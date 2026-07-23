'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { githubIdentity } from '@/lib/auth/identity';
import { copy } from '@/lib/copy';
import { listStarredRepos } from '@/lib/github/client';
import { decideStarImport, type StarImportContext, tallyKey } from '@/lib/ingest/decide';
import { type CandidateInput, upsertCandidates } from '@/lib/ingest/upsert';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';
import type { TablesInsert } from '@/lib/supabase/types';

export type ImportTallies = Record<'own' | 'blocked' | 'here' | 'filtered' | 'queued', number>;

export type ImportPageResult =
  | { tallies: ImportTallies; scanned: number; hasMore: boolean }
  | { error: string };

const EMPTY_TALLIES: ImportTallies = { own: 0, blocked: 0, here: 0, filtered: 0, queued: 0 };

/**
 * Fetches and processes ONE page of the caller's starred repos (docs/plans/
 * p1-gallery-engine.md, locked architecture #5 — client-driven page loop,
 * one page per call, idempotent, resumable). `import-runner.tsx` drives the
 * loop; this action never auto-paginates.
 *
 * Security split (locked architecture #3/#6): `ingest_candidates` and
 * `ingest_blocklist` are deny-all tables — reads AND writes against them go
 * through `service` (the service-role client). `star_imports` and `saves`
 * are genuinely the caller's own data — writes to those go through
 * `supabase`, the cookie-bound client, under RLS, exactly as the user.
 *
 * Write order is load-bearing: candidate upserts happen BEFORE the
 * star_imports upsert, because `trg_star_imports_demand` (fired on
 * star_imports insert) recounts `ingest_candidates.demand_count` by looking
 * the candidate row up — if star_imports landed first, the very first
 * importer's demand credit would find no row yet and silently count for
 * nothing.
 */
export async function importStarsPage(page: number): Promise<ImportPageResult> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Defense-in-depth — src/proxy.ts already gates /settings/import behind a session.
  if (!user) redirect('/auth/signin?next=%2Fsettings%2Fimport');

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id, github_id, github_username')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) redirect('/onboarding');

  if (!Number.isSafeInteger(page) || page < 1) {
    return { error: copy.error };
  }

  // Prefer the verified session identity's login (same source /new uses);
  // fall back to the login captured at onboarding time in the rare case the
  // session identity is missing `user_name`.
  const login = githubIdentity(user)?.login ?? profile.github_username;

  let result: Awaited<ReturnType<typeof listStarredRepos>>;
  try {
    result = await listStarredRepos(login, { page });
  } catch (err) {
    // GithubConfigError (missing GITHUB_TOKEN) — quiet error, loud log.
    console.error('[settings/import] star listing unavailable:', err);
    return { error: copy.error };
  }
  if (result.kind !== 'ok') {
    console.error('[settings/import] star listing failed:', result);
    return { error: copy.error };
  }

  const { items, hasMore } = result.data;
  if (items.length === 0) {
    return { tallies: EMPTY_TALLIES, scanned: 0, hasMore };
  }

  // Batch-derive decision context for the WHOLE page — never one query per
  // repo. `existingProjects` is filtered to `status = 'published'` because
  // `saves_insert_own`'s RLS check requires the target project to be
  // published; an unfiltered match here would let `decideStarImport` emit a
  // `save` action whose insert then silently fails under RLS.
  const repoIds = items.map((item) => item.repo.id);
  const ownerIds = [...new Set(items.map((item) => item.repo.owner.id))];

  const [{ data: existingProjects }, { data: blockedRepoRows }, { data: blockedOwnerRows }] =
    await Promise.all([
      service
        .from('projects')
        .select('id, github_repo_id')
        .eq('status', 'published')
        .in('github_repo_id', repoIds),
      service
        .from('ingest_blocklist')
        .select('github_repo_id')
        .eq('scope', 'repo')
        .in('github_repo_id', repoIds),
      service
        .from('ingest_blocklist')
        .select('github_owner_id')
        .eq('scope', 'owner')
        .in('github_owner_id', ownerIds),
    ]);

  const existingByRepoId = new Map(
    (existingProjects ?? []).map((row) => [row.github_repo_id, row.id]),
  );
  const blockedRepoIds = new Set((blockedRepoRows ?? []).map((row) => row.github_repo_id));
  const blockedOwnerIds = new Set((blockedOwnerRows ?? []).map((row) => row.github_owner_id));

  const tallies: ImportTallies = { ...EMPTY_TALLIES };
  const candidateRepos: CandidateInput[] = [];
  const starImportRows: TablesInsert<'star_imports'>[] = [];
  const saveRows: TablesInsert<'saves'>[] = [];

  for (const item of items) {
    const ctx: StarImportContext = {
      viewerGithubId: profile.github_id,
      isBlocklisted: blockedRepoIds.has(item.repo.id) || blockedOwnerIds.has(item.repo.owner.id),
      existingProjectId: existingByRepoId.get(item.repo.id) ?? null,
    };
    const action = decideStarImport(item.repo, ctx);
    tallies[tallyKey(action)] += 1;

    // Only `save` and `candidate` ever write a star_imports row — `own`,
    // `blocked`, and `filtered_fork` are all "no ledger entry" outcomes (a
    // blocklisted repo especially must never resurface via this ledger).
    switch (action.kind) {
      case 'candidate':
        candidateRepos.push({ repo: item.repo, source: 'star_import' });
        starImportRows.push({
          profile_id: profile.id,
          github_repo_id: item.repo.id,
          starred_at: item.starredAt,
        });
        break;
      case 'save':
        starImportRows.push({
          profile_id: profile.id,
          github_repo_id: item.repo.id,
          starred_at: item.starredAt,
        });
        saveRows.push({ profile_id: profile.id, project_id: action.projectId });
        break;
      default:
        break;
    }
  }

  // Write order matters — see the function doc comment above.
  if (candidateRepos.length > 0) {
    await upsertCandidates(candidateRepos, service);
  }

  if (starImportRows.length > 0) {
    const { error } = await supabase
      .from('star_imports')
      .upsert(starImportRows, { onConflict: 'profile_id,github_repo_id', ignoreDuplicates: true });
    if (error) {
      // Idempotent upsert — safe to log-and-continue; a retry of this same
      // page re-attempts the same (harmless) write.
      console.error('[settings/import] star_imports upsert failed:', error.message);
    }
  }

  if (saveRows.length > 0) {
    const { error } = await supabase
      .from('saves')
      .upsert(saveRows, { onConflict: 'profile_id,project_id', ignoreDuplicates: true });
    if (error) {
      console.error('[settings/import] saves upsert failed:', error.message);
    } else {
      revalidatePath('/saved');
    }
  }

  return { tallies, scanned: items.length, hasMore };
}

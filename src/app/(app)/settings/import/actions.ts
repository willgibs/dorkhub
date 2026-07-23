'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { githubIdentity } from '@/lib/auth/identity';
import { copy } from '@/lib/copy';
import { listStarredRepos } from '@/lib/github/client';
import { decideStarImport, type StarImportContext, tallyKey } from '@/lib/ingest/decide';
import { materializeCandidate } from '@/lib/ingest/materialize';
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

/** Materialization chunk size (docs/plans/p2.5-self-running.md Wave 2C) — small enough each server-action round-trip (repo fetch + writes, sequential) stays a few seconds. */
const MATERIALIZE_CHUNK_SIZE = 5;

/** Cap on `star_imports` rows read per call — this user's own ledger, never unbounded. */
const STAR_IMPORTS_READ_LIMIT = 500;

/** PostgREST `.in()` filters over id lists this size stay comfortably inside URL-length limits. */
const ID_BATCH_SIZE = 100;

export type MaterializeImportsResult = {
  materialized: number;
  failed: number;
  hasMore: boolean;
  stopReason: string | null;
};

const EMPTY_MATERIALIZE_RESULT: MaterializeImportsResult = {
  materialized: 0,
  failed: 0,
  hasMore: false,
  stopReason: null,
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/**
 * Phase 2 of the import flow — "putting them on the wall" (docs/plans/
 * p2.5-self-running.md Wave 2C). `importStarsPage` above only queues this
 * user's un-published starred repos as `ingest_candidates`; this action
 * walks THEIR OWN queued candidates, one chunk at a time (same client-driven
 * page-loop shape as `importStarsPage` — `import-runner.tsx` drives the
 * loop, this action never auto-paginates), and materializes them
 * immediately, so a fresh importer sees their stars go live NOW instead of
 * waiting for the next pipeline cron tick to find them.
 *
 * `inlineEnrich` stays false (locked decision #5) — this is unpaced,
 * user-triggered traffic, not a place to fire an uncapped AI call per row.
 * Bare candidates still publish (locked decision #2: og-image + name +
 * stats IS the floor) and the background pipeline enriches them within
 * ~15 min.
 *
 * Selection: read up to `STAR_IMPORTS_READ_LIMIT` of this user's own
 * `star_imports.github_repo_id`s under RLS (cookie client — `star_imports_
 * select_own` scopes this to the caller, no explicit profile_id filter
 * needed), batch them into `.in()`-safe chunks, and ask the service client
 * for each batch's own top-`MATERIALIZE_CHUNK_SIZE` pending candidates by
 * `stars_count` desc. Merging each batch's local top-N and re-sorting is
 * correct for a global top-N: any row missing from its own batch's top-N
 * has at least N same-batch rows outscoring it, so it can't be in the
 * global top-N either.
 */
export async function materializeImportsPage(): Promise<MaterializeImportsResult> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY_MATERIALIZE_RESULT;

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) return EMPTY_MATERIALIZE_RESULT;

  const { data: starImportRows, error: starImportsError } = await supabase
    .from('star_imports')
    .select('github_repo_id')
    .limit(STAR_IMPORTS_READ_LIMIT);
  if (starImportsError) {
    console.error(
      '[settings/import] materializeImportsPage star_imports read failed:',
      starImportsError.message,
    );
    return EMPTY_MATERIALIZE_RESULT;
  }

  const repoIds = (starImportRows ?? []).map((row) => row.github_repo_id);
  if (repoIds.length === 0) return EMPTY_MATERIALIZE_RESULT;

  const idBatches = chunk(repoIds, ID_BATCH_SIZE);
  const batchResults = await Promise.all(
    idBatches.map((batch) =>
      service
        .from('ingest_candidates')
        .select('github_repo_id, stars_count')
        .eq('status', 'pending')
        .in('github_repo_id', batch)
        .order('stars_count', { ascending: false })
        .limit(MATERIALIZE_CHUNK_SIZE),
    ),
  );

  const candidates = batchResults
    .flatMap((result) => result.data ?? [])
    .sort((a, b) => b.stars_count - a.stars_count)
    .slice(0, MATERIALIZE_CHUNK_SIZE);

  const result: MaterializeImportsResult = {
    ...EMPTY_MATERIALIZE_RESULT,
    hasMore: candidates.length === MATERIALIZE_CHUNK_SIZE,
  };

  for (const candidate of candidates) {
    const outcome = await materializeCandidate(
      candidate.github_repo_id,
      { decidedBy: null },
      service,
    );
    if (outcome.kind === 'published') {
      result.materialized += 1;
    } else if (outcome.kind === 'github_unavailable') {
      // GitHub is rate-limiting THIS invocation specifically — stop the
      // chunk rather than burn the rest of the batch against a dead API;
      // the pipeline cron picks these up (locked decision #2).
      result.stopReason =
        'github is rate-limiting — the rest will go live automatically within the hour';
      result.hasMore = true;
      return result;
    } else {
      // already_decided / repo_gone / blocklisted / invalid_username /
      // username_taken / insert_failed — self-resolving or never eligible;
      // don't let one bad row block the rest of the chunk.
      result.failed += 1;
    }
  }

  return result;
}

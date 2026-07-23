'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/admin';
import { validateUsername } from '@/lib/auth/usernames';
import { getRepoById } from '@/lib/github/client';
import { syncProject } from '@/lib/github/sync';
import { generateProjectSlug } from '@/lib/projects/slug';
import { supabaseService } from '@/lib/supabase/clients';

/**
 * Review-queue actions (P1 Wave 2B, docs/plans/p1-gallery-engine.md "Locked
 * architecture" #2, #4, #7, #9). Every action starts with `requireAdmin()` —
 * the /admin/layout.tsx gate is defense-in-depth only; server actions live
 * outside that render tree entirely.
 *
 * Wiring choice (plan explicitly leaves this open, "pick one, note it"): these
 * are plain `<form action={...}>` targets, not useActionState — same base
 * pattern as src/app/(app)/settings/projects/actions.ts (void-returning
 * actions + revalidatePath). A plain form action's return value is never
 * observed by React, though, so unlike that file's simpler toggles,
 * `approveCandidate` has real outcomes an admin needs to see (which repo got
 * auto-rejected, why an approval failed, how many retroactive saves landed) —
 * those travel as `/admin/queue?...` query params via `redirect()` on both
 * the success and failure paths, decoded and rendered by page.tsx.
 * `rejectCandidate`/`reopenCandidate` have no comparable outcomes to report,
 * so they stay silent no-ops on precondition failure (revalidatePath only),
 * matching setProjectStatus's convention.
 */

/** GitHub's SPDX id for "no machine-detectable license" — mirrors src/app/(app)/new/actions.ts. */
const NOASSERTION = 'NOASSERTION';

function parseRepoId(formData: FormData): number | null {
  const raw = Number(formData.get('github_repo_id'));
  return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
}

/** Sends the admin back to the queue with a short, human-readable reason in `?err=`. */
function redirectWithError(message: string): never {
  redirect(`/admin/queue?err=${encodeURIComponent(message)}`);
}

/**
 * Approves a pending candidate — "approval = publish", no draft step (locked
 * arch #4). Re-fetches the repo fresh (locked arch #2: candidate rows are
 * disposable snapshots, never trusted at write time), re-checks the
 * blocklist, upserts the unclaimed owner profile, and inserts the project
 * using exactly the same shape/slug/sort_order/23505-recovery logic as
 * src/app/(app)/new/actions.ts `createProject` — the only structural
 * difference is `status: 'published'` at insert time instead of `'draft'`.
 */
export async function approveCandidate(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const service = supabaseService();

  const githubRepoId = parseRepoId(formData);
  if (githubRepoId === null) return;

  const { data: candidate } = await service
    .from('ingest_candidates')
    .select('github_repo_id')
    .eq('github_repo_id', githubRepoId)
    .eq('status', 'pending')
    .maybeSingle();
  if (!candidate) return; // already decided elsewhere, or a stale double-submit

  let repoResult: Awaited<ReturnType<typeof getRepoById>>;
  try {
    repoResult = await getRepoById(githubRepoId);
  } catch (err) {
    // GithubConfigError (missing GITHUB_TOKEN) — candidate stays pending, admin retries.
    console.error('[admin/queue] repo fetch unavailable:', err);
    redirectWithError('github unavailable right now — try again');
  }

  if (repoResult.kind === 'not_found') {
    const { error } = await service
      .from('ingest_candidates')
      .update({
        status: 'rejected',
        rejection_reason: 'auto: repo unavailable at approval time',
        decided_by: admin.profileId,
        decided_at: new Date().toISOString(),
      })
      .eq('github_repo_id', githubRepoId);
    if (error) console.error('[admin/queue] auto-reject (not_found) failed:', error.message);
    revalidatePath('/admin/queue');
    redirectWithError('repo no longer available — auto-rejected');
  }
  if (repoResult.kind !== 'ok') {
    // Covers rate_limited/error (and not_modified, which can't happen here —
    // this call never sends an etag). Candidate stays pending either way.
    redirectWithError('github unavailable right now — try again');
  }
  const repo = repoResult.data;

  // Blocklist can change between candidate creation and approval — re-check
  // fresh. Consent is checked on EVERY candidate-creating/-materializing path
  // (locked arch #9).
  const { data: blocked } = await service
    .from('ingest_blocklist')
    .select('id')
    .or(
      `and(scope.eq.repo,github_repo_id.eq.${repo.id}),and(scope.eq.owner,github_owner_id.eq.${repo.owner.id})`,
    )
    .limit(1)
    .maybeSingle();
  if (blocked) {
    const { error } = await service
      .from('ingest_candidates')
      .update({
        status: 'rejected',
        rejection_reason: 'auto: blocklisted',
        decided_by: admin.profileId,
        decided_at: new Date().toISOString(),
      })
      .eq('github_repo_id', githubRepoId);
    if (error) console.error('[admin/queue] auto-reject (blocklist) failed:', error.message);
    revalidatePath('/admin/queue');
    redirectWithError('blocklisted — auto-rejected');
  }

  // Upsert the unclaimed owner profile — N repos under one owner collapse to
  // one profile (locked arch #4).
  const { data: existingProfile } = await service
    .from('profiles')
    .select('id, username')
    .eq('github_id', repo.owner.id)
    .maybeSingle();

  let profileId: string;
  let profileUsername: string;

  if (existingProfile) {
    profileId = existingProfile.id;
    profileUsername = existingProfile.username;
  } else {
    const usernameCheck = validateUsername(repo.owner.login);
    if (!usernameCheck.ok) {
      redirectWithError(
        `can't auto-create a profile for "${repo.owner.login}" (${usernameCheck.reason}) — handle manually`,
      );
    }

    const { data: insertedProfile, error: profileInsertError } = await service
      .from('profiles')
      .insert({
        username: usernameCheck.value,
        display_name: repo.owner.login,
        github_id: repo.owner.id,
        github_username: repo.owner.login,
        // claimed_at stays null (column default) — this is an unclaimed
        // seeded profile until the real owner signs in via the claim flow
        // (P1 Wave 3), NOT an onboarding-style self-claim.
      })
      .select('id, username')
      .single();

    if (profileInsertError || !insertedProfile) {
      // We already confirmed no profile exists for this github_id above, so a
      // 23505 here can only be the USERNAME unique constraint: a different
      // existing profile squats this login (e.g. a GitHub handle that changed
      // hands). Don't guess who "wins" — surface it for manual resolution.
      console.error('[admin/queue] profile insert failed:', profileInsertError);
      redirectWithError(
        `username "${usernameCheck.value}" is already taken by a different account — handle manually`,
      );
    }
    profileId = insertedProfile.id;
    profileUsername = insertedProfile.username;
  }

  // Insert exactly like createProject (src/app/(app)/new/actions.ts): fresh
  // slug vs this owner's existing slugs, sort_order = max + 1, 23505 recovery.
  const { data: existingSlugRows } = await service
    .from('projects')
    .select('slug')
    .eq('profile_id', profileId);
  const existingSlugs = new Set((existingSlugRows ?? []).map((row) => row.slug));
  const slug = generateProjectSlug(repo.name, existingSlugs);

  const { data: maxSortRow } = await service
    .from('projects')
    .select('sort_order')
    .eq('profile_id', profileId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (maxSortRow?.sort_order ?? -1) + 1;

  const license = repo.license?.spdx_id === NOASSERTION ? null : (repo.license?.spdx_id ?? null);
  const publishedAt = new Date();

  const { data: insertedProject, error: insertError } = await service
    .from('projects')
    .insert({
      profile_id: profileId,
      slug,
      github_repo_id: repo.id,
      repo_full_name: repo.full_name,
      repo_url: repo.html_url,
      name: repo.name,
      primary_language: repo.language,
      topics: repo.topics,
      stars_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      license,
      status: 'published',
      sort_order: sortOrder,
      tags: [],
      // `trg_projects_before_update` (0001_init.sql) only fires on UPDATE and
      // only stamps published_at/trending_score on a draft→published
      // transition — a direct INSERT as 'published' never runs it, so both
      // would otherwise sit at null/0 forever. Stamp published_at explicitly,
      // and seed trending_score with the SAME formula as compute_trending()
      // there: likes/saves are always 0 on a brand-new row, so
      // log10(1 + 0 + 2*0) collapses to 0 and only the recency term remains.
      published_at: publishedAt.toISOString(),
      trending_score: publishedAt.getTime() / 1000 / 45000,
    })
    .select('id, slug')
    .single();

  let projectId: string;
  let projectSlug: string;
  if (insertError) {
    if (insertError.code === '23505') {
      // Global unique constraint on github_repo_id: someone else materialized
      // this repo first (e.g. the owner self-added via /new while this sat in
      // the queue — trg_projects_supersede_candidate already flipped the
      // candidate to 'superseded' in that case). Re-point rather than fail.
      // Select slug too — it's THEIR slug, not the one generated above.
      const { data: existingProject } = await service
        .from('projects')
        .select('id, slug')
        .eq('github_repo_id', repo.id)
        .maybeSingle();
      if (!existingProject) {
        console.error('[admin/queue] 23505 recovery found no existing row:', insertError);
        redirectWithError('something broke on our end — not you, us. try again?');
      }
      projectId = existingProject.id;
      projectSlug = existingProject.slug;
    } else {
      console.error('[admin/queue] project insert failed:', insertError);
      redirectWithError('something broke on our end — not you, us. try again?');
    }
  } else {
    projectId = insertedProject.id;
    projectSlug = insertedProject.slug;
  }

  // Best-effort initial sync — never blocks approval (mirrors createProject).
  try {
    await syncProject(projectId);
  } catch (err) {
    console.error('[admin/queue] initial sync threw:', err);
  }

  const { error: decideError } = await service
    .from('ingest_candidates')
    .update({
      status: 'approved',
      decided_by: admin.profileId,
      decided_at: new Date().toISOString(),
      materialized_project_id: projectId,
    })
    .eq('github_repo_id', githubRepoId);
  if (decideError) {
    console.error('[admin/queue] candidate decision write failed:', decideError.message);
  }

  // Retroactive saves: everyone who already starred this while it was a
  // candidate gets instant gratification (locked arch #4). Batched upsert
  // with ON CONFLICT DO NOTHING — safe even against the 23505-recovery path
  // reusing an already-live, already-saved project. RETURNING only reports
  // the rows PostgREST actually inserted (conflicted rows are silently
  // skipped), so `.select().length` IS the real "created" count.
  const { data: importerRows } = await service
    .from('star_imports')
    .select('profile_id')
    .eq('github_repo_id', githubRepoId);
  const importerProfileIds = [...new Set((importerRows ?? []).map((row) => row.profile_id))];

  let savesCreated = 0;
  if (importerProfileIds.length > 0) {
    const { data: insertedSaves, error: savesError } = await service
      .from('saves')
      .upsert(
        importerProfileIds.map((profileIdToSave) => ({
          profile_id: profileIdToSave,
          project_id: projectId,
        })),
        { onConflict: 'profile_id,project_id', ignoreDuplicates: true },
      )
      .select('profile_id');
    if (savesError) {
      console.error('[admin/queue] retroactive saves failed:', savesError.message);
    }
    savesCreated = insertedSaves?.length ?? 0;
  }

  revalidatePath('/');
  revalidatePath(`/u/${profileUsername}`);
  revalidatePath('/admin/queue');

  // Success surfaces the same way failures do (query params, not a return
  // value a plain form action can't observe) — projectSlug/username/
  // savesCreated is what the plan asked this action to report back.
  const successParams = new URLSearchParams({
    ok: projectSlug,
    username: profileUsername,
    saves: String(savesCreated),
  });
  redirect(`/admin/queue?${successParams.toString()}`);
}

/** Pending → rejected. Sticky by design (locked arch #7) — only `reopenCandidate` reverses it. */
export async function rejectCandidate(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const service = supabaseService();

  const githubRepoId = parseRepoId(formData);
  if (githubRepoId === null) return;

  const reasonRaw = String(formData.get('reason') ?? '').trim();
  const reason = reasonRaw.length > 0 ? reasonRaw : null;

  const { error } = await service
    .from('ingest_candidates')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      decided_by: admin.profileId,
      decided_at: new Date().toISOString(),
    })
    .eq('github_repo_id', githubRepoId)
    .eq('status', 'pending'); // no-op if already decided elsewhere (stale double-submit)

  if (error) console.error('[admin/queue] rejectCandidate failed:', error.message);
  revalidatePath('/admin/queue');
}

/** Rejected → pending. The ONLY reopen path (locked arch #7) — clears the prior decision. */
export async function reopenCandidate(formData: FormData): Promise<void> {
  await requireAdmin();
  const service = supabaseService();

  const githubRepoId = parseRepoId(formData);
  if (githubRepoId === null) return;

  const { error } = await service
    .from('ingest_candidates')
    .update({
      status: 'pending',
      decided_by: null,
      decided_at: null,
      rejection_reason: null,
    })
    .eq('github_repo_id', githubRepoId)
    .eq('status', 'rejected');

  if (error) console.error('[admin/queue] reopenCandidate failed:', error.message);
  revalidatePath('/admin/queue');
}

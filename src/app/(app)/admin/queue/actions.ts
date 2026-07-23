'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/admin';
import { copy } from '@/lib/copy';
import { type EnrichBatchResult, enrichNextBatch } from '@/lib/enrich/run';
import { materializeCandidate } from '@/lib/ingest/materialize';
import { supabaseService } from '@/lib/supabase/clients';

/**
 * Review-queue actions (P1 Wave 2B, docs/plans/p1-gallery-engine.md "Locked
 * architecture" #2, #4, #7, #9; rewired P2.5 Wave 2A, docs/plans/
 * p2.5-self-running.md).
 *
 * `approveCandidate` and `enrichCandidatesPage` are now THIN wrappers over
 * the shared pipeline libs the automated cron also calls
 * (`src/lib/ingest/materialize.ts`, `src/lib/enrich/run.ts`) — every write
 * path an admin's "approve"/"enrich" click can take lives there now, not
 * here. This file's job is purely the admin-surface concerns those libs
 * deliberately don't own: `requireAdmin()`, `formData` parsing, and mapping
 * each result onto this page's `?ok=`/`?err=` query-param banner convention
 * (`redirect()`/`revalidatePath` are Next.js server-action concerns, not
 * pipeline concerns — see the libs' file headers).
 *
 * Wiring choice (unchanged from P1): plain `<form action={...}>` targets,
 * not useActionState — same base pattern as
 * src/app/(app)/settings/projects/actions.ts. `rejectCandidate`/
 * `reopenCandidate` have no comparable outcomes to report, so they stay
 * silent no-ops on precondition failure (revalidatePath only).
 *
 * `markReviewed`/`unpublishProject` (NEW, P2.5 Wave 2A) are the retro-
 * moderation actions: a candidate can reach `status='approved',
 * decided_by=NULL` without ANY human ever calling `approveCandidate` — the
 * pipeline cron auto-publishes every bare candidate (locked decision #1/#2,
 * docs/plans/p2.5-self-running.md) — so these two close that loop for the
 * admin queue's "published, unreviewed" section (page.tsx).
 */

/**
 * Wave 2A shrinks the per-click chunk from the old 5 to 3 (docs/plans/
 * p2.5-self-running.md Wave 2 description) — the enrich-runner's new
 * rate-limited auto-resume (enrich-runner.tsx) calls this far more
 * frequently than a human clicking "resume" ever did, so each round-trip
 * staying small keeps the UI's progress line moving visibly instead of one
 * long silent chunk.
 */
const ENRICH_CHUNK_SIZE = 3;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseRepoId(formData: FormData): number | null {
  const raw = Number(formData.get('github_repo_id'));
  return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
}

/** Sends the admin back to the queue with a short, human-readable reason in `?err=`. */
function redirectWithError(message: string): never {
  redirect(`/admin/queue?err=${encodeURIComponent(message)}`);
}

/**
 * One enrich-runner chunk. Shape-aligned with `EnrichBatchResult`
 * (`src/lib/enrich/run.ts`) — kept as its own exported name because
 * `enrich-runner.tsx` imports it, and "the batch engine's result type" isn't
 * this page's vocabulary to leak everywhere.
 */
export type EnrichPageResult = EnrichBatchResult;

/**
 * One chunk of the client-driven enrichment loop (`enrich-runner.tsx` calls
 * this repeatedly until `hasMore` is false). Thin wrapper over
 * `enrichNextBatch` — candidates only (the admin queue never enriches
 * `projects`; that's the pipeline cron's job, docs/plans/
 * p2.5-self-running.md Wave 2B) — the actual selection/pacing/stamping logic
 * lives there now (P2.1's hard-won lessons are documented on that function,
 * not duplicated here).
 */
export async function enrichCandidatesPage(): Promise<EnrichPageResult> {
  await requireAdmin();
  const service = supabaseService();

  const result = await enrichNextBatch(service, {
    sources: ['candidates'],
    limit: ENRICH_CHUNK_SIZE,
  });

  if (!result.hasMore) revalidatePath('/admin/queue');
  return result;
}

/**
 * Approves a pending candidate — "approval = publish", no draft step. Thin
 * wrapper over `materializeCandidate` (`src/lib/ingest/materialize.ts`,
 * P2.5 Wave 1A): that function IS `approveCandidate`'s old steps 2–14
 * (pending pre-check through retroactive saves), extracted verbatim. This
 * wrapper's only job is admin auth + mapping each `MaterializeResult` kind
 * onto the SAME `/admin/queue?...` banners this action has always produced —
 * every string below is byte-for-byte what the pre-rewire inline version
 * redirected with, with ONE documented exception (`invalid_username`, see
 * that case).
 */
export async function approveCandidate(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const githubRepoId = parseRepoId(formData);
  if (githubRepoId === null) return;

  const result = await materializeCandidate(githubRepoId, {
    decidedBy: admin.profileId,
    inlineEnrich: true,
  });

  if (result.kind === 'already_decided') {
    // already decided elsewhere, or a stale double-submit — silent no-op,
    // same as the pre-rewire `if (!candidate) return;`.
    return;
  }

  if (result.kind === 'github_unavailable') {
    // Covers both "repo fetch threw" and "repo fetch returned rate_limited/
    // error" — candidate stays pending either way, admin retries.
    redirectWithError('github unavailable right now — try again');
  }

  if (result.kind === 'repo_gone') {
    // materializeCandidate already auto-rejected the candidate row.
    revalidatePath('/admin/queue');
    redirectWithError('repo no longer available — auto-rejected');
  }

  if (result.kind === 'blocklisted') {
    // materializeCandidate already auto-rejected the candidate row.
    revalidatePath('/admin/queue');
    redirectWithError('blocklisted — auto-rejected');
  }

  if (result.kind === 'invalid_username') {
    // DOCUMENTED DEVIATION from byte-for-byte: the pre-rewire message quoted
    // `repo.owner.login` (`can't auto-create a profile for "${login}"
    // (${reason}) — handle manually`) — but `MaterializeResult`'s
    // `invalid_username` variant carries only `reason`, not the login,
    // because `materializeCandidate` owns the fresh repo fetch now and
    // nothing else needs that value back. Refetching the repo here just to
    // reconstruct one string would undo the "thin wrapper" point of this
    // rewire, so the message drops the quoted login instead.
    redirectWithError(
      `can't auto-create a profile for this repo's owner (${result.reason}) — handle manually`,
    );
  }

  if (result.kind === 'username_taken') {
    redirectWithError(
      `username "${result.username}" is already taken by a different account — handle manually`,
    );
  }

  if (result.kind === 'insert_failed') {
    redirectWithError(copy.error);
  }

  // Only `{ kind: 'published' }` remains — every other MaterializeResult kind
  // redirected (`never`-returning) above, so TS narrows `result` here.
  revalidatePath('/');
  revalidatePath(`/u/${result.profileUsername}`);
  revalidatePath('/admin/queue');

  // Success surfaces the same way failures do (query params, not a return
  // value a plain form action can't observe).
  const successParams = new URLSearchParams({
    ok: result.projectSlug,
    username: result.profileUsername,
    saves: String(result.savesCreated),
  });
  // Only set when the inline fallback actually generated a tagline — lets
  // the admin see what got published sight-unseen (locked decision #5).
  if (result.inlineAiTagline) {
    successParams.set('ai', result.inlineAiTagline);
  }
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

/**
 * Retro-moderation "looks good" (P2.5 Wave 2A, docs/plans/
 * p2.5-self-running.md locked decision #1). The candidate is ALREADY
 * `status='approved'` — the pipeline cron published it unattended — so this
 * only stamps `decided_by`/`decided_at`, no status guard needed (unlike
 * `rejectCandidate`/`reopenCandidate`, there's no precondition status to
 * race against: the retro section only ever lists already-approved rows).
 */
export async function markReviewed(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const service = supabaseService();

  const githubRepoId = parseRepoId(formData);
  if (githubRepoId === null) return;

  const { error } = await service
    .from('ingest_candidates')
    .update({ decided_by: admin.profileId, decided_at: new Date().toISOString() })
    .eq('github_repo_id', githubRepoId);

  if (error) console.error('[admin/queue] markReviewed failed:', error.message);
  revalidatePath('/admin/queue');
}

/**
 * Retro-moderation "pull it back" (P2.5 Wave 2A) — a softer alternative to
 * delete+block for a sub-threshold auto-publish that isn't ready for the
 * gallery yet, but doesn't deserve blocklisting either (the owner can
 * `/new` it again, or the pipeline can re-materialize a resurfaced star).
 * Sets the PROJECT back to draft, then stamps the candidate's decision the
 * same way `markReviewed` does — the review IS "unpublish", not a no-op.
 */
export async function unpublishProject(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const service = supabaseService();

  const githubRepoId = parseRepoId(formData);
  const projectId = String(formData.get('project_id') ?? '').trim();
  if (githubRepoId === null || !UUID_PATTERN.test(projectId)) return;

  const { data: project, error: updateError } = await service
    .from('projects')
    .update({ status: 'draft' })
    .eq('id', projectId)
    .select('slug, profile_id')
    .maybeSingle();
  if (updateError) {
    console.error('[admin/queue] unpublishProject project update failed:', updateError.message);
  }

  if (project) {
    const { data: owner } = await service
      .from('profiles')
      .select('username')
      .eq('id', project.profile_id)
      .maybeSingle();
    if (owner) {
      revalidatePath('/');
      revalidatePath(`/u/${owner.username}`);
      revalidatePath(`/u/${owner.username}/${project.slug}`);
    }
  }

  const { error: candidateError } = await service
    .from('ingest_candidates')
    .update({ decided_by: admin.profileId, decided_at: new Date().toISOString() })
    .eq('github_repo_id', githubRepoId);
  if (candidateError) {
    console.error('[admin/queue] unpublishProject candidate stamp failed:', candidateError.message);
  }

  revalidatePath('/admin/queue');
}

import { NextResponse } from 'next/server';
import { needsEnrichment } from '@/lib/ai/enrich';
import { ENRICH_PER_RUN, type EnrichBatchResult, enrichNextBatch } from '@/lib/enrich/run';
import { type MaterializeResult, materializeCandidate } from '@/lib/ingest/materialize';
import { supabaseService } from '@/lib/supabase/clients';

/**
 * The pipeline worker (P2.5 Wave 2B, docs/plans/p2.5-self-running.md). Same
 * shell as src/app/api/cron/sync/route.ts (Bearer CRON_SECRET, service
 * client, fail-closed 401), two sequential passes per invocation:
 *
 *  1. Materialize up to `MATERIALIZE_PER_RUN` pending `ingest_candidates`
 *     into published `projects` rows via `materializeCandidate` — publish-all
 *     (locked decision #2: no pre-publish content gate), `decidedBy: null`
 *     is the auto-approved encoding (locked decision #1 — a human always
 *     stamps `decided_by`; the retro queue reads `approved ∧ decided_by IS
 *     NULL ∧ stars_count < threshold`).
 *  2. Spend whatever's left of the 50s soft deadline calling
 *     `enrichNextBatch` (src/lib/enrich/run.ts, Wave 1B) across BOTH
 *     `projects` and `ingest_candidates`.
 *
 * Runs on the offset-minute GitHub Actions schedule (`4,19,34,49 * * * *`,
 * .github/workflows/pipeline.yml) plus a daily Vercel-cron fallback
 * (vercel.json, `7 9 * * *`) — locked decision #7.
 *
 * Double-fire safety is inherent, not enforced here: two overlapping
 * invocations racing the same candidate resolve via `materializeCandidate`'s
 * own 23505 re-point (the loser's INSERT conflicts, re-selects the winner's
 * row, and still writes the SAME terminal `decided_by: null` outcome), and
 * `enrichNextBatch` only stamps a row after a genuine model reply, so a
 * row picked up twice just gets `enriched_at` written twice with the same
 * content. No locking/dedup layer is needed at this route's level.
 */

// Vercel Hobby cron budget is 60s max (maxDuration below) — leave 10s of
// headroom for the response to actually ship before Vercel kills the
// invocation (locked decision #7).
export const maxDuration = 60;
const SOFT_DEADLINE_MS = 50_000;

/** Pass-1 batch size — small and sequential, never a worker pool (materializeCandidate does real writes per call). */
const MATERIALIZE_PER_RUN = 10;

/** The subset of a pending `ingest_candidates` row pass 1 needs to select and prioritize. */
type PendingCandidateRow = {
  github_repo_id: number;
  description: string | null;
  topics: string[];
  stars_count: number;
};

/** Every non-`'published'` `MaterializeResult['kind']` — tallied by kind in the response. */
type SkippedKind = Exclude<MaterializeResult['kind'], 'published'>;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Empty-secret guard: an unset CRON_SECRET must never leave this endpoint open.
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('unauthorized', { status: 401 });
  }

  const startedAt = Date.now();
  const deadlineAt = startedAt + SOFT_DEADLINE_MS;
  const service = supabaseService();

  // PASS 1 — materialize. Pull a window twice the batch size so JS has room
  // to reprioritize (locked decision #2: content-having candidates publish
  // with a tagline/tags already on the card; bare ones still publish this
  // run, just after — the instant floor is og-image + name + stats either
  // way, never gated).
  const { data: pendingCandidates, error: selectError } = await service
    .from('ingest_candidates')
    .select('github_repo_id, description, topics, stars_count')
    .eq('status', 'pending')
    .order('stars_count', { ascending: false })
    .limit(MATERIALIZE_PER_RUN * 2);

  if (selectError) {
    console.error('[cron/pipeline] candidate select failed', { message: selectError.message });
  }

  const contentHaving: PendingCandidateRow[] = [];
  const bare: PendingCandidateRow[] = [];
  for (const candidate of pendingCandidates ?? []) {
    (needsEnrichment(candidate) ? bare : contentHaving).push(candidate);
  }
  const toMaterialize = [...contentHaving, ...bare].slice(0, MATERIALIZE_PER_RUN);

  const skippedByKind: Record<SkippedKind, number> = {
    already_decided: 0,
    github_unavailable: 0,
    repo_gone: 0,
    blocklisted: 0,
    invalid_username: 0,
    username_taken: 0,
    insert_failed: 0,
  };
  let materialized = 0;
  let savesCreated = 0;
  let deadlineHit = false;

  for (const candidate of toMaterialize) {
    if (Date.now() >= deadlineAt) {
      deadlineHit = true;
      break;
    }

    const result = await materializeCandidate(
      candidate.github_repo_id,
      { decidedBy: null }, // auto-approved encoding — locked decision #1.
      service,
    );

    if (result.kind === 'published') {
      materialized++;
      savesCreated += result.savesCreated; // observability only — retroactive saves per run.
      continue;
    }

    skippedByKind[result.kind]++;
    if (result.kind === 'insert_failed') {
      // The one skip kind that indicates a real problem (not a policy no-op) — log it.
      console.error('[cron/pipeline] materialize insert_failed', {
        githubRepoId: candidate.github_repo_id,
      });
    }
    if (result.kind === 'github_unavailable') {
      // Rate-limit or missing-config — every remaining candidate this run
      // would hit the same GitHub client and fail identically. Stop pass 1
      // early; pass 2 (Gemini, a different provider) still gets its shot.
      break;
    }
  }

  // PASS 2 — enrich, only with time left on the soft deadline. No
  // revalidatePath here (mirrors enrichNextBatch's own doc comment) — the
  // feed's ISR-60 window and dynamic project pages absorb a stale
  // tagline/tags on their own; a cron route has no request to revalidate for anyway.
  let enrichResult: EnrichBatchResult = {
    enriched: 0,
    empty: 0,
    hasMore: false,
    stopKind: null,
    stopReason: null,
  };
  if (Date.now() < deadlineAt) {
    enrichResult = await enrichNextBatch(service, {
      limit: ENRICH_PER_RUN,
      deadlineAt,
      sources: ['projects', 'candidates'],
    });
  }

  return NextResponse.json({
    materialized,
    savesCreated,
    skippedByKind,
    enriched: enrichResult.enriched,
    enrichedEmpty: enrichResult.empty,
    enrichHasMore: enrichResult.hasMore,
    enrichStopKind: enrichResult.stopKind,
    deadlineHit,
    tookMs: Date.now() - startedAt,
  });
}

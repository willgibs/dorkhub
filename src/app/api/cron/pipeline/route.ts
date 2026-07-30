import { NextResponse } from 'next/server';
import { needsEnrichment } from '@/lib/ai/enrich';
import { ENRICH_PER_RUN, type EnrichBatchResult, enrichNextBatch } from '@/lib/enrich/run';
import { type ScreenBatchResult, screenNextBatch } from '@/lib/enrich/screen';
import { syncProject } from '@/lib/github/sync';
import { type MaterializeResult, materializeCandidate } from '@/lib/ingest/materialize';
import { supabaseService } from '@/lib/supabase/clients';

/**
 * The pipeline worker (P2.5 Wave 2B, docs/plans/p2.5-self-running.md; screen
 * pass added in P2.6, docs/plans/p2.6-immune-system.md). Same shell as
 * src/app/api/cron/sync/route.ts (Bearer CRON_SECRET, service client,
 * fail-closed 401), four sequential passes per invocation:
 *
 *  1. Materialize up to `MATERIALIZE_PER_RUN` pending `ingest_candidates`
 *     into published `projects` rows via `materializeCandidate` — publish-all
 *     (locked decision #2: no pre-publish content gate), `decidedBy: null`
 *     is the auto-approved encoding (locked decision #1 — a human always
 *     stamps `decided_by`; the retro queue reads `approved ∧ decided_by IS
 *     NULL ∧ stars_count < threshold`).
 *  2. Enrich via `enrichNextBatch` (src/lib/enrich/run.ts) across BOTH
 *     `projects` and `ingest_candidates`.
 *  3. Screen via `screenNextBatch` (src/lib/enrich/screen.ts) — AI moderation
 *     triage, reported projects first, retro backlog second. Runs BEFORE the
 *     sync backfill on purpose: safety before cosmetics (P2.6 decision D3).
 *  4. Sync backfill for projects whose materialization skipped inline sync.
 *
 * AI budget: passes 2+3 together spend at most ENRICH_PER_RUN (5) +
 * SCREEN_PER_RUN (3) = 8 Gemini calls per run — the proven daily ceiling
 * (768 scheduled < ~1k free tier) is unchanged from P2.5. Since P3-C the
 * schedule-derived ceiling is also HARD-enforced: every model call claims a
 * slot from the `ai_usage` DB ledger first (src/lib/ai/budget.ts, decision
 * D33) and a refused claim surfaces here as
 * `enrichStopKind`/`screenStopKind: 'budget'`.
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

/**
 * Pass-1 batch size — sequential, never a worker pool. Raised 10 → 25 in
 * P2.5.1: materialization skips the inline README sync now (`skipSync`), so
 * each item costs one repo fetch + a handful of pooled queries (~1s), and a
 * big star import drains in a couple of ticks instead of hours. The 50s soft
 * deadline still governs.
 */
const MATERIALIZE_PER_RUN = 25;

/**
 * Pass-3 budget — AI moderation screens per run (P2.6 decision D3). Together
 * with ENRICH_PER_RUN (5) this keeps the total AI spend at ≤8 calls/run, the
 * ceiling the schedulers were budgeted against in P2.5.
 */
const SCREEN_PER_RUN = 3;

/**
 * Pass-4 budget — README/metadata backfill for projects materialization
 * skipped sync on (`last_synced_at IS NULL` sorts first in the daily cron
 * too; this pass just gets READMEs onto fresh project pages within ~15-60
 * min instead of by tomorrow). Also heals fast-path demo_url via
 * computeSyncUpdate's fill-only rule.
 */
const SYNC_BACKFILL_PER_RUN = 5;

/**
 * Storage monitoring threshold (P3-C C0; board: monitor now, Supabase Pro
 * when forced). 80% of the 500 MB free-tier ceiling — at ~14 KB/project the
 * warning fires with tens of thousands of projects of headroom left, not at
 * the wall.
 */
const STORAGE_WARN_MB = 400;

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
      // decidedBy null = auto-approved encoding (locked decision #1).
      // skipSync (P2.5.1): READMEs land via pass 3 below — keeping the big
      // per-item cost out of this loop is what lets the batch size be 25.
      { decidedBy: null, skipSync: true },
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

  // PASS 3 — screen (P2.6): AI moderation triage. Reported projects outrank
  // the retro backlog inside screenNextBatch; verdicts only label and order
  // the admin queues (triage-only, decision D2 — no auto-actions). Same
  // stamping discipline as enrichment: systemic failures stop without
  // writing, so nothing gets marked "screened" that wasn't.
  let screenResult: ScreenBatchResult = {
    screened: 0,
    flagged: 0,
    hasMore: false,
    stopKind: null,
    stopReason: null,
  };
  if (Date.now() < deadlineAt) {
    screenResult = await screenNextBatch(service, {
      limit: SCREEN_PER_RUN,
      deadlineAt,
    });
  }

  // PASS 4 — sync backfill (P2.5.1): projects whose materialization skipped
  // the inline sync have last_synced_at NULL — give a few of them their
  // README (+ fill-only demo_url) now rather than waiting for the daily
  // sync cron. Deadline-checked per item; failures are syncProject's own
  // tallied outcomes, never thrown.
  let synced = 0;
  if (Date.now() < deadlineAt) {
    const { data: unsyncedProjects } = await service
      .from('projects')
      .select('id')
      .eq('status', 'published')
      .is('last_synced_at', null)
      .order('published_at', { ascending: false })
      .limit(SYNC_BACKFILL_PER_RUN);
    for (const project of unsyncedProjects ?? []) {
      if (Date.now() >= deadlineAt) {
        deadlineHit = true;
        break;
      }
      try {
        const outcome = await syncProject(project.id);
        if (outcome.status === 'synced') synced++;
        if (outcome.status === 'rate_limited') break;
      } catch (err) {
        console.error('[cron/pipeline] sync backfill threw:', err);
        break;
      }
    }
  }

  // STORAGE MONITORING (P3-C C0): one cheap RPC per run — 96/day — so growth
  // toward the free-tier ceiling is visible in every pipeline response (and
  // the GH Actions log trail) with headroom, instead of being discovered at
  // the wall. Probe failures are logged, never fatal: monitoring must not be
  // able to take down the pipeline it monitors.
  let dbSizeMb: number | null = null;
  {
    const { data: dbBytes, error: dbSizeError } = await service.rpc('db_size_bytes');
    if (dbSizeError) {
      console.error('[cron/pipeline] db size probe failed', { message: dbSizeError.message });
    } else if (typeof dbBytes === 'number' && Number.isFinite(dbBytes)) {
      dbSizeMb = Math.round(dbBytes / (1024 * 1024));
      if (dbSizeMb >= STORAGE_WARN_MB) {
        console.warn(
          '[cron/pipeline] database size past warn threshold — plan the Supabase Pro upgrade',
          {
            dbSizeMb,
            warnAtMb: STORAGE_WARN_MB,
          },
        );
      }
    }
  }

  return NextResponse.json({
    materialized,
    savesCreated,
    skippedByKind,
    enriched: enrichResult.enriched,
    enrichedEmpty: enrichResult.empty,
    enrichHasMore: enrichResult.hasMore,
    enrichStopKind: enrichResult.stopKind,
    screened: screenResult.screened,
    flagged: screenResult.flagged,
    // Mirrors enrichHasMore (P2.7): screenNextBatch returns hasMore with a
    // null stopKind when it bails on the deadline, so without this a
    // truncated safety pass reads identically to a complete one.
    screenHasMore: screenResult.hasMore,
    screenStopKind: screenResult.stopKind,
    synced,
    dbSizeMb,
    deadlineHit,
    tookMs: Date.now() - startedAt,
  });
}

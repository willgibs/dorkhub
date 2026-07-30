import { NextResponse } from 'next/server';
import { ENRICH_PER_RUN, type EnrichBatchResult, enrichNextBatch } from '@/lib/enrich/run';
import { type ScreenBatchResult, screenNextBatch } from '@/lib/enrich/screen';
import { supabaseService } from '@/lib/supabase/clients';

/**
 * The AI/moderation worker (P2.5 Wave 2B; screen pass added in P2.6;
 * SLIMMED in P3-C wave C3, decision D34). Materialization + sync moved to
 * /api/cron/ingest: all four passes used to share this one 50 s window and
 * cost ~61 s when all had work, so a bulk import starved moderation and
 * pass 3 starved behind passes 1–2 (a P2.7 deferral — now resolved
 * structurally: the two passes left here need at most 8 × 4.5 s ≈ 36 s of
 * paced calls against a window that is now entirely theirs).
 *
 * Same shell as the other cron routes (Bearer CRON_SECRET, service client,
 * fail-closed 401), two sequential passes per invocation:
 *
 *  1. Enrich via `enrichNextBatch` (src/lib/enrich/run.ts) across BOTH
 *     `projects` and `ingest_candidates`.
 *  2. Screen via `screenNextBatch` (src/lib/enrich/screen.ts) — AI
 *     moderation triage, reported projects first, retro backlog second
 *     (P2.6 decision D3: safety runs every tick).
 *
 * AI budget: ≤ ENRICH_PER_RUN (5) + SCREEN_PER_RUN (3) = 8 calls per run,
 * 768/day scheduled — and since P3-C hard-enforced by the `ai_usage` DB
 * ledger (src/lib/ai/budget.ts, decision D33): every call claims a slot
 * first, and a refused claim surfaces here as
 * `enrichStopKind`/`screenStopKind: 'budget'`.
 *
 * Runs on the offset-minute GitHub Actions schedule (`4,19,34,49 * * * *`,
 * .github/workflows/pipeline.yml, step 1 — before ingest) plus a daily
 * Vercel-cron fallback (vercel.json `7 9 * * *`) — locked decision #7. The
 * fallback slot stays on THIS route, not ingest: if Actions dies, safety
 * still runs daily; imports just pause.
 *
 * Also reports `dbSizeMb` (P3-C C0 storage monitoring — board decision:
 * monitor now, Supabase Pro when forced).
 */

// Vercel Hobby cron budget is 60s max (maxDuration below) — leave 10s of
// headroom for the response to actually ship before Vercel kills the
// invocation (locked decision #7).
export const maxDuration = 60;
const SOFT_DEADLINE_MS = 50_000;

/**
 * Pass-2 budget — AI moderation screens per run (P2.6 decision D3). Together
 * with ENRICH_PER_RUN (5) this keeps the total AI spend at ≤8 calls/run, the
 * ceiling the schedulers were budgeted against in P2.5.
 */
const SCREEN_PER_RUN = 3;

/**
 * Storage monitoring threshold (P3-C C0; board: monitor now, Supabase Pro
 * when forced). 80% of the 500 MB free-tier ceiling — at ~14 KB/project the
 * warning fires with tens of thousands of projects of headroom left, not at
 * the wall.
 */
const STORAGE_WARN_MB = 400;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Empty-secret guard: an unset CRON_SECRET must never leave this endpoint open.
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('unauthorized', { status: 401 });
  }

  const startedAt = Date.now();
  const deadlineAt = startedAt + SOFT_DEADLINE_MS;
  const service = supabaseService();

  // PASS 1 — enrich. No revalidatePath (mirrors enrichNextBatch's own doc
  // comment) — the feed's ISR-60 window and dynamic project pages absorb a
  // stale tagline/tags on their own; a cron route has no request to
  // revalidate for anyway.
  const enrichResult: EnrichBatchResult = await enrichNextBatch(service, {
    limit: ENRICH_PER_RUN,
    deadlineAt,
    sources: ['projects', 'candidates'],
  });

  // PASS 2 — screen (P2.6): AI moderation triage. Reported projects outrank
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
          { dbSizeMb, warnAtMb: STORAGE_WARN_MB },
        );
      }
    }
  }

  // SEARCH-LIMITER PRUNE (P4 L2d): expired fixed windows are dead rows the
  // moment their minute passes; one cheap DELETE per run keeps the ledger at
  // roughly one row per active-searcher-minute instead of growing forever.
  // Piggybacked here rather than a new cron (Hobby's 2-cron cap) — and like
  // the storage probe, a prune failure logs and never takes down the run.
  {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { error: pruneError } = await service
      .from('search_rate_limit')
      .delete()
      .lt('window_start', cutoff);
    if (pruneError) {
      console.error('[cron/pipeline] search-limiter prune failed', {
        message: pruneError.message,
      });
    }
  }

  // BUDGET OBSERVABILITY (P3-D): the ledger's consumption in every run's
  // response, next to dbSizeMb — so "how much of the AI budget is gone"
  // is a log line, not a psql session. Tiny read (one row per UTC day).
  let aiCallsToday: number | null = null;
  let aiCallsTotal: number | null = null;
  {
    const { data: usageRows, error: usageError } = await service
      .from('ai_usage')
      .select('day, calls');
    if (usageError) {
      console.error('[cron/pipeline] ai_usage read failed', { message: usageError.message });
    } else if (usageRows) {
      const todayUtc = new Date().toISOString().slice(0, 10);
      aiCallsToday = usageRows.find((row) => row.day === todayUtc)?.calls ?? 0;
      aiCallsTotal = usageRows.reduce((sum, row) => sum + row.calls, 0);
    }
  }

  return NextResponse.json({
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
    aiCallsToday,
    aiCallsTotal,
    dbSizeMb,
    deadlineHit: Date.now() >= deadlineAt,
    tookMs: Date.now() - startedAt,
  });
}

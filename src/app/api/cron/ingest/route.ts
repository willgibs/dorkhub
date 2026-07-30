import { NextResponse } from 'next/server';
import { needsEnrichment } from '@/lib/ai/enrich';
import { syncProject } from '@/lib/github/sync';
import { type MaterializeResult, materializeCandidate } from '@/lib/ingest/materialize';
import { supabaseService } from '@/lib/supabase/clients';

/**
 * The ingest worker (P3-C wave C3, decision D34 — docs/plans/p3c-scale.md).
 * Split OUT of /api/cron/pipeline: materialization + sync used to share one
 * 50 s window with the AI passes, and the four passes cost ~61 s when all
 * had work — so a bulk import starved moderation (and pass 3 starved behind
 * passes 1–2, a P2.7 deferral). Now each worker gets its own invocation:
 * this route ingests and syncs; /api/cron/pipeline enriches and screens.
 *
 * Same shell as the other cron routes (Bearer CRON_SECRET, service client,
 * fail-closed 401). Two deadline-checked passes:
 *
 *  1. Materialize up to `MATERIALIZE_PER_RUN` pending `ingest_candidates`
 *     into published `projects` rows via `materializeCandidate` — publish-all
 *     (locked decision #2), `decidedBy: null` = the auto-approved encoding
 *     (locked decision #1). Candidates are selected demand-first
 *     (`demand_count desc, stars_count desc`) — P3-C P8b: the old
 *     stars-only order matched no index prefix and cost 267 ms at 100k
 *     pending (parallel seq scan) vs 0.1 ms for this order on
 *     idx_ingest_candidates_queue; it is also the order the admin queue
 *     shows humans, so the pipeline now materializes in the order people
 *     see. Demand = real user requests, which outrank raw stars anyway.
 *  2. Sync slice: walk the sync queue (`last_synced_at` asc NULLS FIRST) so
 *     just-materialized projects get their README within ~15 min AND stale
 *     projects keep refreshing between daily sync-cron runs. This replaces
 *     the pipeline's old 5-item unsynced-only backfill: nulls sort first,
 *     so "unsynced before stale" falls out of the queue order itself.
 *     50/run × 96 runs/day ≈ 4,800 conditional GETs/day — a 10k gallery
 *     refreshes in ~2 days instead of 50, still trivial against GitHub's
 *     5k/HOUR limit.
 *
 * Scheduled by .github/workflows/pipeline.yml (same 15-min offset schedule,
 * step 2 after the AI worker). Deliberately NOT in vercel.json: the Hobby
 * plan caps at 2 cron jobs and those fallback slots stay with sync (full
 * daily walk) + pipeline (the immune system) — if Actions dies, ingest
 * pauses until it's back, which only delays imports, never safety.
 *
 * Double-fire safety is inherent, unchanged from the pipeline's doc: racing
 * materializations resolve via materializeCandidate's 23505 re-point, and a
 * project synced twice just writes the same patch twice.
 */

// Vercel Hobby budget is 60s max — leave 10s of headroom for the response.
export const maxDuration = 60;
const SOFT_DEADLINE_MS = 50_000;

/**
 * Pass-1 batch size — sequential, never a worker pool. Raised 25 → 40 with
 * the D34 split: materialization now has the whole window to itself (~1 s
 * per item, GitHub-fetch-bound), and the soft deadline — not the constant —
 * is what actually governs. 40 × 96 runs ≈ 3,840 imports/day drained.
 */
const MATERIALIZE_PER_RUN = 40;

/** Pass-2 cap — deadline-checked per item; 304s cost ~0.25 s each. */
const SYNC_PER_RUN = 50;

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
    .order('demand_count', { ascending: false })
    .order('stars_count', { ascending: false })
    .limit(MATERIALIZE_PER_RUN * 2);

  if (selectError) {
    console.error('[cron/ingest] candidate select failed', { message: selectError.message });
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
      // skipSync (P2.5.1): READMEs land via pass 2 below — keeping the big
      // per-item cost out of this loop is what lets the batch size be 40.
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
      console.error('[cron/ingest] materialize insert_failed', {
        githubRepoId: candidate.github_repo_id,
      });
    }
    if (result.kind === 'github_unavailable') {
      // Rate-limit or missing-config — every remaining candidate this run
      // would hit the same GitHub client and fail identically. Stop pass 1;
      // pass 2 shares that client, so skip it too by letting the deadline
      // logic below see an exhausted budget naturally.
      break;
    }
  }

  // PASS 2 — sync slice. The queue order (last_synced_at asc, NULLS FIRST —
  // idx_projects_sync_queue) puts never-synced projects first, so fresh
  // materializations get READMEs before stale rows get refreshes.
  let synced = 0;
  let notModified = 0;
  if (Date.now() < deadlineAt) {
    const { data: syncQueue } = await service
      .from('projects')
      .select('id')
      .eq('status', 'published')
      .order('last_synced_at', { ascending: true, nullsFirst: true })
      .limit(SYNC_PER_RUN);
    for (const project of syncQueue ?? []) {
      if (Date.now() >= deadlineAt) {
        deadlineHit = true;
        break;
      }
      try {
        const outcome = await syncProject(project.id);
        if (outcome.status === 'synced') synced++;
        if (outcome.status === 'not_modified') notModified++;
        if (outcome.status === 'rate_limited') break;
      } catch (err) {
        console.error('[cron/ingest] sync slice threw:', err);
        break;
      }
    }
  }

  return NextResponse.json({
    materialized,
    savesCreated,
    skippedByKind,
    synced,
    notModified,
    deadlineHit,
    tookMs: Date.now() - startedAt,
  });
}

import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildEnrichmentPrompt,
  type EnrichmentCandidate,
  needsEnrichment,
  type ParsedEnrichment,
  parseEnrichmentResult,
} from '@/lib/ai/enrich';
import { AiConfigError, chatCompletion } from '@/lib/ai/gateway';
import { getReadmeRaw } from '@/lib/github/client';
import type { Database } from '@/lib/supabase/types';

/**
 * The shared AI-enrichment engine (P2.5 Wave 1B, docs/plans/
 * p2.5-self-running.md) — the ONE place that walks a paced batch of
 * enrichable rows and calls the model. Generalizes the P2.1 `ingest_candidates`
 * queue-runner (src/app/(app)/admin/queue/actions.ts `enrichCandidatesPage`)
 * to also cover `projects` (fill-only — never overwrite human/GitHub data).
 * Wave 2A rewires `enrichCandidatesPage` into a thin wrapper around
 * `enrichNextBatch`; Wave 2B's cron route is the other caller.
 */

/**
 * Budget knobs (locked decision #7). The pipeline cron fires on a 15-minute
 * offset schedule, 96 runs/day (`4,19,34,49 * * * *`), each calling
 * `enrichNextBatch` with `limit: ENRICH_PER_RUN`: 96 × 8 = 768 calls/day,
 * comfortably under Google AI Studio's genuinely-free ~1k-requests/day
 * budget (src/lib/ai/gateway.ts). Within one run, `ENRICH_PACE_MS` spaces
 * consecutive `chatCompletion` call STARTS 4.5s apart — 60_000 / 4500 ≈ 13.3
 * calls/minute, under the free tier's 15-RPM floor with headroom for the
 * readme-fetch + model-latency time each call already burns.
 */
export const ENRICH_PACE_MS = 4500;
export const ENRICH_PER_RUN = 8;

/** Same token budget as the P2.1 queue runner — a tagline + up to 6 tags is short. */
const ENRICHMENT_MAX_TOKENS = 300;

/**
 * A project "needs enrichment" under the same OR (not AND) rule as
 * `needsEnrichment` in src/lib/ai/enrich.ts for candidates: missing EITHER
 * a tagline OR any tags leaves it invisible to tag-driven discovery surfaces
 * even if the other field is populated.
 */
export function projectNeedsEnrichment(p: { tagline: string | null; tags: string[] }): boolean {
  return !p.tagline?.trim() || p.tags.length === 0;
}

/**
 * Maps a `projects` row to the shape `buildEnrichmentPrompt` reads. The
 * existing tagline (if any) is passed as the prompt's "description" slot —
 * it's real grounding for the model even when it's not enough on its own
 * (e.g. a tagline with no tags still needs enrichment per
 * `projectNeedsEnrichment` above). `topics` is the GitHub-topics column,
 * never the curated `tags` column — the model should see what GitHub says,
 * not what a prior AI pass guessed.
 */
export function projectToEnrichmentInput(p: {
  name: string;
  repo_full_name: string;
  tagline: string | null;
  primary_language: string | null;
  topics: string[];
}): EnrichmentCandidate {
  return {
    name: p.name,
    owner_login: p.repo_full_name.split('/')[0],
    description: p.tagline,
    primary_language: p.primary_language,
    topics: p.topics,
  };
}

export type EnrichQueueItem<TP, TC> =
  | { source: 'project'; item: TP }
  | { source: 'candidate'; item: TC };

/**
 * Merges pre-sorted project + candidate rows into one priority-ordered,
 * capped queue: ALL published projects first (locked decision #2 — bare
 * candidates already publish; enriching what's already live outranks
 * enriching what's still pending), then candidates, filling up to `limit`.
 * Pure — callers are responsible for pre-sorting each input (stars desc for
 * projects, demand/stars desc for candidates); this function only prioritizes
 * and caps.
 */
export function buildEnrichmentQueue<TP, TC>(
  projects: TP[],
  candidates: TC[],
  limit: number,
): EnrichQueueItem<TP, TC>[] {
  const queue: EnrichQueueItem<TP, TC>[] = [
    ...projects.map((item): EnrichQueueItem<TP, TC> => ({ source: 'project', item })),
    ...candidates.map((item): EnrichQueueItem<TP, TC> => ({ source: 'candidate', item })),
  ];
  return queue.slice(0, Math.max(0, limit));
}

/** The subset of a `projects` row `planStamp` needs to decide what's fillable. */
type ExistingProjectContent = { tagline: string | null; tags: string[] };

/**
 * Pure "what do we write back" rule (P2.1 stamping lesson, generalized —
 * locked decision #8). Both targets ALWAYS include `enriched_at` — it's
 * provenance/no-retry, not "successfully enriched" (a model reply with
 * nothing usable still stamps it so the row never retries forever).
 *
 * - `'candidate'`: ai_tagline/ai_tags are the review surface an admin reads
 *   before approving — always overwritten with the latest parse (null/[]
 *   when the model came up empty), same as the P2.1 queue runner.
 * - `'project'`: FILL-ONLY. tagline is included only when the model produced
 *   one AND the existing tagline is null; tags only when the model produced
 *   at least one AND the existing tags array is empty. Human/GitHub-authored
 *   content is never overwritten by an AI guess.
 */
export function planStamp(
  target: 'candidate',
  existing: ExistingProjectContent,
  parsed: ParsedEnrichment | null,
  today: string,
): { ai_tagline: string | null; ai_tags: string[]; enriched_at: string };
export function planStamp(
  target: 'project',
  existing: ExistingProjectContent,
  parsed: ParsedEnrichment | null,
  today: string,
): { enriched_at: string; tagline?: string; tags?: string[] };
export function planStamp(
  target: 'candidate' | 'project',
  existing: ExistingProjectContent,
  parsed: ParsedEnrichment | null,
  today: string,
): Record<string, unknown> {
  if (target === 'candidate') {
    return {
      ai_tagline: parsed?.tagline ?? null,
      ai_tags: parsed?.tags ?? [],
      enriched_at: today,
    };
  }

  const stamp: { enriched_at: string; tagline?: string; tags?: string[] } = { enriched_at: today };
  if (parsed?.tagline && existing.tagline === null) {
    stamp.tagline = parsed.tagline;
  }
  if (parsed?.tags && parsed.tags.length > 0 && existing.tags.length === 0) {
    stamp.tags = parsed.tags;
  }
  return stamp;
}

export type EnrichBatchResult = {
  enriched: number;
  empty: number;
  hasMore: boolean;
  stopKind: 'rate_limited' | 'config' | 'provider_error' | null;
  stopReason: string | null;
};

export type EnrichSource = 'projects' | 'candidates';

export type EnrichNextBatchOpts = {
  /** Max rows to process this call — also the per-source selection window. */
  limit: number;
  /** `Date.now()`-comparable deadline; checked before every item, not mid-call. */
  deadlineAt?: number;
  sources: EnrichSource[];
};

/** Row shape read from `projects` for enrichment — mirrors the columns every helper above needs. */
type EnrichableProjectRow = {
  id: string;
  name: string;
  repo_full_name: string;
  tagline: string | null;
  tags: string[];
  topics: string[];
  primary_language: string | null;
  stars_count: number;
};

/** Row shape read from `ingest_candidates` for enrichment. */
type EnrichableCandidateRow = {
  github_repo_id: number;
  name: string;
  owner_login: string;
  description: string | null;
  primary_language: string | null;
  topics: string[];
  stars_count: number;
  demand_count: number;
};

const PROJECT_SELECT =
  'id, name, repo_full_name, tagline, tags, topics, primary_language, stars_count';
const CANDIDATE_SELECT =
  'github_repo_id, name, owner_login, description, primary_language, topics, stars_count, demand_count';

/**
 * Enrichable published projects: (tagline is null OR tags = '{}') AND
 * enriched_at is null. TWO lean queries (never `.or()` — house ban,
 * docs/decisions.md M5.5), merged/deduped by `id`, re-sorted stars desc,
 * capped at `limit`. `.filter('tags', 'eq', '{}')` — NEVER `.eq('tags', [])`,
 * which serializes to the invalid `tags=eq.` (probed P2.1).
 */
async function selectEnrichableProjects(
  service: SupabaseClient<Database>,
  limit: number,
): Promise<EnrichableProjectRow[]> {
  const base = () =>
    service
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('status', 'published')
      .is('enriched_at', null)
      .order('stars_count', { ascending: false })
      .limit(limit);

  const [{ data: noTagline }, { data: noTags }] = await Promise.all([
    base().is('tagline', null),
    base().filter('tags', 'eq', '{}'),
  ]);

  const byId = new Map(
    [...(noTagline ?? []), ...(noTags ?? [])].map((row) => [row.id, row as EnrichableProjectRow]),
  );

  return [...byId.values()]
    .filter(projectNeedsEnrichment)
    .sort((a, b) => b.stars_count - a.stars_count)
    .slice(0, limit);
}

/**
 * Enrichable pending candidates: (description is null OR topics = '{}') AND
 * enriched_at is null. Same two-query merge pattern as `selectEnrichableProjects`
 * / the P2.1 `enrichCandidatesPage`, deduped by `github_repo_id`.
 */
async function selectEnrichableCandidates(
  service: SupabaseClient<Database>,
  limit: number,
): Promise<EnrichableCandidateRow[]> {
  const base = () =>
    service
      .from('ingest_candidates')
      .select(CANDIDATE_SELECT)
      .eq('status', 'pending')
      .is('enriched_at', null)
      .order('demand_count', { ascending: false })
      .order('stars_count', { ascending: false })
      .limit(limit);

  const [{ data: noDescription }, { data: noTopics }] = await Promise.all([
    base().is('description', null),
    base().filter('topics', 'eq', '{}'),
  ]);

  const byRepoId = new Map(
    [...(noDescription ?? []), ...(noTopics ?? [])].map((row) => [
      row.github_repo_id,
      row as EnrichableCandidateRow,
    ]),
  );

  return [...byRepoId.values()]
    .filter(needsEnrichment)
    .sort((a, b) => b.demand_count - a.demand_count || b.stars_count - a.stars_count)
    .slice(0, limit);
}

/** `owner/name` → `[owner, name]`, for the readme fetch — projects don't store owner_login separately. */
function ownerAndRepoName(repoFullName: string, fallbackName: string): [string, string] {
  const [owner, repoName] = repoFullName.split('/');
  return [owner ?? '', repoName ?? fallbackName];
}

/**
 * Processes up to `opts.limit` enrichable rows (projects then candidates,
 * priority-ordered by `buildEnrichmentQueue`) sequentially, pacing
 * `chatCompletion` call starts `ENRICH_PACE_MS` apart. Both the P2.1 admin
 * queue runner (Wave 2A) and the pipeline cron (Wave 2B) call this — it is
 * the ONE place the model actually gets called for enrichment.
 *
 * Stamping semantics (P2.1 hard lesson — a bad model id once stamped 12 rows
 * as "attempted" that were never really tried): a SYSTEMIC failure
 * (`AiConfigError`, `rate_limited`, or a provider `error`) stops the batch
 * immediately WITHOUT stamping the row that hit it — nothing is consumed,
 * `stopKind`/`stopReason` report why, and every unprocessed row (including
 * the one that failed) is retried on the next call. Only a genuine `ok`
 * model reply stamps `enriched_at`, via `planStamp` — usable or not — so
 * genuinely-answered duds never retry forever.
 *
 * No `revalidatePath` here — the feed's ISR-60 revalidation window and
 * dynamic project pages absorb a stale `tagline`/`tags` on their own; a
 * server-only batch engine shouldn't reach into Next's cache APIs anyway
 * (Wave 2A/2B callers decide if/when a revalidate is warranted).
 */
export async function enrichNextBatch(
  service: SupabaseClient<Database>,
  opts: EnrichNextBatchOpts,
): Promise<EnrichBatchResult> {
  const [projectRows, candidateRows] = await Promise.all([
    opts.sources.includes('projects')
      ? selectEnrichableProjects(service, opts.limit)
      : Promise.resolve([]),
    opts.sources.includes('candidates')
      ? selectEnrichableCandidates(service, opts.limit)
      : Promise.resolve([]),
  ]);

  const queue = buildEnrichmentQueue(projectRows, candidateRows, opts.limit);

  const result: EnrichBatchResult = {
    enriched: 0,
    empty: 0,
    hasMore: queue.length === opts.limit,
    stopKind: null,
    stopReason: null,
  };

  const today = new Date().toISOString();
  let lastCallAt: number | null = null;

  for (const queueItem of queue) {
    if (opts.deadlineAt !== undefined && Date.now() >= opts.deadlineAt) {
      result.hasMore = true;
      return result;
    }

    const input: EnrichmentCandidate =
      queueItem.source === 'project' ? projectToEnrichmentInput(queueItem.item) : queueItem.item;
    const [owner, repoName] =
      queueItem.source === 'project'
        ? ownerAndRepoName(queueItem.item.repo_full_name, queueItem.item.name)
        : [queueItem.item.owner_login, queueItem.item.name];

    let readmeText: string | null = null;
    try {
      const readmeResult = await getReadmeRaw(owner, repoName);
      if (readmeResult.kind === 'ok') readmeText = readmeResult.data;
    } catch (err) {
      console.error('[enrich/run] readme fetch failed:', err);
    }

    // PACING: consecutive chatCompletion call STARTS stay >= ENRICH_PACE_MS
    // apart. First call is immediate (lastCallAt starts null).
    if (lastCallAt !== null) {
      const waitMs = ENRICH_PACE_MS - (Date.now() - lastCallAt);
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
    lastCallAt = Date.now();

    let chatResult: Awaited<ReturnType<typeof chatCompletion>>;
    try {
      chatResult = await chatCompletion({
        messages: buildEnrichmentPrompt(input, readmeText),
        maxTokens: ENRICHMENT_MAX_TOKENS,
      });
    } catch (err) {
      if (err instanceof AiConfigError) {
        result.stopKind = 'config';
        result.stopReason = err.message;
        return result;
      }
      throw err;
    }

    if (chatResult.kind === 'rate_limited') {
      result.stopKind = 'rate_limited';
      result.stopReason = 'provider rate-limited — nothing consumed, resume shortly';
      return result;
    }
    if (chatResult.kind === 'error') {
      result.stopKind = 'provider_error';
      result.stopReason =
        `provider error${chatResult.status ? ` ${chatResult.status}` : ''}: ${chatResult.message.trim()}`.trim();
      return result;
    }

    const parsed = parseEnrichmentResult(chatResult.content);

    if (queueItem.source === 'candidate') {
      // `existing` is unused by the 'candidate' branch of planStamp (it
      // always overwrites ai_tagline/ai_tags) — passed as a typed no-op.
      const stamp = planStamp('candidate', { tagline: null, tags: [] }, parsed, today);
      const { error } = await service
        .from('ingest_candidates')
        .update(stamp)
        .eq('github_repo_id', queueItem.item.github_repo_id);
      if (error) console.error('[enrich/run] candidate stamp failed:', error.message);
      if (parsed) result.enriched += 1;
      else result.empty += 1;
    } else {
      const existing = { tagline: queueItem.item.tagline, tags: queueItem.item.tags };
      const stamp = planStamp('project', existing, parsed, today);
      const { error } = await service.from('projects').update(stamp).eq('id', queueItem.item.id);
      if (error) console.error('[enrich/run] project stamp failed:', error.message);
      if (stamp.tagline !== undefined || stamp.tags !== undefined) result.enriched += 1;
      else result.empty += 1;
    }
  }

  return result;
}

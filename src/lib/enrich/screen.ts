import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { claimAiCall } from '@/lib/ai/budget';
import { AiConfigError, chatCompletion } from '@/lib/ai/gateway';
import {
  buildScreenPrompt,
  htmlToText,
  type ParsedScreen,
  parseScreenResult,
  SCREEN_MAX_TOKENS,
  type ScreenInput,
  type ScreenVerdict,
} from '@/lib/ai/moderate';
import { autoApproveMinStars, needsReview } from '@/lib/ingest/policy';
import { OPEN_REPORTS_WINDOW } from '@/lib/moderation/report-policy';
import type { Database } from '@/lib/supabase/types';
import { ENRICH_PACE_MS } from './run';

/**
 * The AI-moderation screen engine (P2.6 Wave A2, docs/plans/
 * p2.6-immune-system.md) — structural mirror of src/lib/enrich/run.ts's
 * `enrichNextBatch`, walking a paced batch of screenable `projects` rows and
 * calling the model. Two-priority queue: report-triggered rows (an open
 * `project_reports` row newer than the last screen, or never screened) rank
 * above retro-backlog rows (already-`approved`, still-`decided_by IS NULL`
 * candidates the admin retro section would otherwise show unscreened) —
 * `buildScreenQueue` dedupes by project id with `'report'` winning.
 *
 * Stamping discipline (same P2.1 lesson `enrichNextBatch` documents,
 * locked decision #4): a SYSTEMIC failure (`AiConfigError`, `rate_limited`,
 * or a provider `error`) stops the batch immediately WITHOUT writing — the
 * row that hit it, and everything still queued behind it, is retried on the
 * next call. Only a genuine `ok` model reply ever writes a
 * `moderation_screens` row, via `planScreenStamp` — parseable or not, since
 * `verdict` is `NOT NULL` and there is no null-safe fallback column the way
 * `projects.tagline`/`tags` give `enrichNextBatch` room to skip a write.
 *
 * Budget context (locked decision #3): the pipeline route calls this with
 * `limit: SCREEN_PER_RUN` (3); pass order is materialize → enrich → screen,
 * total ≤8 AI calls/run across all three passes.
 */

/** Same select-string idiom as `PROJECT_SELECT` in ./run — every column `buildScreenPrompt`/`ScreenInput` needs. */
export const SCREEN_PROJECT_SELECT =
  'id, name, repo_full_name, tagline, description_md, topics, tags, primary_language, stars_count, readme_html';

/** Row shape read from `projects` for screening — mirrors `EnrichableProjectRow` in ./run. */
export type ScreenProjectRow = {
  id: string;
  name: string;
  repo_full_name: string;
  tagline: string | null;
  description_md: string | null;
  topics: string[];
  tags: string[];
  primary_language: string | null;
  stars_count: number;
  readme_html: string | null;
};

export type ScreenQueueItem = { source: 'report' | 'retro'; project: ScreenProjectRow };

/**
 * Merges pre-sorted reported + retro rows into one priority-ordered, capped
 * queue: reported projects first (given order preserved), then retro (given
 * order preserved), deduped by project id with `'report'` winning any
 * collision (a project that's both reported AND retro-backlogged gets
 * screened once, at report priority). Pure — callers pre-sort/pre-filter
 * each input; this only prioritizes, dedupes, and caps. Structural mirror of
 * `buildEnrichmentQueue` in ./run.
 */
export function buildScreenQueue(
  reported: ScreenProjectRow[],
  retro: ScreenProjectRow[],
  limit: number,
): ScreenQueueItem[] {
  const seen = new Set<string>();
  const queue: ScreenQueueItem[] = [];

  for (const project of reported) {
    if (seen.has(project.id)) continue;
    seen.add(project.id);
    queue.push({ source: 'report', project });
  }
  for (const project of retro) {
    if (seen.has(project.id)) continue;
    seen.add(project.id);
    queue.push({ source: 'retro', project });
  }

  return queue.slice(0, Math.max(0, limit));
}

/**
 * Pure "what do we write to `moderation_screens`" rule (locked decision #4
 * — the P2.1 stamping lesson, generalized). `model`/`created_at` are always
 * stamped, same provenance-always idiom as `planStamp`'s `enriched_at` — but
 * UNLIKE `planStamp`, there is no fill-only/null-safe column to fall back on
 * here: `moderation_screens.verdict` is `NOT NULL`, so a genuine-but-
 * unusable model reply (`parsed === null` — valid JSON never arrived, or
 * arrived without a recognized `verdict`) cannot be left unwritten without
 * either silently treating the row as "ok" (never seen) or retrying it
 * forever. Neither is acceptable for a safety net, so it stamps
 * `verdict: 'review'` with a synthetic reason instead — a human sees it,
 * exactly once, next admin visit.
 */
export function planScreenStamp(
  parsed: ParsedScreen | null,
  model: string,
  todayIso: string,
): { verdict: ScreenVerdict; reason: string | null; model: string; created_at: string } {
  if (parsed) {
    return { verdict: parsed.verdict, reason: parsed.reason, model, created_at: todayIso };
  }
  return {
    verdict: 'review',
    reason: 'model reply unusable — flagged for manual review',
    model,
    created_at: todayIso,
  };
}

/**
 * D22 (P3-B, resolving a P2.7 deferral): a re-screen NEVER auto-downgrades a
 * `flagged` verdict.
 *
 * Screens upsert-overwrite (P2.6 decision D5), so before this a project
 * flagged on Monday could be re-screened on Tuesday — a new report is enough
 * to trigger it — come back `ok`, and silently lose the flag. Nobody had
 * looked. `flagged` exists to summon a human, so erasing it without a human
 * having seen it defeats the entire mechanism, and the P2.7 audit showed the
 * cheapest way to trigger a re-screen is to report the project you want
 * de-flagged.
 *
 * The original reason is preserved, not the new one: it is the assessment a
 * human still needs to act on. `model`/`created_at` DO advance, because the
 * row genuinely was re-screened — and advancing `created_at` is what stops
 * the same open report from re-queueing it forever.
 *
 * Escalation is unaffected: ok/review -> flagged writes through normally.
 * Only a human (resolving the report, or acting on the project) clears it.
 */
export function resolveScreenWrite(
  existingVerdict: ScreenVerdict | null,
  stamp: { verdict: ScreenVerdict; reason: string | null; model: string; created_at: string },
  existingReason: string | null = null,
): { verdict: ScreenVerdict; reason: string | null; model: string; created_at: string } {
  if (existingVerdict === 'flagged' && stamp.verdict !== 'flagged') {
    return { ...stamp, verdict: 'flagged', reason: existingReason };
  }
  return stamp;
}

export type ScreenBatchResult = {
  screened: number;
  flagged: number;
  hasMore: boolean;
  stopKind: 'rate_limited' | 'config' | 'provider_error' | 'budget' | null;
  stopReason: string | null;
};

export type ScreenNextBatchOpts = {
  /** Max rows to process this call — also the per-priority selection window multiplier base. */
  limit: number;
  /** `Date.now()`-comparable deadline; checked before every item, not mid-call. */
  deadlineAt?: number;
};

/** `project_reports`/`moderation_screens` row shapes read by the priority-1 (reported) selection. */
type OpenReportRow = { project_id: string; created_at: string };
type ScreenTimestampRow = { project_id: string; created_at: string };

/**
 * Priority 1: reported projects needing a (re-)screen. Two lean queries
 * (never `.or()` — house ban): open reports (`resolved_at is null`), newest
 * first, reduced to one "newest open report" timestamp per project (first
 * occurrence wins given the `desc` order); then the existing screen row (if
 * any) per reported project. A project needs screening when it has no screen
 * row yet, OR its screen predates the newest open report (locked decision
 * #5 — re-screen when an open report is newer than the last screen). Result
 * rows are re-sorted newest-open-report-first so the most urgent reports
 * lead the queue.
 */
async function selectReportedProjects(
  service: SupabaseClient<Database>,
): Promise<ScreenProjectRow[]> {
  const { data: openReports } = await service
    .from('project_reports')
    .select('project_id, created_at')
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
    // Shared with the admin reports section (P2.7) — this used to be
    // `Math.max(limit * 5, 50)` = 50 against the admin page's 100, so reports
    // 51-100 rendered for a human but were never fed to the AI triage.
    .limit(OPEN_REPORTS_WINDOW);

  const newestOpenReportAt = new Map<string, string>();
  for (const row of (openReports ?? []) as OpenReportRow[]) {
    if (!newestOpenReportAt.has(row.project_id)) {
      newestOpenReportAt.set(row.project_id, row.created_at);
    }
  }

  if (newestOpenReportAt.size === 0) return [];

  const reportedIds = [...newestOpenReportAt.keys()];
  const { data: existingScreens } = await service
    .from('moderation_screens')
    .select('project_id, created_at')
    .in('project_id', reportedIds);

  const screenedAt = new Map(
    ((existingScreens ?? []) as ScreenTimestampRow[]).map((row) => [
      row.project_id,
      row.created_at,
    ]),
  );

  const needsScreenIds = reportedIds.filter((id) => {
    const lastScreenedAt = screenedAt.get(id);
    return lastScreenedAt === undefined || lastScreenedAt < (newestOpenReportAt.get(id) as string);
  });

  if (needsScreenIds.length === 0) return [];

  const { data: projectRows } = await service
    .from('projects')
    .select(SCREEN_PROJECT_SELECT)
    // Published only (P2.7): an admin can unpublish a reported project
    // without resolving its report (the two are separate actions), which
    // otherwise leaves the now-draft row spending one of the three screen
    // calls per run triaging content nobody can see.
    .eq('status', 'published')
    .in('id', needsScreenIds);

  return ((projectRows ?? []) as ScreenProjectRow[]).sort((a, b) => {
    const atA = newestOpenReportAt.get(a.id) as string;
    const atB = newestOpenReportAt.get(b.id) as string;
    return atB > atA ? 1 : atB < atA ? -1 : 0;
  });
}

/** `ingest_candidates` row shape read by the priority-2 (retro) selection. */
type RetroCandidateRow = { materialized_project_id: string | null; decided_at: string | null };

/**
 * Priority 2: retro-backlog projects — already `approved`, still
 * `decided_by IS NULL` candidates (auto-approved by publish-all, never
 * human-reviewed) whose materialized project has never been screened.
 * Filters on the LIVE `projects.stars_count` via `needsReview` +
 * `autoApproveMinStars()` (locked decision #7) — the SAME population the
 * admin retro section shows (src/app/(app)/admin/queue/page.tsx), not the
 * candidate's stale snapshot. Order preserved from the candidate query
 * (`decided_at` ascending — oldest-approved-and-never-screened first).
 *
 * The candidate query ALSO prefilters on the snapshot `stars_count` — a
 * window-narrowing heuristic, not the decider (the P2.1 window-bug class,
 * re-hit live in P2.6 E2E: approved-and-undecided is dominated by high-star
 * auto-publishes, so an unfiltered `limit * 3` window of oldest-decided rows
 * contained ZERO actual retro items). A repo that crossed the threshold
 * between import and now drifts out via the live filter either way; the rare
 * reverse drift (snapshot ≥ threshold, live below) is missed here but still
 * surfaces in the admin retro queue for humans.
 *
 * P2.7 — the window now WALKS (third strike of the same bug class). A single
 * fixed `limit * 3` window filtered the already-screened rows out in JS
 * AFTERWARDS, so once those oldest rows were all screened the same rows were
 * re-selected and re-discarded on every run and this returned `[]` forever,
 * reporting `screened: 0` — indistinguishable from "nothing to do". Only an
 * admin stamping `decided_by` ever released it. `.range()` paging over the
 * stable `decided_at` order is a deliberate, scoped exception to the
 * no-OFFSET rule (which governs user-facing FEEDS — cf. the documented
 * `/weird` exception): this is an internal cron selection over a few hundred
 * rows, and a non-unique `decided_at` makes true keyset paging tie-skip.
 * Rows shifting mid-walk can at worst defer one row to the next run — the
 * pass is self-healing, unlike the stall it replaces.
 */
export const RETRO_PAGE_MULTIPLIER = 3;
export const RETRO_MAX_PAGES = 5;

/** What one page of the retro walk yields: how many candidate rows the page held (to detect the last page) and which of them still need screening. */
export type RetroPage = { rowCount: number; eligible: ScreenProjectRow[] };

/**
 * The page-advance rule, with the page loader INJECTED (same dependency-
 * injection idiom as the GitHub layer's `fetchImpl` — keeps this unit-testable
 * without a Supabase fake, which the house test conventions rule out).
 *
 * Keeps walking while pages come back full and `limit` is unmet; stops on an
 * empty page, a short page (end of the population), or `maxPages`. The stall
 * this replaces came from never advancing at all, so the advance itself is
 * the behavior worth pinning in a test.
 */
export async function collectRetroPages(
  limit: number,
  pageSize: number,
  maxPages: number,
  loadPage: (from: number, to: number) => Promise<RetroPage>,
): Promise<ScreenProjectRow[]> {
  if (limit <= 0 || pageSize <= 0 || maxPages <= 0) return [];

  const collected: ScreenProjectRow[] = [];
  const seen = new Set<string>();

  for (let page = 0; page < maxPages && collected.length < limit; page++) {
    const from = page * pageSize;
    const { rowCount, eligible } = await loadPage(from, from + pageSize - 1);
    if (rowCount === 0) break;

    for (const project of eligible) {
      if (collected.length >= limit) break;
      if (seen.has(project.id)) continue;
      seen.add(project.id);
      collected.push(project);
    }

    // Short page = end of the eligible population; nothing left to walk to.
    if (rowCount < pageSize) break;
  }

  return collected;
}

async function selectRetroProjects(
  service: SupabaseClient<Database>,
  limit: number,
): Promise<ScreenProjectRow[]> {
  const threshold = autoApproveMinStars();

  return collectRetroPages(
    limit,
    Math.max(limit * RETRO_PAGE_MULTIPLIER, 1),
    RETRO_MAX_PAGES,
    async (from, to) => {
      const { data: retroCandidates } = await service
        .from('ingest_candidates')
        .select('materialized_project_id, decided_at')
        .eq('status', 'approved')
        .is('decided_by', null)
        .not('materialized_project_id', 'is', null)
        .lt('stars_count', threshold)
        .order('decided_at', { ascending: true })
        .range(from, to);

      const rows = (retroCandidates ?? []) as RetroCandidateRow[];
      if (rows.length === 0) return { rowCount: 0, eligible: [] };

      const pageIds: string[] = [];
      const seenOnPage = new Set<string>();
      for (const row of rows) {
        const projectId = row.materialized_project_id;
        if (projectId && !seenOnPage.has(projectId)) {
          seenOnPage.add(projectId);
          pageIds.push(projectId);
        }
      }
      if (pageIds.length === 0) return { rowCount: rows.length, eligible: [] };

      const [{ data: projectRows }, { data: existingScreens }] = await Promise.all([
        service
          .from('projects')
          .select(SCREEN_PROJECT_SELECT)
          .eq('status', 'published') // see selectReportedProjects (P2.7)
          .in('id', pageIds),
        service.from('moderation_screens').select('project_id').in('project_id', pageIds),
      ]);

      const alreadyScreened = new Set(
        ((existingScreens ?? []) as { project_id: string }[]).map((row) => row.project_id),
      );
      const byId = new Map(((projectRows ?? []) as ScreenProjectRow[]).map((row) => [row.id, row]));

      const eligible: ScreenProjectRow[] = [];
      for (const id of pageIds) {
        if (alreadyScreened.has(id)) continue;
        const project = byId.get(id);
        if (!project) continue;
        if (!needsReview({ stars_count: project.stars_count }, threshold)) continue;
        eligible.push(project);
      }

      return { rowCount: rows.length, eligible };
    },
  );
}

/**
 * Processes up to `opts.limit` screenable rows (reported then retro,
 * priority-ordered by `buildScreenQueue`) sequentially, pacing
 * `chatCompletion` call starts `ENRICH_PACE_MS` apart (same free-tier RPM
 * budget `enrichNextBatch` paces to — imported from ./run rather than
 * redefined). The pipeline cron (Wave 2C) is the intended caller.
 *
 * See the module doc comment above for the stamping discipline: systemic
 * failures stop the batch WITHOUT writing (row + everything queued behind
 * it retries next call); a genuine `ok` reply always writes, via
 * `planScreenStamp`, whether or not the JSON parsed cleanly. Re-screens
 * UPSERT-OVERWRITE (`{ onConflict: 'project_id' }`, no `ignoreDuplicates`)
 * since `moderation_screens` is one row per project, not an append log.
 */
export async function screenNextBatch(
  service: SupabaseClient<Database>,
  opts: ScreenNextBatchOpts,
): Promise<ScreenBatchResult> {
  const [reportedProjects, retroProjects] = await Promise.all([
    selectReportedProjects(service),
    selectRetroProjects(service, opts.limit),
  ]);

  const queue = buildScreenQueue(reportedProjects, retroProjects, opts.limit);

  const result: ScreenBatchResult = {
    screened: 0,
    flagged: 0,
    hasMore: queue.length === opts.limit,
    stopKind: null,
    stopReason: null,
  };

  let lastCallAt: number | null = null;

  for (const queueItem of queue) {
    if (opts.deadlineAt !== undefined && Date.now() >= opts.deadlineAt) {
      result.hasMore = true;
      return result;
    }

    // AI SPEND CEILING (P3-C D33): claim from the shared DB ledger before
    // every model call — fail closed, mirroring enrichNextBatch. Nothing is
    // written for the row that hit the ceiling; it re-queues when budget
    // returns. The safety net stays honest: an unscreened row stays VISIBLY
    // unscreened rather than being stamped in any way.
    const claim = await claimAiCall(service);
    if (!claim.ok) {
      result.stopKind = 'budget';
      result.stopReason = claim.reason;
      result.hasMore = true;
      return result;
    }

    const { project } = queueItem;
    const readmeText = project.readme_html ? htmlToText(project.readme_html) : null;
    const input: ScreenInput = {
      repo_full_name: project.repo_full_name,
      name: project.name,
      tagline: project.tagline,
      description: project.description_md,
      topics: project.topics,
      tags: project.tags,
      primary_language: project.primary_language,
      stars_count: project.stars_count,
    };

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
        messages: buildScreenPrompt(input, readmeText),
        maxTokens: SCREEN_MAX_TOKENS,
      });
    } catch (err) {
      if (err instanceof AiConfigError) {
        result.stopKind = 'config';
        result.stopReason = err.message;
        result.hasMore = true;
        return result;
      }
      throw err;
    }

    if (chatResult.kind === 'rate_limited') {
      result.stopKind = 'rate_limited';
      result.stopReason = 'provider rate-limited — nothing consumed, resume shortly';
      result.hasMore = true;
      return result;
    }
    if (chatResult.kind === 'error') {
      result.stopKind = 'provider_error';
      result.stopReason =
        `provider error${chatResult.status ? ` ${chatResult.status}` : ''}: ${chatResult.message.trim()}`.trim();
      result.hasMore = true;
      return result;
    }

    const parsed = parseScreenResult(chatResult.content);
    const stamp = planScreenStamp(parsed, chatResult.model, new Date().toISOString());

    // One lean read per item so `flagged` can't be auto-downgraded (D22).
    // Cheap by construction: the batch is SCREEN_PER_RUN (3) at most, and the
    // queue dedupes by project id, so there is no concurrent-write race to
    // lose here.
    const { data: existing } = await service
      .from('moderation_screens')
      .select('verdict, reason')
      .eq('project_id', project.id)
      .maybeSingle();

    const write = resolveScreenWrite(
      (existing?.verdict as ScreenVerdict | undefined) ?? null,
      stamp,
      existing?.reason ?? null,
    );

    const { error } = await service
      .from('moderation_screens')
      .upsert(
        { project_id: project.id, source: queueItem.source, ...write },
        { onConflict: 'project_id' },
      );
    // Mirrors enrichNextBatch's write-error handling: log and move on — the
    // model gave a genuine reply this call, so it still counts toward the
    // tally, same as planStamp's write path. A failed upsert means the row
    // stays unscreened in the DB and is picked up again next call (no
    // `enriched_at`-equivalent "attempted" marker survives a failed write).
    if (error) console.error('[enrich/screen] screen upsert failed:', error.message);

    result.screened += 1;
    // Counts what was actually WRITTEN, not what the model said — a sustained
    // flag (D22) is still a flagged row in the admin queue.
    if (write.verdict === 'flagged') result.flagged += 1;
  }

  return result;
}

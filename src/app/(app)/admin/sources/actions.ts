'use server';

/**
 * Server actions for /admin/sources (docs/plans/p1-gallery-engine.md, Wave
 * 2C). Every action re-runs `requireAdmin()` — the layout's check is
 * defense-in-depth only, not the real gate (server actions bypass the
 * layout tree entirely; see src/lib/auth/admin.ts).
 *
 * Three ingestion paths land here:
 *  - topic crawl: GitHub `/search/repositories` (SEPARATE 30/min rate
 *    bucket — locked arch #8), walked sequentially with a delay between
 *    calls, NEVER the concurrency pool.
 *  - awesome-list crawl: one README fetched + parsed for github.com links,
 *    then each ref resolved through the core 5k/hr budget via a bounded
 *    concurrency-5 pool (safe — same budget the cron sync pool uses).
 *  - manual add: a single owner/repo, no crawl_run row (not a "run").
 *
 * All three funnel through `upsertCandidates` (src/lib/ingest/upsert.ts,
 * built concurrently against the contract documented in this wave's brief) —
 * the one blocklist-checked, decided-rows-preserving write path shared with
 * the star-import and queue-approval flows.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/admin';
import { copy } from '@/lib/copy';
import {
  type GithubRepo,
  type GithubResult,
  getReadmeHtml,
  getRepoByOwnerName,
  searchRepositories,
} from '@/lib/github/client';
import { extractGithubRepoRefs } from '@/lib/ingest/links';
import { nextCrawlDelayMs, SEARCH_BUCKET_DELAY_MS } from '@/lib/ingest/throttle';
import { upsertCandidates } from '@/lib/ingest/upsert';
import { supabaseService } from '@/lib/supabase/clients';
import type { TablesInsert } from '@/lib/supabase/types';
import { TAG_SLUG_PATTERN } from '@/lib/tags/slug';

const DEFAULT_MIN_STARS = 50;
const DEFAULT_MAX_RESULTS = 60;
const MAX_MAX_RESULTS = 100;

// GitHub's own owner/repo name charset — mirrors the private (unexported)
// OWNER_PATTERN/REPO_PATTERN in src/lib/ingest/links.ts, which only sees
// refs already extracted from README HTML rather than raw form input.
const OWNER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]*$/;
const REPO_PATTERN = /^[A-Za-z0-9._-]+$/;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Awesome-list README crawls resolve refs through the core 5k/hr budget
// (NOT the search bucket) — same pool shape as src/app/api/cron/sync/route.ts.
const RESOLVE_POOL_CONCURRENCY = 5;
const AWESOME_LIST_REF_CAP = 100;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Result-summary redirect helper — plain forms → actions → redirect +
// searchParams summary (admin surface: simple is fine, no client state).
// ---------------------------------------------------------------------------

type SourcesSummary = {
  action: 'topic_crawl' | 'awesome_list' | 'manual' | 'block';
  created?: number;
  touched?: number;
  blocked?: number;
  error?: string;
};

function sourcesRedirectPath(summary: SourcesSummary): string {
  const params = new URLSearchParams({ action: summary.action });
  if (summary.created !== undefined) params.set('created', String(summary.created));
  if (summary.touched !== undefined) params.set('touched', String(summary.touched));
  if (summary.blocked !== undefined) params.set('blocked', String(summary.blocked));
  if (summary.error) params.set('error', summary.error);
  return `/admin/sources?${params.toString()}`;
}

function describeGithubFailure(result: Exclude<GithubResult<unknown>, { kind: 'ok' }>): string {
  switch (result.kind) {
    case 'not_found':
      return 'not found';
    case 'not_modified':
      return 'not modified';
    case 'rate_limited':
      return 'github rate limited';
    case 'error':
      return `github error ${result.status}: ${result.message}`;
    default: {
      const exhaustive: never = result;
      throw new Error(`unhandled GithubResult failure: ${JSON.stringify(exhaustive)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// runTopicCrawl
// ---------------------------------------------------------------------------

function buildTopicCrawlQuery(topic: string, minStars: number, language: string | null): string {
  const parts = [`topic:${topic}`, `stars:>=${minStars}`, 'fork:false', 'archived:false'];
  if (language) {
    // Quote language values containing whitespace (e.g. a pasted "Jupyter Notebook").
    parts.push(language.includes(' ') ? `language:"${language}"` : `language:${language}`);
  }
  return parts.join(' ');
}

/**
 * Walks `/search/repositories` pages sequentially — SEARCH_BUCKET_DELAY_MS
 * between successful calls, `nextCrawlDelayMs` backoff between error
 * retries (giving up after 3 consecutive errors) — until `maxResults` items
 * are collected or the search runs out of pages. NEVER touches the
 * concurrency pool (locked arch #8).
 */
async function collectTopicCrawlItems(
  query: string,
  maxResults: number,
): Promise<{ items: GithubRepo[]; rateLimitedAtPage: number | null; erroredOut: boolean }> {
  const items: GithubRepo[] = [];
  let page = 1;
  let consecutiveErrors = 0;
  let rateLimitedAtPage: number | null = null;
  let erroredOut = false;

  while (items.length < maxResults) {
    const perPage = Math.min(100, maxResults - items.length);
    const result = await searchRepositories(query, { perPage, page });

    if (result.kind === 'ok') {
      items.push(...result.data.items);
      consecutiveErrors = 0;
      const isLastPage = result.data.items.length < perPage;
      if (isLastPage || items.length >= maxResults) break;
      page += 1;
      await sleep(SEARCH_BUCKET_DELAY_MS);
      continue;
    }

    if (result.kind === 'rate_limited') {
      rateLimitedAtPage = page;
      break;
    }

    consecutiveErrors += 1;
    if (consecutiveErrors >= 3) {
      erroredOut = true;
      break;
    }
    await sleep(nextCrawlDelayMs(consecutiveErrors));
  }

  return { items: items.slice(0, maxResults), rateLimitedAtPage, erroredOut };
}

export async function runTopicCrawl(formData: FormData): Promise<void> {
  const { profileId } = await requireAdmin();
  const service = supabaseService();

  const topic = String(formData.get('topic') ?? '')
    .trim()
    .toLowerCase();
  const minStarsRaw = String(formData.get('min_stars') ?? '').trim();
  const languageRaw = String(formData.get('language') ?? '').trim();
  const maxResultsRaw = String(formData.get('max_results') ?? '').trim();

  if (!TAG_SLUG_PATTERN.test(topic)) {
    redirect(
      sourcesRedirectPath({
        action: 'topic_crawl',
        error: 'topic: lowercase letters, numbers, hyphens only',
      }),
    );
  }

  const minStars = minStarsRaw === '' ? DEFAULT_MIN_STARS : Number(minStarsRaw);
  if (!Number.isFinite(minStars) || minStars < 0) {
    redirect(sourcesRedirectPath({ action: 'topic_crawl', error: 'min stars must be ≥ 0' }));
  }

  const maxResults = maxResultsRaw === '' ? DEFAULT_MAX_RESULTS : Number(maxResultsRaw);
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > MAX_MAX_RESULTS) {
    redirect(
      sourcesRedirectPath({
        action: 'topic_crawl',
        error: `max results must be 1–${MAX_MAX_RESULTS}`,
      }),
    );
  }

  const language = languageRaw.length > 0 ? languageRaw : null;
  const params = { topic, min_stars: minStars, language, max_results: maxResults };

  const { data: run, error: insertError } = await service
    .from('ingest_crawl_runs')
    .insert({ source: 'topic_crawl', params, triggered_by: profileId, status: 'running' })
    .select('id')
    .single();

  if (insertError || !run) {
    console.error('[admin/sources] runTopicCrawl run insert failed:', insertError?.message);
    redirect(sourcesRedirectPath({ action: 'topic_crawl', error: copy.error }));
  }

  const query = buildTopicCrawlQuery(topic, minStars, language);
  const { items, rateLimitedAtPage, erroredOut } = await collectTopicCrawlItems(query, maxResults);

  const { created, touched, blocked } = await upsertCandidates(
    items.map((repo) => ({ repo, source: 'topic_crawl' as const })),
    service,
  );

  const errorDetail =
    rateLimitedAtPage !== null
      ? `rate limited at page ${rateLimitedAtPage}`
      : erroredOut
        ? `stopped after repeated errors (collected ${items.length} of ${maxResults})`
        : null;

  const { error: updateError } = await service
    .from('ingest_crawl_runs')
    .update({
      status: 'done',
      finished_at: new Date().toISOString(),
      candidates_created: created,
      candidates_touched: touched,
      error_detail: errorDetail,
    })
    .eq('id', run.id);

  if (updateError) {
    console.error('[admin/sources] runTopicCrawl run update failed:', updateError.message);
  }

  redirect(
    sourcesRedirectPath({
      action: 'topic_crawl',
      created,
      touched,
      blocked,
      error: errorDetail ?? undefined,
    }),
  );
}

// ---------------------------------------------------------------------------
// runAwesomeList
// ---------------------------------------------------------------------------

/**
 * Resolves `refs` (owner/name pairs) through `getRepoByOwnerName` using a
 * bounded concurrency-5 pool — same shape as src/app/api/cron/sync/
 * route.ts's worker pool. Safe here: `getRepoByOwnerName` shares the core
 * 5k/hr budget, NOT the separate 30/min search bucket.
 */
async function resolveRefsPool(refs: { owner: string; name: string }[]): Promise<GithubRepo[]> {
  const resolved: GithubRepo[] = [];
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= refs.length) return;
      const ref = refs[index];
      if (!ref) return;
      const result = await getRepoByOwnerName(ref.owner, ref.name);
      // not_found / not_modified / rate_limited / error are all skipped —
      // one flaky or renamed ref out of hundreds shouldn't sink the crawl.
      if (result.kind === 'ok') {
        resolved.push(result.data);
      }
    }
  }

  await Promise.all(Array.from({ length: RESOLVE_POOL_CONCURRENCY }, () => worker()));
  return resolved;
}

export async function runAwesomeList(formData: FormData): Promise<void> {
  const { profileId } = await requireAdmin();
  const service = supabaseService();

  const owner = String(formData.get('owner') ?? '').trim();
  const name = String(formData.get('repo') ?? '').trim();

  if (!OWNER_PATTERN.test(owner) || !REPO_PATTERN.test(name)) {
    redirect(sourcesRedirectPath({ action: 'awesome_list', error: 'invalid owner/repo' }));
  }

  const { data: run, error: insertError } = await service
    .from('ingest_crawl_runs')
    .insert({
      source: 'awesome_list',
      params: { owner, repo: name },
      triggered_by: profileId,
      status: 'running',
    })
    .select('id')
    .single();

  if (insertError || !run) {
    console.error('[admin/sources] runAwesomeList run insert failed:', insertError?.message);
    redirect(sourcesRedirectPath({ action: 'awesome_list', error: copy.error }));
  }

  const readmeResult = await getReadmeHtml(owner, name);
  if (readmeResult.kind !== 'ok') {
    const errorDetail = describeGithubFailure(readmeResult);
    await service
      .from('ingest_crawl_runs')
      .update({ status: 'error', finished_at: new Date().toISOString(), error_detail: errorDetail })
      .eq('id', run.id);
    redirect(sourcesRedirectPath({ action: 'awesome_list', error: errorDetail }));
  }

  const allRefs = extractGithubRepoRefs(readmeResult.data);
  const refs = allRefs.slice(0, AWESOME_LIST_REF_CAP);
  const truncatedNote =
    allRefs.length > AWESOME_LIST_REF_CAP
      ? `processed ${AWESOME_LIST_REF_CAP} of ${allRefs.length} refs`
      : null;

  const resolved = await resolveRefsPool(refs);
  // Quality bar (same as decide.ts's `filtered_fork`): forks/archived repos
  // never queue for review, whether they arrive via star import or a crawl.
  const qualityFiltered = resolved.filter((repo) => !repo.fork && !repo.archived);

  const { created, touched, blocked } = await upsertCandidates(
    qualityFiltered.map((repo) => ({ repo, source: 'awesome_list' as const })),
    service,
  );

  const { error: updateError } = await service
    .from('ingest_crawl_runs')
    .update({
      status: 'done',
      finished_at: new Date().toISOString(),
      candidates_created: created,
      candidates_touched: touched,
      error_detail: truncatedNote,
    })
    .eq('id', run.id);

  if (updateError) {
    console.error('[admin/sources] runAwesomeList run update failed:', updateError.message);
  }

  redirect(
    sourcesRedirectPath({
      action: 'awesome_list',
      created,
      touched,
      blocked,
      error: truncatedNote ?? undefined,
    }),
  );
}

// ---------------------------------------------------------------------------
// addManualCandidate
// ---------------------------------------------------------------------------

/** Single adds aren't runs — no ingest_crawl_runs row, unlike the two crawl paths above. */
export async function addManualCandidate(formData: FormData): Promise<void> {
  await requireAdmin();
  const service = supabaseService();

  const owner = String(formData.get('owner') ?? '').trim();
  const name = String(formData.get('repo') ?? '').trim();

  if (!OWNER_PATTERN.test(owner) || !REPO_PATTERN.test(name)) {
    redirect(sourcesRedirectPath({ action: 'manual', error: 'invalid owner/repo' }));
  }

  const result = await getRepoByOwnerName(owner, name);
  if (result.kind !== 'ok') {
    redirect(sourcesRedirectPath({ action: 'manual', error: describeGithubFailure(result) }));
  }

  const { created, touched, blocked } = await upsertCandidates(
    [{ repo: result.data, source: 'admin_manual' as const }],
    service,
  );

  redirect(sourcesRedirectPath({ action: 'manual', created, touched, blocked }));
}

// ---------------------------------------------------------------------------
// deleteAndBlockProject — the consent-removal path
// ---------------------------------------------------------------------------

/**
 * Deletes a project AND writes the matching blocklist row (repo- or
 * owner-scoped) so it never re-surfaces via any ingestion path. Service-role
 * throughout: there is no RLS path for an admin deleting someone else's
 * project row, by design (only the owner's own `projects_delete_own` policy
 * exists — see docs/architecture.md).
 */
export async function deleteAndBlockProject(formData: FormData): Promise<void> {
  const { profileId } = await requireAdmin();
  const service = supabaseService();

  const projectId = String(formData.get('project_id') ?? '').trim();
  const scope = String(formData.get('scope') ?? '');
  const reasonRaw = String(formData.get('reason') ?? '').trim();
  const reason = reasonRaw.length > 0 ? reasonRaw : null;

  if (!UUID_PATTERN.test(projectId) || (scope !== 'repo' && scope !== 'owner')) {
    redirect(sourcesRedirectPath({ action: 'block', error: 'invalid project id or scope' }));
  }

  const { data: project, error: selectError } = await service
    .from('projects')
    .select('id, github_repo_id, profile_id, slug')
    .eq('id', projectId)
    .maybeSingle();

  if (selectError) {
    console.error('[admin/sources] deleteAndBlockProject select failed:', selectError.message);
  }
  if (!project) {
    redirect(sourcesRedirectPath({ action: 'block', error: 'project not found' }));
  }

  const { data: owner, error: ownerError } = await service
    .from('profiles')
    .select('username, github_id')
    .eq('id', project.profile_id)
    .maybeSingle();

  if (ownerError) {
    console.error('[admin/sources] deleteAndBlockProject owner lookup failed:', ownerError.message);
  }
  if (!owner) {
    redirect(sourcesRedirectPath({ action: 'block', error: 'project owner not found' }));
  }

  // Same shape on both branches (satisfies the CHECK constraint's XOR by
  // value, not by TS discriminated-union structure) — a union of two object
  // literal shapes confuses supabase-js's generated insert() overloads.
  const blockRow: TablesInsert<'ingest_blocklist'> =
    scope === 'repo'
      ? {
          scope: 'repo',
          github_repo_id: project.github_repo_id,
          github_owner_id: null,
          reason,
          created_by: profileId,
        }
      : {
          scope: 'owner',
          github_owner_id: owner.github_id,
          github_repo_id: null,
          reason,
          created_by: profileId,
        };

  const { error: blockError } = await service.from('ingest_blocklist').insert(blockRow);
  // 23505 = unique_violation on the partial index (idx_ingest_blocklist_repo /
  // _owner) — this repo/owner is already blocklisted, which is exactly the
  // "ON CONFLICT ... DO NOTHING" outcome the plan calls for, so it's not an
  // error worth surfacing. (supabase-js's upsert() can't reliably target
  // these PARTIAL unique indexes without a matching predicate in the
  // generated ON CONFLICT clause, so a plain insert + swallow-23505 is the
  // simplest correct equivalent.)
  if (blockError && blockError.code !== '23505') {
    console.error(
      '[admin/sources] deleteAndBlockProject blocklist insert failed:',
      blockError.message,
    );
    redirect(sourcesRedirectPath({ action: 'block', error: copy.error }));
  }

  const { error: deleteError } = await service.from('projects').delete().eq('id', project.id);
  if (deleteError) {
    console.error(
      '[admin/sources] deleteAndBlockProject project delete failed:',
      deleteError.message,
    );
    redirect(sourcesRedirectPath({ action: 'block', error: copy.error }));
  }

  // Retro-moderation completion (P2.5 Wave 2A, docs/plans/p2.5-self-running.md):
  // this action is also reachable from the admin queue's "published,
  // unreviewed" section (a retro row's delete+block button), not just this
  // page. If this project came from a still-unreviewed auto-approved
  // candidate (decided_by IS NULL), deleting it here IS the review — stamp
  // decided_by/decided_at so the retro queue stops listing a row whose
  // project no longer exists. Guarded to `decided_by IS NULL` so it never
  // clobbers a genuine human approval's provenance; harmless no-op when no
  // matching candidate row exists (e.g. a hand-added-via-/new project) or
  // the candidate was already reviewed. (The candidate's
  // `materialized_project_id` FK is `on delete set null` — 0006_ingestion.sql —
  // so the row survives this delete on its own; this stamp is purely about
  // the review bookkeeping, not referential integrity.)
  const { error: candidateStampError } = await service
    .from('ingest_candidates')
    .update({ decided_by: profileId, decided_at: new Date().toISOString() })
    .eq('github_repo_id', project.github_repo_id)
    .is('decided_by', null);
  if (candidateStampError) {
    console.error(
      '[admin/sources] deleteAndBlockProject candidate stamp failed:',
      candidateStampError.message,
    );
  }

  revalidatePath(`/u/${owner.username}`);
  revalidatePath(`/u/${owner.username}/${project.slug}`);
  revalidatePath('/', 'layout');
  revalidatePath('/admin/queue');

  redirect(sourcesRedirectPath({ action: 'block', blocked: 1 }));
}

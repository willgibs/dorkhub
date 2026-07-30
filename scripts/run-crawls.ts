/**
 * Headless crawl runner (P4 content thread) — drives the SAME lib functions
 * the /admin/sources actions orchestrate (searchRepositories →
 * upsertCandidates, getReadmeHtml → extractGithubRepoRefs → resolve pool),
 * with the same crawl_runs bookkeeping, throttles, and quality bar — minus
 * the browser session. For bulk imports an admin would otherwise click
 * through form-by-form.
 *
 *   set -a && source .env.local && set +a
 *   NODE_OPTIONS='--conditions react-server' pnpm dlx tsx --tsconfig tsconfig.json \
 *     scripts/run-crawls.ts --topics cli,tui --min-stars 50 --max 100 \
 *     --lists sindresorhus/awesome-selfhosted
 *
 * `--conditions react-server` makes the 'server-only' marker package resolve
 * to its empty export (the same trick vitest does via an alias). Search
 * calls stay strictly sequential on the 30/min bucket (locked arch #8);
 * list refs resolve through the core budget's concurrency-5 pool.
 */

import {
  type GithubRepo,
  getReadmeHtml,
  getRepoByOwnerName,
  searchRepositories,
} from '../src/lib/github/client';
import { extractGithubRepoRefs } from '../src/lib/ingest/links';
import { nextCrawlDelayMs, SEARCH_BUCKET_DELAY_MS } from '../src/lib/ingest/throttle';
import { upsertCandidates } from '../src/lib/ingest/upsert';
import { supabaseService } from '../src/lib/supabase/clients';

const AWESOME_LIST_REF_CAP = 100;
const RESOLVE_POOL_CONCURRENCY = 5;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function argValue(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function buildTopicCrawlQuery(topic: string, minStars: number): string {
  return [`topic:${topic}`, `stars:>=${minStars}`, 'fork:false', 'archived:false'].join(' ');
}

async function collectTopicCrawlItems(query: string, maxResults: number) {
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
      if (result.kind === 'ok') resolved.push(result.data);
    }
  }
  await Promise.all(Array.from({ length: RESOLVE_POOL_CONCURRENCY }, () => worker()));
  return resolved;
}

async function main() {
  const topics = (argValue('--topics') ?? '').split(',').map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const lists = (argValue('--lists') ?? '').split(',').map((t) => t.trim()).filter(Boolean);
  const minStars = Number(argValue('--min-stars') ?? '50');
  const maxResults = Number(argValue('--max') ?? '100');

  if (topics.length === 0 && lists.length === 0) {
    console.error('usage: run-crawls.ts --topics a,b --lists owner/repo[,owner/repo] [--min-stars 50] [--max 100]');
    process.exit(1);
  }

  const service = supabaseService();
  const { data: admin } = await service
    .from('profiles')
    .select('id')
    .eq('username', 'willgibs')
    .single();
  if (!admin) throw new Error('willgibs profile not found (triggered_by)');

  let totalCreated = 0;
  let totalTouched = 0;
  let totalBlocked = 0;

  for (const topic of topics) {
    const params = { topic, min_stars: minStars, language: null, max_results: maxResults };
    const { data: run } = await service
      .from('ingest_crawl_runs')
      .insert({ source: 'topic_crawl', params, triggered_by: admin.id, status: 'running' })
      .select('id')
      .single();
    if (!run) {
      console.error(`[topic ${topic}] crawl_run insert failed — skipping`);
      continue;
    }

    const { items, rateLimitedAtPage, erroredOut } = await collectTopicCrawlItems(
      buildTopicCrawlQuery(topic, minStars),
      maxResults,
    );
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
    await service
      .from('ingest_crawl_runs')
      .update({
        status: 'done',
        finished_at: new Date().toISOString(),
        candidates_created: created,
        candidates_touched: touched,
        error_detail: errorDetail,
      })
      .eq('id', run.id);

    totalCreated += created;
    totalTouched += touched;
    totalBlocked += blocked;
    console.log(
      `[topic ${topic}] created=${created} touched=${touched} blocked=${blocked}${errorDetail ? ` (${errorDetail})` : ''}`,
    );
    await sleep(SEARCH_BUCKET_DELAY_MS);
  }

  for (const list of lists) {
    const [owner, name] = list.split('/');
    if (!owner || !name) {
      console.error(`[list ${list}] not owner/repo shaped — skipping`);
      continue;
    }
    const { data: run } = await service
      .from('ingest_crawl_runs')
      .insert({
        source: 'awesome_list',
        params: { owner, repo: name },
        triggered_by: admin.id,
        status: 'running',
      })
      .select('id')
      .single();
    if (!run) {
      console.error(`[list ${list}] crawl_run insert failed — skipping`);
      continue;
    }

    const readmeResult = await getReadmeHtml(owner, name);
    if (readmeResult.kind !== 'ok') {
      const errorDetail = `readme fetch: ${readmeResult.kind}`;
      await service
        .from('ingest_crawl_runs')
        .update({ status: 'error', finished_at: new Date().toISOString(), error_detail: errorDetail })
        .eq('id', run.id);
      console.error(`[list ${list}] ${errorDetail}`);
      continue;
    }

    const allRefs = extractGithubRepoRefs(readmeResult.data);
    const refs = allRefs.slice(0, AWESOME_LIST_REF_CAP);
    const truncatedNote =
      allRefs.length > AWESOME_LIST_REF_CAP
        ? `processed ${AWESOME_LIST_REF_CAP} of ${allRefs.length} refs`
        : null;
    const resolved = await resolveRefsPool(refs);
    const qualityFiltered = resolved.filter((repo) => !repo.fork && !repo.archived);
    const { created, touched, blocked } = await upsertCandidates(
      qualityFiltered.map((repo) => ({ repo, source: 'awesome_list' as const })),
      service,
    );
    await service
      .from('ingest_crawl_runs')
      .update({
        status: 'done',
        finished_at: new Date().toISOString(),
        candidates_created: created,
        candidates_touched: touched,
        error_detail: truncatedNote,
      })
      .eq('id', run.id);

    totalCreated += created;
    totalTouched += touched;
    totalBlocked += blocked;
    console.log(
      `[list ${list}] created=${created} touched=${touched} blocked=${blocked}${truncatedNote ? ` (${truncatedNote})` : ''}`,
    );
  }

  console.log(`TOTAL created=${totalCreated} touched=${totalTouched} blocked=${totalBlocked}`);
}

main().catch((error) => {
  console.error('run-crawls failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});

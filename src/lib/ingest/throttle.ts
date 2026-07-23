/**
 * Pure backoff helper for the `/search/*` crawl loop (see docs/plans/p1-
 * gallery-engine.md, "Locked architecture" #8). GitHub's search endpoint
 * (`/search/repositories`, used by topic_crawl) is metered on a SEPARATE
 * 30-requests-per-minute bucket, independent of the 5000/hr core budget the
 * rest of the client pool shares — so topic crawls MUST walk pages
 * sequentially with a delay between each call, and must NEVER be run
 * through the concurrency-5 fetch pool used elsewhere (that pool assumes
 * the shared core budget and would blow through the search bucket almost
 * immediately).
 */

/** Base delay between sequential `/search/*` calls — keeps us under 30/min with headroom. */
export const SEARCH_BUCKET_DELAY_MS = 2500;

/** Never wait longer than this between crawl pages, however many consecutive errors accrue. */
const MAX_DELAY_MS = 60_000;

/**
 * Delay before the next crawl page, given how many consecutive errors the
 * crawl has hit so far. Starts at `SEARCH_BUCKET_DELAY_MS` and doubles per
 * consecutive error, capped at `MAX_DELAY_MS`.
 */
export function nextCrawlDelayMs(consecutiveErrors: number): number {
  const delay = SEARCH_BUCKET_DELAY_MS * 2 ** consecutiveErrors;
  return Math.min(delay, MAX_DELAY_MS);
}

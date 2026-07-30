import { createHash } from 'node:crypto';

/**
 * Per-IP fixed-window rate limiting for /api/search (P4, migration 0019).
 *
 * FAIL-OPEN — deliberately the inverse of the AI budget's fail-closed. This
 * guards a read-only public endpoint, so when the ledger itself is
 * unreachable, availability wins and the search runs unlimited; spend is
 * separately bounded (AI ledger, Vercel Spend Management at launch). Only an
 * explicit `false` from claim_search_call — genuinely over the window's cap,
 * or a zero ceiling — rate-limits.
 */
export const SEARCH_RATE_LIMIT_MAX_DEFAULT = 60;
export const SEARCH_RATE_LIMIT_WINDOW_S = 60;

/**
 * SEARCH_RATE_LIMIT_MAX env parse: junk/negative degrade to the default;
 * `0` is respected as a real kill-switch (every search 429s) — same parse
 * contract as the AI ceilings in src/lib/ai/budget.ts.
 */
export function searchRateLimitMax(): number {
  const raw = process.env.SEARCH_RATE_LIMIT_MAX;
  if (raw === undefined || raw.trim() === '') return SEARCH_RATE_LIMIT_MAX_DEFAULT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return SEARCH_RATE_LIMIT_MAX_DEFAULT;
  return parsed;
}

/**
 * Ledger key: the LEFTMOST x-forwarded-for entry (the client, per Vercel's
 * proxy chain — the same header family requestOrigin() already trusts),
 * sha-256 hashed so raw IPs never sit at rest. A missing header (local dev,
 * some health checks) buckets under one shared sentinel — that traffic
 * shares a single window, which is fine for what it is.
 */
export function hashClientIp(forwardedFor: string | null): string {
  const first = (forwardedFor ?? '').split(',')[0]?.trim();
  return createHash('sha256')
    .update(first || 'unknown')
    .digest('hex');
}

/**
 * Decision from the rpc result. Anything that is not literally `false`
 * allows the search — rpc errors and malformed payloads included (fail-open;
 * the route logs the error). Compare src/lib/ai/budget.ts interpretClaim,
 * where the same inputs refuse: the two directions are each load-bearing.
 */
export function interpretSearchClaim(
  data: unknown,
  error: { message: string } | null,
): 'ok' | 'limited' {
  if (error) return 'ok';
  return data === false ? 'limited' : 'ok';
}

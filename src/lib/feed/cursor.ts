/**
 * Keyset-pagination cursor codec — base64url over a JSON tuple (see
 * docs/architecture.md "Feed & caching"). Pure, no IO.
 *
 * SECURITY: `raw` is an attacker-reachable query param (`?cursor=...`).
 * `decodeCursor` and every typed `decodeXxxCursor` wrapper must NEVER throw —
 * any malformed input (bad base64, bad JSON, wrong shape, wrong types) returns
 * `null` so callers can fall back to "first page" instead of 500ing.
 */

export type CursorValidator = (value: unknown) => boolean;

/** Encodes a tuple of ordering-key values into an opaque base64url cursor string. */
export function encodeCursor(values: readonly unknown[]): string {
  const json = JSON.stringify(values);
  const base64 = Buffer.from(json, 'utf8').toString('base64');
  return base64ToBase64Url(base64);
}

/**
 * Decodes a base64url cursor string back into a tuple, validating each
 * element against the positional `validators`. Returns `null` on ANY failure:
 * malformed base64, malformed JSON, non-array payload, wrong length, or any
 * validator returning false. Never throws.
 */
export function decodeCursor(
  raw: string,
  validators: readonly CursorValidator[],
): unknown[] | null {
  try {
    if (typeof raw !== 'string' || raw.length === 0) return null;

    const base64 = base64UrlToBase64(raw);
    // Buffer never throws on invalid base64 — it decodes best-effort — so we
    // validate the round trip explicitly below via JSON.parse instead.
    const json = Buffer.from(base64, 'base64').toString('utf8');

    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    if (parsed.length !== validators.length) return null;

    for (let i = 0; i < validators.length; i++) {
      const validator = validators[i];
      if (!validator?.(parsed[i])) return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBase64(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const paddingNeeded = (4 - (base64.length % 4)) % 4;
  return base64 + '='.repeat(paddingNeeded);
}

// ---------------------------------------------------------------------------
// Typed wrappers
// ---------------------------------------------------------------------------

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Recent-feed ordering key: [publishedAtIso, id]. */
export type RecentCursor = readonly [publishedAtIso: string, id: string];

export function encodeRecentCursor(publishedAtIso: string, id: string): string {
  return encodeCursor([publishedAtIso, id]);
}

export function decodeRecentCursor(raw: string): RecentCursor | null {
  const result = decodeCursor(raw, [isString, isString]);
  if (!result) return null;
  return result as unknown as RecentCursor;
}

/** Trending-feed ordering key: [score, id]. */
export type TrendingCursor = readonly [score: number, id: string];

export function encodeTrendingCursor(score: number, id: string): string {
  return encodeCursor([score, id]);
}

export function decodeTrendingCursor(raw: string): TrendingCursor | null {
  const result = decodeCursor(raw, [isFiniteNumber, isString]);
  if (!result) return null;
  return result as unknown as TrendingCursor;
}

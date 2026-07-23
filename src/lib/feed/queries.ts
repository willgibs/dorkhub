import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

import { supabaseAnon } from '@/lib/supabase/clients';
import type { Database, Tables } from '@/lib/supabase/types';
import {
  decodeRecentCursor,
  decodeTrendingCursor,
  encodeRecentCursor,
  encodeTrendingCursor,
  type RecentCursor,
  type TrendingCursor,
} from './cursor';

/**
 * Feed data layer (docs/architecture.md "Feed & caching", docs/plans/m5-discovery.md
 * Wave 1B). Public reads go through the cookie-LESS anon client so RSCs stay
 * cacheable; keyset pagination everywhere, never OFFSET.
 */

export type FeedSort = 'recent' | 'trending';

export const FEED_PAGE_SIZE = 24;
export const FEED_PAGE_SIZE_MAX = 48;

type ProjectRow = Tables<'projects'>;
type ProfileRow = Tables<'profiles'>;

// ---------------------------------------------------------------------------
// resolveFeedFilterSpec — pure param normalization
// ---------------------------------------------------------------------------

/**
 * Raw, possibly-untrusted feed query params (e.g. straight off `URLSearchParams`
 * in `/api/feed`, or hand-built by a server component that already knows the
 * sort/tag from the route). Every field tolerates garbage — this is the single
 * place feed params get normalized, whether the source is trusted or not.
 */
export type FeedQueryParams = {
  /** Any string; unrecognized or missing → 'recent' (same garbage-tolerance as cursor/tag/language below). */
  sort?: string | null;
  limit?: number | string | null;
  tag?: string | null;
  language?: string | null;
  cursor?: string | null;
};

export type FeedFilterSpec = {
  sort: FeedSort;
  limit: number;
  tag: string | null;
  language: string | null;
  cursor: RecentCursor | TrendingCursor | null;
};

function clampLimit(raw: FeedQueryParams['limit']): number {
  const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : raw;
  if (n === null || n === undefined || !Number.isFinite(n)) return FEED_PAGE_SIZE;
  return Math.min(FEED_PAGE_SIZE_MAX, Math.max(1, Math.trunc(n)));
}

/** Trims + lowercases a tag/language filter value; empty/missing → null. */
function normalizeFilterValue(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Normalizes raw feed params into a typed spec. PURE — no IO. Never throws:
 * a malformed limit/tag/language/cursor/sort silently falls back to a sane
 * default (page 1, no filter) rather than erroring the request.
 */
export function resolveFeedFilterSpec(params: FeedQueryParams): FeedFilterSpec {
  const sort: FeedSort = params.sort === 'trending' ? 'trending' : 'recent';
  const limit = clampLimit(params.limit);
  const tag = normalizeFilterValue(params.tag);
  const language = normalizeFilterValue(params.language);

  const cursor = params.cursor
    ? sort === 'trending'
      ? decodeTrendingCursor(params.cursor)
      : decodeRecentCursor(params.cursor)
    : null;

  return { sort, limit, tag, language, cursor };
}

// ---------------------------------------------------------------------------
// FeedRow — lean explicit column select (NEVER select('*'), readme_html ~200KB)
// ---------------------------------------------------------------------------

export type FeedRow = Pick<
  ProjectRow,
  | 'id'
  | 'slug'
  | 'profile_id'
  | 'name'
  | 'tagline'
  | 'primary_language'
  | 'stars_count'
  | 'forks_count'
  | 'license'
  | 'demo_url'
  | 'tags'
  | 'screenshots'
  | 'likes_count'
  | 'updated_at'
  | 'published_at'
  | 'trending_score'
  | 'repo_full_name'
> & {
  profiles: Pick<ProfileRow, 'username' | 'display_name' | 'avatar_url' | 'followers_count'>;
};

// Exported (not just used internally) so callers building their own embedded
// select — e.g. /saved's `saves!inner(projects!inner(...))` — can reuse the
// exact same lean projection instead of hand-mirroring it (docs/plans/
// p2-discovery.md Wave 1A decision 4: a hand-mirrored copy is a drift hazard).
export const FEED_COLUMNS = [
  'id',
  'slug',
  'profile_id',
  'name',
  'tagline',
  'primary_language',
  'stars_count',
  'forks_count',
  'license',
  'demo_url',
  'tags',
  'screenshots',
  'likes_count',
  'updated_at',
  'published_at',
  'trending_score',
  'repo_full_name',
  // The FK name is REQUIRED: projects↔profiles has three relationships (the
  // direct FK plus many-to-many through likes and saves), so a bare
  // `profiles!inner` is ambiguous and PostgREST 400s it (PGRST201) —
  // verified against the live API.
  'profiles!projects_profile_id_fkey!inner(username, display_name, avatar_url, followers_count)',
].join(', ');

export type FeedPage = {
  rows: FeedRow[];
  nextCursor: string | null;
};

// ---------------------------------------------------------------------------
// fetchFeedPage / fetchFollowingFeedPage
// ---------------------------------------------------------------------------

/**
 * Builds the shared filtered+ordered (but not yet limited) query — the common
 * core of `fetchFeedPage` and `fetchFollowingFeedPage`. Keyset pagination via
 * `.or(...)` on the ordering-index tuple; NEVER OFFSET (docs/architecture.md).
 *
 * Note: language matching is exact-case (GitHub's own casing, e.g.
 * "TypeScript" not "typescript") — `resolveFeedFilterSpec` lowercases the
 * filter value for URL/cache-key hygiene, so an exact `.eq()` here will only
 * match a language that happens to be all-lowercase already. Documented scope
 * cut (docs/plans/m5-discovery.md): language filter is query-layer +
 * `/api/feed?language=` only, no UI, so this is acceptable for v1.
 */
function buildFeedQuery(client: SupabaseClient<Database>, spec: FeedFilterSpec) {
  let query = client.from('projects').select(FEED_COLUMNS).eq('status', 'published');

  if (spec.tag) query = query.contains('tags', [spec.tag]);
  if (spec.language) query = query.eq('primary_language', spec.language);

  if (spec.sort === 'trending') {
    query = query.order('trending_score', { ascending: false }).order('id', { ascending: false });
    if (spec.cursor) {
      const [score, id] = spec.cursor as TrendingCursor;
      query = query.or(`trending_score.lt.${score},and(trending_score.eq.${score},id.lt.${id})`);
    }
  } else {
    query = query.order('published_at', { ascending: false }).order('id', { ascending: false });
    if (spec.cursor) {
      const [publishedAtIso, id] = spec.cursor as RecentCursor;
      query = query.or(
        `published_at.lt.${publishedAtIso},and(published_at.eq.${publishedAtIso},id.lt.${id})`,
      );
    }
  }

  return query;
}

/**
 * Fetches limit+1 rows, slices back to `spec.limit`, and derives `nextCursor`
 * from the last KEPT row. The select-string embed (`profiles!inner(...)`)
 * isn't fully verified by postgrest-js's generic inference, so the cast to
 * `FeedRow[]` is an explicit, deliberate IO-boundary trust — the shape is
 * enforced by `FEED_COLUMNS` above and covered by the caller's own tests.
 */
function toFeedPage(data: unknown, spec: FeedFilterSpec): FeedPage {
  const rows = (data ?? []) as unknown as FeedRow[];
  const hasMore = rows.length > spec.limit;
  const page = hasMore ? rows.slice(0, spec.limit) : rows;
  const last = page[page.length - 1];

  const nextCursor =
    hasMore && last
      ? spec.sort === 'trending'
        ? encodeTrendingCursor(last.trending_score, last.id)
        : encodeRecentCursor(last.published_at ?? '', last.id)
      : null;

  return { rows: page, nextCursor };
}

export async function fetchFeedPage(
  spec: FeedFilterSpec,
  client: SupabaseClient<Database>,
): Promise<FeedPage> {
  const { data, error } = await buildFeedQuery(client, spec).limit(spec.limit + 1);
  if (error) {
    console.error('[feed/queries] fetchFeedPage failed', { message: error.message });
    return { rows: [], nextCursor: null };
  }
  return toFeedPage(data, spec);
}

/** Same as `fetchFeedPage`, scoped to a set of followed profiles. Empty `followeeIds` short-circuits WITHOUT querying (an empty `.in()` would otherwise round-trip for nothing). */
export async function fetchFollowingFeedPage(
  spec: FeedFilterSpec,
  followeeIds: string[],
  client: SupabaseClient<Database>,
): Promise<FeedPage> {
  if (followeeIds.length === 0) {
    return { rows: [], nextCursor: null };
  }

  const { data, error } = await buildFeedQuery(client, spec)
    .in('profile_id', followeeIds)
    .limit(spec.limit + 1);
  if (error) {
    console.error('[feed/queries] fetchFollowingFeedPage failed', { message: error.message });
    return { rows: [], nextCursor: null };
  }
  return toFeedPage(data, spec);
}

// ---------------------------------------------------------------------------
// getFeedPage — cached public entry point
// ---------------------------------------------------------------------------

/**
 * Cached (60s, tag 'feed') public feed read via the anon client — the entry
 * point RSCs should use for the main discovery routes. Keyed on the resolved
 * spec so distinct sort/tag/language/cursor combinations don't collide.
 */
export async function getFeedPage(params: FeedQueryParams): Promise<FeedPage> {
  const spec = resolveFeedFilterSpec(params);

  const cached = unstable_cache(
    async (): Promise<FeedPage> => fetchFeedPage(spec, supabaseAnon()),
    [
      'feed',
      spec.sort,
      String(spec.limit),
      spec.tag ?? '_',
      spec.language ?? '_',
      spec.cursor ? JSON.stringify(spec.cursor) : '_',
    ],
    { revalidate: 60, tags: ['feed'] },
  );

  return cached();
}

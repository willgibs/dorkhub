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
  | 'lists_count'
  | 'updated_at'
  | 'github_pushed_at'
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
  'lists_count',
  'updated_at',
  'github_pushed_at',
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
// fetchFeedPage / fetchFollowingFeedPage — via the feed_page RPC
// ---------------------------------------------------------------------------

type FeedPageArgs = Database['public']['Functions']['feed_page']['Args'];

/**
 * The flattened row `feed_page` (migration 0014) returns — every `FeedRow`
 * project column plus `author_*` columns instead of a nested embed (an RPC
 * returns a flat table). Derived FROM `FeedRow` so there is exactly one
 * definition of what a feed row carries; the generated RPC `Returns` type is
 * not used directly because function table-returns lose nullability in
 * codegen (`tagline: string`, not `string | null`).
 */
export type FeedPageRpcRow = Omit<FeedRow, 'profiles'> & {
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  author_followers_count: number;
};

/**
 * Builds the typed argument object for the `feed_page` RPC (P3-C wave C1,
 * decision D31). This replaced a PostgREST `.or()` cursor emulation that
 * COULD NOT SEEK — it scanned the ordering index from the top and discarded
 * every row before the cursor (`Rows Removed by Filter: 7001` at 10k rows,
 * 42× slower, O(offset)); the RPC's row comparison seeks directly
 * (`Index Cond: ROW(...)` — scale_probe.sql P2a/P2b). Deleting the `.or()`
 * also removed the last interpolated filter string built from user-derived
 * input: these TYPED args are the boundary now, and the P2.7 cursor
 * validators in `resolveFeedFilterSpec` stay as defense in depth.
 *
 * Optional filters are OMITTED (not passed as null) — the SQL side builds
 * the exact predicate set it receives.
 *
 * Language matches `language_slug` (migration 0012), a generated
 * `lower(primary_language)` column. This filter was DEAD before that:
 * `resolveFeedFilterSpec` lowercases the incoming value and the pre-0012
 * filter exact-matched the GitHub-cased column, so `?language=typescript`
 * returned an empty page for every casing. `lower()` rather than a slugify
 * because a slugify collides (`C#` and `C++` both → `c-`).
 */
export function buildFeedRpcArgs(spec: FeedFilterSpec, followeeIds: string[] | null): FeedPageArgs {
  // limit + 1: the look-ahead row `toFeedPage` uses to derive `nextCursor`.
  const args: FeedPageArgs = { p_sort: spec.sort, p_limit: spec.limit + 1 };
  if (spec.tag) args.p_tag = spec.tag;
  if (spec.language) args.p_language = spec.language;
  if (followeeIds) args.p_profile_ids = followeeIds;

  if (spec.cursor) {
    if (spec.sort === 'trending') {
      const [score, id] = spec.cursor as TrendingCursor;
      args.p_cursor_score = score;
      args.p_cursor_id = id;
    } else {
      const [publishedAtIso, id] = spec.cursor as RecentCursor;
      args.p_cursor_at = publishedAtIso;
      args.p_cursor_id = id;
    }
  }

  return args;
}

/** Re-nests the RPC's flattened `author_*` columns into the `profiles` embed shape every feed consumer renders. */
export function flattenedToFeedRow(row: FeedPageRpcRow): FeedRow {
  const {
    author_username,
    author_display_name,
    author_avatar_url,
    author_followers_count,
    ...project
  } = row;
  return {
    ...project,
    profiles: {
      username: author_username,
      display_name: author_display_name,
      avatar_url: author_avatar_url,
      followers_count: author_followers_count,
    },
  };
}

/**
 * Takes the RPC's limit+1 look-ahead rows, slices back to `spec.limit`, and
 * derives `nextCursor` from the last KEPT row. The cast to
 * `FeedPageRpcRow[]` is an explicit, deliberate IO-boundary trust — the
 * shape is enforced by the migration's `returns table` and proven
 * row-identical to the old embed path on live data (C1 parity check).
 */
function toFeedPage(data: unknown, spec: FeedFilterSpec): FeedPage {
  const flat = (data ?? []) as unknown as FeedPageRpcRow[];
  const hasMore = flat.length > spec.limit;
  const page = (hasMore ? flat.slice(0, spec.limit) : flat).map(flattenedToFeedRow);
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
  const { data, error } = await client.rpc('feed_page', buildFeedRpcArgs(spec, null));
  if (error) {
    console.error('[feed/queries] fetchFeedPage failed', { message: error.message });
    return { rows: [], nextCursor: null };
  }
  return toFeedPage(data, spec);
}

/** Same as `fetchFeedPage`, scoped to a set of followed profiles. Empty `followeeIds` short-circuits WITHOUT querying (the RPC treats a null array as "no filter", so an empty one must never reach it). */
export async function fetchFollowingFeedPage(
  spec: FeedFilterSpec,
  followeeIds: string[],
  client: SupabaseClient<Database>,
): Promise<FeedPage> {
  if (followeeIds.length === 0) {
    return { rows: [], nextCursor: null };
  }

  const { data, error } = await client.rpc('feed_page', buildFeedRpcArgs(spec, followeeIds));
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

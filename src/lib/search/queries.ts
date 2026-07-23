import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables } from '@/lib/supabase/types';

/**
 * Search data layer (docs/plans/m5.5-curator.md Wave 1A, locked decision 1).
 * Public reads go through the cookie-LESS anon client via `/api/search`.
 */

export const SEARCH_PROJECT_LIMIT = 8;
export const SEARCH_PROFILE_LIMIT = 5;
export const SEARCH_TAG_LIMIT = 5;

// ---------------------------------------------------------------------------
// normalizeSearchQuery — pure param normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes a raw, possibly-untrusted `q` query param. Never throws: trims,
 * collapses internal whitespace runs (tabs/newlines included) to single
 * spaces, then rejects anything under 2 chars (not worth a trigram scan) and
 * truncates anything over 64 (keeps the ILIKE pattern and index scan bounded).
 */
export function normalizeSearchQuery(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const collapsed = raw.trim().replace(/\s+/g, ' ');
  if (collapsed.length < 2) return null;

  return collapsed.length > 64 ? collapsed.slice(0, 64) : collapsed;
}

// ---------------------------------------------------------------------------
// escapeIlikeValue — pure ILIKE wildcard escaping
// ---------------------------------------------------------------------------

/**
 * Escapes a value for safe embedding inside a `%${value}%` ILIKE pattern.
 * Ordering matters: backslash MUST be escaped first. Escaping `%`/`_` first
 * would introduce fresh backslashes that the backslash pass would then
 * re-escape, double-escaping the wildcard markers and breaking the match.
 * Escaping backslash first means every backslash in the output is either an
 * original (now-doubled) backslash or the single escape backslash from a
 * `%`/`_` substitution — never both.
 */
export function escapeIlikeValue(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

// ---------------------------------------------------------------------------
// mergeSearchHits — pure flatten/dedupe/rank/cap
// ---------------------------------------------------------------------------

/**
 * Flattens multiple result groups (e.g. "matched by name" + "matched by
 * tagline"), dedupes by `keyOf` (first-seen wins — the earlier group's copy
 * of a row is kept), sorts by `rankOf` descending (stable — ties keep
 * first-seen order), and caps at `limit`. Pure, no IO; `null`/`undefined`
 * groups (a failed query leg) are tolerated and simply skipped.
 */
export function mergeSearchHits<T>(
  groups: readonly (T[] | null | undefined)[],
  keyOf: (row: T) => string,
  rankOf: (row: T) => number,
  limit: number,
): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const group of groups) {
    if (!group) continue;
    for (const row of group) {
      const key = keyOf(row);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(row);
    }
  }

  // Array#sort is stable (spec since ES2019) — equal-rank rows keep their
  // first-seen flatten order rather than being reshuffled.
  deduped.sort((a, b) => rankOf(b) - rankOf(a));

  return deduped.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Result row shapes — lean explicit picks (never select('*'))
// ---------------------------------------------------------------------------

export type SearchProjectResult = Pick<
  Tables<'projects'>,
  'id' | 'slug' | 'name' | 'tagline' | 'trending_score'
> & {
  profiles: Pick<Tables<'profiles'>, 'username' | 'display_name'>;
};

export type SearchProfileResult = Pick<
  Tables<'profiles'>,
  'id' | 'username' | 'display_name' | 'avatar_url' | 'followers_count'
>;

export type SearchTagResult = Pick<Tables<'tags'>, 'slug' | 'label'>;

export type SearchResults = {
  projects: SearchProjectResult[];
  profiles: SearchProfileResult[];
  tags: SearchTagResult[];
};

const SEARCH_PROJECT_COLUMNS = [
  'id',
  'slug',
  'name',
  'tagline',
  'trending_score',
  // FK name REQUIRED — projects↔profiles has multiple relationships (direct
  // FK plus many-to-many through likes/saves), so a bare `profiles!inner`
  // is ambiguous and PostgREST 400s it (PGRST201). Same pattern as
  // src/lib/feed/queries.ts.
  'profiles!projects_profile_id_fkey!inner(username, display_name)',
].join(', ');

const SEARCH_PROFILE_COLUMNS = [
  'id',
  'username',
  'display_name',
  'avatar_url',
  'followers_count',
].join(', ');

const SEARCH_TAG_COLUMNS = ['slug', 'label'].join(', ');

// ---------------------------------------------------------------------------
// execLeg — run one query leg, never throw, log once, null on failure
// ---------------------------------------------------------------------------

/**
 * Runs a single search leg. supabase-js query builders RESOLVE (rather than
 * reject) with an `{ data, error }` pair even on a query-level failure, so a
 * plain `.catch()` on the builder promise wouldn't see that error — this
 * checks the `error` field explicitly, and also wraps the await in try/catch
 * for the rarer transport-level throw. Either path logs once and returns
 * `null` (a "failed group", tolerated by `mergeSearchHits`) instead of
 * letting one bad leg fail the whole `searchAll` call.
 */
async function execLeg<T>(
  query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
  label: string,
): Promise<T[] | null> {
  try {
    const { data, error } = await query;
    if (error) {
      console.error(`[search/queries] ${label} failed`, { message: error.message });
      return null;
    }
    return (data ?? []) as unknown as T[];
  } catch (error) {
    console.error(`[search/queries] ${label} failed`, {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// searchAll — the six-leg fan-out
// ---------------------------------------------------------------------------

/**
 * Runs six independent `.ilike()` legs (project name/tagline, profile
 * username/display_name, tag slug/label) in one `Promise.all`, then merges
 * each pair with `mergeSearchHits`.
 *
 * Deliberately NOT PostgREST `.or()`: its filter grammar treats `,` and `()`
 * as syntax delimiters, so a user-typed query containing those characters
 * could reshape the filter itself — an injection surface beyond plain SQL
 * wildcard escaping. Six single-column `.ilike()` calls sidestep that
 * grammar entirely (docs/plans/m5.5-curator.md locked decision 1).
 *
 * `q` is assumed already normalized (2–64 chars) by the caller; this escapes
 * it for ILIKE and wraps it in `%…%` once, shared by every leg.
 */
export async function searchAll(
  q: string,
  client: SupabaseClient<Database>,
): Promise<SearchResults> {
  const pattern = `%${escapeIlikeValue(q)}%`;

  const [
    projectsByName,
    projectsByTagline,
    profilesByUsername,
    profilesByDisplayName,
    tagsBySlug,
    tagsByLabel,
  ] = await Promise.all([
    execLeg<SearchProjectResult>(
      client
        .from('projects')
        .select(SEARCH_PROJECT_COLUMNS)
        .eq('status', 'published')
        .ilike('name', pattern)
        .order('trending_score', { ascending: false })
        .limit(SEARCH_PROJECT_LIMIT),
      'projects by name',
    ),
    execLeg<SearchProjectResult>(
      client
        .from('projects')
        .select(SEARCH_PROJECT_COLUMNS)
        .eq('status', 'published')
        .ilike('tagline', pattern)
        .order('trending_score', { ascending: false })
        .limit(SEARCH_PROJECT_LIMIT),
      'projects by tagline',
    ),
    execLeg<SearchProfileResult>(
      client
        .from('profiles')
        .select(SEARCH_PROFILE_COLUMNS)
        .ilike('username', pattern)
        .order('followers_count', { ascending: false })
        .limit(SEARCH_PROFILE_LIMIT),
      'profiles by username',
    ),
    execLeg<SearchProfileResult>(
      client
        .from('profiles')
        .select(SEARCH_PROFILE_COLUMNS)
        .ilike('display_name', pattern)
        .order('followers_count', { ascending: false })
        .limit(SEARCH_PROFILE_LIMIT),
      'profiles by display_name',
    ),
    execLeg<SearchTagResult>(
      client.from('tags').select(SEARCH_TAG_COLUMNS).ilike('slug', pattern).limit(SEARCH_TAG_LIMIT),
      'tags by slug',
    ),
    execLeg<SearchTagResult>(
      client
        .from('tags')
        .select(SEARCH_TAG_COLUMNS)
        .ilike('label', pattern)
        .limit(SEARCH_TAG_LIMIT),
      'tags by label',
    ),
  ]);

  return {
    projects: mergeSearchHits(
      [projectsByName, projectsByTagline],
      (row) => row.id,
      (row) => row.trending_score,
      SEARCH_PROJECT_LIMIT,
    ),
    profiles: mergeSearchHits(
      [profilesByUsername, profilesByDisplayName],
      (row) => row.id,
      (row) => row.followers_count,
      SEARCH_PROFILE_LIMIT,
    ),
    tags: mergeSearchHits(
      [tagsBySlug, tagsByLabel],
      (row) => row.slug,
      () => 0,
      SEARCH_TAG_LIMIT,
    ),
  };
}

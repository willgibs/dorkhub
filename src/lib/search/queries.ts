import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/lib/supabase/types';
import { resolveTagSlug } from '@/lib/tags/slug';

/**
 * Search data layer (docs/plans/m5.5-curator.md Wave 1A, locked decision 1).
 * Public reads go through the cookie-LESS anon client via `/api/search`.
 */

export const SEARCH_PROJECT_LIMIT = 8;
export const SEARCH_PROFILE_LIMIT = 5;
export const SEARCH_TAG_LIMIT = 5;

/**
 * Ceiling for the /search results page (P3-B D25). Results are capped top-N by
 * relevance, NOT keyset-paginated: the no-OFFSET rule governs FEEDS, and a set
 * merged from independently-ranked legs cannot keyset-paginate by
 * construction — there is no single ordering key to cursor on.
 */
export const SEARCH_PROJECT_LIMIT_MAX = 48;

/**
 * Relevance tiers, spaced 5 apart so the popularity tiebreak (normalized to
 * [0,1] by `buildProjectRanker`) can order within a tier but never across one.
 *
 * This is the fix for the actual complaint: ranking used to be
 * `trending_score` alone, so an exact name match sorted BELOW a popular
 * project whose tagline merely contained the substring. Popularity now only
 * separates equally-relevant matches.
 *
 * Ordering note: `repo_full_name` is "owner/name", so any name match is also a
 * repo match — the repo tier therefore only fires for OWNER matches, which is
 * why it sits below the name tiers rather than above them.
 */
export const RELEVANCE = {
  nameExact: 50,
  namePrefix: 45,
  nameContains: 40,
  tagExact: 35,
  repoContains: 30,
  taglineContains: 25,
  other: 0,
} as const;

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
  'id' | 'slug' | 'name' | 'tagline' | 'trending_score' | 'repo_full_name' | 'tags'
> & {
  profiles: Pick<Tables<'profiles'>, 'username' | 'display_name'>;
};

/**
 * Relevance tier for one row against the query. PURE — scored from the row's
 * own data rather than from which leg produced it, so it stays correct however
 * the legs are merged or reordered (leg provenance is lost to `mergeSearchHits`'s
 * first-seen dedupe anyway).
 */
export function relevanceTier(row: SearchProjectResult, q: string): number {
  const needle = q.trim().toLowerCase();
  if (!needle) return RELEVANCE.other;

  const name = row.name.toLowerCase();
  if (name === needle) return RELEVANCE.nameExact;
  if (name.startsWith(needle)) return RELEVANCE.namePrefix;
  if (name.includes(needle)) return RELEVANCE.nameContains;
  if (row.tags.some((tag) => tag.toLowerCase() === needle)) return RELEVANCE.tagExact;
  if (row.repo_full_name.toLowerCase().includes(needle)) return RELEVANCE.repoContains;
  if ((row.tagline ?? '').toLowerCase().includes(needle)) return RELEVANCE.taglineContains;
  return RELEVANCE.other;
}

/**
 * Builds the `rankOf` for `mergeSearchHits`: relevance tier plus popularity
 * normalized across the candidate set to [0,1].
 *
 * Normalizing matters — raw `trending_score` is ~39,661 with a spread under 2
 * (it is dominated by an epoch term), so adding it un-normalized would swamp
 * every tier and reproduce the exact bug this replaces.
 */
export function buildProjectRanker(
  q: string,
  candidates: readonly SearchProjectResult[],
): (row: SearchProjectResult) => number {
  const scores = candidates.map((row) => row.trending_score);
  const min = scores.length > 0 ? Math.min(...scores) : 0;
  const max = scores.length > 0 ? Math.max(...scores) : 0;
  const span = max - min;

  return (row) => relevanceTier(row, q) + (span > 0 ? (row.trending_score - min) / span : 0);
}

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
  // Both are read by `relevanceTier`, not just displayed.
  'repo_full_name',
  'tags',
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

export type SearchOptions = {
  /** Projects returned. Defaults to the palette's 8; the /search page asks for SEARCH_PROJECT_LIMIT_MAX. */
  projectLimit?: number;
};

/**
 * Runs eight independent `.ilike()`/`.contains()` legs (project
 * name/tagline/repo_full_name/tags, profile username/display_name, tag
 * slug/label) in one `Promise.all`, then merges each group with
 * `mergeSearchHits`.
 *
 * Deliberately NOT PostgREST `.or()`: its filter grammar treats `,` and `()`
 * as syntax delimiters, so a user-typed query containing those characters
 * could reshape the filter itself — an injection surface beyond plain SQL
 * wildcard escaping. Independent single-column legs sidestep that grammar
 * entirely (docs/plans/m5.5-curator.md locked decision 1).
 *
 * `q` is assumed already normalized (2–64 chars) by the caller; this escapes
 * it for ILIKE and wraps it in `%…%` once, shared by every leg.
 *
 * NOT searched, deliberately: `readme_html` has no anon column grant and is
 * ~25KB/row (max 210KB). Full-text over it needs a service-role-written
 * derived column and is its own milestone — copy must not imply otherwise.
 */
export async function searchAll(
  q: string,
  client: SupabaseClient<Database>,
  opts: SearchOptions = {},
): Promise<SearchResults> {
  const pattern = `%${escapeIlikeValue(q)}%`;
  const projectLimit = Math.min(
    Math.max(1, Math.trunc(opts.projectLimit ?? SEARCH_PROJECT_LIMIT)),
    SEARCH_PROJECT_LIMIT_MAX,
  );

  // Exact-tag leg, gated on the query actually looking like a tag slug.
  // `resolveTagSlug` is the same validator the /t/[tag] route uses, and its
  // contract is explicitly that a valid slug is safe to `.contains()` — so
  // this rides the existing idx_projects_tags_gin with no new index and no
  // hand-built filter string.
  const tagSlug = resolveTagSlug(q.trim());

  const [
    projectsByName,
    projectsByTagline,
    projectsByRepo,
    projectsByTag,
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
        .limit(projectLimit),
      'projects by name',
    ),
    execLeg<SearchProjectResult>(
      client
        .from('projects')
        .select(SEARCH_PROJECT_COLUMNS)
        .eq('status', 'published')
        .ilike('tagline', pattern)
        .order('trending_score', { ascending: false })
        .limit(projectLimit),
      'projects by tagline',
    ),
    // "owner/repo" is the most-typed query shape on a GitHub-derived product
    // and was entirely unsearchable before P3-B (idx_projects_repo_full_name_trgm, 0012).
    execLeg<SearchProjectResult>(
      client
        .from('projects')
        .select(SEARCH_PROJECT_COLUMNS)
        .eq('status', 'published')
        .ilike('repo_full_name', pattern)
        .order('trending_score', { ascending: false })
        .limit(projectLimit),
      'projects by repo_full_name',
    ),
    tagSlug
      ? execLeg<SearchProjectResult>(
          client
            .from('projects')
            .select(SEARCH_PROJECT_COLUMNS)
            .eq('status', 'published')
            .contains('tags', [tagSlug])
            .order('trending_score', { ascending: false })
            .limit(projectLimit),
          'projects by tag',
        )
      : Promise.resolve(null),
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

  // Relevance is scored from the ROW against `q` (see relevanceTier), not from
  // which leg produced it — leg provenance is lost to mergeSearchHits'
  // first-seen dedupe, and row-derived scoring stays correct however the legs
  // are reordered. The ranker is built over ALL candidates so the popularity
  // tiebreak normalizes across the real set.
  const projectGroups = [projectsByName, projectsByTagline, projectsByRepo, projectsByTag];
  const projectCandidates = projectGroups.flatMap((group) => group ?? []);

  return {
    projects: mergeSearchHits(
      projectGroups,
      (row) => row.id,
      buildProjectRanker(q, projectCandidates),
      projectLimit,
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

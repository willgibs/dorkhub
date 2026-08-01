'use server';

import type { ReactNode } from 'react';

import { renderFeedCards } from '@/app/(app)/_feed/render-cards';
import {
  FEED_COLUMNS,
  type FeedRow,
  fetchFollowingFeedPage,
  resolveFeedFilterSpec,
} from '@/lib/feed/queries';
import { buildExclusionSet, topTags } from '@/lib/recs/derive';
import { supabaseAnon, supabaseServer, supabaseService } from '@/lib/supabase/clients';

const SAVES_SIGNAL_LIMIT = 100;
const STAR_IMPORT_SIGNAL_LIMIT = 200;
const STAR_IMPORT_PROJECT_LIMIT = 100;
const RECS_LIMIT = 6;
const TOP_TAG_COUNT = 5;
const EXCLUSION_CAP = 100;
const FOLLOWEE_CAP = 100;
const FOLLOWING_RAIL_LIMIT = 6;

/**
 * The window has to survive the exclusion set, not merely exceed the output
 * (P3-B). This was a flat 12 while up to EXCLUSION_CAP (100) already-saved or
 * already-starred ids get filtered out of it IN JS afterwards — the
 * window-then-filter class that has now bitten four times (P2.1 enrichment,
 * P2.6 retro, P2.7 retro, P2.7 admin retro).
 *
 * It is not an edge case here, it is the COMMON case: the exclusion set is
 * the user's own saves, and the candidates are the top-trending projects in
 * the user's own top tags — precisely the rows an engaged curator has already
 * saved. Every candidate could be excluded and the rail would render nothing,
 * indistinguishable from "we have no recommendations for you".
 *
 * Expressed as the arithmetic rather than a magic number: fetching
 * RECS_LIMIT + EXCLUSION_CAP guarantees RECS_LIMIT survivors whenever that
 * many candidates exist at all. FEED_COLUMNS is the lean projection (no
 * readme_html), so the extra rows are cheap.
 */
const CANDIDATE_FETCH_LIMIT = RECS_LIMIT + EXCLUSION_CAP;

export type LoadHomeRecsResult =
  | { state: 'import-cta' }
  | { state: 'none' }
  | { state: 'cards'; cards: ReactNode; ids: string[] };

type SignalRow = { id: string; tags: string[] };

type SupabaseServerClient = Awaited<ReturnType<typeof supabaseServer>>;

/**
 * "because you starred" recs — the ONLY personalized read on `/home` (docs/
 * plans/p2-discovery.md Wave 2B, locked decision 6). `/home/page.tsx` stays
 * ISR-60 and cookie-free; `recs-rail.tsx` (a client island) calls this on
 * mount and the result never touches the page's server render. Mirrors the
 * `loadMoreFeed` precedent (`src/app/(app)/_feed/actions.ts`): it hands back
 * already-rendered `ProjectCard` markup so this stays the only place feed
 * rows turn into cards for this surface.
 *
 * Signal = the caller's own saved projects + their star-imported repos that
 * have since been published (not the raw `star_imports` ledger count — a
 * repo can be imported but still be pending in the review queue). Both
 * reads are own-rows RLS via the cookie-bound client; the published-project
 * lookups (star-import match + the recs candidates themselves) go through
 * the cookie-LESS anon client, same split as the rest of the feed.
 */
export async function loadHomeRecs(): Promise<LoadHomeRecsResult> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { state: 'none' };

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) return { state: 'none' };

  const [savedSignal, starImportedSignal] = await Promise.all([
    fetchSavedSignal(supabase, profile.id),
    fetchStarImportedSignal(supabase, profile.id),
  ]);

  const signalRows: SignalRow[] = [...savedSignal, ...starImportedSignal];
  if (signalRows.length === 0) {
    return { state: 'import-cta' };
  }

  const tags = topTags(signalRows, TOP_TAG_COUNT);
  if (tags.length === 0) {
    // Signal exists but every row is untagged — nothing to overlap against.
    return { state: 'none' };
  }

  const anon = supabaseAnon();
  const { data: candidateRows, error } = await anon
    .from('projects')
    .select(FEED_COLUMNS)
    .eq('status', 'published')
    .overlaps('tags', tags)
    .order('trending_score', { ascending: false })
    .order('id', { ascending: false })
    .limit(CANDIDATE_FETCH_LIMIT);

  if (error) {
    console.error('[home/actions] recs candidate query failed', { message: error.message });
    return { state: 'none' };
  }

  // Excluded client-side rather than a `.not('id','in', …)` clause — simpler
  // and injection-safe (no hand-built literal list riding in the query
  // string), and cheap since the fetch is already capped at
  // CANDIDATE_FETCH_LIMIT.
  const excluded = buildExclusionSet(
    signalRows.map((row) => row.id),
    EXCLUSION_CAP,
  );
  const rows = ((candidateRows ?? []) as unknown as FeedRow[])
    .filter((row) => !excluded.has(row.id))
    .slice(0, RECS_LIMIT);

  if (rows.length === 0) {
    return { state: 'none' };
  }

  return { state: 'cards', cards: renderFeedCards(rows), ids: rows.map((row) => row.id) };
}

/** Own saved projects (id, tags) — cookie-bound, RLS-scoped to the caller. */
async function fetchSavedSignal(
  supabase: SupabaseServerClient,
  profileId: string,
): Promise<SignalRow[]> {
  const { data, error } = await supabase
    .from('saves')
    .select('projects!inner(id, tags)')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(SAVES_SIGNAL_LIMIT);

  if (error) {
    console.error('[home/actions] saved-signal query failed', { message: error.message });
    return [];
  }

  // Same IO-boundary trust as `toFeedPage` (src/lib/feed/queries.ts) —
  // postgrest-js's generic inference doesn't fully verify nested embeds.
  return ((data ?? []) as unknown as { projects: SignalRow }[]).map((row) => row.projects);
}

/**
 * Own star-imported repos that have since been published. The repo-id
 * ledger read is own-rows RLS (cookie-bound); the project match is a public
 * read (cookie-LESS anon client, parity with the rest of the feed).
 */
async function fetchStarImportedSignal(
  supabase: SupabaseServerClient,
  profileId: string,
): Promise<SignalRow[]> {
  const { data: starImports, error } = await supabase
    .from('star_imports')
    .select('github_repo_id')
    .eq('profile_id', profileId)
    .order('starred_at', { ascending: false })
    .limit(STAR_IMPORT_SIGNAL_LIMIT);

  if (error) {
    console.error('[home/actions] star-import ledger query failed', { message: error.message });
    return [];
  }

  const repoIds = (starImports ?? []).map((row) => row.github_repo_id);
  // Empty `.in()` would otherwise round-trip for nothing (same short-circuit
  // as `fetchFollowingFeedPage`, src/lib/feed/queries.ts).
  if (repoIds.length === 0) return [];

  const { data: projects, error: projectsError } = await supabaseAnon()
    .from('projects')
    .select('id, tags')
    .eq('status', 'published')
    .in('github_repo_id', repoIds)
    .limit(STAR_IMPORT_PROJECT_LIMIT);

  if (projectsError) {
    console.error('[home/actions] star-imported project query failed', {
      message: projectsError.message,
    });
    return [];
  }

  return (projects ?? []) as SignalRow[];
}

export type LoadFollowingRailResult =
  | { state: 'none' }
  | { state: 'nudge' }
  | { state: 'cards'; cards: ReactNode; ids: string[] };

/**
 * "from people you follow" (U2) — the same personalization contract as
 * `loadHomeRecs` above: `/home` stays ISR/cookie-free, the client island
 * calls this after mount, and it hands back already-rendered cards. Zero new
 * RPCs — the public follows graph (own-rows read via the cookie client)
 * feeds the existing `feed_page` profile filter.
 */
export async function loadFollowingRail(): Promise<LoadFollowingRailResult> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { state: 'none' };

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) return { state: 'none' };

  const { data: follows, error } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', profile.id)
    .limit(FOLLOWEE_CAP);

  if (error) {
    console.error('[home/actions] follows read failed', { message: error.message });
    return { state: 'none' };
  }

  const followeeIds = (follows ?? []).map((row) => row.followee_id);
  // Signed in but following nobody: the module becomes an invitation.
  if (followeeIds.length === 0) return { state: 'nudge' };

  const page = await fetchFollowingFeedPage(
    resolveFeedFilterSpec({ sort: 'recent', limit: FOLLOWING_RAIL_LIMIT }),
    followeeIds,
    supabaseAnon(),
  );
  if (page.rows.length === 0) return { state: 'none' };

  return {
    state: 'cards',
    cards: renderFeedCards(page.rows),
    ids: page.rows.map((row) => row.id),
  };
}

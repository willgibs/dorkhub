import 'server-only';

import { unstable_cache } from 'next/cache';

import {
  FEED_COLUMNS,
  type FeedPageRpcRow,
  type FeedRow,
  flattenedToFeedRow,
} from '@/lib/feed/queries';
import { supabaseAnon } from '@/lib/supabase/clients';

/**
 * Discovery data layer (U2 R0/R1, docs/plans/u2-rework.md) — the home page's
 * non-personalized modules. Everything here rides the cookie-LESS anon client
 * and its own unstable_cache key, so `/` and the preview routes stay
 * ISR-cacheable; DB load scales with modules ÷ revalidate window, not
 * traffic. Every function fails to ABSENCE (null/[]), never an error surface
 * — these are decoration on top of the feed.
 */

const ACTIVE_RAIL_REVALIDATE = 300;
/*
 * 24h, and this number governs THE WHOLE APP: the (app) and (marketing)
 * layouts call getPlatformStats() for the footer, and a route's effective
 * revalidate is the MINIMUM across every cache it reads — layouts included.
 * At 3600 this silently capped every page (including the 24h project pages)
 * to hourly re-renders (2026-08-04, the third time the min-rule bit; see
 * docs/ops-cost.md rule 2). Footer counts drifting a day is invisible;
 * 55k pages re-rendering hourly is not.
 */
const SLOW_META_REVALIDATE = 86400;

export type PlatformStats = {
  projects: number;
  makers: number;
  tags: number;
};

/** Live proof-line counts (published projects / makers / tags in use). */
export async function getPlatformStats(): Promise<PlatformStats | null> {
  const cached = unstable_cache(
    async (): Promise<PlatformStats | null> => {
      const { data, error } = await supabaseAnon().rpc('platform_stats');
      const row = data?.[0];
      if (error || !row) {
        if (error) console.error('[discovery] platform_stats failed', { message: error.message });
        return null;
      }
      return {
        projects: row.published_projects,
        makers: row.makers,
        tags: row.tags_in_use,
      };
    },
    ['discovery', 'platform-stats'],
    { revalidate: SLOW_META_REVALIDATE, tags: ['feed'] },
  );
  return cached();
}

export type RisingMaker = {
  profileId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
};

/**
 * Aggregated recent-engagement leaderboard. The RPC is SECURITY DEFINER but
 * returns ONLY (maker, score) — liker identity never crosses the wire
 * (board: likes stay private).
 */
export async function getRisingMakers(): Promise<RisingMaker[]> {
  const cached = unstable_cache(
    async (): Promise<RisingMaker[]> => {
      const { data, error } = await supabaseAnon().rpc('rising_makers', {
        p_days: 30,
        p_limit: 6,
      });
      if (error) {
        console.error('[discovery] rising_makers failed', { message: error.message });
        return [];
      }
      return (data ?? []).map((row) => ({
        profileId: row.profile_id,
        username: row.username,
        // Codegen loses nullability on RPC table returns (same caveat as
        // FeedPageRpcRow) — display_name/avatar_url are nullable in truth.
        displayName: (row.display_name as string | null) ?? row.username,
        avatarUrl: row.avatar_url as string | null,
        score: row.score,
      }));
    },
    ['discovery', 'rising-makers'],
    { revalidate: SLOW_META_REVALIDATE, tags: ['feed'] },
  );
  return cached();
}

/**
 * First page of the 'active' sort (recently pushed upstream — migration
 * 0021). Rail-sized, no pagination; the full sort joins the feed routes at
 * adoption (W-waves).
 */
export async function getActiveFeedRows(limit: number): Promise<FeedRow[]> {
  const clamped = Math.min(Math.max(limit, 1), 24);
  const cached = unstable_cache(
    async (): Promise<FeedRow[]> => {
      const { data, error } = await supabaseAnon().rpc('feed_page', {
        p_sort: 'active',
        p_limit: clamped,
      });
      if (error) {
        console.error('[discovery] active feed failed', { message: error.message });
        return [];
      }
      // Same IO-boundary trust as toFeedPage (src/lib/feed/queries.ts).
      return ((data ?? []) as unknown as FeedPageRpcRow[]).map(flattenedToFeedRow);
    },
    ['discovery', 'active', String(clamped)],
    { revalidate: ACTIVE_RAIL_REVALIDATE, tags: ['feed'] },
  );
  return cached();
}

/**
 * The daily weird pick: deterministic per UTC day (migration 0023), then the
 * full card row for the spotlight. Cache key carries the date so the rollover
 * is a new cache entry, not a stale hit.
 */
export async function getWeirdDailyPick(): Promise<FeedRow | null> {
  const dateKey = new Date().toISOString().slice(0, 10);
  const cached = unstable_cache(
    async (): Promise<FeedRow | null> => {
      const anon = supabaseAnon();
      const { data: pick, error } = await anon.rpc('weird_pick_for_date', { p_date: dateKey });
      const target = pick?.[0];
      if (error || !target) {
        if (error) console.error('[discovery] weird pick failed', { message: error.message });
        return null;
      }

      const { data: rows, error: rowError } = await anon
        .from('projects')
        .select(FEED_COLUMNS)
        .eq('status', 'published')
        .eq('slug', target.slug)
        .eq('profiles.username', target.username)
        .limit(1);
      if (rowError || !rows?.length) {
        if (rowError) {
          console.error('[discovery] weird row fetch failed', { message: rowError.message });
        }
        return null;
      }
      // IO-boundary cast, shape enforced by FEED_COLUMNS (house idiom).
      return rows[0] as unknown as FeedRow;
    },
    ['discovery', 'weird', dateKey],
    { revalidate: SLOW_META_REVALIDATE, tags: ['feed'] },
  );
  return cached();
}

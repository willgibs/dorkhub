'use server';

import type { ReactNode } from 'react';

import { renderFeedCards } from '@/app/(app)/_feed/render-cards';
import { fetchFollowingFeedPage, resolveFeedFilterSpec } from '@/lib/feed/queries';
import { supabaseAnon, supabaseServer, supabaseService } from '@/lib/supabase/clients';

const FOLLOWEE_CAP = 100;
const RAIL_LIMIT = 6;

export type LoadFollowingRailResult =
  | { state: 'none' }
  | { state: 'nudge' }
  | { state: 'cards'; cards: ReactNode; ids: string[] };

/**
 * "from people you follow" home module (U2 R1) — the loadHomeRecs pattern
 * verbatim: the page stays ISR/cookie-free; this server action is the only
 * thing that knows the viewer, called from the client island after mount and
 * returning pre-rendered cards. Zero new RPCs — follows (public-graph read
 * via the caller's cookie client) feed the existing `feed_page` profile
 * filter through fetchFollowingFeedPage.
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
    console.error('[preview-feed] follows read failed', { message: error.message });
    return { state: 'none' };
  }

  const followeeIds = (follows ?? []).map((row) => row.followee_id);
  // Signed in but following nobody: the module becomes an invitation.
  if (followeeIds.length === 0) return { state: 'nudge' };

  const page = await fetchFollowingFeedPage(
    resolveFeedFilterSpec({ sort: 'recent', limit: RAIL_LIMIT }),
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

'use server';

import type { ReactNode } from 'react';

import { renderFeedCards } from '@/app/(app)/_feed/render-cards';
import { fetchFollowingFeedPage, resolveFeedFilterSpec } from '@/lib/feed/queries';
import { supabaseAnon, supabaseServer, supabaseService } from '@/lib/supabase/clients';

export type LoadMoreFollowingResult = {
  cards: ReactNode;
  ids: string[];
  nextCursor: string | null;
};

/**
 * Load-more server action for `/following` (M5 Wave 3D). Unlike `loadMoreFeed`
 * (`_feed/actions.ts`), which closes over public sort/tag params, this
 * re-derives auth + the caller's own followee ids from the request's cookies
 * on every call instead of accepting a client-supplied id list — the
 * personalized "who do I follow" set should never round-trip through the
 * client. A signed-out/incomplete-profile caller (session expired mid-scroll)
 * degrades to an empty page rather than throwing. Mirrors the page's own
 * auth -> profile -> followee-ids -> `fetchFollowingFeedPage` lookup.
 */
export async function loadMoreFollowing(cursor: string): Promise<LoadMoreFollowingResult> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { cards: null, ids: [], nextCursor: null };

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) return { cards: null, ids: [], nextCursor: null };

  const { data: followRows } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', profile.id);
  const followeeIds = (followRows ?? []).map((row) => row.followee_id);

  const spec = resolveFeedFilterSpec({ sort: 'recent', cursor });
  const { rows, nextCursor } = await fetchFollowingFeedPage(spec, followeeIds, supabaseAnon());

  return {
    cards: renderFeedCards(rows),
    ids: rows.map((row) => row.id),
    nextCursor,
  };
}

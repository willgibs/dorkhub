'use server';

import type { ReactNode } from 'react';
import { getFeedPage } from '@/lib/feed/queries';
import { renderFeedCards } from './render-cards';

export type LoadMoreFeedParams = {
  sort: string;
  tag: string | null;
  cursor: string;
};

export type LoadMoreFeedResult = {
  cards: ReactNode;
  ids: string[];
  nextCursor: string | null;
};

/**
 * Load-more server action (M5 decision 4): returns already-rendered
 * `ProjectCard` markup — `ProjectCard` stays a server component and this is
 * the only place feed rows turn into cards for a "next page" request, so
 * page 1 (`feed-section.tsx`) and every subsequent page always render
 * identically (`renderFeedCards`, shared). `sort`/`tag`/`cursor` all pass
 * straight through `getFeedPage` -> `resolveFeedFilterSpec`, which tolerates
 * garbage (bad cursor, unknown sort) by falling back to page 1 rather than
 * throwing — this action never needs its own validation layer.
 */
export async function loadMoreFeed(params: LoadMoreFeedParams): Promise<LoadMoreFeedResult> {
  const { rows, nextCursor } = await getFeedPage(params);

  return {
    cards: renderFeedCards(rows),
    ids: rows.map((row) => row.id),
    nextCursor,
  };
}

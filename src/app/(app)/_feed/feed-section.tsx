import Link from 'next/link';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { EmptyState } from '@/components/empty-state';
import { FeedFilters } from '@/components/feed-filters';
import { copy } from '@/lib/copy';
import { feedHrefFor } from '@/lib/feed/hrefs';
import { type FeedSort, getFeedPage } from '@/lib/feed/queries';
import { loadMoreFeed } from './actions';
import { FeedGrid } from './feed-grid';
import { renderFeedCards } from './render-cards';

export type FeedSectionProps = {
  sort: FeedSort;
  /** Active tag filter, if any — omitted/undefined and `null` both mean "no tag". */
  tag?: string | null;
};

/**
 * Server entry point for a feed page (M5 decisions 1/4/6/7): fetches page 1
 * via the cached, cookie-less `getFeedPage`, renders the sort/active-tag chip
 * row (full tag browsing lives at `/tags` — decision 7 keeps this list to
 * just the active tag), then wraps the personalization boundary
 * (`EngagementProvider`) around this page's own id set and hands off to the
 * client `FeedGrid` for "load more".
 *
 * Mounted at `/`, `/home`, `/newest`, `/t/[tag]`, `/t/[tag]/newest` — sort
 * defaults to 'trending' (docs/plans/p2.5-self-running.md locked decision 9);
 * 'recent' is the secondary "newest" chip.
 */
export async function FeedSection({ sort, tag = null }: FeedSectionProps) {
  const { rows, nextCursor } = await getFeedPage({ sort, tag });
  const ids = rows.map((row) => row.id);

  const hrefFor = (kind: 'sort' | 'tag', value: string) => feedHrefFor({ sort, tag }, kind, value);

  // Shown to everyone, signed in or not — signed-out clicks ride the proxy's
  // existing signin redirect on /saved and /following (funnel, locked
  // decision 5, docs/plans/m5.5-curator.md).
  const quietLinkClassName =
    'rounded-sm font-mono text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  const trailing = (
    <>
      <Link href="/saved" className={quietLinkClassName}>
        {copy.savedTitle}
      </Link>
      <Link href="/following" className={quietLinkClassName}>
        {copy.followingTitle}
      </Link>
    </>
  );

  // Chip labels are the `hrefFor` vocabulary (feedHrefFor reads 'newest' /
  // anything-else off the value it's handed) — activeSort has to speak the
  // same label, not the raw FeedSort, or the base path (sort='trending')
  // never lights up the default chip.
  const activeSortLabel = sort === 'recent' ? copy.sortNewest : copy.sortTrending;

  const filters = (
    <FeedFilters
      sort={[copy.sortTrending, copy.sortNewest]}
      tags={tag ? [tag] : []}
      activeSort={activeSortLabel}
      activeTag={tag ?? undefined}
      hrefFor={hrefFor}
      trailing={trailing}
    />
  );

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {filters}
        <EmptyState>
          <p>
            {copy.emptyFeedLead}{' '}
            <Link
              href="/weird"
              prefetch={false}
              className="rounded-sm text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {copy.emptyFeedLink}
            </Link>
          </p>
        </EmptyState>
      </div>
    );
  }

  // Inline server action closing over this page's `sort`/`tag` (Next's
  // documented "closures over Server Actions" pattern) — lets `loadMoreFeed`
  // keep its plain `{sort, tag, cursor}` signature while `FeedGrid` only
  // needs to know about a `(cursor) => Promise<...>` shape.
  async function loadMore(cursor: string) {
    'use server';
    return loadMoreFeed({ sort, tag, cursor });
  }

  return (
    <div className="flex flex-col gap-6">
      {filters}
      <EngagementProvider projectIds={ids}>
        <FeedGrid
          initialCards={renderFeedCards(rows)}
          initialIds={ids}
          initialCursor={nextCursor}
          loadMore={loadMore}
        />
      </EngagementProvider>
    </div>
  );
}

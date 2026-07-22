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
 * Nothing mounts this yet (Wave 3 wires it into `/`, `/home`, `/trending`,
 * `/t/[tag]`, `/t/[tag]/trending`) — it only needs to compile and render
 * correctly in isolation for this wave.
 */
export async function FeedSection({ sort, tag = null }: FeedSectionProps) {
  const { rows, nextCursor } = await getFeedPage({ sort, tag });
  const ids = rows.map((row) => row.id);

  const hrefFor = (kind: 'sort' | 'tag', value: string) => feedHrefFor({ sort, tag }, kind, value);

  const filters = (
    <FeedFilters
      sort={[copy.sortRecent, copy.sortTrending]}
      tags={tag ? [tag] : []}
      activeSort={sort}
      activeTag={tag ?? undefined}
      hrefFor={hrefFor}
    />
  );

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {filters}
        <EmptyState message={copy.emptyFeed} />
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

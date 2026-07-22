'use client';

import { type ReactNode, useEffect, useState, useTransition } from 'react';
import { useEngagement } from '@/app/(app)/_engagement/engagement-context';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';

export type FeedGridLoadMoreResult = {
  cards: ReactNode;
  ids: string[];
  nextCursor: string | null;
};

export type FeedGridProps = {
  initialCards: ReactNode;
  initialIds: string[];
  initialCursor: string | null;
  /** Server action (or a closure over one) that fetches + renders the next page. */
  loadMore: (cursor: string) => Promise<FeedGridLoadMoreResult>;
};

/**
 * Client shell around the feed's "load more" mechanism (M5 decision 4):
 * `loadMore` returns already-rendered `ReactNode` from a server action, so
 * this island only tracks pagination state and appends — no markup
 * duplication client-side. Appended pages are kept as an array of ReactNode
 * chunks (one per `loadMore` call) rather than flattened, so React's
 * reconciliation keys stay stable across appends.
 */
export function FeedGrid({ initialCards, initialIds, initialCursor, loadMore }: FeedGridProps) {
  const { registerIds } = useEngagement();
  const [appendedCards, setAppendedCards] = useState<ReactNode[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();

  // The engagement overlay is keyed by id set; registering here (idempotent —
  // `registerIds` dedupes against ids it's already fetched, e.g. via the
  // provider's own initial mount fetch) makes this island correct standalone
  // even if a future caller mounts it without seeding the provider with the
  // exact same id list.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount only — this seeds the overlay for the page-1 id set, not a reaction to prop changes
  useEffect(() => {
    registerIds(initialIds);
  }, []);

  function handleLoadMore() {
    if (!cursor) return;
    startTransition(async () => {
      const result = await loadMore(cursor);
      setAppendedCards((prev) => [...prev, result.cards]);
      registerIds(result.ids);
      setCursor(result.nextCursor);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {initialCards}
        {appendedCards}
      </div>
      {cursor ? (
        <Button
          type="button"
          variant="secondary"
          onClick={handleLoadMore}
          disabled={isPending}
          className="mx-auto w-fit"
        >
          {isPending ? copy.loadingMore : copy.loadMore}
        </Button>
      ) : null}
    </div>
  );
}

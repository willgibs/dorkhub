'use client';

import Link from 'next/link';
import { type ReactNode, useState } from 'react';

import { copy } from '@/lib/copy';
import { FeedFiltersV2, type SortKey } from './feed-filters-v2';

const QUIET_LINK =
  'rounded-sm font-mono text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * Feed v2 shell (U2 R1): three PRE-RENDERED first pages (trending / newest /
 * active — the third is migration 0021's new sort) swap client-side under
 * the sliding-pill filters, so the preview demonstrates the real sort
 * vocabulary with zero request churn. The trending node contains BOTH rhythm
 * variants; the harness data attribute picks which one shows. At adoption
 * the chips go back to being real route links (/, /newest, /active) — the
 * client swap is a preview affordance only.
 */
export function FeedV2({
  trending,
  newest,
  active,
}: {
  trending: ReactNode;
  newest: ReactNode;
  active: ReactNode;
}) {
  const [sort, setSort] = useState<SortKey>('trending');

  const bySort: Record<SortKey, ReactNode> = { trending, newest, active };

  return (
    <div className="flex flex-col gap-6">
      <FeedFiltersV2
        options={[
          { key: 'trending', label: copy.sortTrending },
          { key: 'newest', label: copy.sortNewest },
          { key: 'active', label: copy.sortActive },
        ]}
        value={sort}
        onChange={setSort}
        trailing={
          <>
            <Link href="/saved" className={QUIET_LINK}>
              {copy.savedTitle}
            </Link>
            <Link href="/following" className={QUIET_LINK}>
              {copy.followingTitle}
            </Link>
          </>
        }
      />
      {bySort[sort]}
    </div>
  );
}

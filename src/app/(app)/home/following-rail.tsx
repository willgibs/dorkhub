'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { EmptyState } from '@/components/empty-state';
import { SkeletonCard } from '@/components/skeleton-card';
import { copy } from '@/lib/copy';
import { type LoadFollowingRailResult, loadFollowingRail } from './actions';

const QUIET_LINK =
  'rounded-sm font-mono text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * "from people you follow" client island (U2 R1) — RecsRail's exact contract:
 * identical SSR shell for every viewer (pending skeletons), personalization
 * only after mount via the server action, absence collapses the whole
 * section, the skeleton grid uses the resolved grid's classes so the swap
 * never shifts layout.
 */
export function FollowingRail() {
  const [result, setResult] = useState<LoadFollowingRailResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadFollowingRail().then((res) => {
      if (!cancelled) setResult(res);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (result?.state === 'none') return null;

  return (
    <section className="flex flex-col gap-4">
      <p className="font-mono text-[11.5px] tracking-widest text-muted-foreground uppercase">
        <span aria-hidden="true">{'// '}</span>
        {copy.followingRailKicker}
      </p>
      {result === null ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : result.state === 'nudge' ? (
        <EmptyState>
          <p>{copy.followingRailNudge}</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <Link href="/#feed" className={QUIET_LINK}>
              {copy.browseCta}
            </Link>
          </div>
        </EmptyState>
      ) : (
        <EngagementProvider projectIds={result.ids}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{result.cards}</div>
        </EngagementProvider>
      )}
    </section>
  );
}

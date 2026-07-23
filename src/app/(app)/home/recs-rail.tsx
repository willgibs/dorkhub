'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { EmptyState } from '@/components/empty-state';
import { SkeletonCard } from '@/components/skeleton-card';
import { copy } from '@/lib/copy';
import { type LoadHomeRecsResult, loadHomeRecs } from './actions';

const QUIET_LINK_CLASSNAME =
  'rounded-sm font-mono text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * Mono `// ` section label (docs/design-system.md micro-detail) — matches
 * `related-projects.tsx`'s own header treatment exactly (docs/plans/
 * p2-discovery.md Wave 2A), the closest public-surface precedent: neither
 * `FeedSection` nor `FeedGrid` render a header of their own (just the sort/
 * tag chip row), so there's nothing there to mirror.
 */
function RecsKicker() {
  return (
    <p className="font-mono text-[11.5px] tracking-widest text-muted-foreground uppercase">
      <span aria-hidden="true">{'// '}</span>
      {copy.recsTitle}
    </p>
  );
}

/**
 * "because you starred" client island (docs/plans/p2-discovery.md Wave 2B,
 * locked decision 6). `/home` stays ISR-60 and cookie-free; this is the only
 * piece of that page that knows anything about who's looking at it, and it
 * finds out ONLY after mount via `loadHomeRecs` (a server action returning
 * pre-rendered cards — same contract as `loadMoreFeed`).
 *
 * SSR-shell rule: this component's server-rendered output is identical for
 * every viewer — `result` always starts `null` (the pending/skeleton state),
 * so there's no user-dependent branching before mount. The skeleton grid
 * uses the exact grid classes the resolved card grid will use, so the
 * pending -> resolved swap doesn't shift layout.
 */
export function RecsRail() {
  const [result, setResult] = useState<LoadHomeRecsResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadHomeRecs().then((res) => {
      if (!cancelled) setResult(res);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Absence rule: no signal at all (signed-out, no profile, or a query that
  // came back empty) means the whole section vanishes — kicker included.
  if (result?.state === 'none') return null;

  return (
    <section className="flex flex-col gap-4">
      <RecsKicker />
      {result === null ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : result.state === 'import-cta' ? (
        <EmptyState>
          <p>{copy.recsImportNudge}</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <Link href="/settings/import" className={QUIET_LINK_CLASSNAME}>
              {copy.importStart}
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

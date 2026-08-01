import type { Metadata } from 'next';

import { DiscoveryBand } from '@/app/(app)/_discovery/discovery-band';
import { QuickHits } from '@/app/(app)/_discovery/quick-hits';
import { SectionHead } from '@/app/(app)/_discovery/section-head';
import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { FollowingRail } from '@/app/(app)/home/following-rail';
import { RecsRail } from '@/app/(app)/home/recs-rail';
import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import { getActiveFeedRows, getRisingMakers, getWeirdDailyPick } from '@/lib/discovery/queries';
import { fetchActiveFeaturedSlots } from '@/lib/featured/queries';
import { supabaseAnon } from '@/lib/supabase/clients';

export const revalidate = 60;

// This page SERVES at `/` via the proxy rewrite — without an explicit
// canonical the layout's './' would claim '/home' for the signed-in render
// of the homepage. Pin the bare apex (same fix as the signed-out page).
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const QUICK_HITS_LIMIT = 4;

/**
 * Signed-in home. `src/proxy.ts` rewrites authed hits to `/` here (URL bar
 * stays `/` — docs/plans/m5-discovery.md decision 2). U2 board-set order:
 * the page opens ALIVE with discovery rather than a wall of cards —
 * discover → gallery → quick hits → from-people-you-follow →
 * because-you-starred. The marketing sections (hero, how-it-works) stay
 * signed-out-only on the root page.
 *
 * Cookie-free by construction: every read here uses the anon, cached client
 * so the page stays ISR-60 for every viewer. Both personalized rails are
 * client islands that learn who's looking only AFTER mount, via their own
 * server actions (docs/plans/p2-discovery.md Wave 2B, locked decision 6) —
 * no `await`/branching on them here, or the page would poison its own cache.
 */
export default async function HomePage() {
  const [weird, makers, quickHits, featured] = await Promise.all([
    getWeirdDailyPick(),
    getRisingMakers(),
    getActiveFeedRows(QUICK_HITS_LIMIT),
    // Anon client on purpose — featured slots are the same for every viewer.
    // They render inline as the feed's first cells (board, 2026-07-31).
    fetchActiveFeaturedSlots(supabaseAnon()),
  ]);

  // One provider for the discovery modules; FeedSection and each personal
  // rail bring their own (every island owns its id set).
  const discoveryIds = [...new Set([...(weird ? [weird] : []), ...quickHits].map((row) => row.id))];

  return (
    <>
      <EngagementProvider projectIds={discoveryIds}>
        <DiscoveryBand weird={weird} makers={makers} rails={[]} />

        <section id="feed" className="scroll-mt-20 border-t">
          <PageShell className="flex flex-col gap-8 py-16 sm:py-20">
            <SectionHead kicker={copy.galleryKicker} title={copy.galleryTitle} />
            <FeedSection sort="trending" featured={featured} />
          </PageShell>
        </section>

        <PageShell as="section" className="flex flex-col gap-8 border-t py-16 sm:py-20">
          <SectionHead kicker={copy.clusterKicker} title={copy.quickHitsTitle} />
          <QuickHits rows={quickHits} showKicker={false} />
        </PageShell>
      </EngagementProvider>

      <PageShell className="flex flex-col gap-12 border-t py-16 sm:py-20">
        <FollowingRail />
        <RecsRail />
      </PageShell>
    </>
  );
}

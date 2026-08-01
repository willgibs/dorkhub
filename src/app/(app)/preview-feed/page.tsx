import type { Metadata } from 'next';

import '@/styles/u2-preview.css';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { RecsRail } from '@/app/(app)/home/recs-rail';
import { DiscoveryBand } from '@/app/(app)/preview-home/_v2/discovery-band';
import { FeedRhythm } from '@/app/(app)/preview-home/_v2/feed-rhythm';
import { FeedV2 } from '@/app/(app)/preview-home/_v2/feed-v2';
import { PreviewFrame } from '@/app/(app)/preview-home/_v2/preview-frame';
import { QuickHits } from '@/app/(app)/preview-home/_v2/quick-hits';
import { SectionHead } from '@/app/(app)/preview-home/_v2/section-head';
import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import { getActiveFeedRows, getRisingMakers, getWeirdDailyPick } from '@/lib/discovery/queries';
import { fetchActiveFeaturedSlots } from '@/lib/featured/queries';
import { getFeedPage } from '@/lib/feed/queries';
import { supabaseAnon } from '@/lib/supabase/clients';
import { FollowingRail } from './following-rail';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'preview · feed',
  description: 'U2 R1 — the proposed signed-in home on real data.',
  // Transient board-review surface: noindexed, never in sitemap.ts.
  robots: { index: false, follow: true },
};

const FEED_PREVIEW_LIMIT = 12;

/**
 * U2 exemplar, signed-in composition (docs/plans/u2-rework.md). R3 order
 * (board): the page lands ALIVE — discover first, then the gallery, then
 * quick hits, then the personal rails (from-people-you-follow, then
 * because-you-starred; both client islands so this stays ISR/cookie-free).
 * The live /home is untouched.
 */
export default async function PreviewFeed() {
  const [weird, makers, trendingPage, newestPage, activeRows, featured] = await Promise.all([
    getWeirdDailyPick(),
    getRisingMakers(),
    getFeedPage({ sort: 'trending', limit: FEED_PREVIEW_LIMIT }),
    getFeedPage({ sort: 'recent', limit: FEED_PREVIEW_LIMIT }),
    getActiveFeedRows(FEED_PREVIEW_LIMIT),
    fetchActiveFeaturedSlots(supabaseAnon()),
  ]);

  const engagementIds = [
    ...new Set(
      [
        ...(weird ? [weird] : []),
        ...featured.map((slot) => slot.project),
        ...trendingPage.rows,
        ...newestPage.rows,
        ...activeRows,
      ].map((row) => row.id),
    ),
  ];

  return (
    <PreviewFrame>
      <EngagementProvider projectIds={engagementIds}>
        <DiscoveryBand weird={weird} makers={makers} rails={[]} />

        <section id="feed" className="scroll-mt-20 border-t">
          <PageShell className="flex flex-col gap-8 py-16 sm:py-20">
            <SectionHead kicker={copy.galleryKicker} title={copy.galleryTitle} />
            <FeedV2
              trending={<FeedRhythm rows={trendingPage.rows} featured={featured} />}
              newest={<FeedRhythm rows={newestPage.rows} featured={[]} />}
              active={<FeedRhythm rows={activeRows} featured={[]} />}
            />
          </PageShell>
        </section>

        <PageShell as="section" className="flex flex-col gap-8 border-t py-16 sm:py-20">
          <SectionHead kicker={copy.clusterKicker} title={copy.quickHitsTitle} />
          <QuickHits rows={activeRows.slice(0, 4)} showKicker={false} />
        </PageShell>
      </EngagementProvider>

      <PageShell className="flex flex-col gap-10 border-t py-16 sm:py-20">
        <FollowingRail />
        <RecsRail />
      </PageShell>
    </PreviewFrame>
  );
}

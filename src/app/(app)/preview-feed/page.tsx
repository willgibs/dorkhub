import type { Metadata } from 'next';

import '@/styles/u2-preview.css';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { RecsRail } from '@/app/(app)/home/recs-rail';
import { DiscoveryBand } from '@/app/(app)/preview-home/_v2/discovery-band';
import { FeedRhythm } from '@/app/(app)/preview-home/_v2/feed-rhythm';
import { FeedV2 } from '@/app/(app)/preview-home/_v2/feed-v2';
import { PreviewFrame } from '@/app/(app)/preview-home/_v2/preview-frame';
import { PageShell } from '@/components/page-shell';
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
 * U2 R1 exemplar, signed-in composition (docs/plans/u2-rework.md): the
 * marketing sections fall away; the page opens with the personal rails
 * (because-you-starred + NEW from-people-you-follow, both client islands so
 * this stays ISR/cookie-free) and a tighter discovery band, then feed v2.
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
    <PreviewFrame showHeroToggle={false}>
      <PageShell className="flex flex-col gap-10 py-4">
        <RecsRail />
        <FollowingRail />
      </PageShell>

      <EngagementProvider projectIds={engagementIds}>
        <DiscoveryBand weird={weird} makers={makers} rails={[]} />

        <section id="feed" className="scroll-mt-20 border-t">
          <PageShell className="flex flex-col gap-8 py-12 sm:py-14">
            <FeedV2
              trending={
                <>
                  <div data-v2-only="clusters">
                    <FeedRhythm rows={trendingPage.rows} featured={featured} variant="clusters" />
                  </div>
                  <div data-v2-only="spans">
                    <FeedRhythm rows={trendingPage.rows} featured={featured} variant="spans" />
                  </div>
                </>
              }
              newest={<FeedRhythm rows={newestPage.rows} featured={[]} variant="spans" />}
              active={<FeedRhythm rows={activeRows} featured={[]} variant="spans" />}
            />
          </PageShell>
        </section>
      </EngagementProvider>
    </PreviewFrame>
  );
}

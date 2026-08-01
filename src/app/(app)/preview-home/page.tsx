import type { Metadata } from 'next';

import '@/styles/u2-preview.css';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { PageShell } from '@/components/page-shell';
import {
  getActiveFeedRows,
  getPlatformStats,
  getRisingMakers,
  getWeirdDailyPick,
} from '@/lib/discovery/queries';
import { fetchActiveFeaturedSlots } from '@/lib/featured/queries';
import { getFeedPage } from '@/lib/feed/queries';
import { supabaseAnon } from '@/lib/supabase/clients';
import { DiscoveryBand } from './_v2/discovery-band';
import { FeedRhythm } from './_v2/feed-rhythm';
import { FeedV2 } from './_v2/feed-v2';
import { FooterV2 } from './_v2/footer-v2';
import { HeroV2 } from './_v2/hero-v2';
import { HowItWorksV2 } from './_v2/how-it-works-v2';
import { IsIsntV2 } from './_v2/is-isnt-v2';
import { PreviewFrame } from './_v2/preview-frame';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'preview · home',
  description: 'U2 R1 — the proposed home + feed on real data.',
  // Transient board-review surface: noindexed and NEVER in sitemap.ts
  // (the /design/directions + /search idiom, docs/plans/u2-rework.md).
  robots: { index: false, follow: true },
};

/** Curated rails for the exemplar — all three exist as real tag chips in prod. */
const RAIL_TAGS = ['generative-art', 'cli', 'homelab'] as const;

const FEED_PREVIEW_LIMIT = 12;
const RAIL_LIMIT = 8;

/**
 * U2 R1 exemplar — the proposed signed-out home (docs/plans/u2-rework.md):
 * hero with a live product moment, the discovery band (weird spotlight,
 * rising makers, tag rails), feed v2 with rhythm + the sliding-pill sort
 * demo, and the recomposed marketing sections. REAL data everywhere via the
 * same cached anon data layer the live pages use; the live `/` is untouched.
 * ONE EngagementProvider spans every card on the page (unioned ids), per the
 * U2 risk register.
 */
export default async function PreviewHome() {
  const [stats, weird, makers, trendingPage, newestPage, activeRows, featured, ...railPages] =
    await Promise.all([
      getPlatformStats(),
      getWeirdDailyPick(),
      getRisingMakers(),
      getFeedPage({ sort: 'trending', limit: FEED_PREVIEW_LIMIT }),
      getFeedPage({ sort: 'recent', limit: FEED_PREVIEW_LIMIT }),
      getActiveFeedRows(FEED_PREVIEW_LIMIT),
      fetchActiveFeaturedSlots(supabaseAnon()),
      ...RAIL_TAGS.map((tag) => getFeedPage({ sort: 'trending', tag, limit: RAIL_LIMIT })),
    ]);

  const rails = RAIL_TAGS.map((tag, i) => ({ tag, rows: railPages[i]?.rows ?? [] }));

  const engagementIds = [
    ...new Set(
      [
        ...(weird ? [weird] : []),
        ...rails.flatMap((rail) => rail.rows),
        ...featured.map((slot) => slot.project),
        ...trendingPage.rows,
        ...newestPage.rows,
        ...activeRows,
      ].map((row) => row.id),
    ),
  ];

  return (
    <PreviewFrame>
      <HeroV2 stats={stats} shelfRows={trendingPage.rows} tickerRows={trendingPage.rows} />

      <EngagementProvider projectIds={engagementIds}>
        <DiscoveryBand weird={weird} makers={makers} rails={rails} />

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

      <IsIsntV2 />
      <HowItWorksV2 />
      <FooterV2 stats={stats} />
    </PreviewFrame>
  );
}

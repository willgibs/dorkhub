import type { Metadata } from 'next';

import { DiscoveryBand } from '@/app/(app)/_discovery/discovery-band';
import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { Hero } from '@/app/(app)/_sections/hero';
import { HowItWorks } from '@/app/(app)/_sections/how-it-works';
import { PageShell } from '@/components/page-shell';
import { SectionHead } from '@/components/section-head';
import { copy } from '@/lib/copy';
import {
  getActiveFeedRows,
  getPlatformStats,
  getRisingMakers,
  getWeirdDailyPick,
} from '@/lib/discovery/queries';
import { fetchActiveFeaturedSlots } from '@/lib/featured/queries';
import { getFeedPage } from '@/lib/feed/queries';
import { serializeJsonLd, webSiteJsonLd } from '@/lib/seo/jsonld';
import { supabaseAnon } from '@/lib/supabase/clients';

export const revalidate = 60;

// The layout's relative canonical ('./') resolves to '/index' for the root
// route in production builds — pin the bare apex explicitly (caught live).
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/** Curated rails — all three are real, populated tag chips in production. */
const RAIL_TAGS = ['generative-art', 'cli', 'homelab'] as const;
const RAIL_LIMIT = 8;
const QUICK_HITS_LIMIT = 4;

/**
 * Signed-out home (U2 adoption): hero with a live product moment, the
 * discovery band, the gallery, and the how-it-works → capture close. The
 * group layout supplies header/footer chrome.
 *
 * Every read here is anon + cached, so the page stays ISR-60 for everyone.
 * The hero's trending fetch deliberately uses the SAME cache key as
 * `FeedSection`'s own page-1 read, so the two share one query per window
 * rather than paying twice.
 */
export default async function Home() {
  const [stats, weird, makers, trending, quickHits, featured, ...railPages] = await Promise.all([
    getPlatformStats(),
    getWeirdDailyPick(),
    getRisingMakers(),
    getFeedPage({ sort: 'trending', tag: null }),
    getActiveFeedRows(QUICK_HITS_LIMIT),
    fetchActiveFeaturedSlots(supabaseAnon()),
    ...RAIL_TAGS.map((tag) => getFeedPage({ sort: 'trending', tag, limit: RAIL_LIMIT })),
  ]);

  const rails = RAIL_TAGS.map((tag, i) => ({ tag, rows: railPages[i]?.rows ?? [] }));

  // One provider for the discovery modules; FeedSection brings its own for
  // the gallery (each island owns its id set — the established pattern).
  const discoveryIds = [
    ...new Set(
      [...(weird ? [weird] : []), ...quickHits, ...rails.flatMap((rail) => rail.rows)].map(
        (row) => row.id,
      ),
    ),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes `<`; content is our own structured data.
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(webSiteJsonLd()) }}
      />
      <Hero stats={stats} shelfRows={trending.rows} tickerRows={trending.rows} />

      <EngagementProvider projectIds={discoveryIds}>
        <DiscoveryBand weird={weird} makers={makers} quickHits={quickHits} rails={rails} />
      </EngagementProvider>

      <section id="feed" className="scroll-mt-20 border-t">
        <PageShell className="flex flex-col gap-8 py-16 sm:py-20">
          <SectionHead kicker={copy.galleryKicker} title={copy.galleryTitle} />
          <FeedSection sort="trending" featured={featured} />
        </PageShell>
      </section>

      <HowItWorks />
    </>
  );
}

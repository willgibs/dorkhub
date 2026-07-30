import { FeaturedStrip } from '@/app/(app)/_feed/featured-strip';
import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { Hero } from '@/app/(app)/_sections/hero';
import { HowItWorks } from '@/app/(app)/_sections/how-it-works';
import { IsIsntStrip } from '@/app/(app)/_sections/is-isnt-strip';
import { ManifestoTeaser } from '@/app/(app)/_sections/manifesto-teaser';
import { PageShell } from '@/components/page-shell';
import { fetchActiveFeaturedSlots } from '@/lib/featured/queries';
import { serializeJsonLd, webSiteJsonLd } from '@/lib/seo/jsonld';
import { supabaseAnon } from '@/lib/supabase/clients';

export const revalidate = 60;

/**
 * Signed-out marketing home. The (app) group layout already renders
 * SiteHeader/SiteFooter inside PageShell with bg-bloom — this page is
 * sections only. The feed section wraps `FeedSection` in the same
 * `id="feed"` scroll target + `PageShell` container the old fixture-backed
 * `FeedPreview` used (Hero's "browse" CTA still anchors to `#feed`).
 */
export default async function Home() {
  // The featured strip leads the feed section ("the featured strip IS real
  // cards" — master plan marketing IA). Anon client keeps ISR-60 intact.
  const featured = await fetchActiveFeaturedSlots(supabaseAnon());

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes `<`; content is our own structured data.
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(webSiteJsonLd()) }}
      />
      <Hero />
      <IsIsntStrip />
      <section id="feed" className="scroll-mt-20">
        <PageShell className="flex flex-col gap-16 py-16 sm:py-20">
          <FeaturedStrip slots={featured} />
          <FeedSection sort="trending" excludeIds={featured.map((slot) => slot.project.id)} />
        </PageShell>
      </section>
      <HowItWorks />
      <ManifestoTeaser />
    </>
  );
}

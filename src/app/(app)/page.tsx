import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { Hero } from '@/app/(app)/_sections/hero';
import { HowItWorks } from '@/app/(app)/_sections/how-it-works';
import { IsIsntStrip } from '@/app/(app)/_sections/is-isnt-strip';
import { ManifestoTeaser } from '@/app/(app)/_sections/manifesto-teaser';
import { PageShell } from '@/components/page-shell';

export const revalidate = 60;

/**
 * Signed-out marketing home. The (app) group layout already renders
 * SiteHeader/SiteFooter inside PageShell with bg-bloom — this page is
 * sections only. The feed section wraps `FeedSection` in the same
 * `id="feed"` scroll target + `PageShell` container the old fixture-backed
 * `FeedPreview` used (Hero's "browse" CTA still anchors to `#feed`).
 */
export default function Home() {
  return (
    <>
      <Hero />
      <IsIsntStrip />
      <section id="feed" className="scroll-mt-20">
        <PageShell className="py-16 sm:py-20">
          <FeedSection sort="trending" />
        </PageShell>
      </section>
      <HowItWorks />
      <ManifestoTeaser />
    </>
  );
}

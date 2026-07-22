import { FeedPreview } from '@/app/(app)/_sections/feed-preview';
import { Hero } from '@/app/(app)/_sections/hero';
import { HowItWorks } from '@/app/(app)/_sections/how-it-works';
import { IsIsntStrip } from '@/app/(app)/_sections/is-isnt-strip';
import { ManifestoTeaser } from '@/app/(app)/_sections/manifesto-teaser';

/**
 * Signed-out marketing home. The (app) group layout already renders
 * SiteHeader/SiteFooter inside PageShell with bg-bloom — this page is
 * sections only.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <IsIsntStrip />
      <FeedPreview />
      <HowItWorks />
      <ManifestoTeaser />
    </>
  );
}

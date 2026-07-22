import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { PageShell } from '@/components/page-shell';

export const revalidate = 60;

/**
 * Signed-in home. `src/proxy.ts` rewrites authed hits to `/` here (URL bar
 * stays `/` — docs/plans/m5-discovery.md decision 2), and this route is also
 * reachable directly for an authed session. Feed-only: the marketing
 * sections (hero, is/isn't strip, how-it-works, manifesto teaser) are
 * signed-out-only and stay on the root page. Same `id="feed"` + `PageShell`
 * container the signed-out home wraps its feed section in.
 */
export default function HomePage() {
  return (
    <section id="feed" className="scroll-mt-20">
      <PageShell className="py-16 sm:py-20">
        <FeedSection sort="recent" />
      </PageShell>
    </section>
  );
}

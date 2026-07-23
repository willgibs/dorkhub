import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { RecsRail } from '@/app/(app)/home/recs-rail';
import { PageShell } from '@/components/page-shell';

export const revalidate = 60;

/**
 * Signed-in home. `src/proxy.ts` rewrites authed hits to `/` here (URL bar
 * stays `/` — docs/plans/m5-discovery.md decision 2), and this route is also
 * reachable directly for an authed session. Feed-only: the marketing
 * sections (hero, is/isn't strip, how-it-works, manifesto teaser) are
 * signed-out-only and stay on the root page. Same `id="feed"` + `PageShell`
 * container the signed-out home wraps its feed section in.
 *
 * `RecsRail` is a client island (docs/plans/p2-discovery.md Wave 2B, locked
 * decision 6) — this page stays ISR-60 and reads no cookies; the rail learns
 * who's looking at it client-side, after mount, via a server action. No
 * `await`/branching on it here, or the page would poison its own cache.
 */
export default function HomePage() {
  return (
    <section id="feed" className="scroll-mt-20">
      <PageShell className="flex flex-col gap-16 py-16 sm:gap-20 sm:py-20">
        <RecsRail />
        <FeedSection sort="recent" />
      </PageShell>
    </section>
  );
}

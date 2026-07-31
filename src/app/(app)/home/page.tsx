import type { Metadata } from 'next';

import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { RecsRail } from '@/app/(app)/home/recs-rail';
import { PageShell } from '@/components/page-shell';
import { fetchActiveFeaturedSlots } from '@/lib/featured/queries';
import { supabaseAnon } from '@/lib/supabase/clients';

export const revalidate = 60;

// This page SERVES at `/` via the proxy rewrite — without an explicit
// canonical the layout's './' would claim '/home' for the signed-in render
// of the homepage. Pin the bare apex (same fix as the signed-out page).
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

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
export default async function HomePage() {
  // Anon client on purpose — featured slots are the same for every viewer,
  // so the page stays ISR-60 cacheable (the cookie rule above). They render
  // inline as the feed's first cells (board direction 2026-07-31).
  const featured = await fetchActiveFeaturedSlots(supabaseAnon());

  return (
    <section id="feed" className="scroll-mt-20">
      <PageShell className="flex flex-col gap-16 py-16 sm:gap-20 sm:py-20">
        <RecsRail />
        <FeedSection sort="trending" featured={featured} />
      </PageShell>
    </section>
  );
}

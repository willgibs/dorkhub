import { SiteHeaderAuth } from '@/app/_shell/site-header-auth';
import { PageShell } from '@/components/page-shell';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getPlatformStats } from '@/lib/discovery/queries';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Cached (24h) + anon. NOTE: this call's cache window CAPS every page under
  // this layout (effective revalidate = min across all caches read, layouts
  // included) — the old "never touches the pages' ISR contract" claim here
  // was exactly wrong. Keep its window >= the longest page TTL.
  const stats = await getPlatformStats();

  return (
    <div className="bg-bloom flex min-h-screen flex-col">
      {/* Sticky nav (U2 board direction: "navigation always a click away") —
          now at every width, since the header collapses to a single row
          under `sm`. The veil keeps the floating card-bar readable over
          scrolling content; overlays portal at z-50 and stay above. */}
      <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md">
        <PageShell className="pt-3 pb-3">
          <SiteHeader>
            <SiteHeaderAuth />
          </SiteHeader>
        </PageShell>
      </div>
      <main className="flex-1">{children}</main>
      <SiteFooter stats={stats} />
    </div>
  );
}

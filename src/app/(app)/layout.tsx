import { SiteHeaderAuth } from '@/app/_shell/site-header-auth';
import { PageShell } from '@/components/page-shell';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getPlatformStats } from '@/lib/discovery/queries';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Cached (hourly) + anon, so the footer's live counts cost one query per
  // window across the whole app and never touch the pages' ISR contract.
  const stats = await getPlatformStats();

  return (
    <div className="bg-bloom flex min-h-screen flex-col">
      {/* Sticky nav (U2 board direction: "navigation always a click away").
          The veil keeps the floating card-bar readable over scrolling
          content; overlays portal at z-50 and stay above. */}
      <div className="z-40 bg-background/85 backdrop-blur-md sm:sticky sm:top-0">
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

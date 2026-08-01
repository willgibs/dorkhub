import { SiteHeaderAuth } from '@/app/_shell/site-header-auth';
import { PageShell } from '@/components/page-shell';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getPlatformStats } from '@/lib/discovery/queries';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const stats = await getPlatformStats();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky nav (U2) — same treatment as the (app) layout. */}
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

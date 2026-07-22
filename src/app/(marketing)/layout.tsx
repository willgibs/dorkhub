import { PageShell } from '@/components/page-shell';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeaderSession } from '@/components/site-header-session';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PageShell className="pt-6">
        <SiteHeaderSession />
      </PageShell>
      <main className="flex-1">{children}</main>
      <PageShell>
        <SiteFooter />
      </PageShell>
    </div>
  );
}

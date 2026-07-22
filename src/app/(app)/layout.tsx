import { PageShell } from '@/components/page-shell';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeaderSession } from '@/components/site-header-session';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bloom flex min-h-screen flex-col">
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

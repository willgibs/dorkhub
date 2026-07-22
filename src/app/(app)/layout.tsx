import { SiteHeaderAuth } from '@/app/_shell/site-header-auth';
import { PageShell } from '@/components/page-shell';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bloom flex min-h-screen flex-col">
      <PageShell className="pt-6">
        <SiteHeader>
          <SiteHeaderAuth />
        </SiteHeader>
      </PageShell>
      <main className="flex-1">{children}</main>
      <PageShell>
        <SiteFooter />
      </PageShell>
    </div>
  );
}

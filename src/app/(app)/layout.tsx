import { SiteHeaderAuth } from '@/app/_shell/site-header-auth';
import { PageShell } from '@/components/page-shell';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bloom flex min-h-screen flex-col">
      {/* Sticky nav (U2 R2.5 board direction: "navigation always a click
          away"). sm+ only — the wrapped mobile header is too tall to pin
          (a compact mobile header is a W-wave item). The veil keeps the
          floating card-bar readable over scrolling content; overlays
          portal at z-50 and stay above. */}
      <div className="z-40 bg-background/85 backdrop-blur-md sm:sticky sm:top-0">
        <PageShell className="pt-3 pb-3">
          <SiteHeader>
            <SiteHeaderAuth />
          </SiteHeader>
        </PageShell>
      </div>
      <main className="flex-1">{children}</main>
      <PageShell>
        <SiteFooter />
      </PageShell>
    </div>
  );
}

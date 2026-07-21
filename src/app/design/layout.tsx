import Link from 'next/link';
import type { ReactNode } from 'react';
import { DesignNav } from '@/app/design/design-nav';
import { PageShell } from '@/components/page-shell';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Shell for the /design styleguide: wordmark + ThemeToggle up top, a sticky
 * side nav (DesignNav) beside the page content below. Every /design/* page
 * renders inside this without adding its own outer container.
 */
export default function DesignLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-bloom min-h-screen">
      <PageShell className="flex items-center justify-between gap-4 py-6">
        <Link
          href="/design"
          className="rounded-sm font-display text-base leading-none font-extrabold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          dorkhub<span className="text-primary">_</span>{' '}
          <span className="font-sans text-sm font-normal text-muted-foreground">design</span>
        </Link>
        <ThemeToggle />
      </PageShell>
      <PageShell className="grid gap-8 pb-24 lg:grid-cols-[168px_minmax(0,1fr)] lg:gap-12">
        <DesignNav />
        <main className="min-w-0">{children}</main>
      </PageShell>
    </div>
  );
}

import type { Metadata } from 'next';

import { SiteHeaderAuth } from '@/app/_shell/site-header-auth';
import { NotFoundContent } from '@/components/not-found-content';
import { PageShell } from '@/components/page-shell';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = { title: '404' };

/**
 * Root 404 — reached by paths that match no route group at all, so no group
 * layout wraps it and it renders its own chrome. Anything inside the product
 * tree hits `(app)/not-found.tsx` instead, which is content-only because the
 * group layout already provides the shell.
 *
 * No `stats` on the footer on purpose: a 404 shouldn't pay for a count query
 * to render, and the line is absence-gated.
 */
export default function NotFound() {
  return (
    <div className="bg-bloom flex min-h-screen flex-col">
      <PageShell className="pt-3 pb-3">
        <SiteHeader>
          <SiteHeaderAuth />
        </SiteHeader>
      </PageShell>
      <main className="flex flex-1 items-center justify-center">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </div>
  );
}

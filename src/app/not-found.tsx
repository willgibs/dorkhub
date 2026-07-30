import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteHeaderAuth } from '@/app/_shell/site-header-auth';
import { PageShell } from '@/components/page-shell';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { copy } from '@/lib/copy';

export const metadata: Metadata = { title: '404' };

/**
 * Root 404 — catches every notFound() in the tree (project/profile/tag/list
 * pages included), so it mirrors the (app) layout's chrome rather than
 * rendering a bare page: group layouts don't wrap the root not-found.
 * copy.notFound carries both lines ('404: …\n// …'); the second renders as
 * the mono `//` kicker with the slashes decorative, matching the section
 * labels elsewhere.
 */
export default function NotFound() {
  const [headline, kicker] = copy.notFound.split('\n');
  const kickerText = kicker?.replace(/^\/\/\s*/, '');

  return (
    <div className="bg-bloom flex min-h-screen flex-col">
      <PageShell className="pt-6">
        <SiteHeader>
          <SiteHeaderAuth />
        </SiteHeader>
      </PageShell>
      <main className="flex flex-1 items-center justify-center">
        <PageShell className="flex flex-col items-center gap-4 py-24 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{headline}</h1>
          {kickerText ? (
            <p className="font-mono text-[12.5px] text-muted-foreground">
              <span aria-hidden="true">{'// '}</span>
              {kickerText}
            </p>
          ) : null}
          <Link
            href="/"
            className="mt-2 rounded-md border px-4 py-2 font-mono text-[12.5px] text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px"
          >
            {copy.notFoundCta}
          </Link>
        </PageShell>
      </main>
      <PageShell>
        <SiteFooter />
      </PageShell>
    </div>
  );
}

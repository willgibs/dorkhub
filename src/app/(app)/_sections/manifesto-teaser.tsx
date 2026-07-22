import Link from 'next/link';

import { Callout } from '@/components/callout';
import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';

export function ManifestoTeaser() {
  return (
    <PageShell as="section" className="pb-20 sm:pb-24">
      <Callout className="mx-auto max-w-[560px]">
        <p className="font-display text-lg font-semibold text-foreground">{copy.footerLine}</p>
        <Link
          href="/manifesto"
          className="mt-2 inline-block rounded-sm text-sm text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          read the manifesto
        </Link>
      </Callout>
    </PageShell>
  );
}

import Link from 'next/link';

import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';

/**
 * The 404 body, without chrome — shared by the two not-found boundaries so
 * they can differ in exactly one way: whether they supply header/footer.
 *
 * `copy.notFound` carries both lines ('404: …\n// …'); the second renders as
 * the mono `//` kicker with the slashes decorative, matching the section
 * labels elsewhere.
 */
export function NotFoundContent() {
  const [headline, kicker] = copy.notFound.split('\n');
  const kickerText = kicker?.replace(/^\/\/\s*/, '');

  return (
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
  );
}

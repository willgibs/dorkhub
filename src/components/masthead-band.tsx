import type { ReactNode } from 'react';

import { PageShell } from '@/components/page-shell';
import { cn } from '@/lib/utils';

export type MastheadBandProps = {
  children: ReactNode;
  className?: string;
};

/**
 * The opening band every destination page shares (W3 spine): a full-width
 * rule-terminated section with the halftone field masked toward the headline,
 * wrapping the standard shell.
 *
 * Extracted in W4 when the tag page became the third copy of the same markup.
 * The atmosphere is what makes a project, a maker and a tag read as places on
 * dorkhub rather than three unrelated templates, so it belongs in one file —
 * the pages differ in what they put INSIDE the band, never in the band.
 */
export function MastheadBand({ children, className }: MastheadBandProps) {
  return (
    <header className={cn('relative isolate border-b', className)}>
      <div
        aria-hidden="true"
        className="bg-halftone pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(620px_240px_at_28%_30%,black,transparent_72%)] [-webkit-mask-image:radial-gradient(620px_240px_at_28%_30%,black,transparent_72%)]"
      />
      <PageShell className="flex flex-col gap-7 pt-8 pb-7 sm:pt-10">{children}</PageShell>
    </header>
  );
}

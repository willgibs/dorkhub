import Link from 'next/link';
import type { ReactNode } from 'react';

import { MobileMenu } from '@/app/_shell/mobile-menu';
import { SearchTrigger } from '@/app/_shell/search-trigger';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { NAV_LINKS } from '@/lib/nav';
import { cn } from '@/lib/utils';

export type SiteHeaderProps = {
  /** Destination for the primary CTA (copy.ctaPrimary). */
  ctaHref?: string;
  /** Avatar slot — rendered at the far right (e.g. an <Avatar> or a user-menu trigger). */
  children?: ReactNode;
  className?: string;
};

/**
 * Product nav. Responsive by design (U2): at `sm` and up it's the full bar —
 * wordmark, links, search, CTA, account. Below `sm` it collapses to ONE row
 * (wordmark · search · menu), which is what makes the sticky header viable on
 * phones; everything else moves into <MobileMenu>'s sheet.
 *
 * The layouts own the sticky positioning; this renders the card-styled bar.
 */
export function SiteHeader({ ctaHref = '/new', children, className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        'edge-highlight flex items-center gap-x-[18px] rounded-lg border bg-card px-5 py-3.5 sm:flex-wrap sm:gap-x-[22px] sm:gap-y-2.5',
        className,
      )}
    >
      <Link
        href="/"
        className="rounded-sm font-display text-[19px] leading-none font-extrabold text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        dorkhub
        <span aria-hidden="true" className="text-primary">
          _
        </span>
      </Link>

      <nav aria-label="primary" className="hidden items-center gap-[18px] text-sm sm:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            prefetch={link.prefetch}
            className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <SearchTrigger />

      {/* order-20 keeps the menu trigger to the RIGHT of the search icon on
          mobile (SearchTrigger carries order-10); at sm the row falls back to
          source order with this cluster docked right. */}
      <div className="order-20 ml-auto flex items-center gap-3.5 sm:order-none">
        <Button
          asChild
          size="sm"
          className="hidden shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_45%,transparent),0_4px_18px_color-mix(in_oklab,var(--primary)_20%,transparent)] active:translate-y-px sm:inline-flex"
        >
          <Link href={ctaHref}>{copy.ctaPrimary}</Link>
        </Button>
        {children}
        <MobileMenu />
      </div>
    </header>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'rounded-sm border border-b-2 bg-code-bg px-[7px] py-0.5 font-mono text-xs text-code-text',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

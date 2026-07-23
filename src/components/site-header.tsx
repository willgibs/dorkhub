import Link from 'next/link';
import type { ReactNode } from 'react';

import { SearchTrigger } from '@/app/_shell/search-trigger';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export type SiteHeaderProps = {
  /** Destination for the primary CTA (copy.ctaPrimary). */
  ctaHref?: string;
  /** Avatar slot — rendered at the far right (e.g. an <Avatar> or a user-menu trigger). */
  children?: ReactNode;
  className?: string;
};

const NAV_LINKS = [
  { label: 'browse', href: '/' },
  { label: 'tags', href: '/tags' },
] as const;

/**
 * Product nav. Sticky-ready — positioning (sticky/top/z) is left to pages;
 * this renders the card-styled bar itself.
 */
export function SiteHeader({ ctaHref = '/new', children, className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        'edge-highlight flex flex-wrap items-center gap-x-[18px] gap-y-2.5 rounded-lg border bg-card px-5 py-3.5 sm:gap-x-[22px]',
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

      <nav
        aria-label="primary"
        className="order-10 flex items-center gap-[18px] text-sm sm:order-none"
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <SearchTrigger />

      <div className="ml-auto flex items-center gap-3.5">
        <Button
          asChild
          size="sm"
          className="shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_45%,transparent),0_4px_18px_color-mix(in_oklab,var(--primary)_20%,transparent)] active:translate-y-px"
        >
          <Link href={ctaHref}>{copy.ctaPrimary}</Link>
        </Button>
        {children}
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

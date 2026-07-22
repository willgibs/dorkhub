import Link from 'next/link';
import type { ReactNode } from 'react';

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
        'edge-highlight flex items-center gap-[22px] rounded-lg border bg-card px-5 py-3.5',
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
            className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* search affordance — non-functional placeholder for now */}
      <div className="hidden max-w-[260px] flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-[13px] text-muted-foreground sm:flex">
        search projects…
        <Kbd className="ml-auto">⌘K</Kbd>
      </div>

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

function Kbd({ children, className }: { children: ReactNode; className?: string }) {
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

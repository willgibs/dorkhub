import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';

import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export type SiteFooterLink = {
  label: string;
  href: string;
};

export type SiteFooterProps = {
  /** Override the right-side links; defaults to manifesto / colophon. */
  links?: readonly SiteFooterLink[];
  className?: string;
};

const DEFAULT_LINKS: readonly SiteFooterLink[] = [
  { label: 'manifesto', href: '/manifesto' },
  { label: 'colophon', href: '/manifesto#colophon' },
];

export function SiteFooter({ links = DEFAULT_LINKS, className }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        'flex flex-wrap items-center justify-between gap-5 pt-11 pb-[60px] text-[13.5px] text-muted-foreground',
        className,
      )}
    >
      <span>{copy.footerLine}</span>
      <div className="flex items-center gap-[18px]">
        {links.map((link, i) => (
          <Fragment key={link.href}>
            {i > 0 && (
              <span
                aria-hidden="true"
                className="text-[8px] text-[color-mix(in_oklab,var(--foreground)_28%,transparent)]"
              >
                ✦
              </span>
            )}
            <FooterLink href={link.href}>{link.label}</FooterLink>
          </Fragment>
        ))}
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const linkClass =
    'rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none';
  if (href.startsWith('http')) {
    return (
      <a href={href} rel="noreferrer" className={linkClass}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  );
}

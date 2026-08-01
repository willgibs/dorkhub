import Link from 'next/link';
import { Fragment } from 'react';

import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import type { PlatformStats } from '@/lib/discovery/queries';

const QUIET_LINK =
  'rounded-sm text-[13.5px] text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

type FooterColumn = { label: string; links: Array<{ label: string; href: string }> };

/**
 * Footer v2 (U2 R1): the one-line footer grows into the platform's closing
 * argument — brand + live counts on the left, three quiet nav columns, and
 * the ✦-separated legal row at the bottom. Nav labels mirror the header's
 * literals; voice strings stay in copy.ts.
 */
export function FooterV2({ stats }: { stats: PlatformStats | null }) {
  const columns: FooterColumn[] = [
    {
      label: copy.footerColBrowse,
      links: [
        { label: 'browse', href: '/' },
        { label: 'tags', href: '/tags' },
        { label: 'weird', href: '/weird' },
        { label: 'search', href: '/search' },
      ],
    },
    {
      label: copy.footerColYours,
      links: [
        { label: copy.ctaPrimary, href: '/new' },
        { label: copy.savedTitle, href: '/saved' },
        { label: copy.followingTitle, href: '/following' },
      ],
    },
    {
      label: copy.footerColMeta,
      links: [
        { label: 'manifesto', href: '/manifesto' },
        { label: 'sponsor', href: '/sponsor' },
      ],
    },
  ];

  return (
    <footer className="mt-6 border-t">
      <PageShell className="flex flex-col gap-10 pt-12 pb-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-3">
            <span className="font-display text-lg font-bold">
              dorkhub<span className="text-primary">_</span>
            </span>
            <p className="text-[13.5px] text-muted-foreground">{copy.footerLine}</p>
            {stats && stats.projects > 0 ? (
              <p className="tabular-nums font-mono text-[11.5px] text-muted-foreground">
                {stats.projects.toLocaleString()} {copy.statsUnitProjects} ·{' '}
                {stats.makers.toLocaleString()} {copy.statsUnitMakers} ·{' '}
                {stats.tags.toLocaleString()} tags
              </p>
            ) : null}
          </div>

          {columns.map((column) => (
            <nav key={column.label} aria-label={column.label} className="flex flex-col gap-2.5">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                <span aria-hidden="true">{'// '}</span>
                {column.label}
              </p>
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={link.href === '/weird' ? false : undefined}
                  className={QUIET_LINK}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-[18px] border-t pt-6 text-[12.5px] text-muted-foreground">
          {[
            { label: 'terms', href: '/terms' },
            { label: 'privacy', href: '/privacy' },
          ].map((link, i) => (
            <Fragment key={link.href}>
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  className="text-[8px] text-[color-mix(in_oklab,var(--foreground)_28%,transparent)]"
                >
                  ✦
                </span>
              ) : null}
              <Link href={link.href} className={QUIET_LINK}>
                {link.label}
              </Link>
            </Fragment>
          ))}
        </div>
      </PageShell>
    </footer>
  );
}

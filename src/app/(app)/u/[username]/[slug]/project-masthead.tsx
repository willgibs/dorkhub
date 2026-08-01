import Link from 'next/link';
import type { ReactNode } from 'react';

import { CopyButton } from '@/components/copy-button';
import { MastheadBand } from '@/components/masthead-band';
import { TagChip } from '@/components/tag-chip';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export type ProjectMastheadProps = {
  name: string;
  slug: string;
  tagline: string | null;
  tags: string[];
  username: string;
  repoUrl: string;
  repoFullName: string;
  demoUrl: string | null;
  /** ProjectVitals — the spec block that shares the rail's column. */
  vitals?: ReactNode;
  /** Like / save / add-to-list / report islands. */
  engagement?: ReactNode;
  /** Owner-only publish + refresh controls; renders above everything else. */
  ownerBar?: ReactNode;
  className?: string;
};

const quietLink =
  'rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * The project masthead — a full-width opening band rather than the first few
 * rows of a stacked column.
 *
 * Three things changed from the P3 version, all hierarchy: the title was
 * rendering at 26px (smaller than a section heading on the home page, on a
 * page whose entire job is that one name); the repo's vital signs sat in a
 * comma row sized for a card; and the actions people come here for — demo,
 * clone, repo — were tucked under four other rows of metadata. The band also
 * gives the page a spine: vitals sit directly above the reading rail below,
 * so the two-column rhythm starts at the top of the page.
 */
export function ProjectMasthead({
  name,
  slug,
  tagline,
  tags,
  username,
  repoUrl,
  repoFullName,
  demoUrl,
  vitals,
  engagement,
  ownerBar,
  className,
}: ProjectMastheadProps) {
  return (
    <MastheadBand className={className}>
      {ownerBar}

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <p className="flex flex-wrap items-center gap-1.5 font-mono text-[11.5px] text-muted-foreground">
            <Link href={`/u/${username}`} className={quietLink}>
              @{username}
            </Link>
            <span aria-hidden="true" className="opacity-50">
              /
            </span>
            <span className="text-foreground">{slug}</span>
          </p>

          <h1 className="text-balance font-display text-[32px] leading-[1.05] font-extrabold tracking-tight sm:text-[40px]">
            {name}
          </h1>

          {tagline ? (
            <p className="max-w-[52ch] text-[16.5px] leading-relaxed text-muted-foreground">
              {tagline}
            </p>
          ) : null}

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {tags.map((tag) => (
                <TagChip key={tag} tag={tag} hashPrefix />
              ))}
            </div>
          ) : null}
        </div>

        {vitals ? <div className="lg:w-[260px] lg:shrink-0">{vitals}</div> : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t pt-6">
        {demoUrl ? (
          <Button asChild>
            <a href={demoUrl} target="_blank" rel="noopener">
              {copy.projectVisitDemo}
            </a>
          </Button>
        ) : null}
        <CopyButton command={`git clone ${repoUrl}.git`} />
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener"
          className={cn('font-mono text-[12.5px] text-muted-foreground', quietLink)}
        >
          {repoFullName}
        </a>
        {engagement ? (
          <div className="flex flex-wrap items-center gap-3 sm:ml-auto">{engagement}</div>
        ) : null}
      </div>
    </MastheadBand>
  );
}

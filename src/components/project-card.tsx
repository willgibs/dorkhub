import type { ReactNode } from 'react';
import { CardMedia } from '@/components/card-media';
import { LanguageDot } from '@/components/language-dot';
import { StatButton } from '@/components/stat-button';
import { TagChip } from '@/components/tag-chip';
import type { FixtureAuthor, FixtureProject } from '@/lib/fixtures';
import { githubOgImageUrl } from '@/lib/projects/github-og';
import { cn } from '@/lib/utils';

export type ProjectCardVariant = 'feed' | 'compact' | 'featured';

export type ProjectCardProps = {
  project: FixtureProject;
  author: FixtureAuthor;
  variant?: ProjectCardVariant;
  /** Mono slot label above the card (featured variant only) — e.g. "sponsored", "pick of the week". */
  labelText?: string;
  /** Link target for the project title. */
  href?: string;
  /** Link target for the author row. */
  authorHref?: string;
  /**
   * Slot for the like control — defaults to a disabled-look, always-inactive
   * StatButton (today's exact look, zero visual change for non-opted
   * callers). Real callers pass a `LikeButtonIsland` (M5 decision 5/7).
   */
  likeSlot?: ReactNode;
  /**
   * Position within a card grid — staggers the star-count pop-in by 40ms/index
   * so a grid doesn't fire every count in unison (reads as noise, not polish).
   */
  staggerIndex?: number;
  className?: string;
};

/** FNV-1a — stable, cheap, deterministic across server/client renders. */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 1200 -> "1.2k", 214 -> "214". Never renders 0 — callers gate on null first. */
function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    return `${rounded}k`;
  }
  return String(n);
}

/**
 * Deterministic screenshot placeholder built from the project name — the
 * bars-and-wave treatment from the exploration, seeded so the same project
 * always draws the same picture.
 */
function MediaPlaceholder({ name }: { name: string }) {
  const seed = hashSeed(name);
  const flip = seed & 1;
  const bars = Array.from({ length: 7 }, (_, i) => {
    const h = 32 + ((seed >>> ((i * 4) % 28)) & 15) * 3;
    return {
      x: 24 + i * 38,
      y: 176 - h,
      h,
      fill: (i + flip) % 2 === 0 ? 'var(--primary)' : 'var(--primary-soft)',
    };
  });
  const points = Array.from({ length: 8 }, (_, i) => {
    const y = 36 + ((seed >>> ((i * 3 + 5) % 29)) & 15) * 2.4;
    return `${24 + i * 37},${Math.round(y)}`;
  }).join(' ');

  return (
    <svg
      viewBox="0 0 320 200"
      role="img"
      aria-label={`${name} screenshot placeholder`}
      className="h-full w-full"
    >
      <rect width="320" height="200" fill="var(--surface-2)" />
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} y={bar.y} width="34" height={bar.h} rx="3" fill={bar.fill} />
      ))}
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="3" />
    </svg>
  );
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function ProjectCard({
  project,
  author,
  variant = 'feed',
  labelText,
  href = '#',
  authorHref = '#',
  likeSlot,
  staggerIndex,
  className,
}: ProjectCardProps) {
  const compact = variant === 'compact';
  // og-image hotlinks take priority display-wise once a real screenshot
  // exists (P3 TODO: prefer `hasScreenshot` over the og fallback when
  // screenshots ship) — for now any repo with a `repoFullName` gets imagery.
  const showMedia = !compact && (Boolean(project.repoFullName) || project.hasScreenshot);
  const showTags = !compact && project.tags.length > 0;

  return (
    <article
      className={cn(
        'edge-highlight flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground',
        'transition-[border-color,transform] duration-150 ease-quiet hover:-translate-y-px hover:border-[color-mix(in_oklab,var(--foreground)_22%,var(--border))]',
        className,
      )}
    >
      {variant === 'featured' && labelText ? (
        <div className="border-b px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
          {labelText}
        </div>
      ) : null}

      {showMedia ? (
        <div className="aspect-[1200/630] border-b bg-surface-2">
          {project.repoFullName ? (
            <CardMedia src={githubOgImageUrl(project.repoFullName)}>
              <MediaPlaceholder name={project.name} />
            </CardMedia>
          ) : (
            <MediaPlaceholder name={project.name} />
          )}
        </div>
      ) : null}

      <div
        className={cn(
          'flex flex-1 flex-col',
          compact ? 'gap-1 px-4 py-3' : 'gap-[9px] px-4 pb-[13px] pt-[15px]',
        )}
      >
        <h3
          className={cn(
            'font-display font-bold leading-tight',
            compact ? 'text-sm' : 'text-[16.5px]',
          )}
        >
          <a href={href} className={cn('rounded-sm', focusRing)}>
            {project.name}
          </a>
        </h3>

        <p className="flex-1 text-[13.5px] text-muted-foreground">{project.tagline}</p>

        <div className="tabular-nums flex items-center gap-3.5 font-mono text-xs text-muted-foreground">
          <LanguageDot language={project.language} color={project.languageColor} />
          {project.stars !== null ? (
            <span
              className="inline-flex animate-number-pop-in items-center gap-[5px] [animation-fill-mode:backwards]"
              style={
                staggerIndex !== undefined
                  ? { animationDelay: `${staggerIndex * 40}ms` }
                  : undefined
              }
            >
              ★ {formatCount(project.stars)}
            </span>
          ) : project.updatedAgo ? (
            <span>{project.updatedAgo}</span>
          ) : null}
        </div>

        {showTags ? (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <TagChip key={tag} tag={tag} hashPrefix />
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t px-4 py-2.5">
        <a
          href={authorHref}
          className={cn(
            'inline-flex items-center gap-2 rounded-sm text-[12.5px] text-muted-foreground transition-colors hover:text-foreground',
            focusRing,
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-6 flex-none items-center justify-center rounded-full bg-primary-soft font-mono text-[11px] font-bold text-primary"
          >
            {author.initial}
          </span>
          @{author.username}
        </a>
        {likeSlot ?? <StatButton kind="like" active={false} count={project.likes} />}
      </div>
    </article>
  );
}

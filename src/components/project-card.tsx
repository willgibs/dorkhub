import type { ReactNode } from 'react';
import { AvatarBadge } from '@/components/avatar-badge';
import { CardMedia } from '@/components/card-media';
import { LanguageDot } from '@/components/language-dot';
import { StatButton } from '@/components/stat-button';
import { TagChip } from '@/components/tag-chip';
import { copy } from '@/lib/copy';
import type { FixtureAuthor, FixtureProject } from '@/lib/fixtures';
import { formatCount } from '@/lib/format';
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

/** Singular/plural unit for the lists signal. Kept here (not in copy.ts) because copy values are static strings by contract — /design/voice can't flatten a function. */
function listUnit(n: number): string {
  return n === 1 ? copy.listedInUnitOne : copy.listedInUnit;
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
      preserveAspectRatio="none"
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
        'edge-highlight relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground',
        'transition-[border-color,transform] duration-150 ease-quiet hover:-translate-y-px hover:border-[color-mix(in_oklab,var(--foreground)_22%,var(--border))]',
        className,
      )}
    >
      {/* U2 R3: with media, the featured label floats as a chip ON the media
          so the image top-aligns with its grid neighbors; the bar form
          survives only for media-less variants. */}
      {variant === 'featured' && labelText && !showMedia ? (
        <div className="border-b px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
          {labelText}
        </div>
      ) : null}

      {showMedia ? (
        // 2:1 = GitHub og-images' TRUE size (1200×600, verified in QA — not
        // the 1200×630 OpenGraph default), so hotlinks render uncropped. The
        // placeholder is absolutely positioned: aspect-ratio is only a
        // preferred ratio and in-flow SVG content would stretch the box.
        <div className="relative aspect-[2/1] border-b bg-surface-2">
          {project.repoFullName ? (
            <CardMedia src={githubOgImageUrl(project.repoFullName)}>
              <MediaPlaceholder name={project.name} />
            </CardMedia>
          ) : (
            <div className="absolute inset-0">
              <MediaPlaceholder name={project.name} />
            </div>
          )}
          {variant === 'featured' && labelText ? (
            <span className="absolute top-3 left-3 z-10 rounded-md border bg-background/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground backdrop-blur-sm">
              {labelText}
            </span>
          ) : null}
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
          {/* U2 R3: the whole card is the link — the title anchor stretches
              over the article (after:inset-0); nested interactive elements
              (tags, author, like slot) sit above it at z-10. */}
          <a
            href={href}
            className={cn('rounded-sm after:absolute after:inset-0 after:content-[""]', focusRing)}
          >
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
          {/* A THIRD PEER after stars, not part of the stars-else-recency
              fallback: a listed-but-unstarred project is exactly the case
              this signal exists to surface, so it must survive the branch
              above. ★/⑂ get away with bare glyphs because they're universal;
              this one is dorkhub-native, so it spells itself out ("in 7
              lists") — which also means the text is already its own
              accessible name, no aria-label needed. */}
          {project.lists !== null ? (
            <span>
              {copy.listedInLabel} {formatCount(project.lists)} {listUnit(project.lists)}
            </span>
          ) : null}
        </div>

        {showTags ? (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <TagChip key={tag} tag={tag} hashPrefix className="relative z-10" />
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t px-4 py-2.5">
        <a
          href={authorHref}
          className={cn(
            'relative z-10 inline-flex items-center gap-2 rounded-sm text-[12.5px] text-muted-foreground transition-colors hover:text-foreground',
            focusRing,
          )}
        >
          {/* Real avatar, initial as the layered fallback (U2 R3 — the mapper
              used to drop avatar_url, so card avatars never loaded at all). */}
          <AvatarBadge src={author.avatarUrl} initial={author.initial} />@{author.username}
        </a>
        <span className="relative z-10">
          {likeSlot ?? <StatButton kind="like" active={false} count={project.likes} />}
        </span>
      </div>
    </article>
  );
}

import Link from 'next/link';

import { CardMedia } from '@/components/card-media';
import { LanguageDot } from '@/components/language-dot';
import { TagChip } from '@/components/tag-chip';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import type { FeedRow } from '@/lib/feed/queries';
import { languageColor } from '@/lib/lang-colors';
import { githubOgImageUrl } from '@/lib/projects/github-og';
import { formatUpdatedAgo } from '@/lib/projects/map';

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * The daily weird pick — one project, deterministic per UTC day (migration
 * 0023), on a bespoke stage. R2.5: media sits ON TOP at the card's full
 * width in its true 2:1 ratio — GitHub og-images must never crop (R2
 * verdict; the side-column layout clipped them). Body below carries the
 * kicker, display-scale title, meta, tags, and the serendipity CTA
 * pointing at the true-random /random. Absence rule: no pick, no section.
 */
export function WeirdSpotlight({ row }: { row: FeedRow | null }) {
  if (!row) return null;
  const href = `/u/${row.profiles.username}/${row.slug}`;

  return (
    <article className="edge-highlight relative flex flex-col overflow-hidden rounded-lg border bg-card">
      <div className="relative aspect-[2/1] border-b bg-surface-2">
        {row.repo_full_name ? (
          <CardMedia src={githubOgImageUrl(row.repo_full_name)}>
            <SpotlightPlaceholder />
          </CardMedia>
        ) : (
          <div className="absolute inset-0">
            <SpotlightPlaceholder />
          </div>
        )}
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col gap-3.5 px-6 py-5">
        <div
          aria-hidden="true"
          className="bg-halftone pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(420px_200px_at_14%_0%,black,transparent_70%)] [-webkit-mask-image:radial-gradient(420px_200px_at_14%_0%,black,transparent_70%)]"
        />

        <p className="relative font-mono text-[11.5px] uppercase tracking-widest text-primary">
          <span aria-hidden="true">{'// '}</span>
          {copy.weirdSpotKicker}
        </p>

        <h3 className="relative font-display text-[26px] font-extrabold leading-tight tracking-tight sm:text-3xl">
          <Link href={href} className={`rounded-sm ${focusRing}`}>
            {row.name}
          </Link>
        </h3>

        {row.tagline ? (
          <p className="relative max-w-[62ch] text-[14.5px] leading-relaxed text-muted-foreground">
            {row.tagline}
          </p>
        ) : null}

        <p className="tabular-nums relative flex flex-wrap items-center gap-3.5 font-mono text-xs text-muted-foreground">
          <LanguageDot
            language={row.primary_language ?? 'code'}
            color={languageColor(row.primary_language)}
          />
          {row.stars_count > 0 ? <span>★ {row.stars_count.toLocaleString()}</span> : null}
          {row.github_pushed_at ? <span>{formatUpdatedAgo(row.github_pushed_at)}</span> : null}
          <span className="truncate">@{row.profiles.username}</span>
        </p>

        {row.tags.length > 0 ? (
          <div className="relative flex flex-wrap gap-1.5">
            {row.tags.slice(0, 4).map((tag) => (
              <TagChip key={tag} tag={tag} hashPrefix />
            ))}
          </div>
        ) : null}

        <div className="relative mt-auto flex flex-wrap items-center gap-4 pt-2">
          <Button asChild size="sm" className="active:translate-y-px">
            <Link href={href}>{copy.weirdSpotVisit}</Link>
          </Button>
          <Link
            href="/random"
            prefetch={false}
            className={`rounded-sm font-mono text-xs text-link hover:underline ${focusRing}`}
          >
            {copy.weirdSpotCta} →
          </Link>
          <span className="font-mono text-[11px] text-muted-foreground">{copy.weirdSpotHint}</span>
        </div>
      </div>
    </article>
  );
}

function SpotlightPlaceholder() {
  return (
    <div className="bg-halftone flex h-full w-full items-center justify-center">
      <span aria-hidden="true" className="font-mono text-3xl text-primary/40">
        ✦
      </span>
    </div>
  );
}

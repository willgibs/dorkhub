import Link from 'next/link';
import { type CSSProperties, Fragment } from 'react';

import { LanguageDot } from '@/components/language-dot';
import { PageShell } from '@/components/page-shell';
import { SignInWithGitHub } from '@/components/sign-in-github';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import type { PlatformStats } from '@/lib/discovery/queries';
import type { FeedRow } from '@/lib/feed/queries';
import { languageColor } from '@/lib/lang-colors';
import { cn } from '@/lib/utils';

const WORD_STAGGER_MS = 40;
const RISE_DURATION_MS = 300;
const SHIMMER_WORD = 'fun';

/** 1200 -> "1.2k" — mirrors ProjectCard's formatter for the shelf meta rows. */
function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    return `${rounded}k`;
  }
  return String(n);
}

/**
 * U2 hero: the word-rise headline + halftone identity kept, recomposed
 * left-anchored beside a LIVE product moment — variant A "shelf" (three real
 * trending cards drifting under the bloom) or variant B "ticker" (a linear
 * marquee of real projects). Both render; the harness toggle picks. Below
 * the CTAs: the platform proof line from platform_stats (absence-gated).
 */
export function HeroV2({
  stats,
  shelfRows,
  tickerRows,
}: {
  stats: PlatformStats | null;
  shelfRows: FeedRow[];
  tickerRows: FeedRow[];
}) {
  const words = copy.heroHeadline.split(' ');
  const shimmerDelayMs = words.length * WORD_STAGGER_MS + RISE_DURATION_MS;

  return (
    <section className="relative">
      {/* halftone field, now anchored behind the headline column */}
      <div
        aria-hidden="true"
        className="bg-halftone pointer-events-none absolute inset-x-0 -top-2.5 -z-10 h-[340px] [mask-image:radial-gradient(560px_260px_at_32%_36%,black,transparent_72%)] [-webkit-mask-image:radial-gradient(560px_260px_at_32%_36%,black,transparent_72%)]"
      />

      <PageShell className="grid items-center gap-10 pt-10 pb-10 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6">
        <div className="flex flex-col items-start gap-[18px] text-left">
          <h1 className="max-w-[640px] font-display text-4xl font-extrabold tracking-[-0.02em] sm:text-[54px] sm:leading-[1.05]">
            {words.map((word, i) => {
              const isShimmer = word === SHIMMER_WORD;
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed, never-reordered word list; some words repeat (e.g. "for")
                <Fragment key={`${word}-${i}`}>
                  <span
                    className={cn(
                      'inline-block animate-word-rise [animation-fill-mode:backwards]',
                      isShimmer &&
                        'relative isolate overflow-hidden after:absolute after:inset-0 after:animate-shimmer-sweep-once after:bg-gradient-to-r after:from-transparent after:via-primary/60 after:to-transparent after:[animation-delay:var(--shimmer-delay)]',
                    )}
                    style={
                      {
                        animationDelay: `${i * WORD_STAGGER_MS}ms`,
                        ...(isShimmer ? { '--shimmer-delay': `${shimmerDelayMs}ms` } : {}),
                      } as CSSProperties
                    }
                  >
                    {word}
                  </span>
                  {i < words.length - 1 ? ' ' : null}
                </Fragment>
              );
            })}
          </h1>

          <p className="max-w-[520px] text-[17.5px] text-muted-foreground">{copy.heroSub}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_45%,transparent),0_4px_18px_color-mix(in_oklab,var(--primary)_20%,transparent)] active:translate-y-px"
            >
              <Link href="#feed">{copy.browseCta}</Link>
            </Button>
            <SignInWithGitHub href="/auth/signin" />
          </div>

          <StatsLine stats={stats} />
        </div>

        <CardShelf rows={shelfRows} />
      </PageShell>

      <Ticker rows={tickerRows} />
    </section>
  );
}

/** Live proof line — tabular-nums mono; renders nothing without real counts (absence, never zero). */
function StatsLine({ stats }: { stats: PlatformStats | null }) {
  if (!stats || stats.projects <= 0) return null;
  return (
    <p className="tabular-nums mt-1 font-mono text-xs text-muted-foreground">
      {formatCount(stats.projects)} {copy.statsUnitProjects}
      <Dot />
      {formatCount(stats.makers)} {copy.statsUnitMakers}
      <Dot />
      {copy.statsZeroPitch}
    </p>
  );
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      className="mx-2 text-[color-mix(in_oklab,var(--foreground)_30%,transparent)]"
    >
      ·
    </span>
  );
}

/**
 * Variant A — the shelf: three real trending cards fanned + slowly drifting
 * (u2-drift keyframes; constant decorative motion, killed by the global
 * reduced-motion switch). Mini bespoke card markup — the full ProjectCard
 * belongs to the feed below; the shelf is scenery with real names on it.
 */
function CardShelf({ rows }: { rows: FeedRow[] }) {
  const cards = rows.slice(0, 3);
  if (cards.length < 3) return null;

  const seats: Array<{ tilt: string; className: string; duration: string }> = [
    { tilt: '-4deg', className: 'left-0 top-6 z-10', duration: '9s' },
    { tilt: '2.5deg', className: 'left-16 top-32 z-20', duration: '11s' },
    { tilt: '-1.5deg', className: 'left-6 top-60 z-30', duration: '10s' },
  ];

  return (
    <div
      data-v2-only="shelf"
      aria-hidden="true"
      className="pointer-events-none relative hidden h-[400px] select-none lg:block"
    >
      {cards.map((row, i) => {
        const seat = seats[i];
        return (
          <div
            key={row.id}
            style={{ '--u2-tilt': seat.tilt, animationDuration: seat.duration } as CSSProperties}
            className={cn(
              'edge-highlight absolute w-[300px] animate-[u2-drift_10s_ease-in-out_infinite] rounded-lg border bg-card px-4 py-3.5 shadow-overlay',
              seat.className,
            )}
          >
            <p className="truncate font-display text-sm font-bold">{row.name}</p>
            {row.tagline ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">{row.tagline}</p>
            ) : null}
            <p className="tabular-nums mt-2.5 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
              <LanguageDot
                language={row.primary_language ?? 'code'}
                color={languageColor(row.primary_language)}
              />
              {row.stars_count > 0 ? <span>★ {formatCount(row.stars_count)}</span> : null}
              <span className="truncate">@{row.profiles.username}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Variant B — the ticker: one full-bleed marquee row of real projects.
 * Linear by rule (constant motion); the track holds the list twice so the
 * -50% translate loops seamlessly; duplicate copy is aria-hidden.
 */
function Ticker({ rows }: { rows: FeedRow[] }) {
  if (rows.length === 0) return null;
  const list = (hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {rows.map((row) => (
        <span
          key={`${hidden ? 'b' : 'a'}-${row.id}`}
          className="tabular-nums flex items-center gap-2.5 whitespace-nowrap pr-10 font-mono text-xs text-muted-foreground"
        >
          <LanguageDot
            language={row.primary_language ?? 'code'}
            color={languageColor(row.primary_language)}
          />
          {row.name}
          {row.stars_count > 0 ? <span>★ {formatCount(row.stars_count)}</span> : null}
          <span
            aria-hidden="true"
            className="pl-6 text-[8px] text-[color-mix(in_oklab,var(--foreground)_28%,transparent)]"
          >
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      data-v2-only="ticker"
      className="relative overflow-hidden border-y py-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
    >
      <div className="flex w-max animate-[u2-ticker_48s_linear_infinite]">
        {list(false)}
        {list(true)}
      </div>
    </div>
  );
}

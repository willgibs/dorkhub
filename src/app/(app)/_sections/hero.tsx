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

/* R3 pacing: the R2.5 entrance finished before the eye landed (board note).
 * A short settle beat, longer travel, wider stagger — marketing-surface
 * budget (docs/motion.md's 500ms cap is for UI; emil: marketing/explanatory
 * may run longer). */
const WORD_STAGGER_MS = 60;
const WORD_BASE_DELAY_MS = 120;
const SHELF_BASE_DELAY_MS = 300;
const SHELF_STAGGER_MS = 160;
const SHELF_ENTER_MS = 700;

/** 1200 -> "1.2k" — mirrors ProjectCard's formatter for the shelf meta rows. */
function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    return `${rounded}k`;
  }
  return String(n);
}

const ASCII = /^[\x20-\x7E’—–-]+$/;

/**
 * Shelf curation (R3: "pick 3 more interesting projects… make it feel
 * cool"): from the trending page, prefer clean ascii names, real
 * mid-length taglines, and distinct languages, ranked by stars — then
 * top up from the pool if the diversity pass starves. Deterministic per
 * feed window, no hand-pinning to go stale.
 */
function pickShelfRows(rows: FeedRow[]): FeedRow[] {
  const pool = rows.filter(
    (row) =>
      row.tagline &&
      row.tagline.length >= 16 &&
      row.tagline.length <= 90 &&
      row.name.length <= 22 &&
      ASCII.test(row.name) &&
      ASCII.test(row.tagline),
  );
  const byStars = [...pool].sort((a, b) => b.stars_count - a.stars_count);
  const picks: FeedRow[] = [];
  const languages = new Set<string>();
  for (const row of byStars) {
    const lang = row.primary_language ?? '?';
    if (languages.has(lang)) continue;
    languages.add(lang);
    picks.push(row);
    if (picks.length === 3) return picks;
  }
  for (const row of byStars) {
    if (picks.length === 3) return picks;
    if (!picks.includes(row)) picks.push(row);
  }
  for (const row of rows) {
    if (picks.length === 3) break;
    if (!picks.includes(row)) picks.push(row);
  }
  return picks.slice(0, 3);
}

/**
 * The signed-out home hero (U2): board-final H1 (balanced wrapping), the
 * card shelf and ticker composed together, curated shelf picks, ticker items
 * clickable and paused on hover. Tone: a real resource for ALL projects —
 * playful register without side-project exclusivity.
 */
export function Hero({
  stats,
  shelfRows,
  tickerRows,
}: {
  stats: PlatformStats | null;
  shelfRows: FeedRow[];
  tickerRows: FeedRow[];
}) {
  return (
    <section className="relative">
      {/* halftone field behind the headline column */}
      <div
        aria-hidden="true"
        className="bg-halftone pointer-events-none absolute inset-x-0 -top-2.5 -z-10 h-[340px] [mask-image:radial-gradient(560px_260px_at_32%_36%,black,transparent_72%)] [-webkit-mask-image:radial-gradient(560px_260px_at_32%_36%,black,transparent_72%)]"
      />

      <PageShell className="grid items-center gap-10 pt-10 pb-12 sm:pt-16 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6">
        <div className="flex flex-col items-start gap-[18px] text-left">
          <RisingHeadline text={copy.heroHeadlineTools} />

          <p className="max-w-[520px] text-[17.5px] text-muted-foreground">
            {copy.heroSubDiscover}
          </p>

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

        <CardShelf rows={pickShelfRows(shelfRows)} />
      </PageShell>

      <Ticker rows={tickerRows} />
    </section>
  );
}

/** The staggered word-rise H1 — balanced wrapping so neither line strands a word. */
function RisingHeadline({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <h1 className="max-w-[640px] text-balance font-display text-4xl font-extrabold tracking-[-0.02em] sm:text-[54px] sm:leading-[1.05]">
      {words.map((word, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed, never-reordered word list; some words repeat
        <Fragment key={`${word}-${i}`}>
          <span
            className="inline-block animate-word-rise [animation-fill-mode:backwards]"
            style={{ animationDelay: `${WORD_BASE_DELAY_MS + i * WORD_STAGGER_MS}ms` }}
          >
            {word}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </h1>
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
 * The shelf: three curated trending cards, entering stacked → fan (once, on
 * load, R3-slowed so it can be absorbed), then drifting. Animation shorthand
 * is inline because it chains two named keyframes with per-card
 * delays/durations; the global reduced-motion kill switch (!important)
 * overrides inline values, so the switch still wins.
 */
function CardShelf({ rows }: { rows: FeedRow[] }) {
  const cards = rows.slice(0, 3);
  if (cards.length < 3) return null;

  // fromX/fromY point each seat back at a common stack origin (~the middle
  // card), so the fan visibly deals outward from one pile.
  const seats = [
    {
      tilt: '-4deg',
      className: 'left-0 top-6',
      z: 'z-10',
      fromX: '64px',
      fromY: '104px',
      drift: '9s',
    },
    {
      tilt: '2.5deg',
      className: 'left-16 top-32',
      z: 'z-20',
      fromX: '0px',
      fromY: '8px',
      drift: '11s',
    },
    {
      tilt: '-1.5deg',
      className: 'left-6 top-60',
      z: 'z-30',
      fromX: '40px',
      fromY: '-112px',
      drift: '10s',
    },
  ] as const;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative hidden h-[400px] select-none lg:block"
    >
      {cards.map((row, i) => {
        const seat = seats[i];
        const enterDelay = SHELF_BASE_DELAY_MS + i * SHELF_STAGGER_MS;
        return (
          <div
            key={row.id}
            style={
              {
                '--u2-tilt': seat.tilt,
                '--u2-from-x': seat.fromX,
                '--u2-from-y': seat.fromY,
                animation: `u2-shelf-enter ${SHELF_ENTER_MS}ms var(--motion-ease-quiet) ${enterDelay}ms both, u2-drift ${seat.drift} ease-in-out ${enterDelay + SHELF_ENTER_MS}ms infinite`,
              } as CSSProperties
            }
            className={cn(
              'edge-highlight absolute w-[300px] rounded-lg border bg-card px-4 py-3.5 shadow-overlay',
              seat.className,
              seat.z,
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
 * The ticker: a full-bleed marquee of real projects beneath the hero.
 * Hover pauses the track (globals.css `.u2-ticker`) and every item is a real
 * link to its project page. Linear by rule; the duplicate half is
 * aria-hidden with unfocusable links (visual continuity only — the first
 * half owns the a11y surface).
 */
function Ticker({ rows }: { rows: FeedRow[] }) {
  if (rows.length === 0) return null;
  const list = (hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {rows.map((row) => (
        <Fragment key={`${hidden ? 'b' : 'a'}-${row.id}`}>
          <Link
            href={`/u/${row.profiles.username}/${row.slug}`}
            tabIndex={hidden ? -1 : undefined}
            className="tabular-nums flex items-center gap-2.5 whitespace-nowrap rounded-sm font-mono text-xs text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LanguageDot
              language={row.primary_language ?? 'code'}
              color={languageColor(row.primary_language)}
            />
            {row.name}
            {row.stars_count > 0 ? <span>★ {formatCount(row.stars_count)}</span> : null}
          </Link>
          <span
            aria-hidden="true"
            className="px-6 text-[8px] text-[color-mix(in_oklab,var(--foreground)_28%,transparent)]"
          >
            ✦
          </span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div className="u2-ticker relative overflow-hidden border-y py-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="u2-ticker-track flex w-max animate-[u2-ticker_48s_linear_infinite]">
        {list(false)}
        {list(true)}
      </div>
    </div>
  );
}

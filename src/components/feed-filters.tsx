'use client';

import Link from 'next/link';
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

export type FeedFilterChip = {
  /** Chip label — also the identity the active state is matched against. */
  label: string;
  href: string;
};

export type FeedFiltersProps = {
  /** Sort chips in display order (hrefs precomputed by the server via feedHrefFor). */
  sort: FeedFilterChip[];
  /** Filterable tags in display order. Rendered clean — no hash prefix. */
  tags: FeedFilterChip[];
  activeSort: string;
  activeTag?: string;
  /** Right-docked cluster (e.g. saved/following links). Purely presentational. */
  trailing?: ReactNode;
  className?: string;
};

/** TagChip's exact chip geometry — the filter row and tag chips must read as one family. */
const CHIP_BASE =
  'inline-flex items-center rounded-md border px-[11px] py-1 font-mono text-xs leading-[1.4] transition-colors';
const CHIP_QUIET = 'border-border bg-surface-2 text-muted-foreground hover:text-foreground';
const CHIP_ACTIVE = 'border-primary bg-primary-soft text-primary';
const FOCUS_RING =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * FeedFilters (U2): the feed's chip row — sort chips with a SLIDING active
 * pill, a 1px separator, then tag chips.
 *
 * The pill is emil's duplicated-row clip-path technique rather than a layout
 * animation: a second, active-styled copy of the row sits on top and a
 * `clip-path: inset(… round …)` transition slides the visible window between
 * chips. Compositor-only, interruptible (a transition, not keyframes), 200ms
 * ease-quiet-in-out (on-screen movement), radius preserved via `round`.
 *
 * Chips are LINKS, not buttons — sort/tag live in the URL path (M5 decision
 * 1), so each is a real, shareable, crawlable route. Active state therefore
 * arrives as a prop from the route, not client state; the only local state
 * is an optimistic target so the pill starts sliding on click instead of
 * waiting for the navigation to resolve.
 */
export function FeedFilters({
  sort,
  tags,
  activeSort,
  activeTag,
  trailing,
  className,
}: FeedFiltersProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [clip, setClip] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [lastActiveSort, setLastActiveSort] = useState(activeSort);

  // The navigation landed (or the route changed under us) — drop the
  // optimistic target and follow the URL again. Adjusted DURING RENDER
  // rather than in an effect (React's "adjusting state when a prop
  // changes" pattern): the pill never paints a frame of stale intent.
  if (lastActiveSort !== activeSort) {
    setLastActiveSort(activeSort);
    setPending(null);
  }

  const target = pending ?? activeSort;

  const measure = useCallback(() => {
    const track = trackRef.current;
    const chip = chipRefs.current.get(target);
    if (!track || !chip) return;
    const left = chip.offsetLeft;
    const right = track.offsetWidth - (chip.offsetLeft + chip.offsetWidth);
    setClip(`inset(0 ${right}px 0 ${left}px round calc(var(--radius) * 0.8))`);
  }, [target]);

  useLayoutEffect(() => {
    measure();
    // Transitions turn on only AFTER the first clip has painted, so the pill
    // never animates in from the container's full width on mount.
    const raf = requestAnimationFrame(() => setReady(true));
    const track = trackRef.current;
    const observer = track ? new ResizeObserver(measure) : null;
    if (track && observer) observer.observe(track);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [measure]);

  return (
    <nav aria-label="feed filters" className={cn('flex flex-wrap items-center gap-2', className)}>
      <div ref={trackRef} className="relative">
        <div className="flex gap-2">
          {sort.map((chip) => (
            <Link
              key={chip.label}
              ref={(el) => {
                if (el) chipRefs.current.set(chip.label, el);
                else chipRefs.current.delete(chip.label);
              }}
              href={chip.href}
              aria-current={chip.label === activeSort ? 'page' : undefined}
              onClick={() => setPending(chip.label)}
              className={cn(CHIP_BASE, CHIP_QUIET, FOCUS_RING, 'active:translate-y-px')}
            >
              {chip.label}
            </Link>
          ))}
        </div>

        {/* The pill: an active-styled duplicate revealed through the sliding
            clip window. aria-hidden + pointer-events-none — the link row
            above owns every bit of semantics and input. */}
        {clip ? (
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 flex gap-2',
              ready && 'transition-[clip-path] duration-200 ease-quiet-in-out',
            )}
            style={{ clipPath: clip } as CSSProperties}
          >
            {sort.map((chip) => (
              <span key={chip.label} className={cn(CHIP_BASE, CHIP_ACTIVE)}>
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {tags.length > 0 ? (
        <>
          <span aria-hidden className="mx-1.5 h-5 w-px bg-border" />
          {tags.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              aria-current={chip.label === activeTag ? 'page' : undefined}
              className={cn(
                CHIP_BASE,
                FOCUS_RING,
                'active:translate-y-px',
                chip.label === activeTag ? cn(CHIP_ACTIVE, 'hover:text-primary') : CHIP_QUIET,
              )}
            >
              {chip.label}
            </Link>
          ))}
        </>
      ) : null}

      {trailing ? <div className="ml-auto flex items-center gap-3">{trailing}</div> : null}
    </nav>
  );
}

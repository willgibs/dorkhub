'use client';

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

export type SortKey = 'trending' | 'newest' | 'active';

/**
 * FeedFilters v2 (U2 R1): the sort chips gain a sliding active pill — the
 * deferred docs/motion.md backlog item, built with emil's duplicated-row
 * clip-path technique instead of a JS layout animation: a second,
 * active-styled chip row sits on top and a `clip-path: inset(… round …)`
 * transition slides the visible window between chips. GPU-only,
 * interruptible (transition, not keyframes), 200ms ease-quiet-in-out
 * (on-screen movement), radius preserved via `round`. The global
 * reduced-motion kill switch flattens it to an instant swap.
 */
export function FeedFiltersV2({
  options,
  value,
  onChange,
  trailing,
}: {
  options: ReadonlyArray<{ key: SortKey; label: string }>;
  value: SortKey;
  onChange: (next: SortKey) => void;
  trailing?: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<Map<SortKey, HTMLButtonElement>>(new Map());
  const [clip, setClip] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const chip = chipRefs.current.get(value);
    if (!track || !chip) return;
    const left = chip.offsetLeft;
    const right = track.offsetWidth - (chip.offsetLeft + chip.offsetWidth);
    setClip(`inset(0 ${right}px 0 ${left}px round calc(var(--radius) * 0.8))`);
  }, [value]);

  useLayoutEffect(() => {
    measure();
    // Enable the transition only AFTER the first clip has painted, so the
    // pill never animates in from the container's full width on mount.
    const raf = requestAnimationFrame(() => setReady(true));
    const track = trackRef.current;
    const observer = track ? new ResizeObserver(measure) : null;
    if (track && observer) observer.observe(track);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [measure]);

  const chipBase =
    'inline-flex items-center rounded-md border px-[11px] py-1 font-mono text-xs leading-[1.4] transition-colors active:translate-y-px';
  const focusRing =
    'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  return (
    <nav aria-label="feed filters" className="flex flex-wrap items-center gap-2">
      <div ref={trackRef} className="relative">
        <div role="tablist" aria-label="sort" className="flex gap-2">
          {options.map((option) => (
            <button
              key={option.key}
              ref={(el) => {
                if (el) chipRefs.current.set(option.key, el);
                else chipRefs.current.delete(option.key);
              }}
              type="button"
              role="tab"
              aria-selected={option.key === value}
              onClick={() => onChange(option.key)}
              className={cn(
                chipBase,
                focusRing,
                'border-border bg-surface-2 text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Active-styled duplicate row, revealed through the sliding clip
            window. aria-hidden + pointer-events-none: the base row owns all
            semantics and input. */}
        {clip ? (
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 flex gap-2',
              ready && 'transition-[clip-path] duration-200 ease-quiet-in-out',
            )}
            style={{ clipPath: clip } as CSSProperties}
          >
            {options.map((option) => (
              <span
                key={option.key}
                className={cn(chipBase, 'border-primary bg-primary-soft text-primary')}
              >
                {option.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {trailing ? <div className="ml-auto flex items-center gap-3">{trailing}</div> : null}
    </nav>
  );
}

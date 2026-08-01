'use client';

import { useEffect, useState } from 'react';

import { copy } from '@/lib/copy';
import type { ReadmeHeading } from '@/lib/readme/outline';
import { cn } from '@/lib/utils';

/** Below this a table of contents is noise, not navigation. */
const MIN_HEADINGS = 3;
/** How far below the sticky header a heading counts as "the one you're reading". */
const READING_LINE_OFFSET = 24;

/** Sticky-header height, from the same token the CSS side uses. */
function headerOffset(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-offset');
  return Number.parseInt(raw, 10) || 90;
}

/**
 * The last heading at or above the reading line — i.e. the section you are
 * inside. Pure so the rule is testable; `tops` is in document order.
 * Returns null above the first heading rather than pretending you're in a
 * section you haven't reached.
 */
export function activeHeadingId(
  tops: Array<{ id: string; top: number }>,
  line: number,
): string | null {
  let current: string | null = null;
  for (const heading of tops) {
    if (heading.top > line) break;
    current = heading.id;
  }
  return current;
}

export type ReadmeContentsProps = {
  headings: ReadmeHeading[];
  className?: string;
};

/**
 * The README's own shape, as a reading companion — READMEs on dorkhub average
 * 15 KB, which is a wall without one.
 *
 * A client island because scroll position is the whole point; the links
 * themselves are plain anchors, so with JS off (or before hydration) this
 * still navigates, just without the active marker. The ids it targets are put
 * on the headings at render time by `buildReadmeOutline`.
 *
 * Position beats IntersectionObserver here: an observer watching a band under
 * the header reports nothing while a long section spans the whole band, and
 * says nothing at all when someone lands mid-document on a `#section` deep
 * link — which is exactly when a reader most needs to know where they are.
 * Measuring on scroll always has an answer, and the first measurement happens
 * synchronously on mount.
 */
export function ReadmeContents({ headings, className }: ReadmeContentsProps) {
  const idKey = headings.map((h) => h.id).join(',');
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!idKey) return;
    const elements = idKey
      .split(',')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      setActiveId(
        activeHeadingId(
          elements.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top })),
          headerOffset() + READING_LINE_OFFSET,
        ),
      );
    };
    // Coalesced to one measurement per frame; the rects are read in a single
    // batch, so this never interleaves reads and writes.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [idKey]);

  if (headings.length < MIN_HEADINGS) return null;

  return (
    <nav aria-label={copy.projectContents} className={cn('flex flex-col gap-2.5', className)}>
      <p className="font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">
        <span aria-hidden="true">{'// '}</span>
        {copy.projectContents}
      </p>
      <ul className="u2-rail flex max-h-[min(52vh,420px)] flex-col overflow-y-auto">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  'block rounded-sm border-l py-1.5 text-[13px] leading-snug transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
                  heading.depth === 1 ? 'pl-5' : 'pl-3',
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground',
                )}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

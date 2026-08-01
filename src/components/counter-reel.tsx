import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
/** Per-column offset so the reel rolls left-to-right instead of in unison. */
const COLUMN_STAGGER_MS = 45;
/** Lets the page paint before the spin starts, so it isn't half over on arrival. */
const SPIN_BASE_DELAY_MS = 100;

export type CounterReelProps = {
  /**
   * A number, or an already-formatted figure ("103k", "1.2k"). Non-digit
   * characters render in place and never roll.
   */
  value: number | string;
  /**
   * Roll through one full revolution once on mount — the page-load flourish
   * on masthead stats. Off by default: a counter that's already changing
   * (ImportRunner) doesn't need an entrance too.
   */
  spinOnMount?: boolean;
  className?: string;
};

/**
 * A counter whose digits roll (U2 motion pass; technique adapted from
 * transitions.dev's spinning counter onto our motion tokens). Each column is a
 * digit strip translated by whole cells, so a single transform drives the
 * roll — no JS tween, no rAF loop, and the global reduced-motion switch
 * collapses it to an instant, correct value.
 *
 * The strip carries 0–9 TWICE and rests on the second cycle. That is what lets
 * `spinOnMount` start a full revolution back and land on the digit it started
 * from: the rendered number is correct in the server HTML, correct before
 * hydration (there is none — this is a server component), and correct with
 * animation disabled. A JS count-up would have had to render zeros first.
 *
 * The reel is `aria-hidden` with the plain value beside it in an sr-only span:
 * screen readers announce one discrete figure (and any surrounding aria-live
 * region stays honest) while the eye gets the motion.
 */
export function CounterReel({ value, spinOnMount = false, className }: CounterReelProps) {
  const text = typeof value === 'number' ? Math.max(0, Math.trunc(value)).toString() : value;
  // Counts digit columns only, so a "." or "k" doesn't consume a beat of the
  // cascade and leave a visible gap in the roll.
  let column = 0;

  return (
    <span className={cn('tabular-nums', className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="u2-reel">
        {[...text].map((char, i) => {
          const digit = Number(char);
          if (char < '0' || char > '9') {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: columns ARE positions
              <span key={i} className="u2-reel-fixed" data-char={char} />
            );
          }
          const delay = SPIN_BASE_DELAY_MS + column * COLUMN_STAGGER_MS;
          column += 1;
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: columns ARE positions — a stable index keeps each place's strip mounted so it rolls instead of remounting
            <span key={i} className="u2-reel-col">
              <span
                className={cn('u2-reel-strip', spinOnMount && 'u2-reel-spin')}
                // Offsets are MULTIPLES OF ONE CELL (`--reel-cell`), never
                // percentages: a percentage resolves against the strip's own
                // height, which is twenty cells tall.
                style={
                  {
                    transform: `translateY(calc(var(--reel-cell) * -${digit + DIGITS.length}))`,
                    transitionDelay: `${column * COLUMN_STAGGER_MS}ms`,
                    '--reel-from': `translateY(calc(var(--reel-cell) * -${digit}))`,
                    animationDelay: `${delay}ms`,
                  } as CSSProperties
                }
              >
                {/* `data-digit` rather than a text node — see the
                    .u2-reel-digit rule in globals.css: twenty cells per column
                    as real text would put ~120 characters of hidden digits
                    into the extracted text of every indexed page, and into
                    anything a reader copies. */}
                {[...DIGITS, ...DIGITS].map((n, cycle) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: two identical cycles — position is the only identity
                    key={cycle}
                    className="u2-reel-digit"
                    data-digit={n}
                  />
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

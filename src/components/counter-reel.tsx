import { cn } from '@/lib/utils';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
/** Per-column offset so the reel rolls left-to-right instead of in unison. */
const COLUMN_STAGGER_MS = 45;

export type CounterReelProps = {
  value: number;
  className?: string;
};

/**
 * A counter whose digits roll to their new value (U2 motion pass; technique
 * adapted from transitions.dev's spinning counter onto our motion tokens).
 * Each column is a 0–9 strip translated by whole cells, so a single
 * transform transition drives the roll — no JS tween, no rAF loop, and the
 * global reduced-motion switch collapses it to an instant swap.
 *
 * The reel is `aria-hidden` with the plain number beside it in an sr-only
 * span: screen readers announce one discrete value (and the surrounding
 * aria-live region stays honest) while the eye gets the motion.
 */
export function CounterReel({ value, className }: CounterReelProps) {
  const digits = Math.max(0, Math.trunc(value)).toString().split('');

  return (
    <span className={cn('tabular-nums', className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="u2-reel">
        {digits.map((digit, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: columns ARE positions — a stable index keeps each place's strip mounted so it rolls instead of remounting
            key={i}
            className="u2-reel-col"
          >
            <span
              className="u2-reel-strip"
              style={{
                transform: `translateY(-${Number(digit) * 100}%)`,
                transitionDelay: `${i * COLUMN_STAGGER_MS}ms`,
              }}
            >
              {DIGITS.map((n) => (
                <span key={n} className="u2-reel-digit">
                  {n}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

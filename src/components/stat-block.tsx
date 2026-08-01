import { CounterReel } from '@/components/counter-reel';
import { LanguageDot } from '@/components/language-dot';
import { cn } from '@/lib/utils';

export type Stat = {
  label: string;
  /** Figures get the display face and tabular alignment; text gets body weight. */
  tone: 'figure' | 'text';
  value: string;
  /** Language colour — renders the value as a LanguageDot instead of plain text. */
  dot?: string;
};

export type StatBlockProps = {
  stats: Stat[];
  className?: string;
};

/**
 * Labeled figures, for the right-hand column of a destination page's masthead.
 *
 * A card wants its stats inline and small (RepoStatsRow); a page someone
 * landed on has room to say what each number IS, and labeled figures are what
 * a reader scans before deciding whether to clone a repo or follow a maker.
 * Shared so a project's vital signs and a maker's counts read as one idiom.
 *
 * Absence, never zero: callers omit empty stats, and an empty list renders
 * nothing rather than an empty frame.
 *
 * Figures spin in on load (board request, W3.1) — a masthead entrance in the
 * same class as the home hero's deal-in, not a UI transition. Text stats
 * ("MIT", "3 days ago") stay still: rolling a licence name would be a gimmick.
 */
export function StatBlock({ stats, className }: StatBlockProps) {
  if (stats.length === 0) return null;

  return (
    <dl className={cn('grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-2', className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1">
          <dt className="font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">
            {stat.label}
          </dt>
          <dd
            className={cn(
              'leading-none',
              stat.tone === 'figure'
                ? 'tabular-nums font-display text-[20px] font-extrabold'
                : 'truncate text-[14px] font-medium',
            )}
          >
            {stat.dot ? (
              <LanguageDot language={stat.value} color={stat.dot} className="text-[14px]" />
            ) : stat.tone === 'figure' ? (
              <CounterReel value={stat.value} spinOnMount />
            ) : (
              stat.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

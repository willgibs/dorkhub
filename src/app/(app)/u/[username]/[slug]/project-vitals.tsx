import { LanguageDot } from '@/components/language-dot';
import { formatCount } from '@/lib/format';
import { languageColor } from '@/lib/lang-colors';
import { cn } from '@/lib/utils';

export type ProjectVitalsProps = {
  stars: number | null;
  forks: number | null;
  license: string | null;
  language: string | null;
  /** Humanized github_pushed_at ("3 days ago"), never our own updated_at (D21). */
  pushedAgo: string | null;
  className?: string;
};

type Vital = {
  label: string;
  /** Figures get the display face and tabular alignment; text gets body weight. */
  tone: 'figure' | 'text';
  value: string;
  dot?: string;
};

/**
 * The "is this alive?" answer, as a spec block rather than a metadata comma
 * row. A card wants stats inline and small (RepoStatsRow); a destination page
 * has room to label them, and labeled figures are what a reader is actually
 * scanning for before they decide to clone something.
 *
 * Absence, never zero (docs/design-system.md): a repo with no forks shows no
 * forks cell, and a project with nothing at all renders nothing.
 */
export function ProjectVitals({
  stars,
  forks,
  license,
  language,
  pushedAgo,
  className,
}: ProjectVitalsProps) {
  const vitals: Vital[] = [];
  if (stars !== null && stars > 0)
    vitals.push({ label: 'stars', tone: 'figure', value: formatCount(stars) });
  if (forks !== null && forks > 0)
    vitals.push({ label: 'forks', tone: 'figure', value: formatCount(forks) });
  if (language)
    vitals.push({
      label: 'written in',
      tone: 'text',
      value: language,
      dot: languageColor(language),
    });
  if (license) vitals.push({ label: 'license', tone: 'text', value: license });
  if (pushedAgo) vitals.push({ label: 'last push', tone: 'text', value: pushedAgo });

  if (vitals.length === 0) return null;

  return (
    <dl className={cn('grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-2', className)}>
      {vitals.map((vital) => (
        <div key={vital.label} className="flex flex-col gap-1">
          <dt className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            {vital.label}
          </dt>
          <dd
            className={cn(
              'leading-none',
              vital.tone === 'figure'
                ? 'tabular-nums font-display text-[20px] font-extrabold'
                : 'truncate text-[14px] font-medium',
            )}
          >
            {vital.dot ? (
              <LanguageDot language={vital.value} color={vital.dot} className="text-[14px]" />
            ) : (
              vital.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

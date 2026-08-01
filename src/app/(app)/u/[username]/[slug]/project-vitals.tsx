import { type Stat, StatBlock } from '@/components/stat-block';
import { formatCount } from '@/lib/format';
import { languageColor } from '@/lib/lang-colors';

export type ProjectVitalsProps = {
  stars: number | null;
  forks: number | null;
  license: string | null;
  language: string | null;
  /** Humanized github_pushed_at ("3 days ago"), never our own updated_at (D21). */
  pushedAgo: string | null;
  className?: string;
};

/**
 * The "is this alive?" answer — a repo's vital signs as labeled figures
 * (StatBlock) rather than the metadata comma row a card uses.
 *
 * Absence, never zero: a repo with no forks shows no forks cell, and a project
 * with nothing to report renders nothing at all.
 */
export function ProjectVitals({
  stars,
  forks,
  license,
  language,
  pushedAgo,
  className,
}: ProjectVitalsProps) {
  const stats: Stat[] = [];
  if (stars !== null && stars > 0)
    stats.push({ label: 'stars', tone: 'figure', value: formatCount(stars) });
  if (forks !== null && forks > 0)
    stats.push({ label: 'forks', tone: 'figure', value: formatCount(forks) });
  if (language)
    stats.push({
      label: 'written in',
      tone: 'text',
      value: language,
      dot: languageColor(language),
    });
  if (license) stats.push({ label: 'license', tone: 'text', value: license });
  if (pushedAgo) stats.push({ label: 'last push', tone: 'text', value: pushedAgo });

  return <StatBlock stats={stats} className={className} />;
}

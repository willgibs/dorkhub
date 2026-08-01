import { LanguageDot } from '@/components/language-dot';
import { TimeAgo } from '@/components/time-ago';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/utils';

export type RepoStatsRowProps = {
  /** Empty string = repo has no detected language; the dot is omitted entirely — never a bare dot. */
  language: string;
  languageColor: string;
  /** null = brand new; the item is omitted entirely — never "0". */
  stars: number | null;
  forks?: number;
  license?: string;
  updatedAgo?: string;
  className?: string;
};

/** "3 days ago" → "updated 3 days ago"; standalone phrases ("just shipped") pass through. */
function updatedLabel(updatedAgo: string): string {
  return updatedAgo.endsWith(' ago') ? `updated ${updatedAgo}` : updatedAgo;
}

export function RepoStatsRow({
  language,
  languageColor,
  stars,
  forks,
  license,
  updatedAgo,
  className,
}: RepoStatsRowProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-4 font-mono text-[12.5px] text-muted-foreground tabular-nums',
        className,
      )}
    >
      {language && (
        <LanguageDot language={language} color={languageColor} className="text-[12.5px]" />
      )}
      {stars !== null && (
        <span className="inline-flex animate-number-pop-in items-center gap-[5px]">
          ★ {formatCount(stars)}
        </span>
      )}
      {typeof forks === 'number' && forks > 0 && (
        <span className="inline-flex animate-number-pop-in items-center gap-[5px]">
          ⑂ {formatCount(forks)} forks
        </span>
      )}
      {license && <span>{license}</span>}
      {updatedAgo && <TimeAgo value={updatedLabel(updatedAgo)} className="text-[12.5px]" />}
    </div>
  );
}

import Link from 'next/link';

import { LanguageDot } from '@/components/language-dot';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCount } from '@/lib/format';
import { languageColor } from '@/lib/lang-colors';

export type SearchResultRowProps = {
  name: string;
  href: string;
  repoFullName: string;
  tagline: string | null;
  language: string | null;
  stars: number;
  tags: string[];
};

/** Tags shown inline — enough to recognise the shape of a result, not a tag cloud. */
const ROW_TAG_LIMIT = 4;

/**
 * One search result.
 *
 * Deliberately a ROW, not a ProjectCard. Search returns up to 48 results in
 * relevance order, and a card grid throws that order away — grids are read in
 * two dimensions, so "the best match" stops being a position. Rows keep the
 * ranking legible and let someone scan twenty results without scrolling past
 * six.
 *
 * What was actually wrong with the old rows wasn't the shape, it was that they
 * carried name, repo and tagline and nothing else: no language, no stars, no
 * tags, so there was no way to tell which of twenty results was worth the
 * click. Everything added here was already in the response payload — the
 * projection didn't change.
 */
export function SearchResultRow({
  name,
  href,
  repoFullName,
  tagline,
  language,
  stars,
  tags,
}: SearchResultRowProps) {
  return (
    <li className="group relative flex flex-col gap-1.5 py-3.5">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {/* Stretched link: the whole row is the target, and the tag links
            below sit above it on their own layer (the ProjectCard pattern). */}
        <Link
          href={href}
          className="font-mono text-[15px] font-semibold outline-none transition-colors after:absolute after:inset-0 after:rounded-md group-hover:text-primary focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {name}
        </Link>
        <span className="font-mono text-[12.5px] text-muted-foreground">{repoFullName}</span>
      </div>

      {tagline ? (
        <p className="line-clamp-2 max-w-[62ch] text-[13.5px] text-muted-foreground">{tagline}</p>
      ) : null}

      <div className="tabular-nums relative z-10 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[12px] text-muted-foreground">
        {language ? (
          <LanguageDot
            language={language}
            color={languageColor(language)}
            className="text-[12px]"
          />
        ) : null}
        {/* Absence, never zero — an unstarred repo shows no star count. */}
        {stars > 0 ? <span>★ {formatCount(stars)}</span> : null}
        {tags.slice(0, ROW_TAG_LIMIT).map((tag) => (
          <Link
            key={tag}
            href={`/t/${tag}`}
            className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            #{tag}
          </Link>
        ))}
      </div>
    </li>
  );
}

/** Row-shaped loading placeholder — same rhythm, so results don't shift on arrival. */
export function SearchResultRowSkeleton() {
  return (
    <li aria-hidden="true" className="flex flex-col gap-2 py-3.5">
      <Skeleton className="h-4 w-[38%] bg-surface-2" />
      <Skeleton className="h-3 w-[70%] bg-surface-2" />
      <div className="flex items-center gap-3.5">
        <Skeleton className="h-3 w-16 bg-surface-2" />
        <Skeleton className="h-3 w-10 bg-surface-2" />
        <Skeleton className="h-3 w-24 bg-surface-2" />
      </div>
    </li>
  );
}

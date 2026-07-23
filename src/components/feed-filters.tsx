import type { ReactNode } from 'react';
import { TagChip } from '@/components/tag-chip';
import { cn } from '@/lib/utils';

export type FeedFiltersProps = {
  /** Sort options in display order, e.g. ['recent', 'trending']. */
  sort: string[];
  /** Filterable tags in display order. Rendered clean — no hash prefix. */
  tags: string[];
  activeSort: string;
  activeTag?: string;
  /** Builds the link target for a chip. Pure presentational — chips are links, not buttons. */
  hrefFor: (kind: 'sort' | 'tag', value: string) => string;
  /** Right-docked cluster (e.g. saved/following links). Purely presentational — this component stays data-free. */
  trailing?: ReactNode;
  className?: string;
};

/**
 * FeedFilters — the feed's chip row: sort chips, a 1px separator, then tag
 * chips. All TagChip-composed; active states use the chip's primary-soft
 * treatment. Matches the reference `.feed-filters`.
 */
export function FeedFilters({
  sort,
  tags,
  activeSort,
  activeTag,
  hrefFor,
  trailing,
  className,
}: FeedFiltersProps) {
  return (
    <nav aria-label="feed filters" className={cn('flex flex-wrap items-center gap-2', className)}>
      {sort.map((option) => (
        <TagChip
          key={option}
          tag={option}
          href={hrefFor('sort', option)}
          active={option === activeSort}
        />
      ))}
      <span aria-hidden className="mx-1.5 h-5 w-px bg-border" />
      {tags.map((tag) => (
        <TagChip key={tag} tag={tag} href={hrefFor('tag', tag)} active={tag === activeTag} />
      ))}
      {trailing ? <div className="ml-auto flex items-center gap-3">{trailing}</div> : null}
    </nav>
  );
}

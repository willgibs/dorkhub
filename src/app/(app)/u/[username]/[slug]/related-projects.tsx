import { renderFeedCards } from '@/app/(app)/_feed/render-cards';
import { copy } from '@/lib/copy';
import type { FeedRow } from '@/lib/feed/queries';

export type RelatedProjectsProps = {
  rows: FeedRow[];
};

/**
 * "more like this" section (docs/plans/p2-discovery.md Wave 2A) — takes
 * pre-fetched rows rather than fetching itself: the project page needs the
 * same ids to seed `EngagementProvider` so like/save state hydrates on these
 * cards too, so it fetches once via `getRelatedProjects` and passes the
 * result down. Renders nothing when there's nothing to show (absence rule —
 * no empty section, no header for zero rows).
 */
export function RelatedProjects({ rows }: RelatedProjectsProps) {
  if (rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <p className="font-mono text-[11.5px] tracking-widest text-muted-foreground uppercase">
        <span aria-hidden="true">{'// '}</span>
        {copy.relatedTitle}
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {renderFeedCards(rows, { variant: 'compact' })}
      </div>
    </section>
  );
}

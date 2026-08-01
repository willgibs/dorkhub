import { renderFeedCards } from '@/app/(app)/_feed/render-cards';
import { SectionHead } from '@/components/section-head';
import { copy } from '@/lib/copy';
import type { FeedRow } from '@/lib/feed/queries';

export type RelatedProjectsProps = {
  rows: FeedRow[];
};

/**
 * "more like this" — the page's exit ramp, and on a discovery platform the
 * most valuable thing below a README. Takes pre-fetched rows rather than
 * fetching itself: the project page needs the same ids to seed
 * `EngagementProvider` so like/save state hydrates on these cards too, so it
 * fetches once via `getRelatedProjects` and passes the result down. Renders
 * nothing when there's nothing to show (absence rule — no empty section, no
 * header for zero rows).
 */
export function RelatedProjects({ rows }: RelatedProjectsProps) {
  if (rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      <SectionHead kicker={copy.relatedKicker} title={copy.relatedTitle} note={copy.relatedNote} />
      {/* getRelatedProjects caps at 4 — two even rows, never an orphan. */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {renderFeedCards(rows, { variant: 'compact' })}
      </div>
    </section>
  );
}

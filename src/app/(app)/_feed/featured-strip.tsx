import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { renderFeedCards } from '@/app/(app)/_feed/render-cards';
import { copy } from '@/lib/copy';
import type { FeaturedSlot } from '@/lib/featured/queries';

export type FeaturedStripProps = {
  slots: FeaturedSlot[];
};

/**
 * The featured head over the home feed (P4 L1 — mechanism only; Will
 * hand-places slots, nothing is sold). Real cards, clearly labeled: each
 * carries ProjectCard's `featured` label bar with the slot's sponsor_label
 * or the default `featured` string — the vision's "clearly labeled"
 * requirement lives on the card itself, not in surrounding chrome, so a
 * screenshot of one card is still honest.
 *
 * Renders NOTHING when no slot is active (absence, never a hollow shell).
 * Own EngagementProvider: this strip sits outside FeedSection's provider
 * boundary. Grid classes mirror FeedGrid's exactly.
 */
export function FeaturedStrip({ slots }: FeaturedStripProps) {
  if (slots.length === 0) return null;

  const rows = slots.map((slot) => slot.project);
  const labelBySlotProject = new Map(
    slots.map((slot) => [slot.project.id, slot.sponsorLabel ?? copy.featuredLabel]),
  );

  return (
    <EngagementProvider projectIds={rows.map((row) => row.id)}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {renderFeedCards(rows, {
          variant: 'featured',
          labelTextFor: (row) => labelBySlotProject.get(row.id),
        })}
      </div>
    </EngagementProvider>
  );
}

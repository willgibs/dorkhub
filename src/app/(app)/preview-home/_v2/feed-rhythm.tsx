import { LikeButtonIsland } from '@/app/(app)/_engagement/like-button-island';
import { ProjectCard, type ProjectCardVariant } from '@/components/project-card';
import { copy } from '@/lib/copy';
import type { FeaturedSlot } from '@/lib/featured/queries';
import type { FeedRow } from '@/lib/feed/queries';
import { profileRowToAuthor, projectRowToCard } from '@/lib/projects/map';
import { cn } from '@/lib/utils';

/**
 * Feed v2 rhythm, R2-resolved: lead-span + uniform grid ONLY. The lead card
 * spans two columns (the featured slot when one exists, otherwise the top
 * organic row); the mid-stream "quick hits" strip moved to the discovery
 * band (Will: loved the strip, hated the gallery break). Featured slots
 * keep the P4 inline placement: labeled cells inside the one grid.
 */
export function FeedRhythm({
  rows,
  featured,
}: {
  rows: FeedRow[];
  featured: readonly FeaturedSlot[];
}) {
  const featuredRows = featured.map((slot) => slot.project);
  const featuredIds = new Set(featuredRows.map((row) => row.id));
  const organic = featuredIds.size ? rows.filter((row) => !featuredIds.has(row.id)) : rows;
  const labelBySlotProject = new Map(
    featured.map((slot) => [slot.project.id, slot.sponsorLabel ?? copy.featuredLabel]),
  );

  const ordered: Array<{ row: FeedRow; cardVariant: ProjectCardVariant; label?: string }> = [
    ...featuredRows.map((row) => ({
      row,
      cardVariant: 'featured' as const,
      label: labelBySlotProject.get(row.id),
    })),
    ...organic.map((row) => ({ row, cardVariant: 'feed' as const })),
  ];
  if (ordered.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {ordered.map((cell, i) => {
        const author = profileRowToAuthor(cell.row.profiles);
        return (
          <ProjectCard
            key={cell.row.id}
            project={projectRowToCard(cell.row, author.username)}
            author={author}
            variant={cell.cardVariant}
            labelText={cell.label}
            staggerIndex={i}
            href={`/u/${author.username}/${cell.row.slug}`}
            authorHref={`/u/${author.username}`}
            className={cn(i === 0 && 'sm:col-span-2')}
            likeSlot={
              <LikeButtonIsland
                projectId={cell.row.id}
                initialCount={cell.row.likes_count > 0 ? cell.row.likes_count : null}
              />
            }
          />
        );
      })}
    </div>
  );
}

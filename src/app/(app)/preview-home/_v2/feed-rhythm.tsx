import { LikeButtonIsland } from '@/app/(app)/_engagement/like-button-island';
import { ProjectCard, type ProjectCardVariant } from '@/components/project-card';
import { copy } from '@/lib/copy';
import type { FeaturedSlot } from '@/lib/featured/queries';
import type { FeedRow } from '@/lib/feed/queries';
import { profileRowToAuthor, projectRowToCard } from '@/lib/projects/map';
import { cn } from '@/lib/utils';

/**
 * Feed v2 rhythm (U2 R1): the grid stops being a uniform wall. The lead card
 * spans two columns (a chapter opener — the featured slot when one exists,
 * otherwise the top organic row), and in the `clusters` variant a compact
 * "quick hits" strip breaks the grid mid-stream. Featured slots keep the P4
 * inline placement: labeled cells inside the one grid, never a separate band.
 */
export function FeedRhythm({
  rows,
  featured,
  variant,
}: {
  rows: FeedRow[];
  featured: readonly FeaturedSlot[];
  variant: 'clusters' | 'spans';
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

  const clustered = variant === 'clusters' && ordered.length >= 10;
  const gridHead = clustered ? ordered.slice(0, 6) : ordered;
  const clusterCells = clustered ? ordered.slice(6, 10) : [];
  const gridTail = clustered ? ordered.slice(10) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {gridHead.map((cell, i) => renderCell(cell, i, i === 0))}
      </div>

      {clusterCells.length > 0 ? (
        <div className="edge-highlight flex flex-col gap-3 rounded-lg border bg-surface-2/60 px-5 py-4">
          <p className="font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
            <span aria-hidden="true">{'// '}</span>
            {copy.clusterKicker}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {clusterCells.map((cell, i) =>
              renderCell({ ...cell, cardVariant: 'compact' }, 6 + i, false),
            )}
          </div>
        </div>
      ) : null}

      {gridTail.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gridTail.map((cell, i) => renderCell(cell, 10 + i, false))}
        </div>
      ) : null}
    </div>
  );
}

function renderCell(
  cell: { row: FeedRow; cardVariant: ProjectCardVariant; label?: string },
  staggerIndex: number,
  lead: boolean,
) {
  const author = profileRowToAuthor(cell.row.profiles);
  return (
    <ProjectCard
      key={cell.row.id}
      project={projectRowToCard(cell.row, author.username)}
      author={author}
      variant={cell.cardVariant}
      labelText={cell.label}
      staggerIndex={staggerIndex}
      href={`/u/${author.username}/${cell.row.slug}`}
      authorHref={`/u/${author.username}`}
      className={cn(lead && 'sm:col-span-2')}
      likeSlot={
        <LikeButtonIsland
          projectId={cell.row.id}
          initialCount={cell.row.likes_count > 0 ? cell.row.likes_count : null}
        />
      }
    />
  );
}

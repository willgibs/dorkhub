import { LikeButtonIsland } from '@/app/(app)/_engagement/like-button-island';
import { ProjectCard } from '@/components/project-card';
import { copy } from '@/lib/copy';
import type { FeedRow } from '@/lib/feed/queries';
import { profileRowToAuthor, projectRowToCard } from '@/lib/projects/map';

/**
 * Quick hits — the compact strip Will loved in R2, re-homed as a discovery
 * module (it broke the gallery's rhythm mid-stream). Fed by the 'active'
 * sort (migration 0021): fresh upstream pushes, deliberately distinct from
 * the trending rails around it. Absence rule: no rows, no strip.
 */
export function QuickHits({
  rows,
  showKicker = true,
}: {
  rows: FeedRow[];
  /** Off when a SectionHead already introduces the strip (feed page, R3). */
  showKicker?: boolean;
}) {
  const cells = rows.slice(0, 4);
  if (cells.length === 0) return null;

  return (
    <section className="edge-highlight flex flex-col gap-3 rounded-lg border bg-surface-2/60 px-5 py-4">
      {showKicker ? (
        <p className="font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
          <span aria-hidden="true">{'// '}</span>
          {copy.clusterKicker}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cells.map((row, i) => {
          const author = profileRowToAuthor(row.profiles);
          return (
            <ProjectCard
              key={row.id}
              project={projectRowToCard(row, author.username)}
              author={author}
              variant="compact"
              staggerIndex={i}
              href={`/u/${author.username}/${row.slug}`}
              authorHref={`/u/${author.username}`}
              likeSlot={
                <LikeButtonIsland
                  projectId={row.id}
                  initialCount={row.likes_count > 0 ? row.likes_count : null}
                />
              }
            />
          );
        })}
      </div>
    </section>
  );
}

import Link from 'next/link';

import { LikeButtonIsland } from '@/app/(app)/_engagement/like-button-island';
import { ProjectCard } from '@/components/project-card';
import { TagChip } from '@/components/tag-chip';
import { copy } from '@/lib/copy';
import type { FeedRow } from '@/lib/feed/queries';
import { profileRowToAuthor, projectRowToCard } from '@/lib/projects/map';

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * A horizontal trending rail for one curated tag — real cards, scroll-snap,
 * right-edge fade instead of a scrollbar (u2-rail). Cards are mapped here
 * (not via renderFeedCards) because each cell needs the fixed-width
 * snap-start wrapper classes; at adoption this folds into a
 * renderFeedCards option instead of a second mapping site.
 */
export function TagRail({ tag, rows }: { tag: string; rows: FeedRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <p className="font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
          <span aria-hidden="true">{'// '}</span>
          {copy.railTrendingIn}
        </p>
        <TagChip tag={tag} hashPrefix />
        <Link
          href={`/t/${encodeURIComponent(tag)}`}
          className={`ml-auto rounded-sm font-mono text-xs text-muted-foreground hover:text-foreground ${focusRing}`}
        >
          {copy.railSeeAll} →
        </Link>
      </div>

      <div className="relative">
        <div className="u2-rail -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-1.5">
          {rows.map((row, i) => {
            const author = profileRowToAuthor(row.profiles);
            return (
              <ProjectCard
                key={row.id}
                project={projectRowToCard(row, author.username)}
                author={author}
                staggerIndex={i}
                href={`/u/${author.username}/${row.slug}`}
                authorHref={`/u/${author.username}`}
                className="w-[300px] shrink-0 snap-start"
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-background to-transparent"
        />
      </div>
    </section>
  );
}

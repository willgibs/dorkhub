import type { ReactNode } from 'react';
import { LikeButtonIsland } from '@/app/(app)/_engagement/like-button-island';
import { ProjectCard, type ProjectCardVariant } from '@/components/project-card';
import type { FeedRow } from '@/lib/feed/queries';
import { profileRowToAuthor, projectRowToCard } from '@/lib/projects/map';

export type RenderFeedCardsOptions = {
  /** Card variant for every rendered row — defaults to 'feed' (today's exact look). */
  variant?: ProjectCardVariant;
  /**
   * Per-row label bar text (featured variant only — e.g. a slot's
   * sponsor_label). Kept here so featured placement rides this exact core
   * instead of hand-mirroring the card markup.
   */
  labelTextFor?: (row: FeedRow) => string | undefined;
  /**
   * Added to each row's staggerIndex. When one grid is composed from two
   * renderFeedCards calls (featured head + organic, P4 inline placement),
   * the second call passes the first's length so the entrance stagger reads
   * as one continuous sweep instead of restarting mid-grid.
   */
  staggerOffset?: number;
};

/**
 * Shared row -> ProjectCard rendering core (M5 decision 4/7) — used by both
 * `feed-section.tsx` (page 1, server-rendered) and `actions.ts`
 * (`loadMoreFeed`, server action) so the two can never drift in markup.
 * Server-only module (no 'use client'): it renders `ProjectCard` (a server
 * component) with a `LikeButtonIsland` (client) dropped into its `likeSlot`.
 * Cards keep like-only (docs/plans/m5-discovery.md scope cut) — save UI
 * lives on the project detail page only, wired up separately in Wave 3C.
 */
export function renderFeedCards(rows: FeedRow[], opts?: RenderFeedCardsOptions): ReactNode {
  const variant = opts?.variant ?? 'feed';
  return (
    <>
      {rows.map((row, i) => {
        const author = profileRowToAuthor(row.profiles);
        const project = projectRowToCard(row, author.username);
        return (
          <ProjectCard
            key={row.id}
            project={project}
            author={author}
            variant={variant}
            labelText={opts?.labelTextFor?.(row)}
            staggerIndex={i + (opts?.staggerOffset ?? 0)}
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
    </>
  );
}

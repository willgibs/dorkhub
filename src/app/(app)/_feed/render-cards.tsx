import type { ReactNode } from 'react';
import { LikeButtonIsland } from '@/app/(app)/_engagement/like-button-island';
import { ProjectCard } from '@/components/project-card';
import type { FeedRow } from '@/lib/feed/queries';
import { profileRowToAuthor, projectRowToCard } from '@/lib/projects/map';

/**
 * Shared row -> ProjectCard rendering core (M5 decision 4/7) — used by both
 * `feed-section.tsx` (page 1, server-rendered) and `actions.ts`
 * (`loadMoreFeed`, server action) so the two can never drift in markup.
 * Server-only module (no 'use client'): it renders `ProjectCard` (a server
 * component) with a `LikeButtonIsland` (client) dropped into its `likeSlot`.
 * Cards keep like-only (docs/plans/m5-discovery.md scope cut) — save UI
 * lives on the project detail page only, wired up separately in Wave 3C.
 */
export function renderFeedCards(rows: FeedRow[]): ReactNode {
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
    </>
  );
}

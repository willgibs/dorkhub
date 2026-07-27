import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { FollowButtonIsland } from '@/app/(app)/_engagement/follow-button-island';
import { LikeButtonIsland } from '@/app/(app)/_engagement/like-button-island';
import { EmptyState } from '@/components/empty-state';
import { PageShell } from '@/components/page-shell';
import { ProfileHeader, type ProfileLink } from '@/components/profile-header';
import { ProjectCard } from '@/components/project-card';
import { Badge } from '@/components/ui/badge';
import { copy } from '@/lib/copy';
import { projectRowToCard } from '@/lib/projects/map';
import { supabaseAnon } from '@/lib/supabase/clients';
import type { Tables } from '@/lib/supabase/types';

/**
 * ISR (docs/architecture.md, "Feed & caching"): fetched via the cookie-LESS
 * anon client so this page stays static/cacheable; per-user state (none yet —
 * follow interactions land in M5) would be a client-island overlay, never a
 * reason to switch this to the cookie-bound client.
 */
export const revalidate = 300;

type ProfileRow = Tables<'profiles'>;

const getProfile = cache(async (username: string): Promise<ProfileRow | null> => {
  const supabase = supabaseAnon();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username) // citext column — case-insensitive match
    .maybeSingle();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return {};
  return {
    title: profile.display_name ?? `@${profile.username}`,
    description: profile.bio ?? undefined,
  };
}

/** Guards the jsonb `links` column into ProfileHeader's {label,href}[] shape — omits anything malformed. */
function parseProfileLinks(links: ProfileRow['links']): ProfileLink[] | undefined {
  if (!Array.isArray(links)) return undefined;
  const parsed = links.filter((link): link is ProfileLink => {
    if (typeof link !== 'object' || link === null) return false;
    const record = link as Record<string, unknown>;
    return typeof record.label === 'string' && typeof record.href === 'string';
  });
  return parsed.length > 0 ? parsed : undefined;
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const supabase = supabaseAnon();
  const { data: projectRows } = await supabase
    .from('projects')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('status', 'published')
    .order('sort_order', { ascending: true });

  // Public lists only — this page renders via the anon client for
  // cacheability, and the explicit is_public filter is belt-and-suspenders on
  // top of the RLS select policy (same style as the published filter above).
  const { data: listRows } = await supabase
    .from('collections')
    .select('name, slug, description, collection_items(count)')
    .eq('profile_id', profile.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  const lists = (listRows ?? []).map((row) => ({
    name: row.name,
    slug: row.slug,
    description: row.description,
    // PostgREST count aggregate arrives as a one-element array (probed live, P3-A).
    itemCount: (row.collection_items as unknown as Array<{ count: number }>)[0]?.count ?? 0,
  }));

  // Keeps both the ProjectCard model AND the raw row (id/likes_count) around
  // per item — the card model alone can't back a LikeButtonIsland, which
  // needs the project id and the DB-trigger-maintained count directly.
  const projectItems = (projectRows ?? []).map((row) => ({
    row,
    card: projectRowToCard(row, profile.username),
  }));

  const author = {
    username: profile.username,
    displayName: profile.display_name ?? profile.username,
    bio: profile.bio ?? '',
    initial: (profile.display_name ?? profile.username).charAt(0).toLowerCase(),
    projects: projectItems.length,
    followers: profile.followers_count,
  };

  return (
    <EngagementProvider projectIds={projectItems.map(({ row }) => row.id)} followeeId={profile.id}>
      <PageShell className="flex flex-col gap-8 py-10">
        {profile.user_id === null ? (
          <Badge
            variant="outline"
            className="w-fit font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
          >
            curated by dorkhub from public github data · not yet claimed
          </Badge>
        ) : null}

        <ProfileHeader
          avatarUrl={profile.avatar_url}
          author={author}
          links={parseProfileLinks(profile.links)}
          followButton={<FollowButtonIsland />}
        />

        {projectItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projectItems.map(({ row, card }, i) => (
              <ProjectCard
                key={card.slug}
                project={card}
                author={author}
                staggerIndex={i}
                href={`/u/${author.username}/${card.slug}`}
                authorHref={`/u/${author.username}`}
                likeSlot={
                  <LikeButtonIsland
                    projectId={row.id}
                    initialCount={row.likes_count > 0 ? row.likes_count : null}
                  />
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState message={copy.profileEmptyProjects} />
        )}

        {/* Public lists — quiet typographic rows, section absent entirely at
            zero (absence, never an empty-state nudge on someone else's page). */}
        {lists.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              {'// '}
              {copy.listsTitle}
            </h2>
            <ul className="flex flex-col gap-2">
              {lists.map((list) => (
                <li key={list.slug} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <Link
                    href={`/u/${author.username}/lists/${list.slug}`}
                    className="rounded-sm font-mono text-[15px] font-semibold outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {list.name}
                  </Link>
                  {list.itemCount > 0 ? (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'}
                    </span>
                  ) : null}
                  {list.description ? (
                    <span className="text-sm text-muted-foreground">{list.description}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </PageShell>
    </EngagementProvider>
  );
}

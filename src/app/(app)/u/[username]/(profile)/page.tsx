import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { FollowButtonIsland } from '@/app/(app)/_engagement/follow-button-island';
import { LikeButtonIsland } from '@/app/(app)/_engagement/like-button-island';
import { type ProfileLink, ProfileMasthead } from '@/app/(app)/u/[username]/profile-masthead';
import { EmptyState } from '@/components/empty-state';
import { ListRow } from '@/components/list-row';
import { PageShell } from '@/components/page-shell';
import { ProjectCard } from '@/components/project-card';
import { SectionHead } from '@/components/section-head';
import { copy } from '@/lib/copy';
import { languageColor } from '@/lib/lang-colors';
import { PROFILE_COLUMNS, type ProfileRow } from '@/lib/profiles/columns';
import { PROJECT_CARD_COLUMNS, projectRowToCard } from '@/lib/projects/map';
import { profilePageJsonLd, serializeJsonLd } from '@/lib/seo/jsonld';
import { supabaseAnon } from '@/lib/supabase/clients';

/**
 * ISR (docs/architecture.md, "Feed & caching"): fetched via the cookie-LESS
 * anon client so this page stays static/cacheable; per-user state (none yet —
 * follow interactions land in M5) would be a client-island overlay, never a
 * reason to switch this to the cookie-bound client.
 *
 * Cookie-free was necessary but NOT sufficient (2026-08-03 cost incident):
 * a dynamic segment with no `generateStaticParams` never enters Next's full
 * route cache, so Vercel served every hit `no-store` and this "ISR" page was
 * re-rendering on each of ~1,000 crawler hits/hour. The params list below is
 * what actually makes the caching real; `dynamicParams` stays default-true so
 * the other ~13,900 profiles still render on demand, and are cached after.
 */
export const revalidate = 3600;

/** The makers with a real body of work — same set the sitemap promotes. */
export async function generateStaticParams(): Promise<Array<{ username: string }>> {
  const { data } = await supabaseAnon()
    .from('profiles')
    .select('username')
    .order('followers_count', { ascending: false })
    .limit(100);
  return (data ?? []).map((row) => ({ username: row.username }));
}

const getProfile = cache(async (username: string): Promise<ProfileRow | null> => {
  const supabase = supabaseAnon();
  const { data } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
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

/** Guards the jsonb `links` column into the masthead's {label,href}[] shape — omits anything malformed. */
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
  // Card projection + id (EngagementProvider/LikeButtonIsland need the id and
  // the trigger-maintained likes_count) — never select('*') on a card-only
  // surface, which drags readme_html (~8.4 KB/row) into every profile render.
  const { data: projectRows } = await supabase
    .from('projects')
    .select(`id, ${PROJECT_CARD_COLUMNS}`)
    .eq('profile_id', profile.id)
    .eq('status', 'published')
    .order('sort_order', { ascending: true });

  // Public lists only — this page renders via the anon client for
  // cacheability, and the explicit is_public filter is belt-and-suspenders on
  // top of the RLS select policy (same style as the published filter above).
  // Item counts count VISIBLE members only (P3-D): the id-only
  // `projects!inner` embed runs under RLS, so an unpublished member drops
  // out of the count exactly as it drops off the list page.
  const { data: listRows } = await supabase
    .from('collections')
    .select(
      'name, slug, description, collection_items(projects!collection_items_project_id_fkey!inner(id))',
    )
    .eq('profile_id', profile.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  const lists = (listRows ?? []).map((row) => ({
    name: row.name,
    slug: row.slug,
    description: row.description,
    itemCount: (row.collection_items as unknown as Array<{ projects: { id: string } }>).length,
  }));

  // Keeps both the ProjectCard model AND the raw row (id/likes_count) around
  // per item — the card model alone can't back a LikeButtonIsland, which
  // needs the project id and the DB-trigger-maintained count directly.
  const projectItems = (projectRows ?? []).map((row) => ({
    row,
    card: projectRowToCard(row, profile.username),
  }));

  // Derived from the rows already fetched for the grid — the "what are they
  // into" signals cost no extra query. Languages are ranked by how many
  // projects use them, capped at the three that actually say something.
  //
  // Tallied CASE-INSENSITIVELY: GitHub hands back both "Vim script" and "Vim
  // Script" (345 rows in prod, plus Matlab/MATLAB), which a naive tally lists
  // as two separate languages side by side. The most common spelling wins the
  // label; `languageColor` already lowercases, so colours were never affected.
  const languageTally = new Map<string, { total: number; spellings: Map<string, number> }>();
  let totalStars = 0;
  for (const { row } of projectItems) {
    totalStars += row.stars_count ?? 0;
    const language = row.primary_language;
    if (!language) continue;
    const key = language.toLowerCase();
    const entry = languageTally.get(key) ?? { total: 0, spellings: new Map<string, number>() };
    entry.total += 1;
    entry.spellings.set(language, (entry.spellings.get(language) ?? 0) + 1);
    languageTally.set(key, entry);
  }
  const languages = [...languageTally.entries()]
    .sort(([keyA, a], [keyB, b]) => b.total - a.total || keyA.localeCompare(keyB))
    .slice(0, 3)
    .map(([key, entry]) => {
      const [name] = [...entry.spellings.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      )[0];
      return { name, color: languageColor(key) };
    });

  const author = {
    username: profile.username,
    displayName: profile.display_name ?? profile.username,
    bio: profile.bio ?? '',
    initial: (profile.display_name ?? profile.username).charAt(0).toLowerCase(),
    projects: projectItems.length,
    followers: profile.followers_count,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes `<`; content is our own structured data.
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            profilePageJsonLd({
              username: profile.username,
              displayName: profile.display_name,
              avatarUrl: profile.avatar_url,
            }),
          ),
        }}
      />

      <EngagementProvider
        projectIds={projectItems.map(({ row }) => row.id)}
        followeeId={profile.id}
      >
        <ProfileMasthead
          username={profile.username}
          displayName={author.displayName}
          avatarUrl={profile.avatar_url}
          bio={profile.bio}
          links={parseProfileLinks(profile.links)}
          followers={profile.followers_count}
          projectCount={projectItems.length}
          totalStars={totalStars}
          languages={languages}
          githubUsername={profile.github_username}
          unclaimed={profile.user_id === null}
          followButton={<FollowButtonIsland />}
        />

        <PageShell className="flex flex-col gap-16 py-10 sm:gap-20">
          <section className="flex flex-col gap-6">
            <SectionHead kicker={copy.profileProjectsKicker} title={copy.profileProjectsTitle} />
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
                    // No lead-span here on purpose: the gallery's opening beat
                    // is a feed rhythm. A maker's work reads as a body of work
                    // when the cards are equal — spanning the first one just
                    // blew its 2:1 media up to twice the height of its
                    // neighbour and looked accidental.
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
          </section>

          {/* Public lists — absent entirely at zero (never an empty-state nudge
              on someone else's page). */}
          {lists.length > 0 ? (
            <section className="flex flex-col gap-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionHead kicker={copy.profileListsKicker} title={copy.profileListsTitle} />
                <Link
                  href={`/u/${author.username}/lists`}
                  className="rounded-sm font-mono text-[12.5px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {copy.profileListsAll}
                </Link>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {lists.map((list) => (
                  <ListRow
                    key={list.slug}
                    name={list.name}
                    href={`/u/${author.username}/lists/${list.slug}`}
                    description={list.description}
                    itemCount={list.itemCount}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </PageShell>
      </EngagementProvider>
    </>
  );
}

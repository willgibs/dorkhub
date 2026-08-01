import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { FollowButtonIsland } from '@/app/(app)/_engagement/follow-button-island';
import { LikeButtonIsland } from '@/app/(app)/_engagement/like-button-island';
import { ReportButtonIsland } from '@/app/(app)/_engagement/report-button-island';
import { SaveButtonIsland } from '@/app/(app)/_engagement/save-button-island';
import { AddToListControl } from '@/app/(app)/_lists/add-to-list-control';
import { refreshProjectFromGithub, setProjectStatus } from '@/app/(app)/settings/projects/actions';
import { MakerCard } from '@/app/(app)/u/[username]/[slug]/maker-card';
import { ProjectMasthead } from '@/app/(app)/u/[username]/[slug]/project-masthead';
import { ProjectVitals } from '@/app/(app)/u/[username]/[slug]/project-vitals';
import { ReadmeContents } from '@/app/(app)/u/[username]/[slug]/readme-contents';
import { RelatedProjects } from '@/app/(app)/u/[username]/[slug]/related-projects';
import { EmptyState } from '@/components/empty-state';
import { MarkdownProse } from '@/components/markdown-prose';
import { PageShell } from '@/components/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { PROFILE_COLUMNS, type ProfileRow } from '@/lib/profiles/columns';
import { formatUpdatedAgo, type ProjectRow } from '@/lib/projects/map';
import { buildReadmeOutline } from '@/lib/readme/outline';
import { getRelatedProjects } from '@/lib/related/queries';
import { serializeJsonLd, softwareSourceCodeJsonLd } from '@/lib/seo/jsonld';
import { supabaseServer } from '@/lib/supabase/clients';
import { cn } from '@/lib/utils';

/**
 * This revalidate is inert today: `supabaseServer()`'s `cookies()` read
 * forces dynamic rendering, so the page is never actually served from the ISR
 * cache. It documents intent for a future caching pass (docs/state.md).
 * Using the cookie-bound client here is deliberate: RLS "published-or-own"
 * shows owners their fresh drafts for free (decision 4,
 * docs/plans/m4-projects.md).
 *
 * NOTE (P2.7): an earlier version of this comment credited SiteHeaderSession
 * — a component that no longer exists; the (app) layout is cookie-free and
 * its auth slot is a client island. The page is per-viewer (owners see
 * drafts), so if a caching pass ever swaps this read to `supabaseAnon()` it
 * MUST drop `revalidate` or add `force-dynamic` first, or one viewer's
 * render can be served to another. The two lists pages took the explicit
 * `force-dynamic` route for exactly this reason.
 */
export const revalidate = 300;

type PageData = {
  profile: ProfileRow;
  project: ProjectRow;
  isOwner: boolean;
};

const getPageData = cache(async (username: string, slug: string): Promise<PageData | null> => {
  const supabase = await supabaseServer();

  const [{ data: claimsData }, { data: profile }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from('profiles').select(PROFILE_COLUMNS).eq('username', username).maybeSingle(),
  ]);

  if (!profile) return null;

  // RLS "published-or-own" already hides other people's drafts — no status
  // filter needed in app code; owners see their own fresh drafts for free.
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('slug', slug)
    .maybeSingle();

  if (!project) return null;

  const isOwner = Boolean(profile.user_id) && claimsData?.claims?.sub === profile.user_id;

  return { profile, project, isOwner };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}): Promise<Metadata> {
  const { username, slug } = await params;
  const data = await getPageData(username, slug);
  if (!data) return {};
  return {
    title: data.project.name,
    description: data.project.tagline ?? undefined,
  };
}

const linkFocusRing =
  'rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const data = await getPageData(username, slug);
  if (!data) notFound();

  const { profile, project, isOwner } = data;
  const displayName = profile.display_name ?? profile.username;

  // Heading ids + repaired in-page anchors, and the outline that feeds the
  // reading rail. Runs on the stored HTML at render time because re-rendering
  // 16.9k READMEs would mean re-fetching every one of them from GitHub —
  // see src/lib/readme/outline.ts for the three defects this closes.
  const readme = project.readme_html
    ? buildReadmeOutline(project.readme_html, { titleHint: project.name })
    : null;

  // Drafts get no related fetch at all — the rail is gated on published
  // (docs/plans/p2-discovery.md decision 5). Fetched once here (not inside
  // the section component) so the resulting ids can also seed
  // EngagementProvider — otherwise like/save state wouldn't hydrate on the
  // related cards.
  const relatedRows =
    project.status === 'published'
      ? await getRelatedProjects(project.id, project.tags, project.primary_language)
      : [];

  const engagementProjectIds = [project.id, ...relatedRows.map((row) => row.id)];

  return (
    <>
      {/* JSON-LD (P4 L3) — published pages only; a draft is an owner-only
          view with no business emitting public structured data. Kept OUTSIDE
          the client provider: a <script> under a client component is
          server-rendered fine but React re-renders it inert on the client and
          warns about it, which was four console errors on every project page. */}
      {project.status === 'published' ? (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes `<`; content is our own structured data.
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              softwareSourceCodeJsonLd({
                name: project.name,
                tagline: project.tagline,
                username: profile.username,
                slug: project.slug,
                repoUrl: project.repo_url,
                primaryLanguage: project.primary_language,
                license: project.license,
                githubPushedAt: project.github_pushed_at,
                authorDisplayName: profile.display_name,
              }),
            ),
          }}
        />
      ) : null}

      <EngagementProvider projectIds={engagementProjectIds} followeeId={profile.id}>
        <ProjectMasthead
          name={project.name}
          slug={project.slug}
          tagline={project.tagline}
          tags={project.tags}
          username={profile.username}
          repoUrl={project.repo_url}
          repoFullName={project.repo_full_name}
          demoUrl={project.demo_url}
          vitals={
            <ProjectVitals
              stars={project.stars_count}
              forks={project.forks_count}
              license={project.license}
              language={project.primary_language}
              // `github_pushed_at`, not projects.updated_at (P3-B D21) — the
              // latter bumps on our own sync writes, so every project claimed to
              // be freshly updated. Absent until re-fetched since 0011.
              pushedAgo={
                project.github_pushed_at ? formatUpdatedAgo(project.github_pushed_at) : null
              }
            />
          }
          engagement={
            <>
              <LikeButtonIsland
                projectId={project.id}
                initialCount={project.likes_count > 0 ? project.likes_count : null}
              />
              <SaveButtonIsland
                projectId={project.id}
                initialCount={project.saves_count > 0 ? project.saves_count : null}
              />
              {/* Owners get this too — listing your own work is normal (P3-A) —
                but only once published: collection_items_insert_own (0010)
                requires a published target, so on a draft every toggle is
                rejected by RLS with no path to success. Same publish gate the
                related-projects rail uses.

                The GLOBAL lists_count deliberately does NOT render here:
                AddToListControl's trigger shows the viewer's OWN membership in
                this exact spot, and two similar counts side by side ("in 23
                lists" vs "in 2 lists") read as a contradiction. The global
                discovery signal still ships on ProjectCard, where browsing
                happens. */}
              {project.status === 'published' ? <AddToListControl projectId={project.id} /> : null}
              {!isOwner ? <ReportButtonIsland projectId={project.id} /> : null}
            </>
          }
          ownerBar={
            isOwner ? (
              <div className="flex flex-wrap items-center gap-3">
                {project.status === 'draft' ? (
                  <Badge
                    variant="outline"
                    className="w-fit font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
                  >
                    {copy.projectDraftBadge}
                  </Badge>
                ) : null}

                {/* Plain server-rendered forms are deliberate here (no client
                  island): a throttled/failed refresh just silently no-ops on
                  this surface — /settings/projects is the full-feedback one. */}
                <form action={setProjectStatus}>
                  <input type="hidden" name="project_id" value={project.id} />
                  <input
                    type="hidden"
                    name="intent"
                    value={project.status === 'draft' ? 'publish' : 'unpublish'}
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    {project.status === 'draft' ? copy.actionPublish : copy.actionUnpublish}
                  </Button>
                </form>

                <form action={refreshProjectFromGithub}>
                  <input type="hidden" name="project_id" value={project.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    {copy.actionRefresh}
                  </Button>
                </form>

                <Link
                  href="/settings/projects"
                  className={cn(
                    'font-mono text-[12.5px] text-muted-foreground transition-colors hover:text-foreground',
                    linkFocusRing,
                  )}
                >
                  {copy.projectManageInSettings}
                </Link>
              </div>
            ) : undefined
          }
        />

        <PageShell className="flex flex-col gap-16 py-10 sm:gap-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            {/* READING COLUMN (P3-B). The locked reference
              (explorations/05-quiet-dev-native.html) sets `.project-page` to a
              780px measure; shipping it at the full 1120px shell width put
              README prose at ~122 characters per line, roughly double a
              comfortable measure. The width the measure gives back is now the
              reading rail rather than empty margin. */}
            <div className="min-w-0 flex-1 lg:max-w-[780px]">
              {readme ? (
                <MarkdownProse
                  html={readme.html}
                  label="README.md"
                  forkHref={`${project.repo_url}/fork`}
                />
              ) : (
                <EmptyState message={copy.projectNoReadme} />
              )}
            </div>

            {/* Reading companion. Sticky only where there's a column to spare;
              on narrow screens it falls below the README (the maker is still
              one tap from the masthead's @handle) and the contents list is
              dropped entirely — a 26-item outline above a phone-width README
              is a second wall, not navigation. */}
            <aside className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--header-offset)+16px)] lg:w-[260px] lg:shrink-0">
              <MakerCard
                username={profile.username}
                displayName={displayName}
                avatarUrl={profile.avatar_url}
                bio={profile.bio}
                followers={profile.followers_count}
                unclaimed={profile.user_id === null}
                followButton={<FollowButtonIsland />}
              />
              {readme ? (
                <ReadmeContents headings={readme.headings} className="hidden lg:flex" />
              ) : null}
            </aside>
          </div>

          <RelatedProjects rows={relatedRows} />
        </PageShell>
      </EngagementProvider>
    </>
  );
}

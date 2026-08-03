import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { FollowButtonIsland } from '@/app/(app)/_engagement/follow-button-island';
import { LikeButtonIsland } from '@/app/(app)/_engagement/like-button-island';
import { ReportButtonIsland } from '@/app/(app)/_engagement/report-button-island';
import { SaveButtonIsland } from '@/app/(app)/_engagement/save-button-island';
import { AddToListControl } from '@/app/(app)/_lists/add-to-list-control';
import { MakerCard } from '@/app/(app)/u/[username]/[slug]/maker-card';
import { ProjectMasthead } from '@/app/(app)/u/[username]/[slug]/project-masthead';
import { ProjectOwnerBar } from '@/app/(app)/u/[username]/[slug]/project-owner-bar';
import { ProjectVitals } from '@/app/(app)/u/[username]/[slug]/project-vitals';
import { ReadmeContents } from '@/app/(app)/u/[username]/[slug]/readme-contents';
import { RelatedProjects } from '@/app/(app)/u/[username]/[slug]/related-projects';
import { EmptyState } from '@/components/empty-state';
import { MarkdownProse } from '@/components/markdown-prose';
import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import { PROFILE_COLUMNS, type ProfileRow } from '@/lib/profiles/columns';
import { formatUpdatedAgo, type ProjectRow } from '@/lib/projects/map';
import { buildReadmeOutline } from '@/lib/readme/outline';
import { getRelatedProjects } from '@/lib/related/queries';
import { serializeJsonLd, softwareSourceCodeJsonLd } from '@/lib/seo/jsonld';
import { supabaseAnon } from '@/lib/supabase/clients';

/**
 * Cacheable since 2026-08-03 (cost incident). This page used to read cookies
 * via `supabaseServer()` so that RLS "published-or-own" could show an owner
 * their own drafts — which made `revalidate` inert, because a cookie read
 * forces dynamic rendering. At 16,972 project pages that meant a full render
 * of a ~15 KB README on every crawler hit, forever.
 *
 * It now reads through the cookie-LESS anon client and is genuinely cached.
 * The consequence, taken deliberately: a DRAFT's public URL 404s instead of
 * previewing for its owner. Drafts are managed and previewed at
 * /settings/projects, which was already the full-feedback surface for exactly
 * this. Owner controls for PUBLISHED projects survive as a client island
 * (`ProjectOwnerBar`), which is the same shape as every other per-viewer bit
 * on this page (like, save, add-to-list, report).
 *
 * The old note here warned that swapping to `supabaseAnon()` without dropping
 * `revalidate` could serve one viewer's render to another. That hazard is
 * exactly what this change removes: with no cookie read there is no
 * per-viewer render left to leak.
 *
 * `generateStaticParams` is what actually puts the route in Next's cache — a
 * dynamic segment without one is served `no-store` no matter how cookie-free
 * it is. The list is small on purpose; `dynamicParams` stays default-true, so
 * the other ~16,900 projects render on demand and are cached from then on.
 */
export const revalidate = 3600;

export async function generateStaticParams(): Promise<Array<{ username: string; slug: string }>> {
  const { data } = await supabaseAnon()
    .from('projects')
    .select('slug, profiles!projects_profile_id_fkey!inner(username)')
    .eq('status', 'published')
    .order('trending_score', { ascending: false })
    .limit(100);
  return (data ?? []).map((row) => ({
    username: (row.profiles as unknown as { username: string }).username,
    slug: row.slug,
  }));
}

type PageData = {
  profile: ProfileRow;
  project: ProjectRow;
};

const getPageData = cache(async (username: string, slug: string): Promise<PageData | null> => {
  const supabase = supabaseAnon();

  const { data: profile } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('username', username)
    .maybeSingle();

  if (!profile) return null;

  // Explicitly published-only. Anon RLS enforces this anyway, but stating it
  // here is what documents that a draft 404s on its public URL by design —
  // the page is one shared cached render, so there is no viewer to show it to.
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!project) return null;

  return { profile, project };
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

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const data = await getPageData(username, slug);
  if (!data) notFound();

  const { profile, project } = data;
  const displayName = profile.display_name ?? profile.username;

  // Heading ids + repaired in-page anchors, and the outline that feeds the
  // reading rail. Runs on the stored HTML at render time because re-rendering
  // 16.9k READMEs would mean re-fetching every one of them from GitHub —
  // see src/lib/readme/outline.ts for the three defects this closes.
  const readme = project.readme_html
    ? buildReadmeOutline(project.readme_html, { titleHint: project.name })
    : null;

  // Fetched here rather than inside the section component so the resulting
  // ids can also seed EngagementProvider — otherwise like/save state wouldn't
  // hydrate on the related cards. (The old published-only gate is gone with
  // the drafts: only published projects reach this page at all now.)
  const relatedRows = await getRelatedProjects(project.id, project.tags, project.primary_language);

  const engagementProjectIds = [project.id, ...relatedRows.map((row) => row.id)];

  return (
    <>
      {/* JSON-LD (P4 L3). Kept OUTSIDE the client provider: a <script> under a
          client component is server-rendered fine but React re-renders it
          inert on the client and warns about it, which was four console
          errors on every project page. */}
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
              <AddToListControl projectId={project.id} />
              <ReportButtonIsland projectId={project.id} ownerUsername={profile.username} />
            </>
          }
          ownerBar={<ProjectOwnerBar projectId={project.id} ownerUsername={profile.username} />}
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

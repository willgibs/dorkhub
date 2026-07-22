import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { CopyButton } from '@/components/copy-button';
import { EmptyState } from '@/components/empty-state';
import { MarkdownProse } from '@/components/markdown-prose';
import { PageShell } from '@/components/page-shell';
import { RepoStatsRow } from '@/components/repo-stats-row';
import { StatButton } from '@/components/stat-button';
import { TagChip } from '@/components/tag-chip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { languageColor } from '@/lib/lang-colors';
import { formatUpdatedAgo, type ProjectRow } from '@/lib/projects/map';
import { supabaseServer } from '@/lib/supabase/clients';
import type { Tables } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

/**
 * Tree is already dynamic today — SiteHeaderSession reads cookies on the
 * (app) layout for every page under it — so this revalidate is inert for
 * now. It documents intent for the M5 caching pass (docs/state.md), same as
 * the profile page. Using cookie-bound supabaseServer() here is deliberate
 * in the meantime: RLS "published-or-own" shows owners their fresh drafts
 * for free (decision 4, docs/plans/m4-projects.md).
 */
export const revalidate = 300;

type ProfileRow = Tables<'profiles'>;

type PageData = {
  profile: ProfileRow;
  project: ProjectRow;
  isOwner: boolean;
};

const getPageData = cache(async (username: string, slug: string): Promise<PageData | null> => {
  const supabase = await supabaseServer();

  const [{ data: claimsData }, { data: profile }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from('profiles').select('*').eq('username', username).maybeSingle(),
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
  const initial = displayName.charAt(0).toLowerCase();

  return (
    <PageShell className="flex flex-col gap-8 py-10">
      {isOwner ? (
        <div className="flex flex-wrap items-center gap-3">
          {project.status === 'draft' ? (
            <Badge
              variant="outline"
              className="w-fit font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
            >
              {copy.projectDraftBadge}
            </Badge>
          ) : null}
          <Link
            href="/settings/projects"
            className={cn(
              'font-mono text-[12.5px] text-muted-foreground transition-colors hover:text-foreground',
              linkFocusRing,
            )}
          >
            manage in settings
          </Link>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3.5">
          <h1 className="font-display text-[26px] font-extrabold">{project.name}</h1>
          {/* Interactions ship in M5 — the slot is real, the toggle isn't wired up yet. */}
          <StatButton
            kind="like"
            active={false}
            count={project.likes_count > 0 ? project.likes_count : null}
            disabled
          />
        </div>

        {project.tagline ? (
          <p className="max-w-[560px] text-[15px] text-muted-foreground">{project.tagline}</p>
        ) : null}

        <Link
          href={`/u/${profile.username}`}
          className={cn(
            'inline-flex w-fit items-center gap-2 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground',
            linkFocusRing,
          )}
        >
          {profile.avatar_url ? (
            // biome-ignore lint/performance/noImgElement: cost rule — user images never go through the image optimizer (docs/architecture.md)
            <img
              src={profile.avatar_url}
              alt=""
              width={24}
              height={24}
              className="size-6 flex-none rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-6 flex-none items-center justify-center rounded-full bg-primary-soft font-mono text-[11px] font-bold text-primary"
            >
              {initial}
            </span>
          )}
          {displayName}
        </Link>

        <RepoStatsRow
          language={project.primary_language ?? ''}
          languageColor={languageColor(project.primary_language)}
          stars={project.stars_count > 0 ? project.stars_count : null}
          forks={project.forks_count > 0 ? project.forks_count : undefined}
          license={project.license ?? undefined}
          updatedAgo={formatUpdatedAgo(project.updated_at)}
        />

        {project.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <TagChip key={tag} tag={tag} hashPrefix />
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {project.demo_url ? (
            <Button asChild>
              <a href={project.demo_url} target="_blank" rel="noopener">
                visit the demo
              </a>
            </Button>
          ) : null}
          <CopyButton command={`git clone ${project.repo_url}.git`} />
          <a
            href={project.repo_url}
            target="_blank"
            rel="noopener"
            className={cn(
              'font-mono text-[12.5px] text-muted-foreground transition-colors hover:text-foreground',
              linkFocusRing,
            )}
          >
            {project.repo_full_name}
          </a>
        </div>
      </div>

      {project.readme_html ? (
        <MarkdownProse
          html={project.readme_html}
          label="README.md"
          forkHref={`${project.repo_url}/fork`}
        />
      ) : (
        <EmptyState message={copy.projectNoReadme} />
      )}
    </PageShell>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { EmptyState } from '@/components/empty-state';
import { PageShell } from '@/components/page-shell';
import { TimeAgo } from '@/components/time-ago';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { formatUpdatedAgo } from '@/lib/projects/map';
import { canRefreshNow } from '@/lib/projects/throttle';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';

import { refreshProjectFromGithub, reorderProject, setProjectStatus } from './actions';
import { DeleteProjectButton } from './delete-button';
import { EditProjectForm } from './edit-form';

export const metadata: Metadata = { title: copy.settingsProjectsTitle };

export default async function SettingsProjectsPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin?next=%2Fsettings%2Fprojects');

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id, username')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) redirect('/onboarding');

  // Cookie-bound client under RLS: `projects_select_published_or_own` surfaces
  // this owner's drafts too, no app-level status filter needed.
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: true });

  const rows = projects ?? [];
  const now = new Date();

  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <h1 className="font-display text-[26px] font-extrabold">{copy.settingsProjectsTitle}</h1>

      {rows.length === 0 ? (
        <EmptyState>
          <div className="flex flex-col items-center gap-4">
            <p>{copy.settingsEmptyProjects}</p>
            <Button asChild size="sm">
              <Link href="/new">{copy.ctaPrimary}</Link>
            </Button>
          </div>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((project, index) => {
            const refreshable = canRefreshNow(project.last_synced_at, now);

            return (
              <div
                key={project.id}
                className="edge-highlight flex flex-col gap-4 rounded-lg border bg-card px-[22px] py-[18px]"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/u/${profile.username}/${project.slug}`}
                    className="rounded-sm font-mono text-[15px] font-semibold outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {project.name}
                  </Link>
                  {project.status === 'draft' ? (
                    <Badge
                      variant="outline"
                      className="w-fit font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
                    >
                      {copy.projectDraftBadge}
                    </Badge>
                  ) : null}
                  {project.last_synced_at ? (
                    <TimeAgo
                      value={`synced ${formatUpdatedAgo(project.last_synced_at, now)}`}
                      dateTime={project.last_synced_at}
                    />
                  ) : null}
                </div>

                <EditProjectForm
                  projectId={project.id}
                  tagline={project.tagline ?? ''}
                  tags={project.tags.join(', ')}
                  demoUrl={project.demo_url ?? ''}
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
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
                    <Button type="submit" variant="ghost" size="sm" disabled={!refreshable}>
                      {copy.actionRefresh}
                    </Button>
                  </form>
                  {!refreshable ? (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {copy.projectRefreshThrottled}
                    </span>
                  ) : null}

                  <form action={reorderProject}>
                    <input type="hidden" name="project_id" value={project.id} />
                    <input type="hidden" name="direction" value="up" />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="move up"
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                  </form>
                  <form action={reorderProject}>
                    <input type="hidden" name="project_id" value={project.id} />
                    <input type="hidden" name="direction" value="down" />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="move down"
                      disabled={index === rows.length - 1}
                    >
                      ↓
                    </Button>
                  </form>

                  <DeleteProjectButton projectId={project.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

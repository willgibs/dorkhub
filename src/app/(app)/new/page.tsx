import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/empty-state';
import { PageShell } from '@/components/page-shell';
import { githubIdentity } from '@/lib/auth/identity';
import { copy } from '@/lib/copy';
import { listPublicRepos, MAX_LIST_PAGES } from '@/lib/github/client';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';
import { type PickerRepo, RepoPicker } from './repo-picker';

export const metadata: Metadata = { title: copy.newTitle };

// listPublicRepos pages at 100/page (src/lib/github/client.ts) up to
// MAX_LIST_PAGES, then simply stops — mirror the math here so we can tell a
// caller "showing your 500 most recent" apart from "that's really all of them".
const REPOS_PER_PAGE = 100;
const REPO_LIST_CAP = MAX_LIST_PAGES * REPOS_PER_PAGE;

function NewPageHeader({ truncated = false }: { truncated?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        <span aria-hidden="true">{'// '}</span>new
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold">{copy.newTitle}</h1>
      <p className="mt-2 text-muted-foreground">{copy.newSubtitle}</p>
      {truncated ? (
        <p className="mt-1 font-mono text-[12.5px] text-muted-foreground">
          {copy.newRepoListTruncated}
        </p>
      ) : null}
    </div>
  );
}

export default async function NewProjectPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Defense-in-depth — src/proxy.ts already gates /new behind a session.
  if (!user) redirect('/auth/signin?next=%2Fnew');

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id, username')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) redirect('/onboarding');

  const login = githubIdentity(user)?.login;
  if (!login) {
    return (
      <PageShell className="flex flex-col gap-8 py-10">
        <NewPageHeader />
        <EmptyState message={copy.error} />
      </PageShell>
    );
  }

  // GithubConfigError (missing GITHUB_TOKEN) must degrade to the quiet empty
  // state, not a 500 — env misconfiguration is ours to notice in logs, not
  // the user's to hit as a crash.
  let result: Awaited<ReturnType<typeof listPublicRepos>>;
  try {
    result = await listPublicRepos(login);
  } catch (err) {
    console.error('[new] repo listing unavailable:', err);
    return (
      <PageShell className="flex flex-col gap-8 py-10">
        <NewPageHeader />
        <EmptyState message={copy.newRepoUnavailable} />
      </PageShell>
    );
  }

  if (result.kind !== 'ok') {
    return (
      <PageShell className="flex flex-col gap-8 py-10">
        <NewPageHeader />
        <EmptyState message={copy.newRepoUnavailable} />
      </PageShell>
    );
  }

  const repos = result.data;

  if (repos.length === 0) {
    return (
      <PageShell className="flex flex-col gap-8 py-10">
        <NewPageHeader />
        <EmptyState message={copy.newNoRepos} />
      </PageShell>
    );
  }

  // Drafts belonging to OTHER users still make a repo "taken" from this
  // picker's point of view, so this has to read through the service-role
  // client — supabaseServer()'s RLS ("published-or-own") would silently hide
  // everyone else's draft rows and let two people pick the same repo.
  const repoIds = repos.map((repo) => repo.id);
  const { data: existingRows } = await service
    .from('projects')
    .select('github_repo_id, profile_id, slug')
    .in('github_repo_id', repoIds);
  const existingByRepoId = new Map((existingRows ?? []).map((row) => [row.github_repo_id, row]));

  const pickerRepos: PickerRepo[] = repos.map((repo) => {
    const existing = existingByRepoId.get(repo.id);
    const status: PickerRepo['status'] = !existing
      ? 'available'
      : existing.profile_id === profile.id
        ? 'yours'
        : 'taken';
    return {
      repoId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
      fork: repo.fork,
      archived: repo.archived,
      status,
      existingSlug: status === 'yours' ? existing?.slug : undefined,
    };
  });

  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <NewPageHeader truncated={repos.length >= REPO_LIST_CAP} />
      <RepoPicker repos={pickerRepos} username={profile.username} />
    </PageShell>
  );
}

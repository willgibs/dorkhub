'use server';

import { redirect } from 'next/navigation';
import { copy } from '@/lib/copy';
import { getRepoById } from '@/lib/github/client';
import { syncProject } from '@/lib/github/sync';
import { isValidDemoUrl } from '@/lib/projects/fields';
import { generateProjectSlug } from '@/lib/projects/slug';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';

export type CreateProjectState = { error: string } | null;

/** GitHub's SPDX id for "no machine-detectable license" — not a real license, normalize to null (mirrors src/lib/github/sync.ts). */
const NOASSERTION = 'NOASSERTION';

/**
 * Creates a draft project from one of the caller's own public GitHub repos.
 *
 * Structure mirrors onboarding/actions.ts `createProfile` exactly (auth →
 * identity/ownership → validate → service write → redirect). Service role is
 * required: `projects.INSERT` has no RLS path for authenticated users (see
 * docs/plans/m4-projects.md, design decision #5) — repo metadata can only
 * ever come from a fresh, server-verified GitHub fetch, never trusted from
 * client input.
 */
export async function createProject(
  _prev: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin?next=%2Fnew');

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id, username, github_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) redirect('/onboarding');

  const repoId = Number(formData.get('repo_id'));
  if (!Number.isSafeInteger(repoId) || repoId <= 0) {
    return { error: copy.newRepoUnavailable };
  }

  // Always re-fetch fresh — never trust the repo metadata the picker rendered
  // client-side (it's already minutes old by the time a form submits, and it
  // was never authenticated as belonging to this caller in the first place).
  let repoResult: Awaited<ReturnType<typeof getRepoById>>;
  try {
    repoResult = await getRepoById(repoId);
  } catch (err) {
    // GithubConfigError (missing GITHUB_TOKEN) → quiet error, loud log.
    console.error('[new] repo fetch unavailable:', err);
    return { error: copy.newRepoUnavailable };
  }
  if (repoResult.kind !== 'ok') {
    return { error: copy.newRepoUnavailable };
  }
  const repo = repoResult.data;

  // Numeric-id ownership check ONLY — logins are mutable and re-registerable
  // (see src/lib/auth/identity.ts), so they're never a valid ownership key.
  if (repo.owner.id !== profile.github_id) {
    return { error: copy.newRepoNotYours };
  }
  // Belt+braces: a public-repo-scoped PAT should never even be able to see a
  // private repo, but never lean on that upstream guarantee blindly.
  if (repo.private) {
    return { error: copy.newRepoUnavailable };
  }

  const { data: existingSlugRows } = await service
    .from('projects')
    .select('slug')
    .eq('profile_id', profile.id);
  const existingSlugs = new Set((existingSlugRows ?? []).map((row) => row.slug));
  const slug = generateProjectSlug(repo.name, existingSlugs);

  const { data: maxSortRow } = await service
    .from('projects')
    .select('sort_order')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (maxSortRow?.sort_order ?? -1) + 1;

  // homepage may be '', a bare host, or http:// — only ever prefill a demo
  // link we're willing to render as a live CTA (see decision #7: sync never
  // touches this field again after creation).
  const demoUrl = repo.homepage && isValidDemoUrl(repo.homepage) ? repo.homepage : null;
  const license = repo.license?.spdx_id === NOASSERTION ? null : (repo.license?.spdx_id ?? null);

  const { data: inserted, error: insertError } = await service
    .from('projects')
    .insert({
      profile_id: profile.id,
      slug,
      github_repo_id: repo.id,
      repo_full_name: repo.full_name,
      repo_url: repo.html_url,
      name: repo.name,
      primary_language: repo.language,
      topics: repo.topics,
      demo_url: demoUrl,
      stars_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      license,
      status: 'draft',
      sort_order: sortOrder,
      tags: [],
    })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      // Global unique constraint on github_repo_id: either this is our own
      // double-submit (back button, double-click) — idempotently redirect to
      // the row that already exists — or someone else claimed it first.
      const { data: existing } = await service
        .from('projects')
        .select('profile_id, slug')
        .eq('github_repo_id', repo.id)
        .maybeSingle();
      if (existing?.profile_id === profile.id) {
        redirect(`/u/${profile.username}/${existing.slug}`);
      }
      return { error: copy.newRepoTaken };
    }
    console.error('[new] project insert failed:', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
    });
    return { error: copy.error };
  }

  // Best-effort initial sync — a failure here never blocks project creation.
  // The draft row exists either way, and the daily cron retries stale/failed
  // syncs (docs/plans/m4-projects.md, Wave 3G).
  try {
    await syncProject(inserted.id);
  } catch (err) {
    console.error('[new] initial sync threw:', err);
  }

  // redirect() throws NEXT_REDIRECT — must stay outside any try/catch.
  redirect(`/u/${profile.username}/${slug}`);
}

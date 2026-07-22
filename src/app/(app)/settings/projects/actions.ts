'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { copy } from '@/lib/copy';
import { syncProject } from '@/lib/github/sync';
import { isValidDemoUrl, parseTagsInput } from '@/lib/projects/fields';
import { canRefreshNow } from '@/lib/projects/throttle';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';

/**
 * Security note (docs/plans/m4-projects.md, Wave 3F): every write below goes
 * through the cookie-bound `supabaseServer()` client under RLS
 * (`projects_update_own` / `projects_delete_own` + the column grants on
 * exactly tagline/description_md/tags/demo_url/screenshots/sort_order/status).
 * RLS is the real enforcement — app-level ownership checks here exist only to
 * produce nicer error copy or to short-circuit before a wasted round trip.
 * The only service-role touch is inside `syncProject` itself (called by
 * `refreshProjectFromGithub`) and the "who am I" profile lookup below, which
 * is a read.
 */

/** Resolves the caller's own profile (service-role read) and a cookie-bound client for writes. */
async function requireOwnProfile(nextPath: string) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/signin?next=${encodeURIComponent(nextPath)}`);

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id, username')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) redirect('/onboarding');

  return { supabase, profile };
}

function revalidateProjectPaths(username: string, slug: string) {
  revalidatePath(`/u/${username}`);
  revalidatePath(`/u/${username}/${slug}`);
}

export type ProjectFieldsState = { error: string } | null;

/** Inline tagline/tags/demo_url save from the settings page (per-card form). */
export async function updateProjectFields(
  _prev: ProjectFieldsState,
  formData: FormData,
): Promise<ProjectFieldsState> {
  const { supabase, profile } = await requireOwnProfile('/settings/projects');

  const projectId = String(formData.get('project_id') ?? '');
  if (!projectId) return { error: copy.error };

  const taglineRaw = String(formData.get('tagline') ?? '').trim();
  if (taglineRaw.length > 120) return { error: 'tagline: 120 characters max' };
  const tagline = taglineRaw.length > 0 ? taglineRaw : null;

  const tags = parseTagsInput(String(formData.get('tags') ?? ''));

  const demoUrlRaw = String(formData.get('demo_url') ?? '').trim();
  let demoUrl: string | null;
  if (demoUrlRaw.length === 0) {
    demoUrl = null;
  } else if (isValidDemoUrl(demoUrlRaw)) {
    demoUrl = demoUrlRaw;
  } else {
    return { error: 'demo links are https-only' };
  }

  const { data: updated, error: updateError } = await supabase
    .from('projects')
    .update({ tagline, tags, demo_url: demoUrl })
    .eq('id', projectId)
    .select('slug')
    .maybeSingle();

  // Zero rows affected covers both a bad id and RLS blocking a non-owner —
  // either way there's nothing more specific we can (or should) say.
  if (updateError || !updated) {
    if (updateError) {
      console.error('[settings/projects] updateProjectFields failed:', updateError.message);
    }
    return { error: copy.error };
  }

  revalidateProjectPaths(profile.username, updated.slug);
  return null;
}

/** Publish/unpublish toggle — plain form action, no client state needed. */
export async function setProjectStatus(formData: FormData): Promise<void> {
  const { supabase, profile } = await requireOwnProfile('/settings/projects');

  const projectId = String(formData.get('project_id') ?? '');
  const intent = String(formData.get('intent') ?? '');
  if (!projectId || (intent !== 'publish' && intent !== 'unpublish')) return;

  const status: 'draft' | 'published' = intent === 'publish' ? 'published' : 'draft';

  const { data: updated, error: updateError } = await supabase
    .from('projects')
    .update({ status })
    .eq('id', projectId)
    .select('slug')
    .maybeSingle();

  if (updateError) {
    console.error('[settings/projects] setProjectStatus failed:', updateError.message);
  }
  if (!updated) return;

  revalidateProjectPaths(profile.username, updated.slug);
}

/** Removes a project from dorkhub (the GitHub repo itself is untouched). */
export async function deleteProject(formData: FormData): Promise<void> {
  const { supabase, profile } = await requireOwnProfile('/settings/projects');

  const projectId = String(formData.get('project_id') ?? '');
  if (!projectId) redirect('/settings/projects');

  const { data: deleted, error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .select('slug')
    .maybeSingle();

  if (deleteError) {
    console.error('[settings/projects] deleteProject failed:', deleteError.message);
  }
  if (deleted) {
    revalidateProjectPaths(profile.username, deleted.slug);
  }

  // Safe here (never call outside a settings-page-originated submit): this
  // action is only ever wired up from the settings page itself.
  redirect('/settings/projects');
}

/**
 * Swaps `sort_order` with the adjacent project. Two statements, not atomic —
 * acceptable for M4, single-owner data; a tie/race just mis-sorts one refresh
 * (docs/plans/m4-projects.md, Wave 3F).
 */
export async function reorderProject(formData: FormData): Promise<void> {
  const { supabase, profile } = await requireOwnProfile('/settings/projects');

  const projectId = String(formData.get('project_id') ?? '');
  const direction = String(formData.get('direction') ?? '');
  if (!projectId || (direction !== 'up' && direction !== 'down')) return;

  const { data: rows, error: selectError } = await supabase
    .from('projects')
    .select('id, sort_order')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: true });

  if (selectError || !rows) {
    if (selectError) {
      console.error('[settings/projects] reorderProject select failed:', selectError.message);
    }
    return;
  }

  const index = rows.findIndex((row) => row.id === projectId);
  if (index === -1) return;

  const neighborIndex = direction === 'up' ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= rows.length) return; // boundary row: no-op

  const current = rows[index];
  const neighbor = rows[neighborIndex];
  if (!current || !neighbor) return;

  const { error: firstError } = await supabase
    .from('projects')
    .update({ sort_order: neighbor.sort_order })
    .eq('id', current.id);
  if (firstError) {
    console.error('[settings/projects] reorderProject swap (1/2) failed:', firstError.message);
    return;
  }

  const { error: secondError } = await supabase
    .from('projects')
    .update({ sort_order: current.sort_order })
    .eq('id', neighbor.id);
  if (secondError) {
    console.error('[settings/projects] reorderProject swap (2/2) failed:', secondError.message);
  }

  revalidatePath(`/u/${profile.username}`);
}

/**
 * Owner-triggered GitHub refresh. Throttled via `canRefreshNow`; the settings
 * page pre-checks the same throttle to disable the button + show
 * `copy.projectRefreshThrottled` before the user can even submit, so a
 * throttled/failed refresh here just no-ops quietly (console-logged) rather
 * than needing its own client-side error surface.
 */
export async function refreshProjectFromGithub(formData: FormData): Promise<void> {
  const { supabase, profile } = await requireOwnProfile('/settings/projects');

  const projectId = String(formData.get('project_id') ?? '');
  if (!projectId) return;

  // RLS (own-or-published) already scopes this select; the profile_id check
  // below is the nicer-error-copy layer, not the security boundary.
  const { data: project, error: selectError } = await supabase
    .from('projects')
    .select('id, last_synced_at, profile_id, slug')
    .eq('id', projectId)
    .maybeSingle();

  if (selectError || !project) {
    if (selectError) {
      console.error('[settings/projects] refresh select failed:', selectError.message);
    }
    return;
  }
  if (project.profile_id !== profile.id) return;
  if (!canRefreshNow(project.last_synced_at, new Date())) return;

  const outcome = await syncProject(project.id);
  if (outcome.status === 'rate_limited' || outcome.status === 'error') {
    console.error('[settings/projects] refresh outcome:', outcome);
    return;
  }

  revalidateProjectPaths(profile.username, project.slug);
}

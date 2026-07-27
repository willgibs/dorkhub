'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { copy } from '@/lib/copy';
import { MAX_SLUG_ATTEMPTS, nextListSlugCandidate } from '@/lib/lists/slug';
import { slugify } from '@/lib/projects/slug';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';

/**
 * Security note (mirrors src/app/(app)/settings/projects/actions.ts): every
 * write below goes through the cookie-bound `supabaseServer()` client under
 * RLS (`collections_*_own` / `collection_items_*_own`, migration 0010) plus
 * the narrow column grants (no `slug` in the `collections` UPDATE grant, no
 * `id` in either table's grants). RLS is the real enforcement — the
 * app-level checks below (id shape, length caps, "zero rows back means bad
 * id or not-owner") exist only to produce nicer error copy or short-circuit
 * before a wasted round trip. The only service-role touch is the "who am I"
 * profile lookup shared by both auth helpers, which is a read.
 *
 * Signature split (locked decision D11, docs/plans/p3-lists.md): `createList`
 * and `deleteList` are FormData `<form action>` bound, matching the
 * settings/projects mirror exactly. Everything else — rename, description
 * edit, visibility toggle, item toggle — is called imperatively (awaited
 * directly from a client island's event handler), because a checkbox toggle
 * and a combined edit panel with several independently-submittable fields
 * have no natural single `<form>` to bind a FormData action to. This split
 * is intentional, not an inconsistency to "fix" later.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const LIST_CAP = 50;
export const ITEM_CAP = 400;

type OwnProfile = {
  supabase: Awaited<ReturnType<typeof supabaseServer>>;
  profile: { id: string; username: string };
};

/**
 * Core caller resolution, shared by both wrappers below — never redirects on
 * its own. Mirrors `requireOwnProfile`'s two lookups (auth user, then a
 * service-role profile-by-user_id read) but reports which one failed instead
 * of jumping straight to a redirect, since only the FormData actions want
 * that behavior.
 */
async function resolveCaller(): Promise<
  { status: 'signed-out' } | { status: 'no-profile' } | ({ status: 'ok' } & OwnProfile)
> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'signed-out' };

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id, username')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) return { status: 'no-profile' };

  return { status: 'ok', supabase, profile };
}

/**
 * FormData-bound actions (createList/deleteList): signed-out/no-profile
 * redirects, exactly like `requireOwnProfile` in settings/projects/actions.ts.
 * `nextPath` can't reflect the caller's actual page here (these actions are
 * wired up from more than one surface — the lists index and, per D12, the
 * project page's add-to-list dropdown — and the pre-auth caller has no
 * resolvable username yet), so it falls back to the home feed.
 */
async function requireOwnProfile(nextPath = '/'): Promise<OwnProfile> {
  const result = await resolveCaller();
  if (result.status === 'signed-out') {
    redirect(`/auth/signin?next=${encodeURIComponent(nextPath)}`);
  }
  if (result.status === 'no-profile') redirect('/onboarding');
  return result;
}

/**
 * Positional-arg actions (rename/description/visibility/toggle): imperative
 * callers — a redirect mid-toggle would be jarring, so this never redirects
 * and instead returns null for the caller to surface `copy.error` on.
 */
async function tryOwnProfile(): Promise<OwnProfile | null> {
  const result = await resolveCaller();
  return result.status === 'ok' ? result : null;
}

function revalidateListPaths(username: string, slug: string) {
  revalidatePath(`/u/${username}/lists`);
  revalidatePath(`/u/${username}/lists/${slug}`);
}

export type CreateListState =
  | { error: string }
  | { list: { id: string; name: string; slug: string } }
  | null;

/** New-list dialog submit (create-list-dialog / new-list-button islands). */
export async function createList(
  _prev: CreateListState,
  formData: FormData,
): Promise<CreateListState> {
  const { supabase, profile } = await requireOwnProfile('/');

  const name = String(formData.get('name') ?? '').trim();
  if (name.length < 1 || name.length > 60) return { error: copy.error };

  const descriptionRaw = String(formData.get('description') ?? '').trim();
  if (descriptionRaw.length > 280) return { error: copy.error };
  const description = descriptionRaw.length > 0 ? descriptionRaw : null;

  const { count } = await supabase
    .from('collections')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id);
  if ((count ?? 0) >= LIST_CAP) return { error: copy.listCapHit };

  const base = slugify(name, 'list');

  // Retry loop for the (profile_id, slug) unique constraint — base, base-2,
  // … base-5 (MAX_SLUG_ATTEMPTS). Creation-time-only; renames never re-slug
  // (0010 column comment, src/lib/lists/slug.ts).
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = nextListSlugCandidate(base, attempt);

    // is_public deliberately omitted — the DB default (true) applies.
    const { data: inserted, error: insertError } = await supabase
      .from('collections')
      .insert({ profile_id: profile.id, name, slug, description })
      .select('id, name, slug')
      .maybeSingle();

    if (insertError) {
      if (insertError.code === '23505') continue; // slug collision — try the next suffix
      console.error('[lists] createList failed:', insertError.message);
      return { error: copy.error };
    }

    if (inserted) {
      revalidatePath(`/u/${profile.username}/lists`);
      return { list: inserted };
    }
  }

  console.error('[lists] createList failed: exhausted slug attempts for base', base);
  return { error: copy.error };
}

export type ListActionResult = { error: string } | null;

/** Rename field in the list's combined edit panel. */
export async function renameList(collectionId: string, name: string): Promise<ListActionResult> {
  const resolved = await tryOwnProfile();
  if (!resolved) return { error: copy.error };
  const { supabase, profile } = resolved;

  if (!UUID_PATTERN.test(collectionId)) return { error: copy.error };

  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 60) return { error: copy.error };

  const { data: updated, error: updateError } = await supabase
    .from('collections')
    .update({ name: trimmed })
    .eq('id', collectionId)
    .select('slug')
    .maybeSingle();

  // Zero rows covers both a bad id and RLS blocking a non-owner — same
  // idiom as updateProjectFields in settings/projects/actions.ts.
  if (updateError || !updated) {
    if (updateError) console.error('[lists] renameList failed:', updateError.message);
    return { error: copy.error };
  }

  revalidateListPaths(profile.username, updated.slug);
  return null;
}

/** Description field in the list's combined edit panel. */
export async function editListDescription(
  collectionId: string,
  description: string,
): Promise<ListActionResult> {
  const resolved = await tryOwnProfile();
  if (!resolved) return { error: copy.error };
  const { supabase, profile } = resolved;

  if (!UUID_PATTERN.test(collectionId)) return { error: copy.error };

  const trimmed = description.trim();
  if (trimmed.length > 280) return { error: copy.error };
  const value = trimmed.length > 0 ? trimmed : null;

  const { data: updated, error: updateError } = await supabase
    .from('collections')
    .update({ description: value })
    .eq('id', collectionId)
    .select('slug')
    .maybeSingle();

  if (updateError || !updated) {
    if (updateError) console.error('[lists] editListDescription failed:', updateError.message);
    return { error: copy.error };
  }

  revalidateListPaths(profile.username, updated.slug);
  return null;
}

/** Public/private toggle in the list's combined edit panel. */
export async function setListVisibility(
  collectionId: string,
  isPublic: boolean,
): Promise<ListActionResult> {
  const resolved = await tryOwnProfile();
  if (!resolved) return { error: copy.error };
  const { supabase, profile } = resolved;

  if (!UUID_PATTERN.test(collectionId)) return { error: copy.error };

  const { data: updated, error: updateError } = await supabase
    .from('collections')
    .update({ is_public: isPublic })
    .eq('id', collectionId)
    .select('slug')
    .maybeSingle();

  if (updateError || !updated) {
    if (updateError) console.error('[lists] setListVisibility failed:', updateError.message);
    return { error: copy.error };
  }

  revalidateListPaths(profile.username, updated.slug);
  return null;
}

/** Delete-list-button island submit. */
export async function deleteList(formData: FormData): Promise<void> {
  const { supabase, profile } = await requireOwnProfile('/');

  const collectionId = String(formData.get('collection_id') ?? '');
  if (!UUID_PATTERN.test(collectionId)) redirect(`/u/${profile.username}/lists`);

  const { data: deleted, error: deleteError } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .select('slug')
    .maybeSingle();

  if (deleteError) {
    console.error('[lists] deleteList failed:', deleteError.message);
  }

  if (deleted) {
    revalidatePath(`/u/${profile.username}/lists`);
    redirect(`/u/${profile.username}/lists`);
  }

  // Unreachable in normal use — the delete form only ever renders for a list
  // the caller owns, so a zero-row delete here means the id was stale or
  // tampered with. Mirrors deleteProject's defensive-redirect comment style.
  redirect('/');
}

/** Add/remove-from-list checkbox (add-to-list-control island). */
export async function toggleListItem(
  collectionId: string,
  projectId: string,
  on: boolean,
): Promise<ListActionResult> {
  const resolved = await tryOwnProfile();
  if (!resolved) return { error: copy.error };
  const { supabase, profile } = resolved;

  if (!UUID_PATTERN.test(collectionId) || !UUID_PATTERN.test(projectId)) {
    return { error: copy.error };
  }

  if (on) {
    const { count } = await supabase
      .from('collection_items')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', collectionId);
    if ((count ?? 0) >= ITEM_CAP) return { error: copy.listItemCapHit };

    const { error: insertError } = await supabase
      .from('collection_items')
      .insert({ collection_id: collectionId, project_id: projectId });

    // 23505 = unique_violation — an already-member race, not a real failure
    // (same discipline as toggleSave/toggleLike in engagement-context.tsx).
    // Anything else (e.g. 42501 from RLS on a non-owned collection or an
    // unpublished target project) is a real failure.
    if (insertError && insertError.code !== '23505') {
      console.error('[lists] toggleListItem insert failed:', insertError.message);
      return { error: copy.error };
    }
  } else {
    const { error: deleteError } = await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('project_id', projectId);

    // Zero rows affected (not currently a member) is a silent no-op.
    if (deleteError) {
      console.error('[lists] toggleListItem delete failed:', deleteError.message);
      return { error: copy.error };
    }
  }

  const { data: collection, error: lookupError } = await supabase
    .from('collections')
    .select('slug')
    .eq('id', collectionId)
    .maybeSingle();

  if (lookupError || !collection) {
    // Never fail the toggle over a revalidation-path lookup — the mutation
    // itself already succeeded.
    if (lookupError) {
      console.error('[lists] toggleListItem slug lookup failed:', lookupError.message);
    }
    return null;
  }

  revalidateListPaths(profile.username, collection.slug);
  return null;
}

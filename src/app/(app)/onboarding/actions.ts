'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { githubIdentity } from '@/lib/auth/identity';
import { safeNextPath } from '@/lib/auth/redirects';
import { validateUsername } from '@/lib/auth/usernames';
import { isAllowedAvatarUrl } from '@/lib/avatars';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';

export type OnboardingState = { error: string } | null;

/**
 * Creates the caller's profile.
 *
 * Username policy (Will, 2026-07-22): usernames ARE GitHub logins — locked, not
 * chosen — so nobody can impersonate someone else's handle here. The form only
 * customizes display_name and bio (both optional).
 *
 * Service role is REQUIRED by design: profiles.INSERT has no RLS path for
 * authenticated users, so github_id/username can only ever come from the
 * verified OAuth identity server-side — never from client input.
 */
export async function createProfile(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin?next=%2Fonboarding');

  const gh = githubIdentity(user);
  if (!gh?.login) {
    return { error: 'your session has no GitHub identity — try signing in again' };
  }

  // GitHub's own username rules match our DB CHECK; this also blocks the rare
  // case of a GitHub login that collides with our reserved route names.
  const validation = validateUsername(gh.login);
  if (!validation.ok) {
    return { error: `your github handle can’t be used here (${validation.reason}) — email us` };
  }
  const username = validation.value;

  const displayNameRaw = String(formData.get('display_name') ?? '').trim();
  const bioRaw = String(formData.get('bio') ?? '').trim();
  if (displayNameRaw.length > 80) return { error: 'display name: 80 characters max' };
  if (bioRaw.length > 500) return { error: 'bio: 500 characters max' };

  // Avatar: the pulled GitHub default or an upload to OUR bucket — nothing
  // else may enter avatar_url (host allowlist; this is the whole defense
  // since the write is service-role).
  const githubAvatar = (user.user_metadata?.avatar_url as string | undefined) ?? null;
  const submittedAvatar = String(formData.get('avatar_url') ?? '').trim();
  const avatarUrl =
    submittedAvatar && isAllowedAvatarUrl(submittedAvatar) ? submittedAvatar : githubAvatar;

  const service = supabaseService();
  const next = safeNextPath(String(formData.get('next') ?? '/'));

  // Already onboarded (double-submit, back button) → just continue.
  const { data: mine } = await service
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .maybeSingle();
  if (mine) {
    revalidatePath('/', 'layout');
    redirect(next);
  }

  const { error: insertError } = await service.from('profiles').insert({
    user_id: user.id,
    username,
    display_name:
      displayNameRaw || ((user.user_metadata?.full_name as string | undefined) ?? gh.login),
    bio: bioRaw || null,
    avatar_url: avatarUrl,
    github_id: gh.githubId,
    github_username: gh.login,
    claimed_at: new Date().toISOString(),
  });

  if (insertError) {
    if (insertError.code === '23505') {
      // github_id or username collision → a seeded/unclaimed profile exists for
      // this handle. The real claim flow is M8; until then, hold honestly.
      return {
        error: 'a curated profile is waiting for this GitHub account — claiming it lands soon',
      };
    }
    console.error('[onboarding] profile insert failed:', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
    });
    return { error: 'something broke on our end — not you, us. try again?' };
  }

  // The (app)/(marketing) layouts are SHARED with /onboarding, so a plain
  // client navigation would reuse the pre-signup header render (the "?" avatar
  // Will hit as first user). Purge the layout cache so the session-aware
  // header re-renders with the fresh profile.
  revalidatePath('/', 'layout');

  // Stars import is the activation moment (vision) — freshly-created profiles
  // funnel through it before landing on `next`. `next` is already
  // safeNextPath-validated above and gets re-validated on the way out of
  // /settings/import (see that page's skip link).
  redirect(`/settings/import?from=onboarding&next=${encodeURIComponent(next)}`);
}

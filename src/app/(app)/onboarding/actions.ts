'use server';

import { redirect } from 'next/navigation';
import { githubIdentity } from '@/lib/auth/identity';
import { safeNextPath } from '@/lib/auth/redirects';
import { validateUsername } from '@/lib/auth/usernames';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';

export type OnboardingState = { error: string } | null;

/**
 * Creates the caller's profile. Service role is REQUIRED here by design:
 * profiles.INSERT has no RLS path for authenticated users, so github_id can
 * only ever come from the verified OAuth identity server-side — never from
 * client input (docs/architecture.md, RLS matrix).
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
  if (!gh) {
    return { error: 'your session has no GitHub identity — try signing in again' };
  }

  const validation = validateUsername(String(formData.get('username') ?? ''));
  if (!validation.ok) return { error: validation.reason };
  const username = validation.value;

  const service = supabaseService();

  // Already onboarded (double-submit, back button) → just continue.
  const { data: mine } = await service
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .maybeSingle();
  const next = safeNextPath(String(formData.get('next') ?? '/'));
  if (mine) redirect(next);

  // Usernames equal to an UNCLAIMED profile's github_username are reserved for
  // that person (cold-start honesty) — unless the caller IS that person, which
  // the M8 claim flow will handle properly; block here either way.
  const { data: reservedFor } = await service
    .from('profiles')
    .select('id')
    .is('user_id', null)
    .eq('github_username', username)
    .maybeSingle();
  if (reservedFor) {
    return { error: 'that name is reserved for its GitHub owner' };
  }

  const { error: insertError } = await service.from('profiles').insert({
    user_id: user.id,
    username,
    display_name: (user.user_metadata?.full_name as string | undefined) ?? gh.login ?? username,
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    github_id: gh.githubId,
    github_username: gh.login ?? username,
    claimed_at: new Date().toISOString(),
  });

  if (insertError) {
    // Unique-violation race on username → taken; on github_id → a curated
    // profile exists for this account (claim lands in M8).
    if (insertError.code === '23505') {
      if (insertError.message.includes('github_id')) {
        return {
          error: 'a curated profile is waiting for this GitHub account — claiming it lands soon',
        };
      }
      return { error: 'that username just got taken — try another' };
    }
    return { error: 'something broke on our end — not you, us. try again?' };
  }

  redirect(next);
}

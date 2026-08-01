'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { supabaseBrowser } from '@/lib/supabase/browser';
import type { Tables } from '@/lib/supabase/types';

export type HeaderProfile = Pick<Tables<'profiles'>, 'username' | 'display_name' | 'avatar_url'>;

export type HeaderAuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; profile: HeaderProfile | null };

const LOADING: HeaderAuthState = { status: 'loading' };

// Module-level so every mount (remounting across the (marketing) <-> (app)
// route-group boundary, or a second consumer like the mobile menu) seeds its
// initial render with the last-known state instead of "loading" — this is
// what keeps the sign-in button from ever flashing before we actually know
// the caller is signed out (M3 stale-header bug class, docs/decisions.md
// 2026-07-22). `inFlight` dedupes concurrent resolves (StrictMode double
// effects, or the desktop header and mobile menu mounting together) so we
// never fire two getClaims() calls for the same render.
let cachedState: HeaderAuthState | null = null;
let inFlight: Promise<HeaderAuthState> | null = null;

async function resolveAuthState(): Promise<HeaderAuthState> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims) {
      return { status: 'signed-out' } as const;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('user_id', claims.sub)
      .maybeSingle();
    return { status: 'signed-in', profile } as const;
  })();
  try {
    const result = await inFlight;
    cachedState = result;
    return result;
  } finally {
    inFlight = null;
  }
}

/**
 * Shared header auth state (U2): resolves via supabaseBrowser on mount and on
 * every pathname change, so the layouts that mount the header stay
 * static/cookie-free while it still reflects sign-in/sign-out/onboarding
 * without any revalidatePath (decision 3, docs/plans/m5-discovery.md).
 *
 * Extracted from SiteHeaderAuth so the desktop dropdown and the mobile menu
 * share ONE resolver and one cache — two independent copies would double the
 * claims call and could disagree mid-navigation.
 */
export function useHeaderAuth(): HeaderAuthState {
  const pathname = usePathname();
  const [state, setState] = useState<HeaderAuthState>(cachedState ?? LOADING);

  // pathname is a re-resolve trigger (decision 3, docs/plans/m5-discovery.md)
  // — re-run on every navigation so post-onboarding/signout pathname changes
  // pick up fresh claims without any cache purging.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname isn't read in the effect body, it's intentionally used only to trigger re-runs
  useEffect(() => {
    let cancelled = false;
    resolveAuthState().then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return state;
}

/** The account links both surfaces render, in one place so they can't drift. */
export function headerAccountLinks(profile: HeaderProfile | null) {
  return [
    { href: '/saved', label: 'saved' as const },
    // Omitted mid-onboarding (no profile yet) — never link /u/undefined/lists.
    ...(profile ? [{ href: `/u/${profile.username}/lists`, label: 'lists' as const }] : []),
    { href: '/following', label: 'following' as const },
    { href: profile ? `/u/${profile.username}` : '/onboarding', label: 'your page' as const },
  ];
}

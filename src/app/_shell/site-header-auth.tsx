'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SignInWithGitHub } from '@/components/sign-in-github';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { supabaseBrowser } from '@/lib/supabase/browser';
import type { Tables } from '@/lib/supabase/types';

type HeaderProfile = Pick<Tables<'profiles'>, 'username' | 'display_name' | 'avatar_url'>;

type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; profile: HeaderProfile | null };

const LOADING: AuthState = { status: 'loading' };

// Module-level so every mount of SiteHeaderAuth (e.g. remounting across the
// (marketing) <-> (app) route-group boundary) can seed its initial render
// with the last-known state instead of "loading" — this is what keeps the
// sign-in button from ever flashing before we actually know the caller is
// signed out (M3 stale-header bug class, docs/decisions.md 2026-07-22).
// `inFlight` dedupes concurrent resolves (e.g. StrictMode double-effects)
// so we never fire two getClaims() calls for the same render.
let cachedState: AuthState | null = null;
let inFlight: Promise<AuthState> | null = null;

async function resolveAuthState(): Promise<AuthState> {
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
 * Session-aware avatar slot for <SiteHeader>. Client-side by design (decision
 * 3, docs/plans/m5-discovery.md): resolves auth via supabaseBrowser on mount
 * and on every pathname change, so the (app)/(marketing) layouts that mount
 * this stay static/cookie-free while the header still reflects sign-in/
 * sign-out/onboarding without any revalidatePath. Deviation from the general
 * "no Supabase imports in src/components/" convention (docs/conventions.md)
 * is deliberate — this lives in src/app/_shell/, not src/components/, same
 * precedent as onboarding-form.tsx.
 */
export function SiteHeaderAuth() {
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>(cachedState ?? LOADING);

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

  if (state.status === 'loading') {
    return <Skeleton className="size-8 flex-none rounded-full bg-muted" />;
  }

  if (state.status === 'signed-out') {
    return <SignInWithGitHub href="/auth/signin" />;
  }

  const { profile } = state;
  const initial = (profile?.display_name ?? profile?.username ?? '?').charAt(0).toLowerCase();
  const destination = profile ? `/u/${profile.username}` : '/onboarding';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="account menu"
          className="flex size-8 flex-none items-center justify-center overflow-hidden rounded-full bg-primary-soft font-mono text-sm font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {profile?.avatar_url ? (
            // biome-ignore lint/performance/noImgElement: cost rule — user images never go through the image optimizer (docs/architecture.md)
            <img
              src={profile.avatar_url}
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-full object-cover"
            />
          ) : (
            initial
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={destination}>your page</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <form method="post" action="/auth/signout" className="w-full">
            <button type="submit" className="w-full cursor-default text-left">
              sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

'use client';

import Link from 'next/link';

import { headerAccountLinks, useHeaderAuth } from '@/app/_shell/use-header-auth';
import { SignInWithGitHub } from '@/components/sign-in-github';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Session-aware avatar slot for <SiteHeader> — the DESKTOP surface (the
 * mobile menu renders the same account links inline; both read the shared
 * `useHeaderAuth` resolver). Client-side by design (decision 3,
 * docs/plans/m5-discovery.md): the layouts that mount this stay
 * static/cookie-free while the header still reflects auth state.
 *
 * Deviation from the general "no Supabase imports in src/components/" rule
 * is deliberate — this lives in src/app/_shell/, same precedent as
 * onboarding-form.tsx.
 */
export function SiteHeaderAuth() {
  const state = useHeaderAuth();

  if (state.status === 'loading') {
    return <Skeleton className="size-8 flex-none rounded-full bg-muted" />;
  }

  if (state.status === 'signed-out') {
    return <SignInWithGitHub href="/auth/signin" className="hidden sm:inline-flex" />;
  }

  const { profile } = state;
  const initial = (profile?.display_name ?? profile?.username ?? '?').charAt(0).toLowerCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="account menu"
          className="hidden size-8 flex-none items-center justify-center overflow-hidden rounded-full bg-primary-soft font-mono text-sm font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex"
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
        {headerAccountLinks(profile).map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
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

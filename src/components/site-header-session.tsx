import Link from 'next/link';

import { SignInWithGitHub } from '@/components/sign-in-github';
import { SiteHeader } from '@/components/site-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabaseServer } from '@/lib/supabase/clients';

/**
 * Session-aware wrapper around SiteHeader: reads the caller's auth claims and
 * (when signed in) their own profile, then renders the avatar slot — sign-in
 * link when signed out, a "your page" / "sign out" dropdown when signed in.
 *
 * NOTE: this reads cookies (supabaseServer), so any page rendering it goes
 * dynamic — accepted for M3 (per-user header), revisit at the M5 caching pass
 * (docs/state.md).
 */
export async function SiteHeaderSession() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) {
    return (
      <SiteHeader>
        <SignInWithGitHub href="/auth/signin" />
      </SiteHeader>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url')
    .eq('user_id', claims.sub)
    .maybeSingle();

  const initial = (profile?.display_name ?? profile?.username ?? '?').charAt(0).toLowerCase();
  const destination = profile ? `/u/${profile.username}` : '/onboarding';

  return (
    <SiteHeader>
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
    </SiteHeader>
  );
}

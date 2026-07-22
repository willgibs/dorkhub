import { NextResponse } from 'next/server';
import { githubIdentity } from '@/lib/auth/identity';
import { requestOrigin, safeNextPath } from '@/lib/auth/redirects';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';

/**
 * OAuth callback — the security-critical path (docs/architecture.md).
 * Exchanges the PKCE code, then routes on profile state:
 *   existing profile        → next/home
 *   unclaimed github_id hit → hold at /onboarding?claim=pending (full claim UX is M8;
 *                             the atomic github_id-keyed UPDATE never runs before then)
 *   no profile              → /onboarding
 * Identity decisions key EXCLUSIVELY on GitHub's immutable numeric id.
 */
export async function GET(request: Request) {
  const origin = requestOrigin(request);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNextPath(url.searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/?auth_error=exchange_failed`);
  }

  const service = supabaseService();
  const { data: existing } = await service
    .from('profiles')
    .select('id, username')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const gh = githubIdentity(data.user);
  if (gh) {
    const { data: unclaimed } = await service
      .from('profiles')
      .select('id')
      .eq('github_id', gh.githubId)
      .is('user_id', null)
      .maybeSingle();
    if (unclaimed) {
      // Seeded profile awaiting its owner — claim UX ships in M8.
      return NextResponse.redirect(`${origin}/onboarding?claim=pending`);
    }
  }

  return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(next)}`);
}

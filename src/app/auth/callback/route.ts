import { NextResponse } from 'next/server';
import { githubIdentity } from '@/lib/auth/identity';
import { requestOrigin, safeNextPath } from '@/lib/auth/redirects';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';

/**
 * OAuth callback — the security-critical path (docs/architecture.md).
 * Exchanges the PKCE code, then routes on profile state:
 *   existing profile             → next/home
 *   unclaimed github_id hit      → /claim (carries ?next= through)
 *   unclaimed hit, but declined  → falls through to /onboarding (no nag —
 *                                  see the decline-marker comment below)
 *   no profile                  → /onboarding
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
      // Decline-marker check (docs/plans/p1-gallery-engine.md Wave 3): a
      // prior decline inserts a claim_invites row for this profile with
      // used_at already set — repurposing that service-role-only table as a
      // "the owner already said no" marker rather than a real invite
      // redemption record (used_at semantics: "interacted with"). Without
      // this check, a declined owner would be bounced to /claim on every
      // sign-in forever. Falling through (no return here) sends them to the
      // ordinary /onboarding path below, exactly as if there were no
      // unclaimed match at all.
      const { data: declineMarker } = await service
        .from('claim_invites')
        .select('token')
        .eq('profile_id', unclaimed.id)
        .not('used_at', 'is', null)
        .limit(1)
        .maybeSingle();
      if (!declineMarker) {
        return NextResponse.redirect(`${origin}/claim?next=${encodeURIComponent(next)}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(next)}`);
}

import { NextResponse } from 'next/server';
import { requestOrigin, safeNextPath } from '@/lib/auth/redirects';
import { supabaseServer } from '@/lib/supabase/clients';

/**
 * Starts the GitHub OAuth flow. Identity only — zero extra scopes
 * (docs/architecture.md: the server PAT does all GitHub reads; provider tokens
 * are deliberately unused).
 */
export async function GET(request: Request) {
  const origin = requestOrigin(request);
  const next = safeNextPath(new URL(request.url).searchParams.get('next'));

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/?auth_error=start_failed`);
  }
  return NextResponse.redirect(data.url);
}

import { NextResponse } from 'next/server';
import { parseIdsParam } from '@/lib/engagement/parse-ids';
import { supabaseServer } from '@/lib/supabase/clients';

export type EngagementOverlayResponse = {
  liked: string[];
  saved: string[];
  /** null when no `followee` param was given — "not applicable", not "false". */
  following: boolean | null;
  isOwnProfile: boolean;
};

const EMPTY_OVERLAY: EngagementOverlayResponse = {
  liked: [],
  saved: [],
  following: null,
  isOwnProfile: false,
};

function emptyOverlayResponse(): NextResponse<EngagementOverlayResponse> {
  return NextResponse.json(EMPTY_OVERLAY, { headers: { 'Cache-Control': 'private, no-store' } });
}

/**
 * Per-user personalization overlay (decision 8, docs/plans/m5-discovery.md).
 * Public feed/project/profile reads go through the cookie-less anon client so
 * they stay cacheable; this route is the one cookie-bound endpoint that tells
 * the client which of the ids it's showing are liked/saved, and whether the
 * caller follows `followee`.
 *
 * Signed-out (or claims present but no profile yet, e.g. mid-onboarding) is
 * NOT an error — it degrades to the same empty overlay a brand-new signed-in
 * user with no activity would get. Always 200; never 401. Callers (the
 * EngagementProvider client island) treat "empty overlay" as "nothing to
 * highlight yet", not as a failure state.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = parseIdsParam(url.searchParams.get('ids'));
  const followee = url.searchParams.get('followee')?.trim() || null;

  const supabase = await supabaseServer();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims) return emptyOverlayResponse();

  const { data: me } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('user_id', claims.sub)
    .maybeSingle();
  if (!me) return emptyOverlayResponse();

  const [likedResult, savedResult, followingResult] = await Promise.all([
    ids.length > 0
      ? supabase.from('likes').select('project_id').eq('profile_id', me.id).in('project_id', ids)
      : Promise.resolve({ data: [] as Array<{ project_id: string }> }),
    ids.length > 0
      ? supabase.from('saves').select('project_id').eq('profile_id', me.id).in('project_id', ids)
      : Promise.resolve({ data: [] as Array<{ project_id: string }> }),
    followee
      ? supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', me.id)
          .eq('followee_id', followee)
          .maybeSingle()
      : Promise.resolve({ data: null as { follower_id: string } | null }),
  ]);

  const body: EngagementOverlayResponse = {
    liked: (likedResult.data ?? []).map((row) => row.project_id),
    saved: (savedResult.data ?? []).map((row) => row.project_id),
    following: followee ? Boolean(followingResult.data) : null,
    isOwnProfile: followee === me.id,
  };

  return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store' } });
}

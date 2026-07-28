import { NextResponse } from 'next/server';
import { LIST_CAP } from '@/lib/lists/policy';
import { supabaseServer } from '@/lib/supabase/clients';

export type MyListsResponse = {
  lists: Array<{ id: string; name: string; hasProject: boolean }>;
};

const EMPTY_LISTS: MyListsResponse = { lists: [] };

function emptyListsResponse(): NextResponse<MyListsResponse> {
  return NextResponse.json(EMPTY_LISTS, { headers: { 'Cache-Control': 'private, no-store' } });
}

// Minimal shape actually used from the `collection_items` embed below — the
// nested `collections` object (needed only for the `.eq('collections.profile_id', …)`
// filter, not for anything read back out) isn't modeled; same IO-boundary
// trust as `src/lib/feed/queries.ts`'s `toFeedPage`.
type MembershipRow = { collection_id: string };

/**
 * Per-user "which of my lists already has this project" overlay for the
 * project page's add-to-list dropdown (docs/plans/p3-lists.md decision 12).
 * Mirrors /api/me/engagement's auth shape and 200-empty-not-error discipline
 * exactly: signed-out, or claims present but no profile row yet (mid-
 * onboarding), is NOT an error — it degrades to the same empty list a
 * brand-new signed-in user with zero lists would get. Always 200; never 401.
 *
 * `itemCount` is deliberately omitted from the response shape: nothing that
 * consumes this route (the add-to-list dropdown) needs a per-list item count,
 * and adding one here would mean either a second per-list count query or a
 * join this route doesn't otherwise need.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  // Same parse style as engagement's `followee` param — trimmed, no format
  // validation. RLS + the `.eq('project_id', …)` filter make a malformed
  // value harmless (it just matches nothing).
  const projectId = url.searchParams.get('projectId')?.trim() || null;

  const supabase = await supabaseServer();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims) return emptyListsResponse();

  const { data: me } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('user_id', claims.sub)
    .maybeSingle();
  if (!me) return emptyListsResponse();

  const [listsResult, membershipResult] = await Promise.all([
    supabase
      .from('collections')
      .select('id, name')
      .eq('profile_id', me.id)
      .order('created_at', { ascending: false })
      // LIST_CAP, not a literal 50 — a bare literal silently truncates the
      // dropdown (and every `hasProject` state with it) the moment the cap
      // moves. The list detail page already imports ITEM_CAP this way.
      .limit(LIST_CAP),
    projectId
      ? supabase
          .from('collection_items')
          .select('collection_id, collections!inner(profile_id)')
          .eq('project_id', projectId)
          .eq('collections.profile_id', me.id)
      : Promise.resolve({ data: [] as MembershipRow[] }),
  ]);

  const memberCollectionIds = new Set(
    ((membershipResult.data ?? []) as unknown as MembershipRow[]).map((row) => row.collection_id),
  );

  const body: MyListsResponse = {
    lists: (listsResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      hasProject: memberCollectionIds.has(row.id),
    })),
  };

  return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store' } });
}

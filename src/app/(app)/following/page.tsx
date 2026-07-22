import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { FeedGrid } from '@/app/(app)/_feed/feed-grid';
import { renderFeedCards } from '@/app/(app)/_feed/render-cards';
import { EmptyState } from '@/components/empty-state';
import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import { fetchFollowingFeedPage, resolveFeedFilterSpec } from '@/lib/feed/queries';
import { supabaseAnon, supabaseServer, supabaseService } from '@/lib/supabase/clients';

import { loadMoreFollowing } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: copy.followingTitle };

export default async function FollowingPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin?next=%2Ffollowing');

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) redirect('/onboarding');

  // `follows_select_all` is public (anon+authenticated, using true) so the
  // cookie-bound client works fine here too — kept for consistency with the
  // rest of this page's own-profile lookups.
  const { data: followRows } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', profile.id);
  const followeeIds = (followRows ?? []).map((row) => row.followee_id);

  // Projects are public data — query them through the cookie-LESS anon
  // client (parity with the public feed) even though the followee id list
  // itself came from an authed lookup above.
  const spec = resolveFeedFilterSpec({ sort: 'recent' });
  const { rows, nextCursor } = await fetchFollowingFeedPage(spec, followeeIds, supabaseAnon());
  const ids = rows.map((row) => row.id);

  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <h1 className="font-display text-[26px] font-extrabold">{copy.followingTitle}</h1>

      {rows.length === 0 ? (
        <EmptyState message={copy.followingEmpty} />
      ) : (
        <EngagementProvider projectIds={ids}>
          <FeedGrid
            initialCards={renderFeedCards(rows)}
            initialIds={ids}
            initialCursor={nextCursor}
            loadMore={loadMoreFollowing}
          />
        </EngagementProvider>
      )}
    </PageShell>
  );
}

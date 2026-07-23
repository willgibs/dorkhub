import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { renderFeedCards } from '@/app/(app)/_feed/render-cards';
import { EmptyState } from '@/components/empty-state';
import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import type { FeedRow } from '@/lib/feed/queries';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: copy.savedTitle };

// Mirrors `FEED_COLUMNS` in `src/lib/feed/queries.ts` (LEAN explicit column
// list — never select('*'), readme_html is huge) so the embedded `projects`
// resource below matches `FeedRow` and can go straight into the shared
// `renderFeedCards`. The FK name on the nested `profiles` embed is REQUIRED:
// projects<->profiles has three relationships, so a bare `profiles!inner`
// is ambiguous and PostgREST 400s it (PGRST201).
const SAVED_PROJECT_COLUMNS = [
  'id',
  'slug',
  'profile_id',
  'name',
  'tagline',
  'primary_language',
  'stars_count',
  'forks_count',
  'license',
  'demo_url',
  'tags',
  'screenshots',
  'likes_count',
  'updated_at',
  'published_at',
  'trending_score',
  'profiles!projects_profile_id_fkey!inner(username, display_name, avatar_url, followers_count)',
].join(', ');

type SaveRow = { created_at: string; projects: FeedRow };

export default async function SavedPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin?next=%2Fsaved');

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) redirect('/onboarding');

  // Cookie-bound client under RLS: `saves_select_own` scopes this to the
  // caller's own saves; the nested `projects!inner` embed then filters to
  // whatever's visible under `projects` RLS (published, or the caller's own
  // draft) — a save pointing at a project that's since gone invisible simply
  // drops out of the result. Unpaginated v1 (docs/plans/m5-discovery.md scope
  // cut): bounded by one user's own save activity, cap 100 is a sanity limit
  // not a real pagination boundary.
  const { data } = await supabase
    .from('saves')
    .select(`created_at, projects!inner(${SAVED_PROJECT_COLUMNS})`)
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(100);

  // Same IO-boundary trust as `toFeedPage` in `src/lib/feed/queries.ts` —
  // postgrest-js's generic inference doesn't fully verify nested embeds; the
  // shape is enforced by `SAVED_PROJECT_COLUMNS` above.
  const rows = ((data ?? []) as unknown as SaveRow[]).map((row) => row.projects);
  const ids = rows.map((row) => row.id);

  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <h1 className="font-display text-[26px] font-extrabold">{copy.savedTitle}</h1>

      {rows.length === 0 ? (
        <EmptyState>
          <p>{copy.savedEmpty}</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-sm font-mono text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {copy.browseCta}
            </Link>
            <Link
              href="/tags"
              className="rounded-sm font-mono text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {copy.tagsTitle}
            </Link>
            <Link
              href="/settings/import"
              className="rounded-sm font-mono text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {copy.importTitle}
            </Link>
          </div>
        </EmptyState>
      ) : (
        <EngagementProvider projectIds={ids}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {renderFeedCards(rows)}
          </div>
        </EngagementProvider>
      )}
    </PageShell>
  );
}

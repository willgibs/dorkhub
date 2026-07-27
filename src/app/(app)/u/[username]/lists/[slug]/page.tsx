import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { renderFeedCards } from '@/app/(app)/_feed/render-cards';
import { DeleteListButton } from '@/app/(app)/_lists/delete-list-button';
import { EditListForm } from '@/app/(app)/_lists/edit-list-form';
import { EmptyState } from '@/components/empty-state';
import { PageShell } from '@/components/page-shell';
import { Badge } from '@/components/ui/badge';
import { copy } from '@/lib/copy';
import { FEED_COLUMNS, type FeedRow } from '@/lib/feed/queries';
// Sibling-owned actions module (docs/plans/p3-lists.md) — one level up in the
// same feature tree, same relative-import idiom `edit-list-form.tsx` and
// `delete-list-button.tsx` use to pull the action functions themselves.
import { ITEM_CAP } from '@/lib/lists/policy';
import { supabaseServer } from '@/lib/supabase/clients';
import type { Tables } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

type ProfileRow = Tables<'profiles'>;
type CollectionRow = Pick<
  Tables<'collections'>,
  'id' | 'name' | 'slug' | 'description' | 'is_public'
>;

type PageData = {
  profile: ProfileRow;
  collection: CollectionRow;
  isOwner: boolean;
};

/**
 * Same pattern as the project page (cache()-wrapped fn, cookie-bound
 * supabaseServer, revalidate 300, isOwner via auth claims). Item rows are
 * deliberately NOT fetched here — same reason the project page fetches
 * `relatedRows` separately in the component body rather than folding them
 * into `getPageData`: `generateMetadata` only needs the collection's own
 * fields, and coupling metadata generation to the (possibly 400-row) items
 * query would be pure waste.
 */
/**
 * PER-VIEWER page: a private list must 404 for everyone but its owner, so
 * this must never be cached across viewers. `supabaseServer()`'s `cookies()`
 * read already forces dynamic rendering; declaring it makes the guarantee
 * explicit rather than an implicit side effect, matching /saved and
 * /following.
 */
export const dynamic = 'force-dynamic';

const getPageData = cache(async (username: string, slug: string): Promise<PageData | null> => {
  const supabase = await supabaseServer();

  const [{ data: claimsData }, { data: profile }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from('profiles').select('*').eq('username', username).maybeSingle(),
  ]);

  if (!profile) return null;

  // RLS `collections_select_public_or_own` (migration 0010) returns zero
  // rows for a private list unless the caller is its owner — a private list
  // is indistinguishable from a nonexistent one to everyone else. That's
  // deliberate (docs/plans/p3-lists.md decision 9), so a null read here
  // 404s exactly like a bad slug would.
  const { data: collection } = await supabase
    .from('collections')
    .select('id, name, slug, description, is_public')
    .eq('profile_id', profile.id)
    .eq('slug', slug)
    .maybeSingle();

  if (!collection) return null;

  const isOwner = Boolean(profile.user_id) && claimsData?.claims?.sub === profile.user_id;

  return { profile, collection, isOwner };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}): Promise<Metadata> {
  const { username, slug } = await params;
  const data = await getPageData(username, slug);
  if (!data) return {};
  return {
    title: data.collection.name,
    description: data.collection.description ?? undefined,
  };
}

const linkFocusRing =
  'rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

type ItemRow = { added_at: string; projects: FeedRow };

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const data = await getPageData(username, slug);
  if (!data) notFound();

  const { profile, collection, isOwner } = data;

  // Fresh client (mirrors the project page not threading `getPageData`'s
  // internal client out to its own separate `relatedRows` fetch) — RLS
  // scopes this the same way regardless.
  const supabase = await supabaseServer();
  const { data: itemsData } = await supabase
    .from('collection_items')
    .select(`added_at, projects!collection_items_project_id_fkey!inner(${FEED_COLUMNS})`)
    .eq('collection_id', collection.id)
    .order('added_at', { ascending: false })
    .limit(ITEM_CAP);

  // Same IO-boundary trust as `SaveRow` in src/app/(app)/saved/page.tsx —
  // postgrest-js's generic inference doesn't fully verify nested embeds; the
  // shape is enforced by `FEED_COLUMNS`.
  const rows = ((itemsData ?? []) as unknown as ItemRow[]).map((row) => row.projects);
  const ids = rows.map((row) => row.id);

  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[26px] font-extrabold">{collection.name}</h1>
          {isOwner && !collection.is_public ? (
            <Badge
              variant="outline"
              className="w-fit font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
            >
              {copy.listPrivateBadge}
            </Badge>
          ) : null}
        </div>

        {collection.description ? (
          <p className="max-w-[560px] text-[15px] text-muted-foreground">
            {collection.description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 text-[13.5px] text-muted-foreground">
          <Link
            href={`/u/${profile.username}`}
            className={cn('transition-colors hover:text-foreground', linkFocusRing)}
          >
            by @{profile.username}
          </Link>
          {/* Absence rule: 0 items renders nothing, never "0 items". */}
          {rows.length > 0 ? (
            <span className="tabular-nums font-mono text-[12.5px]">
              {rows.length} item{rows.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      </div>

      {isOwner ? (
        <div className="edge-highlight flex flex-col gap-4 rounded-lg border bg-card px-[22px] py-[18px]">
          <EditListForm
            collectionId={collection.id}
            name={collection.name}
            description={collection.description ?? ''}
            isPublic={collection.is_public}
          />
          <DeleteListButton collectionId={collection.id} />
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState message={copy.listEmpty} />
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

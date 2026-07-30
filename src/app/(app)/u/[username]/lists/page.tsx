import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { NewListButton } from '@/app/(app)/_lists/new-list-button';
import { EmptyState } from '@/components/empty-state';
import { PageShell } from '@/components/page-shell';
import { Badge } from '@/components/ui/badge';
import { copy } from '@/lib/copy';
import { supabaseServer } from '@/lib/supabase/clients';
import type { Tables } from '@/lib/supabase/types';

export const metadata: Metadata = { title: copy.listsTitle };

/**
 * PER-VIEWER page: the owner sees their private lists here and a visitor must
 * not, so it must never be cached across viewers. `supabaseServer()`'s
 * `cookies()` read already forces dynamic rendering, but that is an implicit
 * side effect — this makes it explicit and load-bearing, matching /saved and
 * /following. (An earlier comment justified `revalidate = 300` by citing
 * SiteHeaderSession keeping the tree dynamic; that component no longer
 * exists, and the (app) layout is cookie-free with a client auth island.)
 */
export const dynamic = 'force-dynamic';

type ProfileRow = Tables<'profiles'>;

type ListRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  itemCount: number;
};

type PageData = {
  profile: ProfileRow;
  lists: ListRow[];
  isOwner: boolean;
};

// Live-verified shape (P3-D curl probe against PostgREST) of the id-only
// visible-members embed: `collection_items: [{ projects: { id } }, ...]` —
// one entry per item WHOSE PROJECT THE VIEWER CAN SEE (the nested `!inner`
// join runs under RLS, so an unpublished member simply drops out).
// postgrest-js's generic inference doesn't fully verify nested embeds, so
// the cast below is a deliberate IO-boundary trust, same idiom as
// `toFeedPage` in src/lib/feed/queries.ts.
type CollectionCountRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  collection_items: Array<{ projects: { id: string } }>;
};

/**
 * Mirrors the PROJECT page pattern (cache()-wrapped fn, cookie-bound
 * supabaseServer, revalidate 300, isOwner via auth claims) — NOT the anon
 * profile page pattern. Reason: private-vs-public rows differ per viewer on
 * this page (a visitor should only ever see `is_public` lists; the owner
 * sees all of their own, public or private), and RLS
 * (`collections_select_public_or_own`, migration 0010) already does that
 * split with zero app-level branching — but only because the cookie-bound
 * client lets RLS see who's actually asking.
 */
const getPageData = cache(async (username: string): Promise<PageData | null> => {
  const supabase = await supabaseServer();

  const [{ data: claimsData }, { data: profile }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from('profiles').select('*').eq('username', username).maybeSingle(),
  ]);

  if (!profile) return null;

  // VIEWER-VISIBLE count (P3-D): a bare `collection_items(count)` counts
  // every member row, but the detail page renders through an RLS-filtered
  // `projects!inner` join — so "3 items" could render 2 when a member
  // project is unpublished. Counting the same RLS-filtered join makes the
  // number BY CONSTRUCTION what the detail page will show this viewer
  // (proved on real data: naive 2 vs visible 1 with one drafted member).
  // ≤ ITEM_CAP (400) id-only entries per list — trivial payload.
  const { data } = await supabase
    .from('collections')
    .select(
      'id, name, slug, description, is_public, created_at, collection_items(projects!collection_items_project_id_fkey!inner(id))',
    )
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  const lists = ((data ?? []) as unknown as CollectionCountRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    is_public: row.is_public,
    itemCount: row.collection_items.length,
  }));

  const isOwner = Boolean(profile.user_id) && claimsData?.claims?.sub === profile.user_id;

  return { profile, lists, isOwner };
});

export default async function ListsIndexPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getPageData(username);
  if (!data) notFound();

  const { profile, lists, isOwner } = data;

  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[26px] font-extrabold">{copy.listsTitle}</h1>
        {isOwner ? <NewListButton /> : null}
      </div>

      {lists.length === 0 ? (
        <EmptyState message={isOwner ? copy.listsEmptyOwn : copy.listsEmptyVisitor} />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {lists.map((list) => (
            <li key={list.id} className="flex flex-col gap-1 py-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/u/${profile.username}/lists/${list.slug}`}
                  className="rounded-sm font-mono text-[15px] font-semibold outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {list.name}
                </Link>
                {!list.is_public && isOwner ? (
                  <Badge
                    variant="outline"
                    className="w-fit font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
                  >
                    {copy.listPrivateBadge}
                  </Badge>
                ) : null}
                {/* Absence rule: 0 items renders nothing, never "0 items". */}
                {list.itemCount > 0 ? (
                  <span className="tabular-nums font-mono text-[12.5px] text-muted-foreground">
                    {list.itemCount}{' '}
                    {list.itemCount === 1 ? copy.listItemUnitOne : copy.listItemUnit}
                  </span>
                ) : null}
              </div>
              {list.description ? (
                <p className="line-clamp-1 max-w-[560px] text-[13.5px] text-muted-foreground">
                  {list.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}

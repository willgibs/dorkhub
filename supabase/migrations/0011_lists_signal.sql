-- ============================================================================
-- 0011: the lists discovery signal + honest repo recency (P3-B part 1,
-- docs/plans/p3b-rich-pages.md)
-- ============================================================================
-- Two additive projects columns, a generalized recount function, and the two
-- triggers that keep the list counter self-healing.
--
-- NO grant changes anywhere. 0001's authenticated UPDATE grant on projects is
-- column-ENUMERATED, so new columns are non-writable by the API roles by
-- construction; rls_checks.sql §2a is an exact-match inventory and asserts the
-- absence by name.
--
-- ORDER IS LOAD-BEARING. Step 2 (the updated_at guard) must land before step 6
-- (the backfill), or the backfill stamps updated_at across the whole gallery.

-- ----------------------------------------------------------------------------
-- 1. Columns
-- ----------------------------------------------------------------------------

alter table public.projects add column lists_count integer not null default 0;

comment on column public.projects.lists_count is
  'How many PUBLIC lists contain this project (P3-B decision D18 — private membership deliberately does not count: at this scale "in 1 list" with no visible list would disclose that exactly one person privately curated it, and the number must be backed by clickable evidence). Counts membership ROWS, not distinct curators (D19). Trigger-written via recount_project_signals(); never granted to authenticated.';

alter table public.projects add column github_pushed_at timestamptz;

comment on column public.projects.github_pushed_at is
  'GitHub''s own repo.pushed_at — real upstream activity. projects.updated_at is NOT this: it bumps on our own sync writes (stars/etag/last_synced_at are not in the projects_before_update counters guard), so every row read "updated hours ago" regardless of the repo. Written by syncProject only; NULL until a repo has been re-fetched (see the etag_repo clear at the end of this migration).';

-- ----------------------------------------------------------------------------
-- 2. updated_at guard — MUST precede the backfill in step 6
-- ----------------------------------------------------------------------------
-- Identical to 0001's definition except `lists_count` joins the counters
-- array. Without this, every list add/remove (and step 6's own backfill) would
-- bump updated_at, so every listed project's card would read "just shipped" —
-- exactly the bug this guard was written for in 0001.

create or replace function public.projects_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  counters constant text[] := array['likes_count', 'saves_count', 'lists_count', 'trending_score', 'updated_at'];
begin
  if (to_jsonb(new) - counters) is distinct from (to_jsonb(old) - counters) then
    new.updated_at := now();
  end if;
  if old.status = 'draft' and new.status = 'published' then
    new.published_at   := coalesce(new.published_at, now());
    new.trending_score := compute_trending(new.likes_count, new.saves_count, new.published_at);
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. One recount to rule all three counters
-- ----------------------------------------------------------------------------
-- Generalizes 0001's bump_project_engagement(): recounts likes, saves AND
-- public-list memberships from scratch, then refreshes trending. Full recount
-- (never +/-1) so the counters are self-healing if they ever drift.
--
-- SECURITY DEFINER because the caller's RLS only shows them their own
-- likes/saves and only public-or-own collections, but the recount must see
-- everyone's. search_path pinned and EXECUTE revoked per 0002's discipline.
--
-- NOTE (D20): compute_trending keeps its 3-arg signature. lists_count is
-- DISPLAY-ONLY this round — feeding it into trending means a 4-arg overload,
-- a re-grant, a re-pin, a 207-row rescore that invalidates in-flight keyset
-- cursors, and amending materialize.ts's hand-mirrored formula. Deferred until
-- there is real list data to tune a weight against.

create or replace function public.recount_project_signals(p_project_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update projects p
     set likes_count    = c.n_likes,
         saves_count    = c.n_saves,
         lists_count    = c.n_lists,
         trending_score = compute_trending(c.n_likes, c.n_saves, p.published_at)
    from (
      select
        (select count(*)::int from likes where project_id = p_project_id) as n_likes,
        (select count(*)::int from saves where project_id = p_project_id) as n_saves,
        (select count(*)::int
           from collection_items ci
           join collections col on col.id = ci.collection_id
          where ci.project_id = p_project_id
            and col.is_public) as n_lists
    ) c
   where p.id = p_project_id;
$$;

revoke execute on function public.recount_project_signals(uuid) from public, anon, authenticated;

-- Re-point the existing engagement trigger at the shared recount so likes,
-- saves and lists can never diverge. trg_likes_engagement /
-- trg_saves_engagement (0001) keep firing this unchanged.
create or replace function public.bump_project_engagement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform recount_project_signals(coalesce(new.project_id, old.project_id));
  return null; -- AFTER trigger: return value ignored
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. Membership trigger
-- ----------------------------------------------------------------------------
-- Deleting a collection or a profile cascades to collection_items and fires
-- this row trigger, so those paths need no extra handling.

create or replace function public.bump_project_lists()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform recount_project_signals(coalesce(new.project_id, old.project_id));
  return null;
end;
$$;

revoke execute on function public.bump_project_lists() from public, anon, authenticated;

create trigger trg_collection_items_signal
  after insert or delete on public.collection_items
  for each row execute function public.bump_project_lists();

-- ----------------------------------------------------------------------------
-- 5. Visibility trigger — the piece the likes/saves pattern has no analogue for
-- ----------------------------------------------------------------------------
-- A single UPDATE on collections.is_public changes the count of every project
-- in that list (up to ITEM_CAP = 400). This is what makes the public-only rule
-- of D18 self-healing rather than a one-way door: flip a list private and its
-- projects' counters drop; flip it back and they return.

create or replace function public.bump_collection_visibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
begin
  for v_project_id in
    select project_id from collection_items where collection_id = new.id
  loop
    perform recount_project_signals(v_project_id);
  end loop;
  return null;
end;
$$;

revoke execute on function public.bump_collection_visibility() from public, anon, authenticated;

create trigger trg_collections_visibility
  after update of is_public on public.collections
  for each row
  when (old.is_public is distinct from new.is_public)
  execute function public.bump_collection_visibility();

-- ----------------------------------------------------------------------------
-- 6. Backfill (after step 2, so updated_at stays frozen)
-- ----------------------------------------------------------------------------
-- A no-op today (0 collections) but correct forever. `is distinct from` avoids
-- pointless writes on rows that already agree.

update public.projects p
   set lists_count = x.n
  from (
    select ci.project_id, count(*)::int as n
      from public.collection_items ci
      join public.collections c on c.id = ci.collection_id
     where c.is_public
     group by ci.project_id
  ) x
 where p.id = x.project_id
   and p.lists_count is distinct from x.n;

-- ----------------------------------------------------------------------------
-- 7. Force one full re-fetch so github_pushed_at actually populates
-- ----------------------------------------------------------------------------
-- syncProject sends If-None-Match and takes the 304 fast path for unchanged
-- repos, writing NO metadata — so a newly added column would stay NULL forever
-- on every already-synced project. Clearing the repo ETag makes the next sync
-- a full fetch that writes pushed_at, through the EXISTING daily cron and the
-- pipeline's sync-backfill pass. ~207 full fetches against a 5k/hr budget with
-- ~10x headroom; readme_etag is deliberately left alone (README bodies haven't
-- changed and re-downloading them is the expensive half).

update public.projects set repo_etag = null where repo_etag is not null;

-- No index on lists_count (D23): there is no "most listed" surface yet, and an
-- unused index is pure write cost on a table the pipeline writes 4x/hour.

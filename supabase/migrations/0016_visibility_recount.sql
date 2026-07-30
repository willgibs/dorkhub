-- ============================================================================
-- 0016 — set-based visibility recount + counters-guard generated-column fix
-- (P3-C wave C3)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. REGRESSION FIX — the 0012 generated column silently broke the counters
-- guard.
-- ----------------------------------------------------------------------------
-- In a BEFORE UPDATE trigger, generated columns are NOT yet computed on NEW
-- (they compute after BEFORE triggers run), so `new.language_slug` is NULL
-- while `old.language_slug` holds the stored value — probed live:
--   probe id=752ea6a0 old.language_slug=javascript new.language_slug=<NULL>
-- Result: since 0012, EVERY update to a project with a detected language
-- read as a "real" change, so likes/saves/list toggles bumped updated_at —
-- the exact "just shipped on every like" bug this guard was written for in
-- 0001. Fix: exclude generated columns from the comparison. Nothing is
-- lost — language_slug derives from primary_language, which IS compared.

create or replace function public.projects_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  -- counters: legitimate high-churn columns that must not read as edits.
  -- language_slug: GENERATED — always NULL on new in a BEFORE trigger, so
  -- comparing it makes every language-having row look edited (see above).
  counters constant text[] := array['likes_count', 'saves_count', 'lists_count', 'trending_score', 'updated_at', 'language_slug'];
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

revoke execute on function public.projects_before_update() from public, anon, authenticated;
-- Flipping a list's is_public re-counts every member project's signals. The
-- 0011 version looped `perform recount_project_signals(id)` per member — up
-- to ITEM_CAP (400) function calls × 3 subqueries each ≈ 1,200 scans and 400
-- separate UPDATEs per flip. This rewrite recounts the same formula in ONE
-- statement: per-project indexed lateral counts (never whole-table
-- aggregates), one UPDATE, one trigger invocation.
--
-- Semantics are IDENTICAL to recount_project_signals (which stays — the
-- single-row triggers still use it): full recount from scratch (never +/-1,
-- self-healing), public-only list memberships (D18), trending refreshed via
-- the same 3-arg compute_trending. Counter-only updates don't bump
-- updated_at (the projects_before_update counters guard), so cards never
-- read "just shipped" because a list was toggled.
-- ----------------------------------------------------------------------------
create or replace function public.bump_collection_visibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update projects p
     set likes_count    = m.n_likes,
         saves_count    = m.n_saves,
         lists_count    = m.n_lists,
         trending_score = compute_trending(m.n_likes, m.n_saves, p.published_at)
    from (
      select ci.project_id,
             lc.n as n_likes,
             sc.n as n_saves,
             pl.n as n_lists
        from collection_items ci
        cross join lateral (
          select count(*)::int as n from likes l where l.project_id = ci.project_id
        ) lc
        cross join lateral (
          select count(*)::int as n from saves s where s.project_id = ci.project_id
        ) sc
        cross join lateral (
          select count(*)::int as n
            from collection_items ci2
            join collections col on col.id = ci2.collection_id
           where ci2.project_id = ci.project_id
             and col.is_public
        ) pl
       where ci.collection_id = new.id
    ) m
   where p.id = m.project_id;
  return null;
end;
$$;

revoke execute on function public.bump_collection_visibility() from public, anon, authenticated;

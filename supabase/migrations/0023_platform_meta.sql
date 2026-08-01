-- ============================================================================
-- 0023 — platform_stats() + weird_pick_for_date() + tags.description (U2 R0,
-- docs/plans/u2-rework.md)
-- ============================================================================

-- platform_stats: the hero proof line's three counts in one round trip.
-- SECURITY INVOKER — the explicit published filter matches what anon RLS
-- shows anyway; called once per ISR window (revalidate >= 3600 app-side),
-- so three aggregate scans at 17k rows is noise. Distinct-tag count reuses
-- tag_tally's lateral-unnest shape.
create or replace function public.platform_stats()
returns table (
  published_projects bigint,
  makers bigint,
  tags_in_use bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (select count(*)::bigint
       from public.projects where status = 'published'),
    (select count(distinct profile_id)::bigint
       from public.projects where status = 'published'),
    (select count(distinct t.slug)::bigint
       from public.projects p
      cross join lateral unnest(p.tags) as t(slug)
      where p.status = 'published');
$$;

comment on function public.platform_stats() is
  'Published/makers/tags counts for the home hero proof line (U2 R0). SECURITY INVOKER; cache app-side (revalidate >= 3600).';

revoke execute on function public.platform_stats() from public;
grant execute on function public.platform_stats() to anon, authenticated, service_role;

-- weird_pick_for_date: the daily weird spotlight. Same O(log n) uuid-pivot
-- trick as /weird (D35) but the pivot derives from the DATE, so the same
-- day always lands the same project and the result is cacheable for the
-- whole UTC day (revalidate 86400) — where /weird itself stays force-dynamic
-- random on purpose. md5 of a salted date string is 32 hex chars = a valid
-- uuid literal; uniform over the id space like the ids themselves.
-- Wraparound handled by the pref column, NOT bare `union all ... limit 1`
-- (cross-branch ordering there is not guaranteed).
-- SECURITY INVOKER — published-only, same visibility as anon RLS.
create or replace function public.weird_pick_for_date(p_date date)
returns table (slug text, username text)
language sql
stable
security invoker
set search_path = public
as $$
  with pivot as (
    select md5('dorkhub-weird-' || p_date::text)::uuid as u
  )
  select x.slug, x.username
    from (
      (select 1 as pref, p.slug, pr.username::text as username
         from public.projects p
         join public.profiles pr on pr.id = p.profile_id
        where p.status = 'published' and p.id >= (select u from pivot)
        order by p.id asc
        limit 1)
      union all
      (select 2 as pref, p.slug, pr.username::text as username
         from public.projects p
         join public.profiles pr on pr.id = p.profile_id
        where p.status = 'published' and p.id < (select u from pivot)
        order by p.id desc
        limit 1)
    ) as x
   order by x.pref
   limit 1;
$$;

comment on function public.weird_pick_for_date(date) is
  'Deterministic daily weird pick via date-derived uuid pivot (U2 R0). Cacheable per UTC day; /weird stays force-dynamic random. SECURITY INVOKER.';

revoke execute on function public.weird_pick_for_date(date) from public;
grant execute on function public.weird_pick_for_date(date) to anon, authenticated, service_role;

-- tags.description — hand-authored curation copy for the curated taxonomy
-- (stack/topic rows only; the uncurated long tail stays deliberately
-- unpromoted, mirroring sitemap.ts's thin-content posture). Table-level
-- `grant select on public.tags` from 0001 covers the new column for
-- anon/authenticated automatically; writes stay service-role-only (no write
-- grants exist on tags, unchanged).
alter table public.tags
  add column description text
  constraint tags_description_len check (char_length(description) <= 500);

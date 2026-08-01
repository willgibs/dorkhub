-- ============================================================================
-- 0022 — rising_makers(): aggregated recent-engagement leaderboard (U2 R0,
-- docs/plans/u2-rework.md)
-- ============================================================================
-- Board decision (Will, 2026-07-31, U2 planning): LIKES STAY PRIVATE. RLS
-- keeps likes/saves SELECT own-rows-only; only aggregate counts are public.
-- This RPC honors that line: it must see everyone's engagement to rank
-- makers — hence SECURITY DEFINER, same rationale as recount_project_signals
-- ("the caller's RLS only lets them see their own likes/saves, but the
-- recount must see everyone's") — but it returns ONLY (maker, score)
-- aggregates. No (liker, project) pair, no per-liker identity, ever leaves
-- this function. Any future change that exposes liker identity is a policy
-- reversal requiring an explicit board decision first.
--
-- likes/saves carry created_at since 0001 but only (project_id) is indexed —
-- a recency-window scan would walk the whole table. The two created_at
-- indexes bound the window scan; at 17k projects the 14-day window is a few
-- hundred rows.
--
-- Weights mirror compute_trending's save>like posture (saves are stronger
-- intent): score = likes + 2*saves. Bounds are clamped server-side, defense
-- in depth behind the TS caller.
-- ----------------------------------------------------------------------------
create index idx_likes_created_at on public.likes (created_at desc);
create index idx_saves_created_at on public.saves (created_at desc);

create or replace function public.rising_makers(
  p_days integer default 14,
  p_limit integer default 6
)
returns table (
  profile_id uuid,
  username text,
  display_name text,
  avatar_url text,
  score bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with recent as (
    select p.profile_id, count(*)::bigint as pts
      from public.likes l
      join public.projects p on p.id = l.project_id
     where l.created_at >= now() - make_interval(days => least(greatest(p_days, 1), 90))
       and p.status = 'published'
     group by p.profile_id
    union all
    select p.profile_id, count(*)::bigint * 2
      from public.saves s
      join public.projects p on p.id = s.project_id
     where s.created_at >= now() - make_interval(days => least(greatest(p_days, 1), 90))
       and p.status = 'published'
     group by p.profile_id
  )
  select pr.id, pr.username::text, pr.display_name, pr.avatar_url,
         sum(r.pts)::bigint as score
    from recent r
    join public.profiles pr on pr.id = r.profile_id
   group by pr.id, pr.username, pr.display_name, pr.avatar_url
   order by score desc, pr.id
   limit least(greatest(p_limit, 1), 12);
$$;

comment on function public.rising_makers(integer, integer) is
  'Makers ranked by recent engagement on their published projects (U2 R0). SECURITY DEFINER on purpose — must aggregate across all users'' private likes/saves — but returns ONLY (maker, score) aggregates; liker identity never leaves (board: likes stay private).';

revoke execute on function public.rising_makers(integer, integer) from public;
grant execute on function public.rising_makers(integer, integer) to anon, authenticated, service_role;

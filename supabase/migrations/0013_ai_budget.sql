-- ============================================================================
-- 0013 — AI spend ceiling + storage probe (P3-C wave C0, docs/plans/
-- p3c-scale.md, decision D33)
-- ============================================================================
-- The AI budget is a DATABASE ledger, not an in-process counter: serverless
-- instances don't share memory, so only a shared atomic row can enforce
-- "at most N model calls today" across concurrent pipeline runs, the admin
-- enrich drain, and inline materialize-time enrichment. Callers claim a slot
-- via claim_ai_call() BEFORE every model call and fail CLOSED — no slot, no
-- call (src/lib/ai/budget.ts).

-- ----------------------------------------------------------------------------
-- ai_usage — one row per UTC day. Deny-all posture (same as
-- moderation_screens, 0009): service-role only. Grants are the first gate;
-- RLS-enabled-with-zero-policies is the second.
-- ----------------------------------------------------------------------------
create table public.ai_usage (
  day date primary key,
  calls integer not null default 0
    constraint ai_usage_calls_nonnegative check (calls >= 0)
);

comment on table public.ai_usage is
  'Per-UTC-day AI call ledger (P3-C D33). claim_ai_call() increments it atomically before every model call; the enforcement point for AI_DAILY_MAX. Service-role only.';

revoke all on table public.ai_usage from anon, authenticated;
alter table public.ai_usage enable row level security;  -- no policies → deny all

-- ----------------------------------------------------------------------------
-- claim_ai_call(p_max) — atomically claim one AI-call slot for today (UTC).
-- Returns true when the slot was claimed; false when the day's ceiling is
-- already reached, or p_max <= 0 (a zero ceiling = "no calls at all", the
-- fail-closed verification mode).
--
-- Atomicity: ON CONFLICT DO UPDATE locks the day row, so two concurrent
-- claimants serialize — each sees the other's increment and the cap can
-- never be slipped past by a race. The INSERT arm is guarded by the same
-- ceiling (p_max >= 1) so the first call of a zero-budget day can't sneak
-- in via the insert path. When either arm's guard fails, RETURNING yields
-- no row and the function reports false.
-- ----------------------------------------------------------------------------
create or replace function public.claim_ai_call(p_max integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed boolean;
begin
  insert into public.ai_usage as u (day, calls)
  select (now() at time zone 'utc')::date, 1
  where p_max >= 1
  on conflict (day) do update
    set calls = u.calls + 1
    where u.calls < p_max
  returning true into claimed;
  return coalesce(claimed, false);
end;
$$;

comment on function public.claim_ai_call(integer) is
  'Atomic AI-budget claim (P3-C D33): true = slot consumed, make the call; false = ceiling reached, make NO call. Service-role only — API roles could otherwise drain the day''s budget as a DoS.';

-- Execute lockdown: an API role that could call this would be able to burn
-- the whole day's budget in a loop and starve the immune system. The
-- service_role grant is explicit (not left to default privileges) because
-- revoking from PUBLIC removes the everyone-grant this RPC path would
-- otherwise ride on.
revoke execute on function public.claim_ai_call(integer) from public, anon, authenticated;
grant execute on function public.claim_ai_call(integer) to service_role;

-- ----------------------------------------------------------------------------
-- db_size_bytes() — storage monitoring probe (board decision: monitor now,
-- Supabase Pro when forced). One cheap call per pipeline run surfaces growth
-- with headroom instead of discovering the 500 MB free-tier wall.
-- ----------------------------------------------------------------------------
create or replace function public.db_size_bytes()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select pg_database_size(current_database());
$$;

comment on function public.db_size_bytes() is
  'Current database size in bytes, for the pipeline''s storage monitoring (P3-C C0). Service-role only.';

revoke execute on function public.db_size_bytes() from public, anon, authenticated;
grant execute on function public.db_size_bytes() to service_role;

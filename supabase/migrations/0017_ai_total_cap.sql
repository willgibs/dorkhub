-- ============================================================================
-- 0017 — lifetime AI spend cap (P3-D wave D1, board directive)
-- ============================================================================
-- Will: "tight limit on our initial AI budget (~$5 max or $1 daily) so we
-- don't accidentally rack up a bill if a bug slips through." The 0013 ledger
-- caps calls per UTC day; this adds the LIFETIME ceiling — the "$5 max" half
-- — enforced in the same ledger. Dollar mapping lives with the env defaults
-- in src/lib/ai/budget.ts (worst-case ≤ $0.0006/call with clipped prompts,
-- so the 5,000-call default ≈ ≤$3).
--
-- The old single-arg signature is DROPPED (CREATE OR REPLACE with a new arg
-- list would create an overload, and PostgREST would then refuse the
-- ambiguous rpc name). Deploy order is migration-then-code: the deployed
-- old caller errors for a few minutes and the engines FAIL CLOSED — the
-- safe direction, on today's empty queues a non-event.
--
-- Race-freedom of the total check: every write goes to TODAY's row, and
-- ON CONFLICT DO UPDATE holds that row's lock while the WHERE runs — past
-- days are immutable, so `past_sum + locked_today_count < p_total_max`
-- cannot be raced past by concurrent claimants. The INSERT arm (first call
-- of a day, no row to lock) reads the committed all-days sum, which IS the
-- total when no today-row exists; two racing first-claims resolve via the
-- conflict path as before (0013).
--
-- p_total_max semantics: NULL = no lifetime cap · 0 = kill-switch (both
-- arms guarded, so it refuses even on an empty ledger and writes NOTHING —
-- the same I14-proven discipline as the daily zero-ceiling).
-- ----------------------------------------------------------------------------
drop function public.claim_ai_call(integer);

create or replace function public.claim_ai_call(p_max integer, p_total_max integer)
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
    and (p_total_max is null
         or (select coalesce(sum(a.calls), 0) from public.ai_usage a) < p_total_max)
  on conflict (day) do update
    set calls = u.calls + 1
    where u.calls < p_max
      and (p_total_max is null
           or u.calls + (select coalesce(sum(a.calls), 0)
                           from public.ai_usage a
                          where a.day < u.day) < p_total_max)
  returning true into claimed;
  return coalesce(claimed, false);
end;
$$;

comment on function public.claim_ai_call(integer, integer) is
  'Atomic AI-budget claim (P3-C D33 + P3-D lifetime cap): true = slot consumed, make the call; false = a ceiling is reached (daily p_max or lifetime p_total_max), make NO call. Service-role only.';

revoke execute on function public.claim_ai_call(integer, integer) from public, anon, authenticated;
grant execute on function public.claim_ai_call(integer, integer) to service_role;

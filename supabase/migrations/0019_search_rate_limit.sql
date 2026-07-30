-- ============================================================================
-- 0019 — per-IP search rate limiter (P4 L2d)
-- ============================================================================
-- /api/search is public and fans out up to eight SQL legs per request; the
-- CDN cache only dedupes IDENTICAL q strings, so a varying-q flood reaches
-- the database and (post-launch) bills Vercel function invocations. D29
-- deferred a limiter because "shared state = new spend" — the ai_usage
-- ledger (0013) has since proven the $0 shared-state shape, and this clones
-- it: fixed windows keyed by (hashed ip, window bucket).
--
-- Failure direction is the OPPOSITE of claim_ai_call, on purpose: the route
-- fails OPEN when this ledger errors (availability for a read-only public
-- endpoint wins; spend is separately bounded by the AI ledger and, at
-- launch, Vercel Spend Management). A `false` return — genuinely over the
-- cap, or a zero ceiling — is the only thing that rate-limits.

create table public.search_rate_limit (
  ip_hash      text not null,
  window_start timestamptz not null,
  calls        integer not null default 0
               constraint search_rate_limit_calls_nonnegative check (calls >= 0),
  primary key (ip_hash, window_start)
);

comment on table public.search_rate_limit is
  'Fixed-window per-IP search ledger (P4). claim_search_call() increments atomically; ips stored as sha-256 hashes, expired windows pruned by the pipeline cron. Service-role only.';

revoke all on table public.search_rate_limit from anon, authenticated;
alter table public.search_rate_limit enable row level security;  -- no policies → deny all

-- ----------------------------------------------------------------------------
-- claim_search_call(p_ip_hash, p_max, p_window_seconds) — claim one search
-- slot in the caller's current fixed window. true = proceed; false = over
-- the window's ceiling (or a zero/negative ceiling: kill-switch, writing
-- nothing — the guarded INSERT arm mirrors claim_ai_call).
--
-- Atomicity: ON CONFLICT DO UPDATE locks the (ip, window) row, so concurrent
-- requests from one ip serialize and the cap can't be raced past. The window
-- key is the epoch floored to p_window_seconds — pure arithmetic, no
-- session state.
-- ----------------------------------------------------------------------------
create or replace function public.claim_search_call(
  p_ip_hash text,
  p_max integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed boolean;
  v_window timestamptz;
begin
  if p_ip_hash is null or p_window_seconds is null or p_window_seconds < 1 then
    return false;
  end if;
  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.search_rate_limit as s (ip_hash, window_start, calls)
  select p_ip_hash, v_window, 1
  where p_max >= 1
  on conflict (ip_hash, window_start) do update
    set calls = s.calls + 1
    where s.calls < p_max
  returning true into claimed;
  return coalesce(claimed, false);
end;
$$;

comment on function public.claim_search_call(text, integer, integer) is
  'Atomic per-IP search-rate claim (P4): true = serve the search, false = 429. Service-role only — an API role holding execute could exhaust any ip''s window as a DoS.';

-- Execute lockdown (0013's rule): revoking from PUBLIC removes the
-- everyone-grant, so service_role must be granted explicitly.
revoke execute on function public.claim_search_call(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.claim_search_call(text, integer, integer)
  to service_role;

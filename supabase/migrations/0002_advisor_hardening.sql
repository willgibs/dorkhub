-- 0002: security-advisor hardening (2026-07-22, run after first advisor pass)
--
-- Fixes the actionable advisor findings; the remaining WARN/INFO entries are
-- accepted by design and documented here so future audits don't re-litigate:
--   · claim_invites "RLS enabled, no policy"  → deny-all is intentional
--     (service-role only; tokens are invitation UX, never authorization).
--   · public bucket "allows listing"          → screenshots are public content
--     served directly by design (cost rule: no image-optimizer proxying).
--   · current_profile_id() executable by anon/authenticated → REQUIRED: RLS
--     policies evaluate it as the querying role. It only maps auth.uid() to a
--     profile id; safe by construction.

-- Trigger functions never need direct EXECUTE from API roles — Postgres fires
-- triggers regardless of the invoking role's EXECUTE privilege.
revoke execute on function public.bump_project_engagement() from public, anon, authenticated;
revoke execute on function public.bump_followers() from public, anon, authenticated;

-- rls_auto_enable() is the dashboard's "automatic RLS" event-trigger helper;
-- same reasoning — no API role should call it directly.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Pin the search_path on the one function that lacked it (advisor: mutable
-- search_path). IMMUTABLE + qualified would also do; pinning is simplest.
alter function public.compute_trending(int, int, timestamptz) set search_path = public;

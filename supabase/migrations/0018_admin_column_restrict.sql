-- ============================================================================
-- 0018 — profiles SELECT grant goes column-list; is_admin leaves the API
-- surface (P4 L2a).
-- ============================================================================
-- 0001 granted table-wide SELECT on profiles to the API roles, which made
-- is_admin publicly enumerable over PostgREST (?select=is_admin worked for
-- anon) — flagged by P1's fact-check as "P4 hardening TODO". The fix mirrors
-- the UPDATE grant's existing shape: an explicit column list, every column
-- EXCEPT is_admin.
--
-- user_id deliberately STAYS granted: PostgREST ties "may filter on a column"
-- to holding SELECT on it, and the signed-in shell resolves the viewer's
-- profile via .eq('user_id', …) under the API roles (site-header-auth,
-- /api/me/lists, settings pages). Revoking it would 42501 the header on every
-- signed-in page load. It has been public since 0001 and discloses only an
-- opaque auth uuid on claimed rows.
--
-- requireAdmin() reads is_admin via the service role (untouched by this
-- revoke — 0003 grants service_role directly). feed_page() is SECURITY
-- INVOKER and selects only username/display_name/avatar_url/followers_count
-- from profiles — all still granted.
--
-- Suite: rls_checks.sql §2b asserts the exact 12-column SELECT surface;
-- T27/T28 prove the 42501 behaviorally for authenticated and anon.

revoke select on public.profiles from anon, authenticated;

grant select (id, user_id, username, display_name, avatar_url, bio, links,
              github_id, github_username, followers_count, claimed_at,
              created_at)
  on public.profiles to anon, authenticated;

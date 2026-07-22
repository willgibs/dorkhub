-- 0003: restore service_role table privileges (2026-07-22)
--
-- BUG: 0001's revoke-all-then-grant-back hardening revoked ALL from every API
-- role on public tables and granted back only the anon/authenticated surface —
-- nobody re-granted service_role, leaving it with only REFERENCES/TRIGGER/
-- TRUNCATE. Every service-role code path (onboarding INSERT, admin/seed, sync,
-- claim) failed with 42501. Caught in production by the first real sign-up.
--
-- service_role is Supabase's RLS-bypassing server key; it is meant to hold
-- full DML on the public schema. rls_checks.sql section 2 now asserts this.

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

-- Future tables created by later migrations keep the same shape.
alter default privileges in schema public grant all privileges on tables to service_role;
alter default privileges in schema public grant all privileges on sequences to service_role;

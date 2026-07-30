-- 0020: profiles.username — widen to GitHub's full legal envelope.
--
-- Board decision 2026-07-30 (Will): never exclude a GitHub-legal login.
-- The 0001 pattern was GitHub's NEW-SIGNUP rule (min 2 chars, single
-- interior hyphens only), which rejects real legacy accounts: trailing
-- hyphens (LingDong-), consecutive hyphens (Rob--W), single characters (f).
-- Those owners' repos stalled as `invalid_username` in the P4 import, and a
-- real user with such a login could not claim their profile.
--
-- New rule: 1–39 chars, [A-Za-z0-9-], must START with a letter or number.
-- Leading hyphens stay banned — GitHub has never issued one, and flag-shaped
-- names are an injection footgun. Charset and length cap unchanged, so the
-- URL-safety envelope is identical. Strict superset of the old pattern:
-- every existing row passes by construction (validated on ADD below anyway).
--
-- App-side mirror: src/lib/auth/usernames.ts USERNAME_PATTERN — changed in
-- the same commit; the two must never drift.

alter table public.profiles
  drop constraint profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format
  check (username::text ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$');

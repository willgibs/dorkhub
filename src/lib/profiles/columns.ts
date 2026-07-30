import type { Tables } from '@/lib/supabase/types';

// The exact profiles SELECT surface migration 0018 grants the API roles —
// every column EXCEPT is_admin, which must never be API-readable (admin
// identities were publicly enumerable before 0018). A `select('*')` on
// profiles now 42501s at the database (SQL `*` needs SELECT on every column),
// which is why this constant exists: one literal string (postgrest-js only
// infers real row types from literals) kept in lockstep with 0018 and
// rls_checks.sql §2b.
export const PROFILE_COLUMNS =
  'id, user_id, username, display_name, avatar_url, bio, links, github_id, github_username, followers_count, claimed_at, created_at';

export type ProfileRow = Omit<Tables<'profiles'>, 'is_admin'>;

/**
 * Username rules — mirrors the DB CHECK constraint exactly
 * (supabase/migrations/0001_init.sql, profiles.username):
 * 2–40 chars, alphanumeric with single interior hyphens, GitHub-style.
 */
export const USERNAME_PATTERN = /^[a-zA-Z0-9](?:-?[a-zA-Z0-9]){1,38}$/;

/**
 * Route names and brand terms a profile may never squat. `/u/` prefixing
 * already prevents actual route collisions; this list is about confusion, not
 * correctness — keep it short and obvious.
 */
export const RESERVED_USERNAMES = new Set([
  'admin',
  'api',
  'auth',
  'browse',
  'claim',
  'colophon',
  'design',
  'dorkhub',
  'feed',
  'following',
  'manifesto',
  'new',
  'onboarding',
  'privacy',
  'root',
  'saved',
  'settings',
  'support',
  'tags',
  'terms',
  'u',
  'www',
]);

export type UsernameValidation = { ok: true; value: string } | { ok: false; reason: string };

export function validateUsername(raw: string): UsernameValidation {
  const value = raw.trim();
  if (value.length < 2) return { ok: false, reason: 'needs at least 2 characters' };
  if (value.length > 39) return { ok: false, reason: 'maximum 39 characters' };
  if (!USERNAME_PATTERN.test(value)) {
    return { ok: false, reason: 'letters, numbers, and single hyphens only' };
  }
  if (RESERVED_USERNAMES.has(value.toLowerCase())) {
    return { ok: false, reason: 'that name is reserved' };
  }
  return { ok: true, value };
}

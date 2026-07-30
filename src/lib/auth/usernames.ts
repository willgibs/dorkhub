/**
 * Username rules — mirrors the DB CHECK constraint exactly
 * (supabase/migrations/0020_username_github_envelope.sql, profiles.username):
 * 1–39 chars, letters/numbers/hyphens, must start with a letter or number.
 *
 * This is GitHub's FULL legal envelope, not its new-signup rule: legacy
 * accounts with trailing hyphens (LingDong-), consecutive hyphens (Rob--W),
 * and single characters (f) are real and welcome here — board decision
 * 2026-07-30, "open to all GitHub username formats." Leading hyphens stay
 * banned: GitHub has never issued one, and names that parse as CLI flags are
 * an injection footgun we don't need.
 */
export const USERNAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/;

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
  if (value.length === 0) return { ok: false, reason: 'needs at least 1 character' };
  if (value.length > 39) return { ok: false, reason: 'maximum 39 characters' };
  if (!USERNAME_PATTERN.test(value)) {
    return {
      ok: false,
      reason: 'letters, numbers, and hyphens; must start with a letter or number',
    };
  }
  if (RESERVED_USERNAMES.has(value.toLowerCase())) {
    return { ok: false, reason: 'that name is reserved' };
  }
  return { ok: true, value };
}

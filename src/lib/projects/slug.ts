/**
 * Project slug rules — mirrors the DB CHECK constraint exactly
 * (supabase/migrations/0001_init.sql, projects.slug):
 * lowercase groups of [a-z0-9] joined by single hyphens, no leading/trailing/
 * doubled hyphens. Unlike usernames, slugs are machine-derived from a repo
 * name rather than user-typed, so we don't reject input — we normalize it
 * until it fits, with a safe fallback and collision suffixing.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Sanity bound on the base slug (applied BEFORE collision suffixing). The DB
 * column itself has no length check, so this exists purely so a repo with an
 * absurdly long name doesn't produce an unwieldy URL — 100 chars is already
 * far beyond any reasonable repo name.
 */
const MAX_BASE_SLUG_LENGTH = 100;

/** Used when a repo name normalizes to nothing (e.g. an all-emoji/unicode name). */
const FALLBACK_SLUG = 'project';

/**
 * Lowercases, replaces every run of non-[a-z0-9] characters with a single
 * hyphen, and trims leading/trailing hyphens. Exported separately so tests
 * can exercise the normalization step independent of collision handling.
 */
export function slugify(input: string): string {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized.length > 0 ? normalized : FALLBACK_SLUG;
}

/**
 * Turns a GitHub repo name into a unique, DB-safe project slug for a given
 * owner. Always returns a string matching `SLUG_PATTERN` — callers can trust
 * the output without re-validating.
 *
 * Collision handling: if the normalized base slug is already taken (within
 * this owner's `existingSlugs`), appends `-2`, `-3`, … until a free one is
 * found.
 */
export function generateProjectSlug(repoName: string, existingSlugs: ReadonlySet<string>): string {
  const base =
    slugify(repoName).slice(0, MAX_BASE_SLUG_LENGTH).replace(/-+$/g, '') || FALLBACK_SLUG;

  if (!existingSlugs.has(base)) return base;

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (existingSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

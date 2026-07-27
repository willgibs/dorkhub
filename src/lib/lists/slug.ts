/**
 * List slug collision suffixing (P3-A, locked decision D8 —
 * docs/plans/p3-lists.md, supabase/migrations/0010_lists.sql column comment
 * on `collections.slug`). This is CREATION-TIME-ONLY: a list's slug is
 * assigned once, during the `createList` insert-retry loop, by trying
 * `nextListSlugCandidate(base, attempt)` for attempt 0..MAX_SLUG_ATTEMPTS-1
 * until an insert doesn't collide (23505) on the `(profile_id, slug)`
 * unique constraint. Renames never re-slug — `slug` is deliberately excluded
 * from the authenticated UPDATE column grant, so there is no rename-time
 * caller for this helper.
 */

/** Total insert attempts the createList retry loop will make: base, base-2, base-3, base-4, base-5. */
export const MAX_SLUG_ATTEMPTS = 5;

/**
 * attempt 0 → base; attempt n (n >= 1) → `${base}-${n + 1}`.
 *
 * Pure string suffixing — does no normalization and does not guarantee a
 * non-empty result on its own. In practice `base` always comes from
 * `slugify(name, 'list')` (src/lib/projects/slug.ts), which guarantees a
 * non-empty string; an empty `base` here would just suffix off of nothing
 * (attempt 1 → `-2`), which is harmless but not a case real callers hit.
 */
export function nextListSlugCandidate(base: string, attempt: number): string {
  return attempt === 0 ? base : `${base}-${attempt + 1}`;
}

/**
 * Canonical tag-slug shape (docs/plans/m5-discovery.md Wave 3B) — matches the
 * `tags.slug` DB constraint (`supabase/migrations/0001_init.sql`,
 * `tags_slug_format`) and the same normalization `parseTagsInput` applies to
 * `projects.tags` at write time (`src/lib/projects/fields.ts`), so a valid
 * slug here is always safe to `.contains('tags', [slug])` against. Pure, no
 * IO.
 */
export const TAG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Normalizes a raw `[tag]` route param (lowercase) and validates its shape.
 * Returns `null` for anything malformed — callers should `notFound()`.
 */
export function resolveTagSlug(raw: string): string | null {
  const normalized = raw.toLowerCase();
  return TAG_SLUG_PATTERN.test(normalized) ? normalized : null;
}

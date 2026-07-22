/**
 * Pure tag-frequency tally across project rows (docs/plans/m5-discovery.md
 * Wave 3B) — powers the live counts on `/tags`. `projects.tags` is deduped
 * within a row at write time (`parseTagsInput`, `src/lib/projects/fields.ts`),
 * so this counts naively across rows without any per-row de-dup step. Case is
 * preserved exactly as stored (project tags are always written lowercase —
 * `src/lib/projects/fields.ts` — so this tallies cleanly against `tags.slug`
 * with no normalization needed). No IO.
 */
export function tallyProjectTags(rows: readonly { tags: string[] }[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    for (const tag of row.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return counts;
}

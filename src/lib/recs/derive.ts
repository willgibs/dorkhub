import { tallyProjectTags } from '@/lib/tags/tally';

/**
 * "because you starred" recs derivation (docs/plans/p2-discovery.md Wave 2B)
 * — pure helpers over already-fetched signal rows, no IO. `src/app/(app)/
 * home/actions.ts` is the only caller.
 */

/**
 * Top N tags across the caller's own signal rows (saved + star-imported
 * projects), sorted by frequency desc then tag asc — `Map` iteration order
 * isn't a stable tiebreak, so ties are broken alphabetically for a
 * deterministic result across calls with the same input.
 */
export function topTags(rows: readonly { tags: string[] }[], n = 5): string[] {
  const counts = tallyProjectTags(rows);

  return [...counts.entries()]
    .sort(([tagA, countA], [tagB, countB]) => {
      if (countA !== countB) return countB - countA;
      return tagA < tagB ? -1 : tagA > tagB ? 1 : 0;
    })
    .slice(0, n)
    .map(([tag]) => tag);
}

/**
 * Caps a signal-project id list before it's used as a recs exclusion set —
 * a caller with a long saves/star-imports history should never balloon the
 * exclusion check (or a hypothetical downstream query clause) unbounded.
 */
export function buildExclusionSet(ids: readonly string[], cap = 100): Set<string> {
  return new Set(ids.slice(0, cap));
}

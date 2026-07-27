/**
 * AI triage verdict ordering + labels (P2.6 "immune system",
 * docs/plans/p2.6-immune-system.md). `moderation_screens.verdict` is
 * `'ok' | 'review' | 'flagged'` (0009_immune_system.sql); a project with no
 * screen row at all is represented here as `null` ("unscreened") rather than
 * a fourth DB value.
 *
 * This ordering drives the admin retro queue triage: flagged sorts first so
 * the worst rows get human attention where it matters most, unscreened sorts
 * ahead of ok (an AI-cleared row needs eyes less than one nobody has looked
 * at yet), and ok sorts last — locked order per the plan doc: "retro rows
 * sort flagged → review → unscreened → ok." Pure, zero IO.
 */
export type Verdict = 'ok' | 'review' | 'flagged';

/** Ascending sort key: flagged=0, review=1, unscreened(null)=2, ok=3. */
export function verdictRank(verdict: Verdict | null): number {
  switch (verdict) {
    case 'flagged':
      return 0;
    case 'review':
      return 1;
    case null:
      return 2;
    case 'ok':
      return 3;
    default:
      return 2;
  }
}

/**
 * Sorts `rows` ascending by `verdictRank`, without mutating the input array.
 * Stable — rows sharing a verdict keep their original relative order.
 * `Array.prototype.sort` is spec-stable as of ES2019 (V8 has honored this
 * for years), but the comparator decorates each row with its original index
 * and falls back to it explicitly on a rank tie rather than leaning on that
 * engine guarantee alone.
 */
export function sortByVerdict<T>(rows: T[], getVerdict: (row: T) => Verdict | null): T[] {
  return rows
    .map((row, index) => ({ row, index, rank: verdictRank(getVerdict(row)) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ row }) => row);
}

/** Display label — 'unscreened' stands in for `null` (no screen row yet). */
export function verdictLabel(verdict: Verdict | null): string {
  return verdict === null ? 'unscreened' : verdict;
}

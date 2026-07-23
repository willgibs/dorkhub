/**
 * Auto-approve / retro-review threshold policy (docs/plans/p2.5-self-running.md
 * locked decision #1). The pipeline materializes EVERY bare candidate
 * (publish-all — board-confirmed three times: "don't want users feeling
 * blocked — add quality to mass quantity"). This threshold does NOT gate
 * publishing; it only decides which already-published rows still need a
 * HUMAN glance afterward — the admin queue's retro section surfaces rows
 * where `approved ∧ decided_by IS NULL ∧ stars_count < threshold`, and
 * raising the threshold later can retroactively surface previously-clean
 * rows (accepted, not a bug — bounded by the retro query's LIMIT).
 */

/** Default stars threshold when `AUTO_APPROVE_MIN_STARS` is unset/invalid. */
const DEFAULT_MIN_STARS = 20;

/**
 * Reads `AUTO_APPROVE_MIN_STARS` lazily — at call time, not import time —
 * mirroring `githubToken()` (src/lib/github/client.ts) and `resolveProvider()`
 * (src/lib/ai/gateway.ts): this module can be imported anywhere without the
 * env var already being configured, and every call reflects the current
 * value (tests can mutate `process.env` between calls with no module reset).
 * Falls back to `DEFAULT_MIN_STARS` on missing, unparseable, or negative
 * input — a threshold below zero is nonsensical (every candidate would
 * "need review").
 */
export function autoApproveMinStars(): number {
  const raw = process.env.AUTO_APPROVE_MIN_STARS?.trim();
  if (!raw) return DEFAULT_MIN_STARS;
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed < 0) return DEFAULT_MIN_STARS;
  return parsed;
}

/**
 * A published candidate "needs review" — i.e. belongs in the admin queue's
 * retro section even though it's already live — when its star count sits
 * BELOW `threshold`. Strict `<` (not `<=`): a candidate exactly at the
 * threshold is already "clean enough" by the policy that set the threshold.
 */
export function needsReview(candidate: { stars_count: number }, threshold: number): boolean {
  return candidate.stars_count < threshold;
}

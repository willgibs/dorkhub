/** Minimum time between owner-triggered GitHub refreshes for a single project. */
export const REFRESH_THROTTLE_MS = 5 * 60 * 1000;

/**
 * Whether an owner-triggered refresh is allowed right now.
 *
 * - `null` (never synced) → always allowed.
 * - An unparseable `lastSyncedAt` → fail OPEN (allowed). A corrupt timestamp
 *   is a data bug, not a reason to permanently brick refreshing for that
 *   project.
 * - Otherwise: allowed once at least `REFRESH_THROTTLE_MS` has elapsed
 *   (inclusive — exactly-at-the-boundary is allowed).
 */
export function canRefreshNow(lastSyncedAt: string | null, now: Date): boolean {
  if (lastSyncedAt === null) return true;

  const lastSynced = new Date(lastSyncedAt);
  if (Number.isNaN(lastSynced.getTime())) return true;

  return now.getTime() - lastSynced.getTime() >= REFRESH_THROTTLE_MS;
}

/**
 * Report rules — pure, zero IO, mirroring src/lib/ingest/policy.ts's shape.
 *
 * `project_reports` is deny-all (migration 0009, docs/plans/
 * p2.6-immune-system.md locked decision #1): RLS on, zero policies, zero
 * grants. Every read/write goes through the service-role client inside
 * `reportProject()` (src/app/(app)/u/[username]/[slug]/report-actions.ts) —
 * a client-write-under-RLS (the likes/saves pattern) would be forgeable and
 * brigade-visible for a table this moderation-sensitive. This module owns
 * only the shape/limit rules that action leans on; keeping it IO-free is
 * what makes it trivially unit-testable without a database.
 */

/** The five reasons a reporter can pick — mirrors `copy.reportReasons`' keys 1:1. */
export const REPORT_REASONS = ['spam', 'malware', 'not-a-project', 'abuse', 'other'] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/** Type guard for the `reason` form field — an unrecognized value is a bad request, not a 500. */
export function isReportReason(value: string): value is ReportReason {
  return (REPORT_REASONS as readonly string[]).includes(value);
}

/** Matches the note `Textarea`'s `maxLength` (report-button-island.tsx) — re-enforced
 * server-side since a client-set `maxLength` attribute is advisory only. */
export const REPORT_NOTE_MAX_CHARS = 500;

/**
 * Trims the optional note and collapses an empty/whitespace-only value to
 * `null` — the same null-vs-empty-string convention used elsewhere (e.g.
 * `updateProjectFields`'s `taglineRaw` in settings/projects/actions.ts): a
 * report with no context stores NULL, not `''`, so the admin queue can
 * render "no note" as an absence rather than a blank line.
 */
export function normalizeReportNote(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Five reports per reporter per rolling 24h window (docs/plans/
 * p2.6-immune-system.md locked decision #6). Generous enough that someone
 * flagging a genuine spam wave in one sitting never trips it; tight enough
 * that a single signed-in account can't be used to brigade-flag a target off
 * the admin queue's radar.
 */
export const REPORT_RATE_LIMIT_MAX = 5;

/** 24h in ms — the rolling window `reportProject` counts prior reports against. */
export const REPORT_RATE_LIMIT_WINDOW_MS = 86_400_000;

/**
 * `reportProject` counts reports already in the window BEFORE inserting the
 * new one, so `>=` (not `>`) is the correct boundary: a caller who already
 * has `REPORT_RATE_LIMIT_MAX` reports in-window has, by definition, used up
 * their budget — letting the count reach `MAX` exactly is what "reached"
 * means here, not "about to exceed it".
 */
export function reachedReportRateLimit(countInWindow: number): boolean {
  return countInWindow >= REPORT_RATE_LIMIT_MAX;
}

/**
 * How many open (unresolved) reports the admin queue renders AND the screen
 * engine's priority-1 selection reads. Shared so the two cannot drift (P2.7):
 * the screen engine used `Math.max(limit * 5, 50)` = 50 while the admin page
 * rendered 100, so reports 51-100 were visible to a human but never fed to
 * the AI triage that exists to prioritize them. Because `resolved_at` is only
 * ever set by a human, unresolved reports accumulate and keep the window
 * saturated — the same window-vs-population mismatch as P2.1/P2.6/P2.7.
 */
export const OPEN_REPORTS_WINDOW = 100;

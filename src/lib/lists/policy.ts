/**
 * List caps (P3-A, locked decision D10) — action-level count checks, not DB
 * constraints; a race past the cap is accepted v1 (same class as reorder
 * ties). Lives here rather than in the actions file because `'use server'`
 * modules may only export async functions (Next.js constraint — caught by
 * the production build, not tsc).
 */
export const LIST_CAP = 50;
export const ITEM_CAP = 400;

/** Cap on ids accepted per request — keeps the `.in('project_id', ids)` query bounded. */
export const MAX_IDS_PARAM = 100;

/**
 * Parses a comma-separated `ids` query param into a deduped, trimmed array.
 * Never throws — malformed or absent input just yields fewer/no ids, which
 * the caller (`/api/me/engagement`) treats as "empty overlay", not an error.
 */
export function parseIdsParam(raw: string | null): string[] {
  if (!raw) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const part of raw.split(',')) {
    if (out.length >= MAX_IDS_PARAM) break;
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }

  return out;
}

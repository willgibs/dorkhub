import type { FeedSort } from './queries';

/**
 * Pure path math for feed sort/tag chips (docs/plans/m5-discovery.md decision
 * 1: sort/tag live in the URL PATH, never query strings — `/`, `/trending`,
 * `/t/[tag]`, `/t/[tag]/trending`). No IO, no Next.js imports.
 */

function buildFeedPath(sort: FeedSort, tag: string | null): string {
  if (tag) {
    return sort === 'trending' ? `/t/${tag}/trending` : `/t/${tag}`;
  }
  return sort === 'trending' ? '/trending' : '/';
}

/**
 * Computes the href for a sort or tag chip relative to the current feed
 * state.
 * - `kind: 'sort'` — switches sort, keeps the current tag; `value` is the
 *   target sort ('recent' | 'trending'; anything else falls back to 'recent').
 * - `kind: 'tag'` — switches tag, keeps the current sort; clicking the
 *   ALREADY-ACTIVE tag toggles it off (back to untagged at the current sort)
 *   rather than re-applying it.
 */
export function feedHrefFor(
  current: { sort: FeedSort; tag: string | null },
  kind: 'sort' | 'tag',
  value: string,
): string {
  if (kind === 'sort') {
    const sort: FeedSort = value === 'trending' ? 'trending' : 'recent';
    return buildFeedPath(sort, current.tag);
  }

  const nextTag = current.tag === value ? null : value;
  return buildFeedPath(current.sort, nextTag);
}

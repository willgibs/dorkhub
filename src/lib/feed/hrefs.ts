import type { FeedSort } from './queries';

/**
 * Pure path math for feed sort/tag chips (docs/plans/m5-discovery.md decision
 * 1: sort/tag live in the URL PATH, never query strings). Trending is the
 * default sort (docs/plans/p2.5-self-running.md locked decision 9), so it
 * owns the bare path; 'recent' (chip label "newest") gets the `/newest`
 * suffix — `/`, `/newest`, `/t/[tag]`, `/t/[tag]/newest`.
 */

function buildFeedPath(sort: FeedSort, tag: string | null): string {
  if (tag) {
    // Tag routes carry trending + newest only (U2: 'active' is global-only
    // this round), so an active sort inside a tag falls back to the tag's
    // default rather than linking a route that doesn't exist.
    return sort === 'recent' ? `/t/${tag}/newest` : `/t/${tag}`;
  }
  if (sort === 'recent') return '/newest';
  return sort === 'active' ? '/active' : '/';
}

/**
 * Computes the href for a sort or tag chip relative to the current feed
 * state.
 * - `kind: 'sort'` — switches sort, keeps the current tag; `value` is the
 *   chip's copy label (copy.sortNewest -> 'recent', copy.sortActive ->
 *   'active'; anything else, including copy.sortTrending, falls back to
 *   'trending' — the default sort).
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
    const sort: FeedSort =
      value === 'newest' ? 'recent' : value === 'active' ? 'active' : 'trending';
    return buildFeedPath(sort, current.tag);
  }

  const nextTag = current.tag === value ? null : value;
  return buildFeedPath(current.sort, nextTag);
}

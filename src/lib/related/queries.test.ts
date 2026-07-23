import { describe, expect, it } from 'vitest';
import type { FeedRow } from '@/lib/feed/queries';
import { mergeRelatedRows } from './queries';

/** Minimal-but-typed FeedRow fixture — only `id` varies across tests. */
function makeRow(id: string): FeedRow {
  return {
    id,
    slug: `slug-${id}`,
    profile_id: 'profile-1',
    name: `project ${id}`,
    tagline: null,
    primary_language: 'TypeScript',
    stars_count: 0,
    forks_count: 0,
    license: null,
    demo_url: null,
    tags: [],
    screenshots: [],
    likes_count: 0,
    updated_at: '2026-07-01T00:00:00.000Z',
    published_at: '2026-07-01T00:00:00.000Z',
    trending_score: 0,
    repo_full_name: `owner/${id}`,
    profiles: {
      username: 'someone',
      display_name: null,
      avatar_url: null,
      followers_count: 0,
    },
  };
}

describe('mergeRelatedRows', () => {
  it('returns primary rows first, in their given order', () => {
    const primary = [makeRow('a'), makeRow('b')];
    const backfill = [makeRow('c')];
    expect(mergeRelatedRows(primary, backfill, 4).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('dedupes backfill rows already present in primary, by id', () => {
    const primary = [makeRow('a'), makeRow('b')];
    const backfill = [makeRow('b'), makeRow('c')];
    expect(mergeRelatedRows(primary, backfill, 4).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('caps the merged result at limit', () => {
    const primary = [makeRow('a'), makeRow('b'), makeRow('c')];
    const backfill = [makeRow('d'), makeRow('e')];
    const merged = mergeRelatedRows(primary, backfill, 4);
    expect(merged).toHaveLength(4);
    expect(merged.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('returns an empty array for empty inputs', () => {
    expect(mergeRelatedRows([], [], 4)).toEqual([]);
  });

  it('handles an empty primary with a non-empty backfill', () => {
    const backfill = [makeRow('x'), makeRow('y')];
    expect(mergeRelatedRows([], backfill, 4).map((r) => r.id)).toEqual(['x', 'y']);
  });

  it('handles a limit of 0', () => {
    expect(mergeRelatedRows([makeRow('a')], [makeRow('b')], 0)).toEqual([]);
  });
});

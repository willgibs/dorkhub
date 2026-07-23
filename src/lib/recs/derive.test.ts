import { describe, expect, it } from 'vitest';
import { buildExclusionSet, topTags } from './derive';

describe('topTags', () => {
  it('sorts by frequency desc', () => {
    const rows = [
      { tags: ['rust', 'cli'] },
      { tags: ['rust'] },
      { tags: ['cli'] },
      { tags: ['rust'] },
    ];
    expect(topTags(rows)).toEqual(['rust', 'cli']);
  });

  it('breaks ties alphabetically for determinism', () => {
    const rows = [{ tags: ['zebra', 'apple'] }, { tags: ['zebra', 'apple'] }];
    expect(topTags(rows)).toEqual(['apple', 'zebra']);
  });

  it('slices to n', () => {
    const rows = [{ tags: ['a', 'b', 'c', 'd', 'e', 'f'] }];
    expect(topTags(rows, 3)).toEqual(['a', 'b', 'c']);
  });

  it('defaults n to 5', () => {
    const rows = [{ tags: ['a', 'b', 'c', 'd', 'e', 'f'] }];
    expect(topTags(rows)).toHaveLength(5);
  });

  it('returns empty for no rows', () => {
    expect(topTags([])).toEqual([]);
  });

  it('returns empty when rows carry no tags', () => {
    expect(topTags([{ tags: [] }, { tags: [] }])).toEqual([]);
  });
});

describe('buildExclusionSet', () => {
  it('builds a set from ids', () => {
    const set = buildExclusionSet(['a', 'b', 'c']);
    expect(set.has('a')).toBe(true);
    expect(set.has('z')).toBe(false);
    expect(set.size).toBe(3);
  });

  it('caps at the given limit', () => {
    const ids = Array.from({ length: 150 }, (_, i) => `id-${i}`);
    const set = buildExclusionSet(ids, 100);
    expect(set.size).toBe(100);
    expect(set.has('id-0')).toBe(true);
    expect(set.has('id-99')).toBe(true);
    expect(set.has('id-100')).toBe(false);
  });

  it('defaults cap to 100', () => {
    const ids = Array.from({ length: 150 }, (_, i) => `id-${i}`);
    expect(buildExclusionSet(ids).size).toBe(100);
  });

  it('handles empty input', () => {
    expect(buildExclusionSet([]).size).toBe(0);
  });
});

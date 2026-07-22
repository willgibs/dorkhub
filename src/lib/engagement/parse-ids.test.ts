import { describe, expect, it } from 'vitest';
import { MAX_IDS_PARAM, parseIdsParam } from './parse-ids';

describe('parseIdsParam', () => {
  it('returns [] for null', () => {
    expect(parseIdsParam(null)).toEqual([]);
  });

  it('returns [] for an empty string', () => {
    expect(parseIdsParam('')).toEqual([]);
  });

  it('splits on commas', () => {
    expect(parseIdsParam('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('trims whitespace around each id', () => {
    expect(parseIdsParam(' a , b ,c ')).toEqual(['a', 'b', 'c']);
  });

  it('drops empty segments (leading/trailing/doubled commas)', () => {
    expect(parseIdsParam(',a,,b,')).toEqual(['a', 'b']);
  });

  it('drops segments that are whitespace-only', () => {
    expect(parseIdsParam('a,   ,b')).toEqual(['a', 'b']);
  });

  it('dedupes while preserving first-seen order', () => {
    expect(parseIdsParam('a,b,a,c,b')).toEqual(['a', 'b', 'c']);
  });

  it('a single id with no commas round-trips', () => {
    expect(parseIdsParam('only-one')).toEqual(['only-one']);
  });

  it('caps at MAX_IDS_PARAM, keeping the first ones seen', () => {
    const ids = Array.from({ length: 150 }, (_, i) => `id-${i}`);
    const result = parseIdsParam(ids.join(','));
    expect(result).toHaveLength(MAX_IDS_PARAM);
    expect(result).toEqual(ids.slice(0, MAX_IDS_PARAM));
  });

  it('cap applies after dedupe (duplicates before the cap do not consume a slot)', () => {
    const unique = Array.from({ length: 100 }, (_, i) => `id-${i}`);
    // Interleave duplicates of the first id — should not push a unique id past the cap.
    const raw = `${unique[0]},${unique.join(',')}`;
    const result = parseIdsParam(raw);
    expect(result).toHaveLength(MAX_IDS_PARAM);
    expect(result).toEqual(unique);
  });

  it('never throws on garbage input', () => {
    const cases = [',,,', '   ', '\t\n', ',', 'a,'.repeat(500)];
    for (const raw of cases) {
      expect(() => parseIdsParam(raw)).not.toThrow();
    }
  });
});

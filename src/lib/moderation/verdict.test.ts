import { describe, expect, it } from 'vitest';
import { sortByVerdict, type Verdict, verdictLabel, verdictRank } from './verdict';

describe('verdictRank — triage ordering', () => {
  it('flagged ranks before review', () => {
    expect(verdictRank('flagged')).toBeLessThan(verdictRank('review'));
  });

  it('review ranks before unscreened (null)', () => {
    expect(verdictRank('review')).toBeLessThan(verdictRank(null));
  });

  it('unscreened (null) ranks before ok', () => {
    expect(verdictRank(null)).toBeLessThan(verdictRank('ok'));
  });

  it('full locked order: flagged < review < null < ok', () => {
    expect(verdictRank('flagged')).toBe(0);
    expect(verdictRank('review')).toBe(1);
    expect(verdictRank(null)).toBe(2);
    expect(verdictRank('ok')).toBe(3);
  });
});

describe('sortByVerdict', () => {
  it('sorts mixed input ascending by verdict rank', () => {
    const rows: { id: string; verdict: Verdict | null }[] = [
      { id: 'a', verdict: 'ok' },
      { id: 'b', verdict: 'flagged' },
      { id: 'c', verdict: null },
      { id: 'd', verdict: 'review' },
    ];
    const sorted = sortByVerdict(rows, (row) => row.verdict);
    expect(sorted.map((row) => row.id)).toEqual(['b', 'd', 'c', 'a']);
  });

  it('preserves original relative order within the same verdict (stability)', () => {
    const rows = [
      { id: 'first', verdict: 'flagged' as const },
      { id: 'second', verdict: 'flagged' as const },
      { id: 'third', verdict: 'flagged' as const },
    ];
    const sorted = sortByVerdict(rows, (row) => row.verdict);
    expect(sorted.map((row) => row.id)).toEqual(['first', 'second', 'third']);
  });

  it('does not mutate the input array', () => {
    const rows: { id: string; verdict: Verdict | null }[] = [
      { id: 'a', verdict: 'ok' },
      { id: 'b', verdict: 'flagged' },
    ];
    const original = [...rows];
    sortByVerdict(rows, (row) => row.verdict);
    expect(rows).toEqual(original);
  });

  it('returns an empty array for empty input', () => {
    expect(sortByVerdict([], (row: { verdict: Verdict | null }) => row.verdict)).toEqual([]);
  });
});

describe('verdictLabel', () => {
  it('labels flagged', () => {
    expect(verdictLabel('flagged')).toBe('flagged');
  });

  it('labels review', () => {
    expect(verdictLabel('review')).toBe('review');
  });

  it('labels ok', () => {
    expect(verdictLabel('ok')).toBe('ok');
  });

  it('labels null as unscreened', () => {
    expect(verdictLabel(null)).toBe('unscreened');
  });
});

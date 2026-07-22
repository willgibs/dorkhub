import { describe, expect, it } from 'vitest';
import { encodeRecentCursor, encodeTrendingCursor } from './cursor';
import { FEED_PAGE_SIZE, FEED_PAGE_SIZE_MAX, resolveFeedFilterSpec } from './queries';

describe('resolveFeedFilterSpec — sort', () => {
  it('defaults to "recent" when sort is missing', () => {
    expect(resolveFeedFilterSpec({}).sort).toBe('recent');
  });

  it('accepts "trending"', () => {
    expect(resolveFeedFilterSpec({ sort: 'trending' }).sort).toBe('trending');
  });

  it('falls back to "recent" for any unrecognized value', () => {
    expect(resolveFeedFilterSpec({ sort: 'popular' }).sort).toBe('recent');
    expect(resolveFeedFilterSpec({ sort: null }).sort).toBe('recent');
    expect(resolveFeedFilterSpec({ sort: '' }).sort).toBe('recent');
  });
});

describe('resolveFeedFilterSpec — limit clamp/default', () => {
  it('defaults to FEED_PAGE_SIZE when missing', () => {
    expect(resolveFeedFilterSpec({}).limit).toBe(FEED_PAGE_SIZE);
    expect(resolveFeedFilterSpec({ limit: null }).limit).toBe(FEED_PAGE_SIZE);
    expect(resolveFeedFilterSpec({ limit: undefined }).limit).toBe(FEED_PAGE_SIZE);
  });

  it('defaults to FEED_PAGE_SIZE for a non-numeric string', () => {
    expect(resolveFeedFilterSpec({ limit: 'abc' }).limit).toBe(FEED_PAGE_SIZE);
  });

  it('parses a numeric string', () => {
    expect(resolveFeedFilterSpec({ limit: '10' }).limit).toBe(10);
  });

  it('clamps below 1 up to 1', () => {
    expect(resolveFeedFilterSpec({ limit: 0 }).limit).toBe(1);
    expect(resolveFeedFilterSpec({ limit: -5 }).limit).toBe(1);
  });

  it('clamps above FEED_PAGE_SIZE_MAX down to the max', () => {
    expect(resolveFeedFilterSpec({ limit: 1000 }).limit).toBe(FEED_PAGE_SIZE_MAX);
  });

  it('passes an in-range value through untouched', () => {
    expect(resolveFeedFilterSpec({ limit: FEED_PAGE_SIZE_MAX }).limit).toBe(FEED_PAGE_SIZE_MAX);
    expect(resolveFeedFilterSpec({ limit: 1 }).limit).toBe(1);
  });

  it('truncates a fractional value', () => {
    expect(resolveFeedFilterSpec({ limit: 12.9 }).limit).toBe(12);
  });
});

describe('resolveFeedFilterSpec — tag/language normalize', () => {
  it('trims and lowercases tag', () => {
    expect(resolveFeedFilterSpec({ tag: '  Audio  ' }).tag).toBe('audio');
  });

  it('trims and lowercases language', () => {
    expect(resolveFeedFilterSpec({ language: '  TypeScript  ' }).language).toBe('typescript');
  });

  it('maps empty/whitespace-only tag and language to null', () => {
    expect(resolveFeedFilterSpec({ tag: '' }).tag).toBeNull();
    expect(resolveFeedFilterSpec({ tag: '   ' }).tag).toBeNull();
    expect(resolveFeedFilterSpec({ language: '' }).language).toBeNull();
  });

  it('maps missing/null tag and language to null', () => {
    expect(resolveFeedFilterSpec({}).tag).toBeNull();
    expect(resolveFeedFilterSpec({ tag: null }).tag).toBeNull();
    expect(resolveFeedFilterSpec({}).language).toBeNull();
    expect(resolveFeedFilterSpec({ language: null }).language).toBeNull();
  });
});

describe('resolveFeedFilterSpec — cursor decode per sort', () => {
  it('round-trips a recent cursor under sort "recent"', () => {
    const raw = encodeRecentCursor('2026-07-21T00:00:00.000Z', 'project-1');
    const spec = resolveFeedFilterSpec({ sort: 'recent', cursor: raw });
    expect(spec.cursor).toEqual(['2026-07-21T00:00:00.000Z', 'project-1']);
  });

  it('round-trips a trending cursor under sort "trending"', () => {
    const raw = encodeTrendingCursor(42.5, 'project-2');
    const spec = resolveFeedFilterSpec({ sort: 'trending', cursor: raw });
    expect(spec.cursor).toEqual([42.5, 'project-2']);
  });

  it('missing cursor decodes to null (first page)', () => {
    expect(resolveFeedFilterSpec({ sort: 'recent' }).cursor).toBeNull();
    expect(resolveFeedFilterSpec({ sort: 'trending', cursor: null }).cursor).toBeNull();
  });

  it('garbage cursor decodes to null regardless of sort', () => {
    expect(resolveFeedFilterSpec({ sort: 'recent', cursor: '!!!garbage!!!' }).cursor).toBeNull();
    expect(resolveFeedFilterSpec({ sort: 'trending', cursor: '!!!garbage!!!' }).cursor).toBeNull();
  });

  it('a trending-shaped cursor decoded under sort "recent" is null (wrong-sort payload)', () => {
    const trendingRaw = encodeTrendingCursor(9.5, 'project-3');
    expect(resolveFeedFilterSpec({ sort: 'recent', cursor: trendingRaw }).cursor).toBeNull();
  });

  it('a recent-shaped cursor decoded under sort "trending" is null (wrong-sort payload)', () => {
    const recentRaw = encodeRecentCursor('2026-07-21T00:00:00.000Z', 'project-4');
    expect(resolveFeedFilterSpec({ sort: 'trending', cursor: recentRaw }).cursor).toBeNull();
  });
});

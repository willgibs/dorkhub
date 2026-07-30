import { describe, expect, it } from 'vitest';
import { encodeRecentCursor, encodeTrendingCursor } from './cursor';
import {
  buildFeedRpcArgs,
  FEED_PAGE_SIZE,
  FEED_PAGE_SIZE_MAX,
  type FeedFilterSpec,
  type FeedPageRpcRow,
  flattenedToFeedRow,
  resolveFeedFilterSpec,
} from './queries';

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
  // Uuid-shaped since P2.7 — the id element reaches a PostgREST `.or()` filter.
  const PROJECT_1 = 'b2000000-0000-4000-8000-000000000001';
  const PROJECT_2 = 'b2000000-0000-4000-8000-000000000002';

  it('round-trips a recent cursor under sort "recent"', () => {
    const raw = encodeRecentCursor('2026-07-21T00:00:00.000Z', PROJECT_1);
    const spec = resolveFeedFilterSpec({ sort: 'recent', cursor: raw });
    expect(spec.cursor).toEqual(['2026-07-21T00:00:00.000Z', PROJECT_1]);
  });

  it('round-trips a trending cursor under sort "trending"', () => {
    const raw = encodeTrendingCursor(42.5, PROJECT_2);
    const spec = resolveFeedFilterSpec({ sort: 'trending', cursor: raw });
    expect(spec.cursor).toEqual([42.5, PROJECT_2]);
  });

  it('a tampered cursor falls back to the first page rather than an empty feed', () => {
    // Pre-P2.7 this decoded fine and the junk reached `buildFeedQuery`'s
    // `.or(...)`, so /api/feed answered 200 with zero rows.
    const raw = encodeRecentCursor('2026-07-21T00:00:00.000Z', 'zzz),(id.not.is.null');
    expect(resolveFeedFilterSpec({ sort: 'recent', cursor: raw }).cursor).toBeNull();
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

/**
 * The language filter was DEAD from M5 until migration 0012:
 * `resolveFeedFilterSpec` lowercases the incoming value (correct — URL and
 * cache-key hygiene) and `buildFeedQuery` then exact-matched
 * `primary_language`, which stores GitHub's casing ("TypeScript"). Verified on
 * prod immediately before the fix: `/api/feed?language=` returned 0 rows for
 * EVERY casing, against 76 published TypeScript projects. The fix is the
 * generated `language_slug` column; these pin the contract that made it dead,
 * so a future refactor can't quietly re-introduce a casing mismatch.
 */
describe('language filter — the normalizer and the column must agree on case', () => {
  it('normalizes every casing to the same lowercase key', () => {
    for (const raw of ['TypeScript', 'typescript', 'TYPESCRIPT', '  TypeScript  ']) {
      expect(resolveFeedFilterSpec({ language: raw }).language).toBe('typescript');
    }
  });

  it('preserves languages a slugify would collide (C# vs C++ both slug to "c-")', () => {
    // lower() keeps these distinct, which is why 0012 uses it rather than a
    // slugify — probed against live data before choosing.
    expect(resolveFeedFilterSpec({ language: 'C#' }).language).toBe('c#');
    expect(resolveFeedFilterSpec({ language: 'C++' }).language).toBe('c++');
    expect(resolveFeedFilterSpec({ language: 'C#' }).language).not.toBe(
      resolveFeedFilterSpec({ language: 'C++' }).language,
    );
  });

  it('keeps multi-word languages intact (Jupyter Notebook)', () => {
    expect(resolveFeedFilterSpec({ language: 'Jupyter Notebook' }).language).toBe(
      'jupyter notebook',
    );
  });
});

/**
 * P3-C C1: the feed reads through the `feed_page` RPC — typed args, no
 * interpolated filter strings. These pin the arg mapping the SQL side
 * branches on, because a wrong/missing key silently degrades (an omitted
 * cursor = page 1 forever; an omitted filter = unfiltered feed) rather than
 * erroring — the hardest bug class in this codebase.
 */
describe('buildFeedRpcArgs — typed args are the filter boundary', () => {
  const PROJECT_1 = 'b2000000-0000-4000-8000-000000000001';
  const base: FeedFilterSpec = {
    sort: 'trending',
    limit: 24,
    tag: null,
    language: null,
    cursor: null,
  };

  it('always requests limit + 1 (the nextCursor look-ahead row)', () => {
    expect(buildFeedRpcArgs(base, null).p_limit).toBe(25);
  });

  it('omits absent filters entirely — the SQL builds only the predicates it receives', () => {
    expect(buildFeedRpcArgs(base, null)).toEqual({ p_sort: 'trending', p_limit: 25 });
  });

  it('maps a trending cursor to score + id and never sets the recent slot', () => {
    const args = buildFeedRpcArgs({ ...base, cursor: [42.5, PROJECT_1] }, null);
    expect(args.p_cursor_score).toBe(42.5);
    expect(args.p_cursor_id).toBe(PROJECT_1);
    expect('p_cursor_at' in args).toBe(false);
  });

  it('maps a recent cursor to at + id and never sets the trending slot', () => {
    const args = buildFeedRpcArgs(
      { ...base, sort: 'recent', cursor: ['2026-07-21T00:00:00.000Z', PROJECT_1] },
      null,
    );
    expect(args.p_cursor_at).toBe('2026-07-21T00:00:00.000Z');
    expect(args.p_cursor_id).toBe(PROJECT_1);
    expect('p_cursor_score' in args).toBe(false);
  });

  it('passes tag, language, and followees through', () => {
    const args = buildFeedRpcArgs({ ...base, tag: 'cli', language: 'rust' }, [PROJECT_1]);
    expect(args.p_tag).toBe('cli');
    expect(args.p_language).toBe('rust');
    expect(args.p_profile_ids).toEqual([PROJECT_1]);
  });

  it('null followees omits p_profile_ids (null = unfiltered in SQL; empty must short-circuit upstream)', () => {
    expect('p_profile_ids' in buildFeedRpcArgs(base, null)).toBe(false);
  });
});

describe('flattenedToFeedRow — re-nests the RPC row into the embed shape', () => {
  const flat: FeedPageRpcRow = {
    id: 'b2000000-0000-4000-8000-000000000009',
    slug: 'demo',
    profile_id: 'b2000000-0000-4000-8000-000000000002',
    name: 'demo',
    tagline: null,
    primary_language: 'Rust',
    stars_count: 12,
    forks_count: 3,
    license: 'MIT',
    demo_url: null,
    tags: ['cli'],
    screenshots: [],
    likes_count: 0,
    lists_count: 0,
    updated_at: '2026-07-01T00:00:00+00:00',
    github_pushed_at: null,
    published_at: '2026-06-01T00:00:00+00:00',
    trending_score: 39660.5,
    repo_full_name: 'demo/demo',
    author_username: 'someone',
    author_display_name: null,
    author_avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
    author_followers_count: 7,
  };

  it('moves author_* under profiles and keeps every project column', () => {
    const row = flattenedToFeedRow(flat);
    expect(row.profiles).toEqual({
      username: 'someone',
      display_name: null,
      avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
      followers_count: 7,
    });
    expect(row.trending_score).toBe(39660.5);
    expect(row.published_at).toBe('2026-06-01T00:00:00+00:00');
    // The flat author fields must NOT survive on the nested row — feed
    // consumers spread rows into card props.
    expect('author_username' in row).toBe(false);
  });
});

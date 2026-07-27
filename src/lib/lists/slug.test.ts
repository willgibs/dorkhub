import { describe, expect, it } from 'vitest';
import { MAX_SLUG_ATTEMPTS, nextListSlugCandidate } from './slug';

describe('nextListSlugCandidate', () => {
  it('attempt 0 returns the base slug unchanged', () => {
    expect(nextListSlugCandidate('my-list', 0)).toBe('my-list');
  });

  it('attempt 1 returns base-2', () => {
    expect(nextListSlugCandidate('my-list', 1)).toBe('my-list-2');
  });

  it('attempt 4 (the last of MAX_SLUG_ATTEMPTS) returns base-5', () => {
    expect(nextListSlugCandidate('my-list', 4)).toBe('my-list-5');
  });

  it('MAX_SLUG_ATTEMPTS is 5, matching base..base-5', () => {
    expect(MAX_SLUG_ATTEMPTS).toBe(5);
  });

  // An empty base is not a real-world input — `slugify(name, 'list')` always
  // returns a non-empty string — but the helper is pure string suffixing and
  // doesn't special-case it: attempt 1 on '' still suffixes to '-2'.
  it('an empty base still suffixes (not a real input in practice — slugify guarantees non-empty)', () => {
    expect(nextListSlugCandidate('', 1)).toBe('-2');
  });
});

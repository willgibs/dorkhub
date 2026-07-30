import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  hashClientIp,
  interpretSearchClaim,
  SEARCH_RATE_LIMIT_MAX_DEFAULT,
  searchRateLimitMax,
} from './rate-limit';

describe('searchRateLimitMax', () => {
  const saved = process.env.SEARCH_RATE_LIMIT_MAX;
  beforeEach(() => {
    delete process.env.SEARCH_RATE_LIMIT_MAX;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.SEARCH_RATE_LIMIT_MAX;
    else process.env.SEARCH_RATE_LIMIT_MAX = saved;
  });

  it('defaults when unset or blank', () => {
    expect(searchRateLimitMax()).toBe(SEARCH_RATE_LIMIT_MAX_DEFAULT);
    process.env.SEARCH_RATE_LIMIT_MAX = '   ';
    expect(searchRateLimitMax()).toBe(SEARCH_RATE_LIMIT_MAX_DEFAULT);
  });

  it('parses a real ceiling', () => {
    process.env.SEARCH_RATE_LIMIT_MAX = '120';
    expect(searchRateLimitMax()).toBe(120);
  });

  it('respects 0 as a kill-switch (search off)', () => {
    process.env.SEARCH_RATE_LIMIT_MAX = '0';
    expect(searchRateLimitMax()).toBe(0);
  });

  it('degrades junk and negatives to the default', () => {
    // NOTE deliberately absent: '1e309' — parseInt reads it as 1 (stops at
    // the 'e'), which is a real ceiling, not junk.
    for (const junk of ['abc', '-5', 'NaN', 'Infinity']) {
      process.env.SEARCH_RATE_LIMIT_MAX = junk;
      expect(searchRateLimitMax()).toBe(SEARCH_RATE_LIMIT_MAX_DEFAULT);
    }
  });
});

describe('hashClientIp', () => {
  it('hashes the leftmost x-forwarded-for entry only', () => {
    const direct = hashClientIp('203.0.113.9');
    const chained = hashClientIp('203.0.113.9, 10.0.0.1, 172.16.0.1');
    expect(chained).toBe(direct);
  });

  it('trims whitespace around the client entry', () => {
    expect(hashClientIp('  203.0.113.9 , 10.0.0.1')).toBe(hashClientIp('203.0.113.9'));
  });

  it('is a stable 64-char hex digest, never the raw ip', () => {
    const hash = hashClientIp('203.0.113.9');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain('203');
    expect(hashClientIp('203.0.113.9')).toBe(hash);
  });

  it('buckets a missing or empty header under one sentinel', () => {
    expect(hashClientIp(null)).toBe(hashClientIp(''));
    expect(hashClientIp(null)).toBe(hashClientIp('   '));
    expect(hashClientIp(null)).not.toBe(hashClientIp('203.0.113.9'));
  });
});

describe('interpretSearchClaim (FAIL-OPEN — inverse of the AI budget)', () => {
  it('limits only on a literal false', () => {
    expect(interpretSearchClaim(false, null)).toBe('limited');
  });

  it('allows on true', () => {
    expect(interpretSearchClaim(true, null)).toBe('ok');
  });

  it('allows when the ledger errors (fail-open)', () => {
    expect(interpretSearchClaim(null, { message: 'connection refused' })).toBe('ok');
    // Even a false payload next to an error allows — an errored call proves
    // nothing about the window, and availability wins here.
    expect(interpretSearchClaim(false, { message: 'timeout' })).toBe('ok');
  });

  it('allows on malformed payloads', () => {
    for (const weird of [null, undefined, 0, 1, 'false', {}, []]) {
      expect(interpretSearchClaim(weird, null)).toBe('ok');
    }
  });
});

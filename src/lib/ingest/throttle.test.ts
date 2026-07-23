import { describe, expect, it } from 'vitest';
import { nextCrawlDelayMs, SEARCH_BUCKET_DELAY_MS } from './throttle';

describe('nextCrawlDelayMs', () => {
  it('returns the base delay with zero consecutive errors', () => {
    expect(nextCrawlDelayMs(0)).toBe(SEARCH_BUCKET_DELAY_MS);
    expect(nextCrawlDelayMs(0)).toBe(2500);
  });

  it('doubles the base delay after one consecutive error', () => {
    expect(nextCrawlDelayMs(1)).toBe(5000);
  });

  it('applies exponential ×2 growth after three consecutive errors', () => {
    expect(nextCrawlDelayMs(3)).toBe(20_000);
  });

  it('caps at 60_000ms after ten consecutive errors, well past the uncapped value', () => {
    expect(nextCrawlDelayMs(10)).toBe(60_000);
  });

  it('is capped at exactly 60_000ms, never higher', () => {
    expect(nextCrawlDelayMs(4)).toBeLessThanOrEqual(60_000);
    expect(nextCrawlDelayMs(20)).toBe(60_000);
    expect(nextCrawlDelayMs(100)).toBe(60_000);
  });

  it('finds the exact boundary where the cap first applies', () => {
    // 2500 * 2^4 = 40_000 (under cap); 2500 * 2^5 = 80_000 (over cap, clamped).
    expect(nextCrawlDelayMs(4)).toBe(40_000);
    expect(nextCrawlDelayMs(5)).toBe(60_000);
  });
});

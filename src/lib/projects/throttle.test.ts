import { describe, expect, it } from 'vitest';
import { canRefreshNow, REFRESH_THROTTLE_MS } from './throttle';

const NOW = new Date('2026-07-22T12:00:00.000Z');

describe('canRefreshNow', () => {
  it('allows a refresh when never synced (null)', () => {
    expect(canRefreshNow(null, NOW)).toBe(true);
  });

  it('allows a refresh exactly at the throttle boundary (>= semantics)', () => {
    const lastSyncedAt = new Date(NOW.getTime() - REFRESH_THROTTLE_MS).toISOString();
    expect(canRefreshNow(lastSyncedAt, NOW)).toBe(true);
  });

  it('blocks a refresh 1ms before the throttle boundary', () => {
    const lastSyncedAt = new Date(NOW.getTime() - REFRESH_THROTTLE_MS + 1).toISOString();
    expect(canRefreshNow(lastSyncedAt, NOW)).toBe(false);
  });

  it('allows a refresh well after the throttle window', () => {
    const lastSyncedAt = new Date(NOW.getTime() - REFRESH_THROTTLE_MS * 10).toISOString();
    expect(canRefreshNow(lastSyncedAt, NOW)).toBe(true);
  });

  it('blocks a refresh immediately after syncing (0ms elapsed)', () => {
    expect(canRefreshNow(NOW.toISOString(), NOW)).toBe(false);
  });

  it('fails open (allows) on an unparseable timestamp — a broken value should not brick refresh', () => {
    expect(canRefreshNow('not-a-date', NOW)).toBe(true);
    expect(canRefreshNow('', NOW)).toBe(true);
  });
});

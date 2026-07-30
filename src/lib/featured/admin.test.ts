import { describe, expect, it } from 'vitest';

import { parseProjectRef, resolveSlotWindow, slotStatus } from './admin';

describe('parseProjectRef', () => {
  it('accepts a full project URL on any host', () => {
    expect(parseProjectRef('https://dorkhub.com/u/jason-ro/webflow-git')).toEqual({
      username: 'jason-ro',
      slug: 'webflow-git',
    });
    expect(parseProjectRef('http://localhost:3000/u/a/b')).toEqual({ username: 'a', slug: 'b' });
  });

  it('accepts an absolute path and a bare pair', () => {
    expect(parseProjectRef('/u/molly/synth')).toEqual({ username: 'molly', slug: 'synth' });
    expect(parseProjectRef('molly/synth')).toEqual({ username: 'molly', slug: 'synth' });
  });

  it('trims and rejects garbage rather than guessing', () => {
    expect(parseProjectRef('  molly/synth  ')).toEqual({ username: 'molly', slug: 'synth' });
    for (const bad of ['', '   ', 'justone', '/u/only', 'a/b/c/d', 'https://[bad', '/u/a/b/c']) {
      expect(parseProjectRef(bad)).toBeNull();
    }
  });
});

describe('resolveSlotWindow', () => {
  const now = new Date('2026-07-30T12:00:00Z');

  it('returns ISO strings for a valid window', () => {
    const result = resolveSlotWindow('2026-07-30T13:00', '2026-08-06T13:00', now);
    expect('startsAt' in result && result.startsAt.endsWith('Z')).toBe(true);
  });

  it('rejects unparseable, inverted, and already-over windows', () => {
    expect(resolveSlotWindow('nope', '2026-08-06T13:00', now)).toHaveProperty('error');
    expect(resolveSlotWindow('2026-08-06T13:00', '2026-07-30T13:00', now)).toHaveProperty('error');
    expect(resolveSlotWindow('2026-07-01T00:00', '2026-07-02T00:00', now)).toHaveProperty('error');
  });

  it('allows an already-RUNNING window (starts past, ends future)', () => {
    const result = resolveSlotWindow('2026-07-29T00:00', '2026-08-06T00:00', now);
    expect('startsAt' in result).toBe(true);
  });
});

describe('slotStatus', () => {
  const now = new Date('2026-07-30T12:00:00Z');
  it('classifies scheduled / active / ended', () => {
    expect(slotStatus('2026-08-01T00:00:00Z', '2026-08-08T00:00:00Z', now)).toBe('scheduled');
    expect(slotStatus('2026-07-29T00:00:00Z', '2026-08-01T00:00:00Z', now)).toBe('active');
    expect(slotStatus('2026-07-01T00:00:00Z', '2026-07-02T00:00:00Z', now)).toBe('ended');
  });
});

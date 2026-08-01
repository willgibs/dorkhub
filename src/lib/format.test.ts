import { describe, expect, it } from 'vitest';

import { formatCount } from './format';

describe('formatCount', () => {
  it('leaves counts under a thousand alone', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(1)).toBe('1');
    expect(formatCount(999)).toBe('999');
  });

  it('switches to k with one decimal below ten thousand', () => {
    expect(formatCount(1000)).toBe('1k');
    expect(formatCount(1200)).toBe('1.2k');
    expect(formatCount(9949)).toBe('9.9k');
  });

  it('drops the decimal at ten thousand and above', () => {
    expect(formatCount(10_000)).toBe('10k');
    expect(formatCount(52_900)).toBe('53k');
    expect(formatCount(1_200_000)).toBe('1200k');
  });
});

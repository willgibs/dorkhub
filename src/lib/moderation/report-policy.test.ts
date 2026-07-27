import { describe, expect, it } from 'vitest';
import {
  isReportReason,
  normalizeReportNote,
  REPORT_REASONS,
  reachedReportRateLimit,
} from './report-policy';

describe('isReportReason', () => {
  it.each(REPORT_REASONS)('accepts %s as a valid reason', (reason) => {
    expect(isReportReason(reason)).toBe(true);
  });

  it('rejects an unrecognized reason', () => {
    expect(isReportReason('malicious')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isReportReason('')).toBe(false);
  });

  it('is case-sensitive — rejects an uppercase variant', () => {
    expect(isReportReason('SPAM')).toBe(false);
  });
});

describe('normalizeReportNote', () => {
  it('collapses an empty string to null', () => {
    expect(normalizeReportNote('')).toBeNull();
  });

  it('collapses whitespace-only input to null', () => {
    expect(normalizeReportNote('   ')).toBeNull();
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeReportNote('  looks like a scam  ')).toBe('looks like a scam');
  });

  it('passes already-clean text through as-is', () => {
    expect(normalizeReportNote('spammy fork farm')).toBe('spammy fork farm');
  });
});

describe('reachedReportRateLimit — boundary at 5', () => {
  it('0 in window → not reached', () => {
    expect(reachedReportRateLimit(0)).toBe(false);
  });

  it('4 in window → not reached', () => {
    expect(reachedReportRateLimit(4)).toBe(false);
  });

  it('5 in window → reached (>= semantics)', () => {
    expect(reachedReportRateLimit(5)).toBe(true);
  });

  it('6 in window → reached', () => {
    expect(reachedReportRateLimit(6)).toBe(true);
  });
});

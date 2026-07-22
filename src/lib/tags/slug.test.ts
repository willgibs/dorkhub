import { describe, expect, it } from 'vitest';
import { resolveTagSlug } from './slug';

describe('resolveTagSlug', () => {
  it('accepts a well-formed lowercase slug', () => {
    expect(resolveTagSlug('audio')).toBe('audio');
  });

  it('accepts a hyphenated slug', () => {
    expect(resolveTagSlug('web-audio')).toBe('web-audio');
  });

  it('lowercases before validating', () => {
    expect(resolveTagSlug('TypeScript')).toBe('typescript');
  });

  it('rejects leading/trailing hyphens', () => {
    expect(resolveTagSlug('-audio')).toBeNull();
    expect(resolveTagSlug('audio-')).toBeNull();
  });

  it('rejects consecutive hyphens', () => {
    expect(resolveTagSlug('web--audio')).toBeNull();
  });

  it('rejects spaces and punctuation', () => {
    expect(resolveTagSlug('web audio')).toBeNull();
    expect(resolveTagSlug('c++')).toBeNull();
    expect(resolveTagSlug('audio!')).toBeNull();
  });

  it('rejects an empty string', () => {
    expect(resolveTagSlug('')).toBeNull();
  });
});

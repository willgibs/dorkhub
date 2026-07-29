import { describe, expect, it } from 'vitest';
import { githubAvatarUrl, isAllowedAvatarUrl } from './avatars';

/**
 * `avatar_url` reaches the DB through service-role code only, so
 * `isAllowedAvatarUrl` is the whole defense for that column. `githubAvatarUrl`
 * therefore BUILDS a url and then validates it, rather than trusting a
 * string-concat — these tests pin that it actually routes through the gate.
 */
describe('githubAvatarUrl', () => {
  it('derives the avatar from the immutable numeric id (no API call, survives renames)', () => {
    expect(githubAvatarUrl(583231)).toBe('https://avatars.githubusercontent.com/u/583231?s=200');
  });

  it('produces a url that passes the allowlist', () => {
    const url = githubAvatarUrl(1);
    expect(url).not.toBeNull();
    expect(isAllowedAvatarUrl(url as string)).toBe(true);
  });

  it('handles a large id without exponent notation sneaking into the path', () => {
    const url = githubAvatarUrl(9_000_000_000);
    expect(url).toContain('/u/9000000000?');
    expect(url).not.toContain('e+');
  });
});

describe('isAllowedAvatarUrl — the gate githubAvatarUrl relies on', () => {
  it('accepts the GitHub avatar CDN over https', () => {
    expect(isAllowedAvatarUrl('https://avatars.githubusercontent.com/u/1?s=200')).toBe(true);
  });

  it('rejects http, look-alike hosts, and non-urls', () => {
    expect(isAllowedAvatarUrl('http://avatars.githubusercontent.com/u/1')).toBe(false);
    expect(isAllowedAvatarUrl('https://avatars.githubusercontent.com.evil.test/u/1')).toBe(false);
    expect(isAllowedAvatarUrl('https://evil.test/u/1')).toBe(false);
    expect(isAllowedAvatarUrl('not-a-url')).toBe(false);
    expect(isAllowedAvatarUrl('')).toBe(false);
  });

  it('rejects javascript: and data: payloads', () => {
    expect(isAllowedAvatarUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedAvatarUrl('data:image/svg+xml;base64,AAAA')).toBe(false);
  });
});

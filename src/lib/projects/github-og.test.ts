import { describe, expect, it } from 'vitest';
import { githubOgImageUrl } from './github-og';

describe('githubOgImageUrl', () => {
  it('builds the opengraph.githubassets.com URL for a normal owner/repo', () => {
    expect(githubOgImageUrl('vercel/next.js')).toBe(
      'https://opengraph.githubassets.com/dorkhub/vercel/next.js',
    );
  });

  it('URL-encodes each path segment defensively', () => {
    expect(githubOgImageUrl('some owner/some repo#1')).toBe(
      'https://opengraph.githubassets.com/dorkhub/some%20owner/some%20repo%231',
    );
  });
});

import { describe, expect, it } from 'vitest';
import { feedHrefFor } from './hrefs';

describe('feedHrefFor — sort chips (keep current tag)', () => {
  it('recent, no tag -> trending -> "/trending"', () => {
    expect(feedHrefFor({ sort: 'recent', tag: null }, 'sort', 'trending')).toBe('/trending');
  });

  it('trending, no tag -> recent -> "/"', () => {
    expect(feedHrefFor({ sort: 'trending', tag: null }, 'sort', 'recent')).toBe('/');
  });

  it('recent, no tag -> recent (no-op) -> "/"', () => {
    expect(feedHrefFor({ sort: 'recent', tag: null }, 'sort', 'recent')).toBe('/');
  });

  it('recent, tagged -> trending -> "/t/x/trending"', () => {
    expect(feedHrefFor({ sort: 'recent', tag: 'audio' }, 'sort', 'trending')).toBe(
      '/t/audio/trending',
    );
  });

  it('trending, tagged -> recent -> "/t/x"', () => {
    expect(feedHrefFor({ sort: 'trending', tag: 'audio' }, 'sort', 'recent')).toBe('/t/audio');
  });

  it('trending, tagged -> trending (no-op) -> "/t/x/trending"', () => {
    expect(feedHrefFor({ sort: 'trending', tag: 'audio' }, 'sort', 'trending')).toBe(
      '/t/audio/trending',
    );
  });

  it('unrecognized sort value falls back to "recent"', () => {
    expect(feedHrefFor({ sort: 'trending', tag: null }, 'sort', 'bogus')).toBe('/');
  });
});

describe('feedHrefFor — tag chips (keep current sort)', () => {
  it('recent, no tag -> tag "audio" -> "/t/audio"', () => {
    expect(feedHrefFor({ sort: 'recent', tag: null }, 'tag', 'audio')).toBe('/t/audio');
  });

  it('trending, no tag -> tag "audio" -> "/t/audio/trending"', () => {
    expect(feedHrefFor({ sort: 'trending', tag: null }, 'tag', 'audio')).toBe('/t/audio/trending');
  });

  it('recent, tagged "audio" -> different tag "toy" -> "/t/toy"', () => {
    expect(feedHrefFor({ sort: 'recent', tag: 'audio' }, 'tag', 'toy')).toBe('/t/toy');
  });

  it('trending, tagged "audio" -> different tag "toy" -> "/t/toy/trending"', () => {
    expect(feedHrefFor({ sort: 'trending', tag: 'audio' }, 'tag', 'toy')).toBe('/t/toy/trending');
  });
});

describe('feedHrefFor — active-tag toggle-off', () => {
  it('recent, tagged "audio" -> click "audio" again -> "/" (untagged, same sort)', () => {
    expect(feedHrefFor({ sort: 'recent', tag: 'audio' }, 'tag', 'audio')).toBe('/');
  });

  it('trending, tagged "audio" -> click "audio" again -> "/trending" (untagged, same sort)', () => {
    expect(feedHrefFor({ sort: 'trending', tag: 'audio' }, 'tag', 'audio')).toBe('/trending');
  });
});

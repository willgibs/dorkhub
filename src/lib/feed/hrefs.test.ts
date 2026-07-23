import { describe, expect, it } from 'vitest';
import { feedHrefFor } from './hrefs';

describe('feedHrefFor — sort chips (keep current tag)', () => {
  it('trending, no tag -> newest -> "/newest"', () => {
    expect(feedHrefFor({ sort: 'trending', tag: null }, 'sort', 'newest')).toBe('/newest');
  });

  it('recent, no tag -> trending -> "/"', () => {
    expect(feedHrefFor({ sort: 'recent', tag: null }, 'sort', 'trending')).toBe('/');
  });

  it('trending, no tag -> trending (no-op) -> "/"', () => {
    expect(feedHrefFor({ sort: 'trending', tag: null }, 'sort', 'trending')).toBe('/');
  });

  it('trending, tagged -> newest -> "/t/x/newest"', () => {
    expect(feedHrefFor({ sort: 'trending', tag: 'audio' }, 'sort', 'newest')).toBe(
      '/t/audio/newest',
    );
  });

  it('recent, tagged -> trending -> "/t/x"', () => {
    expect(feedHrefFor({ sort: 'recent', tag: 'audio' }, 'sort', 'trending')).toBe('/t/audio');
  });

  it('recent, tagged -> newest (no-op) -> "/t/x/newest"', () => {
    expect(feedHrefFor({ sort: 'recent', tag: 'audio' }, 'sort', 'newest')).toBe('/t/audio/newest');
  });

  it('unrecognized sort value falls back to "trending"', () => {
    expect(feedHrefFor({ sort: 'recent', tag: null }, 'sort', 'bogus')).toBe('/');
  });
});

describe('feedHrefFor — tag chips (keep current sort)', () => {
  it('trending, no tag -> tag "audio" -> "/t/audio"', () => {
    expect(feedHrefFor({ sort: 'trending', tag: null }, 'tag', 'audio')).toBe('/t/audio');
  });

  it('recent, no tag -> tag "audio" -> "/t/audio/newest"', () => {
    expect(feedHrefFor({ sort: 'recent', tag: null }, 'tag', 'audio')).toBe('/t/audio/newest');
  });

  it('trending, tagged "audio" -> different tag "toy" -> "/t/toy"', () => {
    expect(feedHrefFor({ sort: 'trending', tag: 'audio' }, 'tag', 'toy')).toBe('/t/toy');
  });

  it('recent, tagged "audio" -> different tag "toy" -> "/t/toy/newest"', () => {
    expect(feedHrefFor({ sort: 'recent', tag: 'audio' }, 'tag', 'toy')).toBe('/t/toy/newest');
  });
});

describe('feedHrefFor — active-tag toggle-off', () => {
  it('trending, tagged "audio" -> click "audio" again -> "/" (untagged, same sort)', () => {
    expect(feedHrefFor({ sort: 'trending', tag: 'audio' }, 'tag', 'audio')).toBe('/');
  });

  it('recent, tagged "audio" -> click "audio" again -> "/newest" (untagged, same sort)', () => {
    expect(feedHrefFor({ sort: 'recent', tag: 'audio' }, 'tag', 'audio')).toBe('/newest');
  });
});

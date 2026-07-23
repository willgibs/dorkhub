import { describe, expect, it } from 'vitest';
import { FALLBACK_LANGUAGE_COLOR } from '@/lib/lang-colors';
import { formatUpdatedAgo, type ProjectRow, profileRowToAuthor, projectRowToCard } from './map';

const NOW = new Date('2026-07-21T12:00:00.000Z');

function makeRow(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    created_at: '2026-01-01T00:00:00.000Z',
    demo_url: null,
    description_md: null,
    enriched_at: null,
    forks_count: 0,
    github_repo_id: 1,
    id: 'project-1',
    last_synced_at: null,
    license: null,
    likes_count: 0,
    name: 'tinysynth',
    primary_language: null,
    profile_id: 'profile-1',
    published_at: '2026-01-01T00:00:00.000Z',
    readme_etag: null,
    readme_html: null,
    repo_etag: null,
    repo_full_name: 'mollybuilds/tinysynth',
    repo_url: 'https://github.com/mollybuilds/tinysynth',
    saves_count: 0,
    screenshots: [],
    slug: 'tinysynth',
    sort_order: 0,
    stars_count: 0,
    status: 'published',
    tagline: 'a tiny synth',
    tags: [],
    topics: [],
    trending_score: 0,
    updated_at: '2026-07-21T00:00:00.000Z',
    ...overrides,
  };
}

describe('projectRowToCard — zero-social-proof mapping (absence, never "0")', () => {
  it('maps 0 stars to null', () => {
    const card = projectRowToCard(makeRow({ stars_count: 0 }), 'mollybuilds', NOW);
    expect(card.stars).toBeNull();
  });

  it('maps 0 likes to null', () => {
    const card = projectRowToCard(makeRow({ likes_count: 0 }), 'mollybuilds', NOW);
    expect(card.likes).toBeNull();
  });

  it('maps positive stars/likes through untouched', () => {
    const card = projectRowToCard(
      makeRow({ stars_count: 214, likes_count: 89 }),
      'mollybuilds',
      NOW,
    );
    expect(card.stars).toBe(214);
    expect(card.likes).toBe(89);
  });
});

describe('projectRowToCard — language fallback', () => {
  it('falls back to "code" when primary_language is null', () => {
    const card = projectRowToCard(makeRow({ primary_language: null }), 'mollybuilds', NOW);
    expect(card.language).toBe('code');
    expect(card.languageColor).toBe(FALLBACK_LANGUAGE_COLOR);
  });

  it('resolves a known language to its GitHub swatch color', () => {
    const card = projectRowToCard(makeRow({ primary_language: 'TypeScript' }), 'mollybuilds', NOW);
    expect(card.language).toBe('TypeScript');
    expect(card.languageColor).toBe('#3178c6');
  });

  it('falls back to the muted-foreground token for an unrecognized language', () => {
    const card = projectRowToCard(makeRow({ primary_language: 'Brainfuck' }), 'mollybuilds', NOW);
    expect(card.languageColor).toBe(FALLBACK_LANGUAGE_COLOR);
  });
});

describe('projectRowToCard — other fields', () => {
  it('maps hasScreenshot from a non-empty screenshots array', () => {
    const withShots = projectRowToCard(
      makeRow({ screenshots: [{ path: 'a.webp', w: 1600, h: 900 }] }),
      'mollybuilds',
      NOW,
    );
    expect(withShots.hasScreenshot).toBe(true);

    const withoutShots = projectRowToCard(makeRow({ screenshots: [] }), 'mollybuilds', NOW);
    expect(withoutShots.hasScreenshot).toBe(false);
  });

  it('carries the author username through and preserves tags', () => {
    const card = projectRowToCard(makeRow({ tags: ['audio', 'toy'] }), 'mollybuilds', NOW);
    expect(card.author).toBe('mollybuilds');
    expect(card.tags).toEqual(['audio', 'toy']);
  });

  it('carries repo_full_name through as repoFullName', () => {
    const card = projectRowToCard(
      makeRow({ repo_full_name: 'mollybuilds/tinysynth' }),
      'mollybuilds',
      NOW,
    );
    expect(card.repoFullName).toBe('mollybuilds/tinysynth');
  });
});

describe('formatUpdatedAgo', () => {
  it('renders very recent updates as "just shipped"', () => {
    expect(formatUpdatedAgo(NOW.toISOString(), NOW)).toBe('just shipped');
  });

  it('renders hours, days, weeks, months, and years at coarse granularity', () => {
    const hourAgo = new Date(NOW.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatUpdatedAgo(hourAgo, NOW)).toBe('3 hours ago');

    const daysAgo = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatUpdatedAgo(daysAgo, NOW)).toBe('3 days ago');

    const weeksAgo = new Date(NOW.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatUpdatedAgo(weeksAgo, NOW)).toBe('2 weeks ago');

    const monthsAgo = new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatUpdatedAgo(monthsAgo, NOW)).toBe('2 months ago');

    const yearsAgo = new Date(NOW.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatUpdatedAgo(yearsAgo, NOW)).toBe('1 year ago');
  });

  it('singularizes "1 hour ago" / "1 day ago"', () => {
    const oneHourAgo = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString();
    expect(formatUpdatedAgo(oneHourAgo, NOW)).toBe('1 hour ago');

    const oneDayAgo = new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatUpdatedAgo(oneDayAgo, NOW)).toBe('1 day ago');
  });
});

describe('profileRowToAuthor', () => {
  const base = {
    username: 'mollybuilds',
    display_name: null as string | null,
    avatar_url: null as string | null,
    followers_count: 0,
  };

  it('falls back to username when display_name is null', () => {
    const author = profileRowToAuthor(base);
    expect(author.displayName).toBe('mollybuilds');
    expect(author.initial).toBe('m');
  });

  it('prefers display_name over username, lowercased for the initial', () => {
    const author = profileRowToAuthor({ ...base, display_name: 'Molly' });
    expect(author.displayName).toBe('Molly');
    expect(author.initial).toBe('m');
  });

  it('carries followers_count through as followers', () => {
    const author = profileRowToAuthor({ ...base, followers_count: 340 });
    expect(author.followers).toBe(340);
  });

  it('always sets projects to 0 (unused by ProjectCard render)', () => {
    const author = profileRowToAuthor(base);
    expect(author.projects).toBe(0);
  });

  it('falls back to empty-string bio when omitted or null', () => {
    expect(profileRowToAuthor(base).bio).toBe('');
    expect(profileRowToAuthor({ ...base, bio: null }).bio).toBe('');
  });

  it('carries a provided bio through untouched', () => {
    const author = profileRowToAuthor({ ...base, bio: 'builds small loud things' });
    expect(author.bio).toBe('builds small loud things');
  });

  it('carries username through untouched', () => {
    expect(profileRowToAuthor(base).username).toBe('mollybuilds');
  });
});

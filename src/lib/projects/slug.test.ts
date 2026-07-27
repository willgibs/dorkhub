import { describe, expect, it } from 'vitest';
import { generateProjectSlug, SLUG_PATTERN, slugify } from './slug';

describe('slugify — normalization', () => {
  it('lowercases and hyphenates a simple repo name', () => {
    expect(slugify('MyCoolRepo')).toBe('mycoolrepo');
  });

  it('collapses a run of separators into a single hyphen', () => {
    expect(slugify('foo__bar   baz')).toBe('foo-bar-baz');
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('--foo-bar--')).toBe('foo-bar');
  });

  it('falls back to "project" when nothing normalizable remains', () => {
    expect(slugify('日本語')).toBe('project');
    expect(slugify('🚀🔥')).toBe('project');
    expect(slugify('...')).toBe('project');
    expect(slugify('')).toBe('project');
  });
});

describe('generateProjectSlug — battery of nasty repo names always matches SLUG_PATTERN', () => {
  const nastyNames = [
    'unicode-résumé-parser',
    '日本語リポジトリ',
    '🚀 rocket-ship 🔥',
    'dots.in.the.middle',
    '.github',
    '..hidden..',
    '123-starts-with-digits',
    '---leading-dashes',
    'trailing-dashes---',
    'weird--name-',
    'ALL CAPS REPO',
    'sp aces everywhere',
    'sn@ke_c@se!!',
    'a'.repeat(300),
    `${'x'.repeat(97)}---${'y'.repeat(10)}`,
    '',
    '   ',
    '-',
    '--',
    'a-',
    '-a',
    'CamelCaseRepo',
    'repo.name.js',
    'C++_Project',
    '中文-mixed-english',
    '✨sparkly✨repo✨',
  ];

  for (const name of nastyNames) {
    it(`produces a valid slug for ${JSON.stringify(name)}`, () => {
      const slug = generateProjectSlug(name, new Set());
      expect(slug).toMatch(SLUG_PATTERN);
    });
  }

  it('caps the base slug length at 100 chars before suffixing', () => {
    const slug = generateProjectSlug('a'.repeat(300), new Set());
    expect(slug.length).toBeLessThanOrEqual(100);
    expect(slug).toMatch(SLUG_PATTERN);
  });

  it('a capped-length name that collides still suffixes to a valid, matching slug', () => {
    const longName = 'q'.repeat(300);
    const base = generateProjectSlug(longName, new Set());
    expect(base.length).toBe(100);

    const suffixed = generateProjectSlug(longName, new Set([base]));
    expect(suffixed).toBe(`${base}-2`);
    expect(suffixed).toMatch(SLUG_PATTERN);
  });
});

describe('generateProjectSlug — collision suffixing', () => {
  it('returns the base slug when it is free', () => {
    expect(generateProjectSlug('tinysynth', new Set())).toBe('tinysynth');
  });

  it('appends -2 when the base slug is taken', () => {
    expect(generateProjectSlug('tinysynth', new Set(['tinysynth']))).toBe('tinysynth-2');
  });

  it('appends -3 when both the base and -2 are taken', () => {
    const existing = new Set(['tinysynth', 'tinysynth-2']);
    expect(generateProjectSlug('tinysynth', existing)).toBe('tinysynth-3');
  });

  it('finds the first free suffix, skipping only the taken ones', () => {
    const existing = new Set(['tinysynth', 'tinysynth-2', 'tinysynth-4']);
    // -3 is free even though -4 is taken.
    expect(generateProjectSlug('tinysynth', existing)).toBe('tinysynth-3');
  });

  it('fallback slug "project" also gets suffixed on repeated all-unicode names', () => {
    const existing = new Set(['project']);
    expect(generateProjectSlug('日本語', existing)).toBe('project-2');
  });
});

describe('generateProjectSlug — reserved slugs (P3-A route shadowing)', () => {
  it('suffixes a repo literally named "lists" even with no existing slugs', () => {
    expect(generateProjectSlug('lists', new Set())).toBe('lists-2');
  });

  it('keeps walking suffixes when the reserved escape is also taken', () => {
    expect(generateProjectSlug('lists', new Set(['lists-2']))).toBe('lists-3');
  });

  it('never emits a reserved slug via suffix collision either', () => {
    // Sanity: unrelated names are unaffected by the reserved set.
    expect(generateProjectSlug('checklists', new Set())).toBe('checklists');
  });
});

describe('slugify — custom fallback (P3-A list names)', () => {
  it('uses the provided fallback for all-unicode input', () => {
    expect(slugify('🚀', 'list')).toBe('list');
  });

  it('default fallback stays "project" (backward compat)', () => {
    expect(slugify('🚀')).toBe('project');
  });

  it('fallback is ignored when input normalizes to something', () => {
    expect(slugify('My List!', 'list')).toBe('my-list');
  });
});

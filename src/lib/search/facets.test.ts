import { describe, expect, it } from 'vitest';
import { collectFacetOptions, EMPTY_FACETS, resolveSearchFacets } from './facets';

describe('resolveSearchFacets — untrusted URL params', () => {
  it('returns the unfiltered shape for empty input', () => {
    expect(resolveSearchFacets({})).toEqual(EMPTY_FACETS);
  });

  it('lowercases language so it matches the generated language_slug column', () => {
    expect(resolveSearchFacets({ language: '  TypeScript ' }).language).toBe('typescript');
  });

  it('keeps C# and C++ distinct (a slugify would collide them)', () => {
    expect(resolveSearchFacets({ language: 'C#' }).language).toBe('c#');
    expect(resolveSearchFacets({ language: 'C++' }).language).toBe('c++');
  });

  it('validates tag SHAPE — a crafted value cannot reach the filter grammar', () => {
    expect(resolveSearchFacets({ tag: 'web-audio' }).tag).toBe('web-audio');
    // The grammar delimiters PostgREST treats as syntax, plus other malformed shapes.
    for (const bad of ['a,b', 'a)b', '(x)', 'sp ace', '-lead', 'trail-', 'a--b', '']) {
      expect(resolveSearchFacets({ tag: bad }).tag).toBeNull();
    }
  });

  it('lowercases a valid tag rather than rejecting it (same as /t/[tag])', () => {
    // resolveTagSlug normalizes BEFORE validating, so "CLI" is a real tag
    // reference, not junk — asserted so nobody "fixes" it into a rejection.
    expect(resolveSearchFacets({ tag: 'CLI' }).tag).toBe('cli');
  });

  it('parses stars and rejects junk, zero and negatives', () => {
    expect(resolveSearchFacets({ stars: '1000' }).minStars).toBe(1000);
    expect(resolveSearchFacets({ stars: 250 }).minStars).toBe(250);
    for (const bad of ['abc', '', '0', '-5', null]) {
      expect(resolveSearchFacets({ stars: bad }).minStars).toBeNull();
    }
  });

  it('treats only explicit truthy markers as hasDemo', () => {
    expect(resolveSearchFacets({ demo: '1' }).hasDemo).toBe(true);
    expect(resolveSearchFacets({ demo: 'true' }).hasDemo).toBe(true);
    for (const bad of ['0', 'false', 'yes', '', null]) {
      expect(resolveSearchFacets({ demo: bad }).hasDemo).toBe(false);
    }
  });

  it('never throws on hostile input', () => {
    expect(() =>
      resolveSearchFacets({
        language: '../../etc/passwd',
        tag: 'a,or(1.eq.1)',
        stars: 'NaN',
        demo: '<script>',
      }),
    ).not.toThrow();
  });
});

describe('collectFacetOptions', () => {
  const p = (language: string | null, slug: string | null, tags: string[]) => ({
    primary_language: language,
    language_slug: slug,
    tags,
  });

  it('counts languages and orders most-common first', () => {
    const { languages } = collectFacetOptions([
      p('TypeScript', 'typescript', []),
      p('Rust', 'rust', []),
      p('TypeScript', 'typescript', []),
    ]);

    expect(languages.map((l) => [l.label, l.count])).toEqual([
      ['TypeScript', 2],
      ['Rust', 1],
    ]);
  });

  it('keeps the display label while filtering on the slug', () => {
    const { languages } = collectFacetOptions([p('C#', 'c#', [])]);
    expect(languages[0]).toEqual({ value: 'c#', label: 'C#', count: 1 });
  });

  it('skips projects with no detected language rather than inventing one', () => {
    const { languages } = collectFacetOptions([p(null, null, ['cli'])]);
    expect(languages).toEqual([]);
  });

  it('counts tags across projects, most common first', () => {
    const { tags } = collectFacetOptions([p('Go', 'go', ['cli', 'tools']), p('Go', 'go', ['cli'])]);

    expect(tags.map((t) => [t.value, t.count])).toEqual([
      ['cli', 2],
      ['tools', 1],
    ]);
  });

  it('breaks count ties alphabetically so the chip order is stable', () => {
    const { tags } = collectFacetOptions([p('Go', 'go', ['zebra', 'alpha'])]);
    expect(tags.map((t) => t.value)).toEqual(['alpha', 'zebra']);
  });

  it('returns empty for an empty result set', () => {
    expect(collectFacetOptions([])).toEqual({ languages: [], tags: [] });
  });
});

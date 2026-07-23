import { describe, expect, it } from 'vitest';
import { extractGithubRepoRefs } from './links';

/**
 * A realistic "awesome-list" README rendering — mixed valid repo links, a
 * badge link with a nested <img> (the <a> wraps the badge, not text), deep
 * links (blob/tree/issues), anchors, reserved paths, duplicate-casing
 * repeats, and a `.git` suffix. Modeled on the shape GitHub actually renders
 * for READMEs (h2 sections + <ul><li> entries).
 */
const AWESOME_LIST_FIXTURE = `
<h1>Awesome Widgets</h1>
<p>A curated list of widget things.</p>

<h2>Core</h2>
<ul>
  <li><a href="https://github.com/foo/bar">foo/bar</a> — the original widget engine.</li>
  <li><a href="https://github.com/foo/bar/"><img src="https://img.shields.io/badge/build-passing-green" alt="build" /></a> badge repeats foo/bar with a trailing slash + badge markup.</li>
  <li><a href="https://github.com/Foo/Bar">Foo/Bar</a> — same repo, different casing, should dedupe to first-seen "foo/bar".</li>
  <li><a href="https://github.com/baz/qux.git">baz/qux</a> — clone URL with .git suffix.</li>
</ul>

<h2>Extensions</h2>
<ul>
  <li><a href="//github.com/proto/relative">proto/relative</a> — protocol-relative link.</li>
  <li><a href="https://www.github.com/wwwuser/wwwrepo">wwwuser/wwwrepo</a> — www subdomain.</li>
  <li><a href="https://github.com/foo/bar/blob/main/README.md">deep blob link</a> — should be rejected (not exactly owner/repo).</li>
  <li><a href="https://github.com/foo/bar/tree/main/src">deep tree link</a> — should be rejected.</li>
  <li><a href="https://github.com/foo/bar/issues">issues link</a> — should be rejected.</li>
</ul>

<h2>Meta</h2>
<ul>
  <li><a href="https://github.com/topics/widgets">browse the widgets topic</a> — reserved first segment, rejected.</li>
  <li><a href="https://github.com/sponsors/foo">sponsor foo</a> — reserved first segment, rejected.</li>
  <li><a href="#contributing">Contributing</a> — plain anchor, not a github.com link at all.</li>
  <li><a href="https://github.com">github homepage, no owner/repo</a> — rejected.</li>
  <li><a href="https://github.com/onlyowner">just an owner, no repo</a> — rejected.</li>
  <li><a href="https://example.com/foo/bar">not even github.com</a> — rejected.</li>
  <li><a href='https://github.com/single/quoted'>single-quoted href</a> — still parsed.</li>
</ul>

<p>See also <a href="https://github.com/foo/bar?tab=readme-ov-file#readme">foo/bar with query+fragment</a>.</p>
`;

describe('extractGithubRepoRefs — realistic awesome-list fixture', () => {
  const refs = extractGithubRepoRefs(AWESOME_LIST_FIXTURE);

  it('extracts each valid owner/repo exactly once, deduped case-insensitively', () => {
    expect(refs).toEqual([
      { owner: 'foo', name: 'bar' }, // first-seen casing wins over "Foo/Bar" repeat
      { owner: 'baz', name: 'qux' }, // .git suffix stripped
      { owner: 'proto', name: 'relative' }, // protocol-relative
      { owner: 'wwwuser', name: 'wwwrepo' }, // www subdomain
      { owner: 'single', name: 'quoted' }, // single-quoted href attr
    ]);
  });

  it('does not include any deep-path, reserved, non-github, or ownerless hrefs', () => {
    const pairs = refs.map((r) => `${r.owner}/${r.name}`);
    expect(pairs).not.toContain('topics/widgets');
    expect(pairs).not.toContain('sponsors/foo');
    expect(pairs.filter((p) => p.startsWith('foo/bar'))).toEqual(['foo/bar']);
  });
});

describe('extractGithubRepoRefs — edge battery', () => {
  it('returns an empty array for html with no links at all', () => {
    expect(extractGithubRepoRefs('<p>no links here</p>')).toEqual([]);
  });

  it('returns an empty array for an empty string', () => {
    expect(extractGithubRepoRefs('')).toEqual([]);
  });

  it('rejects a bare github.com root link', () => {
    expect(extractGithubRepoRefs('<a href="https://github.com/">root</a>')).toEqual([]);
  });

  it('rejects an owner-only link', () => {
    expect(extractGithubRepoRefs('<a href="https://github.com/foo">owner only</a>')).toEqual([]);
  });

  it('rejects a link with a double slash between owner and repo', () => {
    expect(extractGithubRepoRefs('<a href="https://github.com/foo//bar">x</a>')).toEqual([]);
  });

  it('rejects owner names starting with a hyphen', () => {
    expect(extractGithubRepoRefs('<a href="https://github.com/-foo/bar">x</a>')).toEqual([]);
  });

  it('accepts repo names with dots and underscores', () => {
    expect(extractGithubRepoRefs('<a href="https://github.com/foo/bar.js_v2">x</a>')).toEqual([
      { owner: 'foo', name: 'bar.js_v2' },
    ]);
  });

  it('rejects owner/repo containing disallowed characters', () => {
    expect(extractGithubRepoRefs('<a href="https://github.com/fo o/bar">x</a>')).toEqual([]);
    expect(extractGithubRepoRefs('<a href="https://github.com/foo/b@r">x</a>')).toEqual([]);
  });

  it('strips only a single trailing slash, not deeper trailing segments', () => {
    expect(extractGithubRepoRefs('<a href="https://github.com/foo/bar/">x</a>')).toEqual([
      { owner: 'foo', name: 'bar' },
    ]);
  });

  it('strips a query string with no fragment', () => {
    expect(extractGithubRepoRefs('<a href="https://github.com/foo/bar?tab=readme">x</a>')).toEqual([
      { owner: 'foo', name: 'bar' },
    ]);
  });

  it('strips a fragment with no query', () => {
    expect(extractGithubRepoRefs('<a href="https://github.com/foo/bar#readme">x</a>')).toEqual([
      { owner: 'foo', name: 'bar' },
    ]);
  });

  it('is case-insensitive on the github.com host', () => {
    expect(extractGithubRepoRefs('<a href="https://GitHub.COM/foo/bar">x</a>')).toEqual([
      { owner: 'foo', name: 'bar' },
    ]);
  });

  it('ignores malformed href attributes without throwing', () => {
    expect(() =>
      extractGithubRepoRefs('<a href=https://github.com/foo/bar>unquoted, not matched</a>'),
    ).not.toThrow();
    expect(extractGithubRepoRefs('<a href=https://github.com/foo/bar>unquoted</a>')).toEqual([]);
  });

  it('handles an href with no value gracefully', () => {
    expect(extractGithubRepoRefs('<a href="">empty</a>')).toEqual([]);
  });

  it('caps output at 500 refs', () => {
    const many = Array.from(
      { length: 600 },
      (_, i) => `<a href="https://github.com/owner${i}/repo${i}">r${i}</a>`,
    ).join('\n');
    expect(extractGithubRepoRefs(many)).toHaveLength(500);
  });

  it('rejects every reserved first segment', () => {
    const reserved = [
      'topics',
      'sponsors',
      'orgs',
      'about',
      'features',
      'marketplace',
      'apps',
      'collections',
      'events',
      'settings',
      'site',
      'contact',
      'pricing',
      'trending',
      'login',
      'join',
      'explore',
    ];
    for (const word of reserved) {
      expect(extractGithubRepoRefs(`<a href="https://github.com/${word}/anything">x</a>`)).toEqual(
        [],
      );
    }
  });
});

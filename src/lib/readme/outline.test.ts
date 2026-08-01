import { describe, expect, it } from 'vitest';

import { buildReadmeOutline, slugifyHeading } from './outline';

/**
 * The shape stored in `readme_html` today: GitHub's heading followed by the
 * autolink anchor, stripped of its id/class by our sanitizer and stamped with
 * the blanket outbound-link treatment. Verified against production rows.
 */
function stored(slug: string, title: string, level = 2): string {
  return `<h${level}>${title}</h${level}><a href="#${slug}" rel="nofollow ugc noopener" target="_blank"></a>`;
}

describe('slugifyHeading', () => {
  it('mirrors GitHub: lowercase, punctuation dropped, spaces hyphenated', () => {
    expect(slugifyHeading('Getting Started')).toBe('getting-started');
    expect(slugifyHeading('What is this?')).toBe('what-is-this');
    expect(slugifyHeading('API / Usage')).toBe('api-usage');
  });

  it('folds diacritics rather than dropping the word', () => {
    expect(slugifyHeading('Café setup')).toBe('cafe-setup');
  });

  it('survives headings made entirely of symbols', () => {
    expect(slugifyHeading('🚀🚀🚀')).toBe('');
    expect(slugifyHeading('---')).toBe('');
  });

  it('emits nothing outside [a-z0-9_-] — the whole security contract', () => {
    const hostile = '" onmouseover="alert(1)" x="';
    expect(slugifyHeading(hostile)).toMatch(/^[a-z0-9_-]*$/);
    expect(slugifyHeading('<script>alert(1)</script>')).toMatch(/^[a-z0-9_-]*$/);
  });
});

describe('buildReadmeOutline', () => {
  it('moves GitHub’s own slug onto the heading and deletes the artifact anchor', () => {
    const { html, headings } = buildReadmeOutline(stored('installation', 'Installation'));

    expect(html).toBe('<h2 id="installation">Installation</h2>');
    expect(html).not.toContain('<a');
    expect(headings).toEqual([{ id: 'installation', text: 'Installation', depth: 0 }]);
  });

  it('keeps a README’s internal table of contents working', () => {
    const html = buildReadmeOutline(
      `<ul><li><a href="#supported-features" rel="nofollow ugc noopener" target="_blank">Features</a></li></ul>${stored('supported-features', 'Supported Features')}`,
    ).html;

    // Same tab (no target), pointing at an id that now exists on the heading.
    expect(html).toContain('<a href="#supported-features" class="prose-jump">Features</a>');
    expect(html).toContain('<h2 id="supported-features">');
    expect(html).not.toContain('target="_blank"');
  });

  it('leaves outbound links exactly as the sanitizer wrote them', () => {
    const outbound =
      '<a href="https://example.com" rel="nofollow ugc noopener" target="_blank">docs</a>';
    expect(buildReadmeOutline(outbound).html).toBe(outbound);
  });

  it('falls back to a derived slug when there is no artifact anchor', () => {
    const { html, headings } = buildReadmeOutline('<h2>Why bother?</h2>');
    expect(html).toBe('<h2 id="why-bother">Why bother?</h2>');
    expect(headings[0].id).toBe('why-bother');
  });

  it('disambiguates repeated headings the way GitHub does', () => {
    const { headings } = buildReadmeOutline('<h2>Usage</h2><h2>Usage</h2><h2>Usage</h2>');
    expect(headings.map((h) => h.id)).toEqual(['usage', 'usage-1', 'usage-2']);
  });

  it('never emits an empty id', () => {
    const { html } = buildReadmeOutline('<h2>🚀</h2>');
    expect(html).toContain('id="section"');
  });

  it('strips markup inside a heading for the label but keeps it in the html', () => {
    const { html, headings } = buildReadmeOutline('<h2><code>npm</code> install</h2>');
    expect(headings[0].text).toBe('npm install');
    expect(html).toContain('<code>npm</code>');
  });

  it('decodes entities in the label', () => {
    const { headings } = buildReadmeOutline('<h2>Tips &amp; tricks</h2>');
    expect(headings[0].text).toBe('Tips & tricks');
    expect(headings[0].id).toBe('tips-tricks');
  });

  it('normalizes nesting from the levels the document actually uses', () => {
    // Opens at h2, subsections at h3 — h2 is this document's top level.
    const { headings } = buildReadmeOutline('<h2>One</h2><h3>One a</h3><h2>Two</h2><h4>Deep</h4>');
    expect(headings).toEqual([
      { id: 'one', text: 'One', depth: 0 },
      { id: 'one-a', text: 'One a', depth: 1 },
      { id: 'two', text: 'Two', depth: 0 },
    ]);
  });

  it('handles the inconsistent real-world case of h2 before h1', () => {
    // Observed in production: `<h2>project-name</h2>` then `<h1>Features</h1>`.
    const { headings } = buildReadmeOutline('<h2>thing</h2><h1>Features</h1>');
    expect(headings.map((h) => h.depth)).toEqual([1, 0]);
  });

  it('treats a lone leading top-level heading as the document title', () => {
    // `# Cool Tool` + `## …` is the most common README shape; without this the
    // entire outline renders indented under a heading that is not a section.
    const { headings } = buildReadmeOutline('<h1>Cool Tool</h1><h2>Install</h2><h2>Usage</h2>');
    expect(headings).toEqual([
      { id: 'install', text: 'Install', depth: 0 },
      { id: 'usage', text: 'Usage', depth: 0 },
    ]);
  });

  it('removes empty outbound anchors (icon links whose svg the sanitizer dropped)', () => {
    const { html } = buildReadmeOutline(
      '<p><a href="https://x.dev" rel="nofollow ugc noopener" target="_blank"></a>after</p>',
    );
    expect(html).toBe('<p>after</p>');
  });

  it('drops a leading heading that only restates the project name', () => {
    const { headings } = buildReadmeOutline('<h1>Tiny Synth</h1><h1>Install</h1>', {
      titleHint: 'tiny-synth',
    });
    expect(headings.map((h) => h.text)).toEqual(['Install']);
  });

  it('keeps a leading heading that says something else', () => {
    const { headings } = buildReadmeOutline('<h1>Why</h1><h1>Install</h1>', {
      titleHint: 'tiny-synth',
    });
    expect(headings.map((h) => h.text)).toEqual(['Why', 'Install']);
  });

  it('emits ids that are safe to interpolate — hostile heading text', () => {
    const { html } = buildReadmeOutline('<h2>" onmouseover=alert(1) x="</h2>');
    // The threat is heading TEXT escaping into the tag; the same characters
    // sitting in the element body are inert (and already sanitizer-approved).
    const openTag = /<h2[^>]*>/.exec(html)?.[0] ?? '';
    expect(openTag).toMatch(/^<h2 id="[a-z0-9_-]+">$/);
  });

  it('refuses a hostile harvested fragment', () => {
    const html = buildReadmeOutline(
      '<h2>Setup</h2><a href="#a&quot; onload=&quot;x" rel="nofollow ugc noopener" target="_blank"></a>',
    ).html;
    const openTag = /<h2[^>]*>/.exec(html)?.[0] ?? '';
    expect(openTag).toMatch(/^<h2 id="[a-z0-9_-]+">$/);
    expect(html).not.toMatch(/onload=/);
  });

  it('removes empty fragment anchors that are not attached to a heading', () => {
    const { html } = buildReadmeOutline(
      '<p>text</p><a href="#stray" rel="nofollow ugc noopener" target="_blank"></a><p>more</p>',
    );
    expect(html).toBe('<p>text</p><p>more</p>');
  });

  it('returns an empty outline for a README with no headings', () => {
    const { html, headings } = buildReadmeOutline('<p>just prose</p>');
    expect(html).toBe('<p>just prose</p>');
    expect(headings).toEqual([]);
  });

  it('handles empty input without throwing', () => {
    expect(buildReadmeOutline('')).toEqual({ html: '', headings: [] });
  });

  it('caps a runaway table of contents', () => {
    const many = Array.from({ length: 60 }, (_, i) => `<h2>Section ${i}</h2>`).join('');
    expect(buildReadmeOutline(many).headings).toHaveLength(40);
  });

  it('is idempotent — a second pass changes nothing', () => {
    const once = buildReadmeOutline(stored('install', 'Install') + stored('usage', 'Usage'));
    const twice = buildReadmeOutline(once.html);
    expect(twice.html).toBe(once.html);
    expect(twice.headings).toEqual(once.headings);
  });
});

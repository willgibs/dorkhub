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
import { trialConfig } from '../lib/trial.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (...p) => readFileSync(join(root, 'src', ...p), 'utf8');
const out = join(root, 'public');

/** A module inlined into the page: no imports, and `export` stripped so it joins the shared scope. */
const inline = (dir, f) => {
  const code = src(dir, f);
  if (/^\s*import\s/m.test(code)) throw new Error(`src/${dir}/${f} must not import anything: it is inlined into the page`);
  return code.replace(/^export (const|function|class|let|async function) /gm, '$1 ').trimEnd();
};
const shared = ['article.js', 'models.js'].map((f) => inline('shared', f));
const vendorDir = join(root, 'src', 'vendor');
const vendorFiles = existsSync(vendorDir) ? readdirSync(vendorDir).sort() : [];
const vendor = vendorFiles.filter((f) => f.endsWith('.js')).map((f) => inline('vendor', f));
const vendorCss = vendorFiles.filter((f) => f.endsWith('.css')).map((f) => src('vendor', f).trimEnd());
const modules = readdirSync(join(root, 'src', 'app')).filter((f) => f.endsWith('.js')).sort();
const script = [
  '(() => {',
  "'use strict';",
  `const TRIAL_PAGES = ${trialConfig(process.env).pages};`,
  ...shared,
  ...vendor,
  ...modules.map((f) => src('app', f).trimEnd()),
  '})();',
].join('\n');
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
  src('styles.css').trimEnd(),
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
console.log(`public/index.html  ${(html.length / 1024).toFixed(0)} KB (script ${(script.length / 1024).toFixed(0)} KB)  ${shared.length} shared + ${vendor.length + vendorCss.length} vendored + ${modules.length} app modules`);

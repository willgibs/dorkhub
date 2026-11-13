// The pictures a shared link shows, 1200 × 630: one for every page known before anyone asks (lib/share.js), and
// the front page's. Each is laid out like a front-page card, its kind and title in the corner and the topic's line
// under them: a card's own drawing, finished and still, for the topics with a card; else the page's Wikipedia lead
// picture, credited; else the words alone, in the kind's colour. Rendered in Chromium from the built page itself, so a
// drawing is the real one (Magnets' filings are drawn on a canvas), then kept in src/static/share/ with their index,
// which the build and api/share read. Not part of the build: Vercel has no browser. Run it after a page is written.
//   node scripts/share.mjs                      the pictures missing or out of date
//   node scripts/share.mjs --all                every picture again
//   node scripts/share.mjs "Black holes" …      those pages' pictures again
// Needs Chromium (npx playwright install chromium) and, for the lead pictures, the network (Wikipedia, with the
// generic User-Agent lib/picture.js sends).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARDS } from '../lib/front.js';
import { handlePicture, lookup } from '../lib/picture.js';
import { GENERIC, images, knownPages } from '../lib/share.js';
import { topicKey } from '../src/shared/world.js';

const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { console.error('Playwright is missing: run npm install, then npx playwright install chromium'); process.exit(1); }
const root = fileURLToPath(new URL('..', import.meta.url));
const pub = join(root, 'public'), dir = join(root, 'src', 'static', 'share');
const args = process.argv.slice(2); const all = args.includes('--all'); const asked = new Set(args.filter(a => !a.startsWith('--')).map(topicKey));

/* Pages whose lead picture shouldn't travel on a link: the Great Emu War's is a dead emu (it is kept off the dice for
   that too). They get the words alone. */
const NO_PICTURE = new Set(['great emu war'].map(topicKey));
/* How each card's drawing sits in the wider frame, beside its words: where its art goes, and anything of the card's
   own that only works on the front page (its controls, its readings) left out. Set by eye, card by card. */
const ART = {
  'black-holes': '',
  'northern-lights': '',
  origami: '.wc-art{transform:translate(300px,100px) scale(1.08)}',
  atlantis: '.wc-art{left:510px;top:30px;bottom:-10px;right:-10px}',
  'venus-flytraps': '.wc-art{left:170px;top:135px;right:-260px;bottom:-240px}.ft-meter,.ft-btn{display:none}',
  magnets: '.wc-art{-webkit-mask-image:radial-gradient(ellipse 640px 210px at 300px 115px,transparent 58%,#000 100%);mask-image:radial-gradient(ellipse 640px 210px at 300px 115px,transparent 58%,#000 100%)}',
  'rubiks-cube': '.wc-art{left:600px;top:30px;right:20px;bottom:30px}.rb-n{left:-532px;bottom:64px;font-size:34px}.rb-cap{left:-532px;bottom:34px;font-size:19px}',
  fireworks: '&{background:#03040A}.wc-art{top:300px}',
  lightning: '.wc-art{left:560px}',
  'giant-squid': '.wc-art{left:560px}.wc-line{max-width:470px}',
  pompeii: '.wc-art{left:560px}.wc-line{max-width:470px}',
  'enigma-machine': '.wc-art{left:560px;top:40px;right:20px;bottom:30px;transform:scale(1.42);transform-origin:62% 50%}.en-tape,.en-tally{display:none}',
  infinity: '.wc-art{left:520px;top:0;right:-10px;bottom:-10px}',
};
/* The frame: the card's own look, scaled up for a picture seen small in a message */
const FRAME = `
body.sharing{overflow:hidden;background:var(--surface)}
body.sharing>:not(.share-frame){display:none!important}
.share-frame{position:fixed!important;left:0;top:0;width:1200px!important;height:630px!important;z-index:9;margin:0!important;border-radius:0!important;box-shadow:none!important;transform:none!important}
.share-frame .wc-cap{position:relative;z-index:2;max-width:700px;padding:58px 68px 0}
.share-frame .wc-kind,.share-frame .wc-kind .kind{font-size:19px;letter-spacing:.09em}
.share-frame .wc-t{margin-top:16px;font-size:68px;line-height:1.02;letter-spacing:-.03em}
.share-frame .wc-line{margin:20px 0 0;max-width:600px;font:500 30px/1.32 var(--f-ui);letter-spacing:-.01em;color:var(--mute);text-wrap:pretty}
.share-frame.wc-night .wc-cap{text-shadow:0 0 18px #06070B,0 0 6px #06070B,0 0 2px #06070B}
.share-frame .wc-open{display:none}
.share-frame .wc-cr{left:68px;bottom:44px;z-index:2;font-size:17px}
.share-frame.sf-pic .wc-cap{max-width:640px}
.share-frame.sf-pic .wc-art{inset:0 0 0 auto;width:500px;background:var(--sunken)}
.share-frame.sf-pic .wc-art img{display:block;width:100%;height:100%;object-fit:cover}
.share-frame.sf-pic .wc-cr{max-width:560px}
.share-frame.sf-type{background:color-mix(in srgb,var(--kc,var(--acc)) 5%,var(--surface))}
.share-frame.sf-type .wc-cap{max-width:1000px;padding-top:150px}
.share-frame.sf-type .wc-t{font-size:92px}
.share-frame.sf-type .wc-line{max-width:880px;font-size:38px}
.share-frame .sf-mark{position:absolute;left:68px;top:52px;margin:0;font:500 30px/1 Doto,monospace;color:var(--faint)}
.share-frame.sf-front .sf-mark{color:var(--ink)}
`;

/* ---------- what to make ---------- */
const known = await knownPages(); const have = images();
const cards = new Map(CARDS.map(c => [topicKey(c.t), c]));
const due = known.filter(p => {
  const im = have.pages[p.word]; if (all || asked.has(p.key) || !im || !existsSync(join(dir, im.file))) return true;
  return im.line !== p.line || im.title !== p.title || im.kind !== p.kind || (im.from === 'card') !== cards.has(p.key);
});
const front = all || asked.has(topicKey('dorkhub')) || !have.generic || !existsSync(join(dir, have.generic.file));
if (!due.length && !front) { console.log('Every known page has its picture. (--all makes them all again.)'); process.exit(0); }

/* the built page, as the site serves it */
const b = spawnSync(process.execPath, [join(root, 'scripts', 'build.mjs')], { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, DH_SITE: 'https://dorkhub.com' } });
if (b.status !== 0) process.exit(1);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const base = 'https://dorkhub.test';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light' });
await ctx.route('**/*', async route => {
  const u = new URL(route.request().url());
  if (u.origin !== base) return route.abort();
  if (u.pathname === '/api/picture') { const r = await handlePicture(new Request(u, { headers: { 'sec-fetch-site': 'same-origin' } })); return route.fulfill({ status: r.status, headers: Object.fromEntries(r.headers), body: Buffer.from(await r.arrayBuffer()) }); }
  if (u.pathname.startsWith('/api/')) return route.fulfill({ status: 204, body: '' });
  const f = join(pub, u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname));
  if (!f.startsWith(pub) || !existsSync(f) || !extname(f)) return route.fulfill({ status: 404, body: '' });
  return route.fulfill({ status: 200, headers: { 'content-type': TYPES[/** @type {keyof typeof TYPES} */ (extname(f))] || 'application/octet-stream' }, body: readFileSync(f) });
});
const page = await ctx.newPage();
page.on('pageerror', e => console.error(`page error: ${e.message}`));
const open = async () => { await page.goto(`${base}/`); await page.waitForSelector('#ways .wc'); await page.evaluate(() => document.fonts.ready); await page.addStyleTag({ content: FRAME }); };
await open();

mkdirSync(dir, { recursive: true });
const index = { v: 1, pages: { ...have.pages }, generic: have.generic };
/** @param {string} file */
const shoot = async file => { await page.waitForTimeout(250); const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 }, ...(file.endsWith('.png') ? { type: 'png' } : { type: 'jpeg', quality: 86 }) }); writeFileSync(join(dir, file), buf); return buf.length; };
const say = (/** @type {string} */ what, /** @type {string} */ file, /** @type {number} */ n) => console.log(`${what.padEnd(30)} ${file.padEnd(32)} ${(n / 1024).toFixed(0)} KB`);
const drop = (/** @type {Record<string, any> | undefined} */ old, /** @type {string} */ file) => { if (old && old.file !== file && existsSync(join(dir, old.file))) rmSync(join(dir, old.file)); };

for (const p of due) {
  const card = cards.get(p.key); let from = 'type', file = `${p.word}.png`, alt = `${p.title}: ${p.line}`, credit = '';
  if (card) {
    from = 'card'; file = `${p.word}.jpg`;
    alt = await page.evaluate(({ slug, kind, title, line, css }) => {
      /* the card itself, moved into the frame, so the page lays its drawing out again at the frame's size (the fold's
         faces, the filings on their canvas) */
      document.querySelectorAll('.share-frame').forEach(e => e.remove());
      const f = /** @type {HTMLElement} */ (document.querySelector(`#ways .wc[data-card="${slug}"]`)); f.classList.remove('armed', 'playing'); f.classList.add('share-frame', 'seen');
      const line_ = document.createElement('p'); line_.className = 'wc-line'; line_.textContent = line; f.querySelector('.wc-cap')?.appendChild(line_);
      const st = document.createElement('style'); st.className = 'sf-art'; st.textContent = css.replace(/(^|\})([^{}]+)\{/g, (m, a, sel) => `${a}${sel.split(',').map(s => s.trim() === '&' ? '.share-frame' : `.share-frame ${s.trim().replace(/^&/, '')}`).join(',')}{`);
      document.querySelectorAll('style.sf-art').forEach(e => e.remove()); document.head.appendChild(st);
      document.body.appendChild(f); document.body.classList.add('sharing'); dispatchEvent(new Event('resize'));
      const art = f.querySelector('.wc-art [role="img"][aria-label], .wc-art [role="group"][aria-label], .wc-art img[alt]');
      return `${title}, a ${kind}: ${line} ${art ? art.getAttribute('aria-label') || art.getAttribute('alt') : ''}`.trim();
    }, { slug: p.word, kind: p.kind, title: p.title, line: p.line, css: ART[/** @type {keyof typeof ART} */ (p.word)] ?? '' });
    if (p.word === 'magnets') await page.waitForTimeout(600);
  } else {
    const pic = NO_PICTURE.has(p.key) || p.nopic ? null : await lookup(fetch, p.own);
    if (pic) { from = 'picture'; file = `${p.word}.jpg`; credit = [pic.credit || 'Wikimedia Commons', pic.license].filter(Boolean).join(' · '); alt = `${p.title}: ${p.line} The picture: ${pic.desc || pic.alt}`; }
    /* a picture whose original is under 960 px wide comes whole (the page shows it at 500), so it stays sharp here */
    const big = pic ? (/&w=500$/.test(pic.src) ? `${pic.src}&o=1` : pic.src) : '';
    const shown = await page.evaluate(({ kind, title, line, src, small, credit, from }) => {
      document.querySelectorAll('.share-frame,style.sf-art').forEach(e => e.remove());
      const k = { concept: 'concept', idea: 'concept', phenomenon: 'phenomenon', mechanism: 'mechanism', technique: 'mechanism', place: 'place', person: 'person', event: 'event', era: 'event', thing: 'thing', creature: 'thing', work: 'thing', mystery: 'mystery' }[kind] || 'concept';
      const f = document.createElement('article'); f.className = `wc share-frame ${from === 'picture' ? 'sf-pic' : 'sf-type'}`; f.dataset.kind = k;
      f.innerHTML = `${src ? '<div class="wc-art"><img alt=""></div>' : '<p class="sf-mark">dorkhub</p>'}<div class="wc-cap"><p class="wc-kind"><span class="kind" data-kind="${k}"></span></p><h3 class="wc-t"></h3><p class="wc-line"></p></div>${credit ? '<p class="wc-cr"></p>' : ''}`;
      /** @type {HTMLElement} */ (f.querySelector('.kind')).textContent = kind[0].toUpperCase() + kind.slice(1);
      /** @type {HTMLElement} */ (f.querySelector('.wc-t')).textContent = title; /** @type {HTMLElement} */ (f.querySelector('.wc-line')).textContent = line;
      if (credit) /** @type {HTMLElement} */ (f.querySelector('.wc-cr')).textContent = credit;
      document.body.appendChild(f); document.body.classList.add('sharing');
      const img = f.querySelector('img'); if (!img) return true;
      /* the largest picture Wikimedia has, else the page's own size; never longer than 15 s. One that won't load (too
         big for the proxy, say: the page drops it too) leaves the words alone */
      return new Promise(done => { setTimeout(() => done(false), 15000); img.onload = () => done(true); img.onerror = () => { img.onerror = () => done(false); img.src = small; }; img.src = src; });
    }, { kind: p.kind || 'concept', title: p.title, line: p.line, src: big, small: pic ? pic.src : '', credit, from });
    if (pic && !shown) { console.log(`${p.title}: its picture didn't load, so the words stand alone`); due.splice(due.indexOf(p) + 1, 0, { ...p, nopic: true }); continue; }
  }
  const n = await shoot(file); drop(have.pages[p.word], file);
  index.pages[p.word] = { file, from, title: p.title, kind: p.kind, line: p.line, alt: alt.replace(/\s+/g, ' ').slice(0, 400), ...(credit ? { credit } : {}) };
  say(p.title, file, n);
}
/* the front page's: the hero as a visitor first sees it, under the wordmark; also what any page without one shows */
if (front) {
  await open();
  await page.evaluate(() => {
    document.querySelectorAll('.top-r,.presets,.seed-err,.prog,#status').forEach(e => e.remove());
    const h = /** @type {HTMLElement} */ (document.querySelector('.hero')); [...h.parentNode.children].forEach(e => { if (e !== h) e.remove(); });
    /** @type {HTMLElement} */ (document.querySelector('.ckey')).style.visibility = 'hidden';
    const r = h.getBoundingClientRect(); h.style.transform = `translateY(${Math.round((630 - r.height) / 2 - r.top + 14)}px) scale(1.18)`;
  });
  const n = await shoot(GENERIC.image); index.generic = { file: GENERIC.image, from: 'front', alt: GENERIC.alt }; say('the front page', GENERIC.image, n);
}
await browser.close();
/* a page no longer known takes its picture with it */
for (const [w, im] of Object.entries(index.pages)) if (!known.some(p => p.word === w)) { drop(im, ''); delete index.pages[w]; }
writeFileSync(join(dir, 'index.json'), `${JSON.stringify(index, null, 1)}\n`);
console.log(`src/static/share/index.json: ${Object.keys(index.pages).length} pages`);

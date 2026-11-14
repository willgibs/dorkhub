// End-to-end smoke test in a real browser, against a fresh local dev server running the
// mock writer. Not part of `npm test` because it needs Chromium (Playwright):
//   npx playwright install chromium   (once)
//   npm run e2e
// Walks the whole reader on desktop and on a phone in dark mode: a page at its own address, the
// cards, back and forward, every tool, Save, Your world, the sidebar, a link from outside (the
// guard), the end of the trial, a bad key, a good key; then a browser with rabbit holes from
// before moves in. Screenshots go to $E2E_SHOTS (default .e2e/, which is git-ignored).
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { FRONT } from '../lib/front.js';
import { placeholderText } from '../lib/placeholder.js';
import { DISEASE, LAW, OUTLIER_AROUND, QUESTION, RULES, VILLAGE, outlierPage } from '../tests/outliers.js';
import { slugOf, topicKey } from '../src/shared/world.js';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('Playwright is missing: run npm install, then npx playwright install chromium'); process.exit(1); }
const shots = process.env.E2E_SHOTS || '.e2e';
mkdirSync(shots, { recursive: true });
const port = 3900 + Math.floor(Math.random() * 90);
const base = `http://localhost:${port}`;
/* A small trial keeps the run short, and goes through the same setting production uses. */
const PAGES = 5;
const server = spawn(process.execPath, [fileURLToPath(new URL('dev.mjs', import.meta.url))], { env: { ...process.env, PORT: String(port), DH_MOCK: '1', DH_MOCK_PACE: 'quick', DH_PICTURES: 'off', DH_TRIAL_PAGES: String(PAGES) }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.on('data', d => { if (String(d).includes('dorkhub on')) resolve(null); }); server.on('exit', () => reject(new Error('dev server exited'))); });

const browser = await chromium.launch();
const errors = [];
const results = [];
/* Pages are written once per topic and then reused, and pre-written topics are free wherever they
   are linked, so a step that expects to spend a free page opens a topic that is neither. */
const written = new Set();
const seeded = new Set([...Object.keys(JSON.parse(readFileSync(new URL('../lib/seeds/index.json', import.meta.url), 'utf8')).pages), ...FRONT.map(f => topicKey(f.t))]);
const fresh = (/** @type {string} */ t) => t && !written.has(topicKey(t)) && !seeded.has(topicKey(t));
const step = async (name, fn) => { const t = Date.now(); try { await fn(); results.push(`ok   ${name} (${Date.now() - t} ms)`); } catch (e) { results.push(`FAIL ${name}: ${String(e.message).split('\n')[0]}`); throw e; } };

async function run(page, { mobile = false } = {}) {
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL_CONNECTION_FAILED|fonts\.g|status of (40[12]|503)/.test(m.text() + (m.location()?.url || ''))) errors.push(`console: ${m.text()}`); });
  const tag = mobile ? 'mobile' : 'desktop';
  page.on('response', r => { if (!r.url().endsWith('/api/write') || r.status() !== 200 || r.headers()['x-dh-cache']) return; const b = r.request().postDataJSON(); if (b && b.task === 'page' && !b.cachedOnly) written.add(topicKey(b.input?.title)); });
  const first = mobile ? 'Moss piglets' : 'Water bears';
  /* what is left of the trial, as the server last said */
  const left = () => page.evaluate(n => { try { const t = JSON.parse(localStorage.getItem('dorkhub:auth:v1') || '{}').trial; return String(t ? t.pages : n); } catch (e) { return String(n); } }, PAGES);
  /* a page is done when it is no longer busy and its cards are in */
  const waitDone = async () => { await page.waitForFunction(() => { const a = document.querySelector('.chamber .article'); return a && a.getAttribute('aria-busy') === 'false' && a.querySelector('.a-end .card'); }, null, { timeout: 20000 }); };

  await step(`${tag}: landing`, async () => {
    await page.goto(base);
    await page.waitForSelector('#seedIn');
    const line = await page.locator('#status').textContent();
    if (!line.includes(`first ${PAGES} pages are on us`)) throw new Error(`status line: ${line}`);
    if ((await page.locator('#seedKey b').textContent()) !== String(PAGES)) throw new Error('the composer’s key pill');
    /* the fonts are our own files, so they load under the page's CSP without asking any third party */
    const fams = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')); });
    for (const f of ['Inter']) if (!fams.includes(f)) throw new Error(`${f} did not load (${fams.join(', ') || 'none'})`);
    const off = await page.evaluate(() => document.querySelectorAll('.intro-sec,#demo,.chains,.ideas,.saved').length);
    if (off) throw new Error('the front page still describes rabbit holes');
    await page.screenshot({ path: `${shots}/${tag}-1-landing.png` });
  });
  /* the hero is one composer: its beam runs, send is Surprise me until there is something to read about, and the presets re-roll */
  await step(`${tag}: the composer`, async () => {
    const h = await page.evaluate(() => { const box = document.querySelector('#seedBox'); const cs = box && getComputedStyle(box); return { h1: document.querySelector('h1')?.textContent, beam: !!box && box.classList.contains('beam') && !!box.querySelector('.beam-bloom'), anim: cs ? cs.animationName : '', send: document.querySelector('#seedGo')?.getAttribute('aria-label'), act: /** @type {HTMLElement} */ (document.querySelector('#seedGo'))?.dataset.act }; });
    /* the heading as read aloud: its last word may still be stepping through topics, but it is heard whole */
    const named = await page.locator('h1').ariaSnapshot();
    if (!named.includes('heading "Learn about anything"') || !h.beam || !/beam-spin/.test(h.anim) || h.send !== 'Surprise me' || h.act !== 'surprise') throw new Error(`composer: ${JSON.stringify(h)} ${named}`);
    await page.fill('#seedIn', 'Why do cats purr?');
    const typed = await page.evaluate(() => { const b = /** @type {HTMLButtonElement} */ (document.querySelector('#seedGo')); return { label: b.getAttribute('aria-label'), type: b.type, act: b.dataset.act || '' }; });
    if (typed.label !== 'Start reading' || typed.type !== 'submit' || typed.act) throw new Error(`send after typing: ${JSON.stringify(typed)}`);
    await page.fill('#seedIn', '');
    const before = await page.$$eval('.door[data-seed]', bs => bs.map(b => /** @type {HTMLElement} */ (b).dataset.seed));
    await page.locator('[data-act="shuffle"]').click();
    /* the new set, whenever it lands: the swap runs on the page's timers, and a busy machine keeps its own time */
    await page.waitForFunction(was => { const now = [...document.querySelectorAll('.door[data-seed]')].map(d => /** @type {HTMLElement} */ (d).dataset.seed); return now.length === 4 && !now.some(t => was.includes(t)); }, before, { timeout: 15000 }).catch(() => {});
    const after = await page.$$eval('.door[data-seed]', bs => bs.map(b => /** @type {HTMLElement} */ (b).dataset.seed));
    if (after.length !== 4 || after.some(t => before.includes(t))) throw new Error(`shuffle: ${JSON.stringify({ before, after })}`);
  });
  /* below the composer, ways in: every card its own drawing leading into a planned topic, with only its kind and
     title, the first one peeking above the fold; one card plays at a time, never two even after a fling; a flytrap
     that counts touches; an Enigma that never lights the key pressed; drawings that answer the pointer; and a map of
     the threads between the topics that says why, beside it, for the topic pointed at */
  await step(`${tag}: ways in below the composer`, async () => {
    await page.waitForSelector('#bentoB .wc'); await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
    const f = await page.evaluate(() => { const cards = [.../** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('#ways .wc'))]; return { n: cards.length, hero: cards[0].classList.contains('wc-hero'), peek: Math.round(cards[0].getBoundingClientRect().top), vh: innerHeight, drawn: cards.filter(c => c.querySelector('.wc-art [role="img"][aria-label], .wc-art img[alt], .wc-art .tt, .wc-art .en')).length, links: cards.map(c => { const a = /** @type {HTMLAnchorElement} */ (c.querySelector('.wc-t a')); return [a.getAttribute('href'), a.dataset.way]; }), map: !!document.querySelector('#threadStage canvas'), chips: document.querySelectorAll('.door[data-seed]').length }; });
    if (f.n !== 13 || !f.hero || f.peek >= f.vh || f.drawn !== f.n || !f.map || f.chips !== 4 || f.links.some(([h, t]) => !t || h !== `/${slugOf(t)}`)) throw new Error(`ways in: ${JSON.stringify(f)}`);
    /* a card says only its kind and title: no number, no hook */
    const words = await page.evaluate(() => ({ hooks: document.querySelectorAll('#ways .wc-h, #ways .wc-n').length, caps: [...document.querySelectorAll('#ways .wc:not(.wc-world)')].filter(c => c.querySelector('.wc-cap .wc-kind .kind') && c.querySelector('.wc-cap .wc-t a')).length }));
    if (words.hooks || words.caps !== 13) throw new Error(`cards' words: ${JSON.stringify(words)}`);
    await page.screenshot({ path: `${shots}/${tag}-1b-front.png` });
    /* one card plays at a time: after a fling down the page, sample what is playing until it settles. The fling
       starts with the hero half in view, short of its turn, and only cards where it lands may play, none it passed */
    if (!mobile) {
      await page.evaluate(() => { const r = /** @type {HTMLElement} */ (document.querySelector('#ways .wc-hero')).getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.top - (innerHeight - r.height * .5)); });
      await page.waitForTimeout(900);
      await page.waitForFunction(() => !document.querySelector('#ways .playing'), null, { timeout: 15000 });
      const seenBefore = await page.$$eval('#ways .seen', cs => cs.map(c => c.id || /** @type {HTMLElement} */ (c).dataset.card));
      /* The fling is made in the page, not from here: a screenful every frame, and never slower than 3 px a
         millisecond by the page's own clock. So no card it passes is on screen for two frames running, and it is a
         fling by the stage's measure (1.4 px/ms) however slowly this machine runs. Wheel events sent from here
         arrived as slowly as the machine was busy, and then the stage, rightly, saw a reader scrolling. */
      await page.evaluate(() => new Promise(done => {
        let left = 2100, t = performance.now();
        const go = () => { const now = performance.now(), d = Math.min(left, Math.max(innerHeight, Math.ceil((now - t) * 3))); t = now; scrollBy(0, d); left -= d; if (left > 0) requestAnimationFrame(go); else done(null); };
        requestAnimationFrame(go);
      }));
      let most = 0, played = 0; const t0 = Date.now();
      while (Date.now() - t0 < 5000) { const n = await page.evaluate(() => [document.querySelectorAll('#ways .playing').length, document.querySelectorAll('#ways .seen').length]); most = Math.max(most, n[0]); played = n[1]; await page.waitForTimeout(70); }
      const passed = await page.$$eval('#ways .seen', cs => cs.filter(c => { const r = c.getBoundingClientRect(); return r.bottom <= 0 || r.top >= innerHeight; }).map(c => c.id || /** @type {HTMLElement} */ (c).dataset.card));
      if (most > 1 || !played || passed.some(k => !seenBefore.includes(k))) throw new Error(`the stage played ${most} at once (${played} seen; played though only flung past: ${passed})`);
    }
    /* every card tells its story on its turn, and ends finished: bring each to the middle of the screen and wait for it */
    for (const c of await page.locator('#ways .wc').all()) { await c.evaluate(el => el.scrollIntoView({ block: 'center' })); await page.waitForFunction(el => el.classList.contains('seen') && !el.classList.contains('playing'), await c.elementHandle(), { timeout: 20000 }); }
    await page.waitForTimeout(2200);
    await page.waitForFunction(() => ![...document.querySelectorAll('#ways .wc .dr')].some(d => d.getClientRects().length && parseFloat(getComputedStyle(d).strokeDashoffset) > .01), null, { timeout: 15000 }).catch(() => {});
    const done = await page.evaluate(() => { const cards = [...document.querySelectorAll('#ways .wc')]; const draws = [...document.querySelectorAll('#ways .wc .dr')].filter(d => d.getClientRects().length); return { unseen: cards.filter(c => !c.classList.contains('seen')).map(c => c.dataset.card), unfinished: draws.filter(d => parseFloat(getComputedStyle(d).strokeDashoffset) > .01).length, draws: draws.length }; });
    if (done.unseen.length || done.unfinished || !done.draws) throw new Error(`entrances: ${JSON.stringify(done)}`);
    /* the cube's count rolls in on reels drawn for the eye; a screen reader still hears the number, once and whole */
    const count = await page.locator('[data-card="rubiks-cube"] .rb-n').ariaSnapshot();
    if (!count.includes('43,252,003,274,489,856,000') || /\d \d/.test(count)) throw new Error(`the cube's count, read aloud: ${count.slice(0, 120)}`);
    if (!mobile) for (const c of await page.locator('#ways .wc').all()) { const name = await c.getAttribute('data-card'); if (name) await c.screenshot({ path: `${shots}/${tag}-card-${name}.png` }); }
    /* the flytrap counts touches, shuts on the second and digests at five */
    const ft = page.locator('.wc[data-fx="flytrap"]'); await ft.scrollIntoViewIfNeeded();
    await ft.locator('.ft-btn').click(); const one = await ft.getAttribute('data-state');
    await ft.locator('.ft-btn').click(); const two = await ft.getAttribute('data-state');
    const lit = await ft.evaluate(c => c.querySelectorAll('.ft-steps li.on').length);
    if (one !== 'armed' || two !== 'shut' || lit !== 2) throw new Error(`the flytrap: ${one}, then ${two}, ${lit} steps lit`);
    /* the Enigma: typing or tapping lights the lamp each letter becomes, steps the rotors, and never lights a key itself */
    const en = page.locator('.wc[data-fx="enigma"]'); await en.scrollIntoViewIfNeeded();
    await en.locator('.en-in input').fill('AAAAA');
    const e1 = await en.evaluate(c => ({ out: c.querySelector('.en-cy')?.textContent, rotors: [.../** @type {NodeListOf<HTMLElement>} */ (c.querySelectorAll('.en-rw'))].map(s => s.dataset.at).join(''), lit: c.querySelector('.en-lamps i.on')?.textContent, n: c.querySelector('.en-n')?.textContent, of: c.querySelector('.en-of')?.textContent }));
    if (e1.out !== 'BDZGO' || e1.rotors !== 'AAF' || e1.lit !== 'O' || e1.n !== '0' || e1.of !== '5') throw new Error(`the Enigma: ${JSON.stringify(e1)}`);
    await en.locator('.en-in input').fill('WETTERVORHERSAGE');
    const same = await en.evaluate(c => { const a = c.querySelector('.en-pl')?.textContent || '', b = c.querySelector('.en-cy')?.textContent || ''; return a.length === 16 && b.length === 16 ? [...a].filter((x, i) => x === b[i]).length : -1; });
    if (same !== 0) throw new Error(`the Enigma lit a letter as itself: ${same}`);
    await en.locator('.en-x').click(); await en.locator('.en-keys [data-k="W"]').click(); await en.locator('.en-keys [data-k="E"]').click();
    const tapped = await en.evaluate(c => [c.querySelector('.en-pl')?.textContent, c.querySelector('.en-cy')?.textContent?.length, c.querySelector('.en-lamps i.on')?.textContent]);
    if (tapped[0] !== 'WE' || tapped[1] !== 2 || !tapped[2] || tapped[2] === 'E') throw new Error(`the Enigma's keys: ${JSON.stringify(tapped)}`);
    await en.screenshot({ path: `${shots}/${tag}-1c-enigma.png` });
    /* drawings answer the pointer: the black hole names the part pointed at; the magnet's filings turn toward it;
       the folded sheet opens and closes across the card */
    if (!mobile) {
      const bh = page.locator('.wc[data-card="black-holes"]'); await bh.evaluate(el => el.scrollIntoView({ block: 'center' })); await page.waitForTimeout(300);
      const hb = /** @type {{ x: number, y: number, width: number, height: number }} */ (await bh.boundingBox());
      await page.mouse.move(hb.x + hb.width * .5, hb.y + hb.height * .3, { steps: 4 }); await page.waitForTimeout(200);
      const read = await bh.evaluate(c => c.classList.contains('reading') ? c.querySelector('.wc-read')?.textContent : '');
      if (!/far side of the disk/.test(read || '')) throw new Error(`the black hole's reading: ${read}`);
      const mg = page.locator('.wc[data-card="magnets"]'); await mg.evaluate(el => el.scrollIntoView({ block: 'center' })); await page.waitForTimeout(1600);
      const ink = () => mg.evaluate(c => { const cv = /** @type {HTMLCanvasElement} */ (c.querySelector('.mg-cv')); const d = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d')).getImageData(0, 0, cv.width, cv.height).data; let n = 0, h = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) { n++; h = (h * 31 + i) % 1000003; } return [n, h]; });
      const before = await ink(); const mb = /** @type {{ x: number, y: number, width: number, height: number }} */ (await mg.boundingBox());
      await page.mouse.move(mb.x + mb.width * .8, mb.y + mb.height * .8, { steps: 6 }); await page.waitForTimeout(700); const after = await ink();
      if (before[0] < 1500 || before[1] === after[1]) throw new Error(`the magnet's filings: ${JSON.stringify({ before, after })}`);
      const mi = page.locator('.wc[data-card="origami"]'); await mi.evaluate(el => el.scrollIntoView({ block: 'center' })); await page.waitForTimeout(1600);
      const face = () => mi.evaluate(c => c.querySelector('.vz-w .mi-f')?.getAttribute('d') || '');
      const rest = await face(); const ob = /** @type {{ x: number, y: number, width: number, height: number }} */ (await mi.boundingBox());
      await page.mouse.move(ob.x + ob.width * .15, ob.y + ob.height * .6, { steps: 6 }); await page.waitForTimeout(700);
      if (!rest || (await face()) === rest) throw new Error('the fold did not answer the pointer');
      await page.mouse.move(0, 0);
    }
    if (!mobile) {
      const stage = page.locator('#threadStage'); await stage.scrollIntoViewIfNeeded(); await page.waitForTimeout(1300);
      const box = /** @type {{ x: number, y: number, width: number, height: number }} */ (await stage.boundingBox()); let found = false;
      for (let y = box.y + box.height * .25; y < box.y + box.height * .75 && !found; y += 9) for (let x = box.x + box.width * .25; x < box.x + box.width * .75; x += 9) { await page.mouse.move(x, y); if (await page.evaluate(() => /** @type {HTMLElement} */ (document.querySelector('#threadStage canvas')).style.cursor === 'pointer')) { found = true; break; } }
      const th = await page.evaluate(() => { const b = /** @type {HTMLElement} */ (document.querySelector('#threads .th-body')); return { t: b.querySelector('.th-t')?.textContent || '', n: b.querySelectorAll('.th-list li').length, way: /** @type {HTMLElement} */ (b.querySelector('.wc-go'))?.dataset.way || '' }; });
      if (!found || !th.t || !th.n || th.way !== th.t) throw new Error(`the map of threads: ${JSON.stringify({ found, ...th })}`);
      await page.locator('#threads').screenshot({ path: `${shots}/${tag}-1d-threads.png` });
    }
  });
  /* the map of threads is drawn on a canvas: switching the theme draws it again in the new theme's ink */
  if (!mobile) await step(`${tag}: the map of threads follows the theme`, async () => {
    await page.mouse.move(0, 0); await page.locator('#threadStage').scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
    const ink = () => page.evaluate(() => { const c = /** @type {HTMLCanvasElement} */ (document.querySelector('#threadStage canvas')); const d = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d')).getImageData(0, 0, c.width, c.height).data; let n = 0, l = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 40) { n++; l += d[i] + d[i + 1] + d[i + 2]; } return n ? l / n / 3 : -1; });
    const theme = () => page.evaluate(() => document.documentElement.dataset.theme || '');
    const light = await ink(); if (light < 0) throw new Error('the map of threads is empty');
    /* the switch steps Device, Light, Dark: on to Dark, then back to Device */
    for (let i = 0; i < 3 && (await theme()) !== 'dark'; i++) await page.locator('#themeBtn').click();
    await page.waitForTimeout(300); const dark = await ink();
    for (let i = 0; i < 3 && (await theme()) !== ''; i++) await page.locator('#themeBtn').click();
    await page.waitForTimeout(300); const back = await ink();
    if (Math.abs(dark - light) < 30 || Math.abs(back - light) > 6) throw new Error(`the map's ink: light ${light.toFixed(0)}, dark ${dark.toFixed(0)}, back ${back.toFixed(0)}`);
  });
  await step(`${tag}: a page written ahead of time opens at its own address, free`, async () => {
    await page.fill('#seedIn', 'Tardigrades'); await page.press('#seedIn', 'Enter'); await waitDone();
    const p = await page.evaluate(() => ({ url: location.pathname, title: document.querySelector('.a-title')?.textContent, fine: document.querySelector('.fineprint')?.textContent || '', paras: document.querySelectorAll('.a-body .pb').length, bridge: !!document.querySelector('.bridge') }));
    if (p.url !== '/tardigrades' || p.title !== 'Tardigrades' || p.paras < 3 || p.fine.trim() || p.bridge) throw new Error(`pre-written page: ${JSON.stringify(p)}`);
    if ((await left()) !== String(PAGES)) throw new Error(`a pre-written page spent a free page: ${await left()}`);
    await page.goto(base); await page.waitForSelector('#seedIn');
  });
  /* a card leads into one of the front page's topics: until its page is written it opens a placeholder, free
     and instant, shaped like a page, and every page it leads to opens free too. Every card's page is written
     today, so the walk serves Origami's and its neighbours' placeholders the way the server does for a new topic */
  await step(`${tag}: a card opens its topic free, a placeholder until it is written`, async () => {
    await page.route('**/api/write', async r => { const b = r.request().postDataJSON(); const ph = b && b.task === 'page' && b.input && !b.input.ctx && placeholderText(b.input.title || ''); if (ph) await r.fulfill({ status: 200, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-dh-cache': 'placeholder' }, body: ph }); else await r.continue(); });
    const card = page.locator('.wc[data-card="origami"] .wc-t a'); await card.scrollIntoViewIfNeeded(); await card.click(); await waitDone();
    const p = await page.evaluate(() => ({ url: location.pathname, title: document.querySelector('.a-title')?.textContent, kind: document.querySelector('.where .kind')?.textContent || '', fine: document.querySelector('.fineprint')?.textContent || '', paras: document.querySelectorAll('.a-body .pb').length, cards: [.../** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.a-end .card'))].map(c => c.dataset.t || ''), qs: document.querySelectorAll('.a-end [data-q]').length }));
    if (p.url !== '/origami' || p.title !== 'Origami' || p.kind !== 'Technique' || !/placeholder/i.test(p.fine) || p.paras < 3 || p.cards.length !== 6 || p.qs !== 3) throw new Error(`placeholder: ${JSON.stringify(p)}`);
    /* the card's drawing came with it, as the page's plate above its title, and the page lists the sources its claims were checked against */
    const plate = await page.evaluate(() => { const pl = document.querySelector('.a-head > .a-plate'); const t = document.querySelector('.a-title'); return { card: pl?.querySelector('.wc[data-card="origami"] svg') ? 'drawn' : pl ? 'empty' : 'none', above: !!pl && !!t && pl.getBoundingClientRect().bottom <= t.getBoundingClientRect().top, sources: document.querySelectorAll('.fineprint details.pv .pv-list a[href^="https://"]').length }; });
    if (plate.card !== 'drawn' || !plate.above || plate.sources < 2) throw new Error(`the card's plate and the sources: ${JSON.stringify(plate)}`);
    if ((await left()) !== String(PAGES)) throw new Error(`a placeholder spent a free page: ${await left()}`);
    await page.screenshot({ path: `${shots}/${tag}-1e-placeholder.png` });
    await page.locator('.a-end .card').first().click();
    await page.waitForFunction(t => document.querySelector('.a-title')?.textContent === t, p.cards[0], { timeout: 20000 }); await waitDone();
    const next = await page.evaluate(() => document.querySelector('.fineprint')?.textContent || '');
    if (!/placeholder/i.test(next) || (await left()) !== String(PAGES)) throw new Error(`the next page: ${next}, ${await left()} free pages`);
    /* the thread: the head says where you came from, and the page's end is this page as an unnamed point with a thread
       out to each way on (on a phone, hanging from one stem), each thread arriving level at the edge of its ring, even
       for a card that was still rising into place when the threads were drawn */
    if (!mobile) await page.waitForFunction(() => document.querySelectorAll('.fan-svg .fan-t').length >= 6, null, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(700);
    const thread = await page.evaluate(() => {
      const fan = document.querySelector('.fan'); const at = (/** @type {HTMLElement} */ d) => { let x = 0, y = d.offsetHeight / 2; for (let n = /** @type {HTMLElement | null} */ (d); n && n !== fan; n = /** @type {HTMLElement | null} */ (n.offsetParent)) { x += n.offsetLeft; y += n.offsetTop; } return [x, y]; };
      const miss = [...document.querySelectorAll('.fan-svg .fan-t')].map(t => { const n = (t.getAttribute('d') || '').match(/-?[\d.]+/g)?.map(Number) || []; const ring = /** @type {HTMLElement} */ (document.querySelector(`.fan-door[data-n="${/** @type {HTMLElement} */ (t).dataset.n}"] .fan-dot`)); const [x, y] = at(ring); return Math.max(Math.abs(n[n.length - 2] - x), Math.abs(n[n.length - 1] - y)); });
      return { from: document.querySelector('.where .from b')?.textContent || '', me: !!document.querySelector('.fan-me'), named: (document.querySelector('.fan-in')?.textContent || '').trim(), out: miss.length, miss: Math.max(0, ...miss), rings: document.querySelectorAll('.a-end .fan-door .fan-dot').length };
    });
    if (thread.from !== 'Origami' || !thread.me || thread.named || thread.rings !== 6 || (!mobile && (thread.out !== 6 || thread.miss > 1))) throw new Error(`the thread: ${JSON.stringify(thread)}`);
    /* once its page is written, the placeholder kept in this browser gives way to it */
    const written = '# Origami :: technique\n> Written at last.\n---\nThe written page, with a link to [[DNA]].\n===\n- [[DNA]] :: Folded into shapes of its own. :: thing\n???\nHow far can a sheet of paper be folded?\n';
    await page.route('**/api/write', async r => { const b = r.request().postDataJSON(); if (b && b.cachedOnly && b.input && b.input.title === 'Origami') await r.fulfill({ status: 200, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-dh-cache': 'seed' }, body: written }); else await r.continue(); });
    await page.goto(`${base}/origami`); await page.waitForFunction(() => /The written page/.test(document.querySelector('.a-body')?.textContent || ''), null, { timeout: 20000 }); await waitDone();
    const after = await page.evaluate(() => document.querySelector('.fineprint')?.textContent || '');
    if (after.trim()) throw new Error(`the written page: ${after}`);
    await page.unroute('**/api/write');
    await page.goto(base); await page.waitForSelector('#seedIn');
  });
  /* a front-page topic written ahead of time, by the same writer as any page: its card's drawing as its plate, then
     its key facts under the deck, side by side when every value fits on one line and down the column when one doesn't,
     never wrapping a value side by side or running past the column; the page says nothing about when it was written */
  await step(`${tag}: a card's page written ahead of time opens with its drawing and its key facts`, async () => {
    const card = page.locator('.wc[data-card="black-holes"] .wc-t a'); await card.scrollIntoViewIfNeeded(); await card.click(); await waitDone();
    const p = await page.evaluate(() => {
      const kf = document.querySelector('.a-head .keyfacts'), deck = document.querySelector('.a-head .deck'), body = document.querySelector('.a-body');
      const rows = kf ? [...kf.children].map(d => { const dd = /** @type {HTMLElement} */ (d.querySelector('dd')); return { dt: d.querySelector('dt')?.textContent || '', dd: dd?.textContent || '', top: Math.round(d.getBoundingClientRect().top), lines: dd ? Math.round(dd.getBoundingClientRect().height / parseFloat(getComputedStyle(dd).lineHeight)) : 0 }; }) : [];
      return { url: location.pathname, fine: document.querySelector('.fineprint')?.textContent || '', rows, fit: /** @type {HTMLElement | null} */ (kf)?.dataset.fit || '', over: kf ? kf.scrollWidth - kf.clientWidth : 0, under: !!kf && !!deck && deck.getBoundingClientRect().bottom <= kf.getBoundingClientRect().top, above: !!kf && !!body && kf.getBoundingClientRect().bottom <= body.getBoundingClientRect().top, plate: !!document.querySelector('.a-head > .a-plate .wc[data-card="black-holes"] svg.vz.bh') };
    });
    const tops = new Set(p.rows.map(r => r.top)).size;
    const laid = p.over <= 1 && (p.fit === 'across' ? tops === 1 && p.rows.every(r => r.lines === 1) : p.fit === 'down' && tops === 3);
    if (p.url !== '/black-holes' || p.fine.trim() || p.rows.length !== 3 || p.rows.some(r => !r.dt || !r.dd) || !p.under || !p.above || !laid || !p.plate) throw new Error(`the written page: ${JSON.stringify(p)}`);
    if ((await left()) !== String(PAGES)) throw new Error(`a page written ahead of time spent a free page: ${await left()}`);
    await page.screenshot({ path: `${shots}/${tag}-1f-written.png` });
    await page.goto(base); await page.waitForSelector('#seedIn');
  });
  /* the dice only ever opens a page written ahead of time, and never one already on screen */
  await step(`${tag}: the dice opens a pre-written topic that isn't on screen`, async () => {
    const shown = await page.$$eval('.door[data-seed]', bs => bs.map(b => /** @type {HTMLElement} */ (b).dataset.seed));
    /* the page Continue offers is never suggested beside it as well */
    const cont = await page.evaluate(() => document.querySelector('.door-cont .dc-t')?.textContent || '');
    if (cont && shown.includes(cont)) throw new Error(`suggested twice: ${cont} in ${JSON.stringify(shown)}`);
    await page.locator('[data-act="surprise"]').click(); await waitDone();
    const p = await page.evaluate(() => ({ title: document.querySelector('.a-title')?.textContent || '', fine: document.querySelector('.fineprint')?.textContent || '' }));
    if (shown.includes(p.title) || !p.title) throw new Error(`dice: ${JSON.stringify({ shown, ...p })}`);
    if ((await left()) !== String(PAGES)) throw new Error(`the dice spent a free page: ${await left()}`);
    await page.goto(base); await page.waitForSelector('#seedIn');
  });
  /* paused (no credits for free pages): nothing is spent, the page says so first and asks nothing,
     and the pages written ahead of time it offers still open */
  await step(`${tag}: a paused page offers pages written ahead of time`, async () => {
    await page.route('**/api/write', async r => { const b = r.request().postDataJSON(); if (b && b.task === 'page' && /moths/.test(JSON.stringify(b.input))) await r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'trial_paused' }) }); else await r.continue(); });
    await page.fill('#seedIn', 'Why do moths fly toward lights?'); await page.press('#seedIn', 'Enter');
    await page.waitForSelector('.state[data-state="trial_paused"] .way', { timeout: 20000 });
    const st = await page.evaluate(() => { const a = document.querySelector('.article'); return { doors: a.querySelectorAll('.state .way').length, label: a.querySelector('.where .st-l')?.textContent, ask: !!a.querySelector('.ask'), cards: !!a.querySelector('.card'), tools: a.querySelectorAll('.tools [data-act]').length, first: /** @type {HTMLElement} */ (a.querySelector('.a-end > div'))?.dataset.k }; });
    if (st.doors !== 3 || st.label !== 'Paused' || st.ask || st.cards || st.tools || st.first !== 'status') throw new Error(`paused page: ${JSON.stringify(st)}`);
    if ((await left()) !== String(PAGES)) throw new Error(`a paused page spent a free page: ${await left()}`);
    await page.screenshot({ path: `${shots}/${tag}-2-paused.png` });
    const door = await page.locator('.state .way').first().getAttribute('data-way');
    await page.locator('.state .way').first().click();
    await page.waitForFunction(t => document.querySelector('.a-title')?.textContent === t, door, { timeout: 20000 }); await waitDone();
    if ((await left()) !== String(PAGES)) throw new Error(`the pre-written page spent a free page: ${await left()}`);
    await page.unroute('**/api/write');
    await page.goto(base); await page.waitForSelector('#seedIn');
  });
  /* pictures come from our own endpoint: one found on desktop, none on the phone */
  if (!mobile) {
    await page.route('**/api/picture?t=*', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ src: '/api/picture?f=a%2Fab%2FTest.jpg&w=500', w: 500, h: 300, alt: 'A test picture', desc: 'A green field, for the test', credit: 'E2E', license: 'CC0', file: 'https://commons.wikimedia.org/wiki/File:Test.jpg' }) }));
    await page.route('**/api/picture?f=*', r => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300"><rect width="500" height="300" fill="#4a7"/></svg>' }));
  } else await page.route('**/api/picture?t=*', r => r.fulfill({ status: 204 }));
  await step(`${tag}: first page streams in`, async () => {
    /* what the wait looked like: its words, whether an orb was drawn beside them, and the picture slot's first height */
    await page.evaluate(() => { const w = /** @type {any} */ (window); w.__status = new Set(); w.__orb = false; w.__picH0 = 0; new MutationObserver(() => { const s = document.querySelector('.status-line'); if (s) { w.__status.add(s.textContent); if (s.querySelector('canvas.orb')) w.__orb = true; } const b = document.querySelector('.pic-box'); if (b && !w.__picH0) w.__picH0 = b.getBoundingClientRect().height; }).observe(document.body, { childList: true, subtree: true, characterData: true }); });
    await page.fill('#seedIn', first); await page.press('#seedIn', 'Enter');
    await page.waitForSelector('.a-title'); await waitDone();
    const status = await page.evaluate(() => ({ seen: [.../** @type {any} */ (window).__status], orb: /** @type {any} */ (window).__orb, now: !!document.querySelector('.status-line'), orbsLeft: document.querySelectorAll('.a-body canvas.orb').length }));
    if (!status.seen.length || status.now || status.seen.some(s => /path/.test(s))) throw new Error(`status line: seen ${JSON.stringify(status.seen)}, still there ${status.now}`);
    if (!status.orb || status.orbsLeft) throw new Error(`thinking orb: ${JSON.stringify(status)}`);
    const where = await page.evaluate(() => ({ url: location.pathname, title: document.querySelector('.a-title')?.textContent, kind: document.querySelector('.where .kind')?.textContent || '', accent: document.documentElement.dataset.accent }));
    if (where.url !== `/${slugOf(first)}` || where.title !== first || !where.kind || !where.accent) throw new Error(`the page: ${JSON.stringify(where)}`);
    /* every page carries its line of key facts, under the deck */
    const kf = await page.evaluate(() => { const k = document.querySelector('.a-head .keyfacts'), d = document.querySelector('.a-head .deck'); return { n: k ? k.children.length : 0, under: !!k && !!d && d.getBoundingClientRect().bottom <= k.getBoundingClientRect().top }; });
    if (kf.n !== 3 || !kf.under) throw new Error(`the key facts: ${JSON.stringify(kf)}`);
    if ((await left()) !== String(PAGES - 1)) throw new Error(`free pages ${await left()}`);
    /* reading first: the opening paragraph starts on the first screen; one column, a facts panel below its paragraph and lined up with it */
    await page.evaluate(() => window.scrollTo(0, 0));
    const lay = await page.evaluate(() => {
      const pb = document.querySelector('.a-body .pb'); const p = pb.querySelector('.pcol > p').getBoundingClientRect(); const f = pb.querySelector('.mcol .panel[data-type="facts"]')?.getBoundingClientRect();
      return { top: p.top, vh: innerHeight, inline: f ? Math.abs(f.left - p.left) < 2 : null, below: f ? f.top >= p.bottom : null, v1: !!document.querySelector('.h-side,.glance-band,.drift,.caret,.levelband,.react,.next'), tools: !!document.querySelector('.a-head .h-row .tools [data-act="save"]'), order: [...document.querySelectorAll('.a-end > div')].map(d => d.dataset.k).join(' '), cards: document.querySelectorAll('.a-end .card').length };
    });
    if (lay.top > lay.vh * .75) throw new Error(`the first paragraph starts at ${Math.round(lay.top)} of ${lay.vh}`);
    if (!lay.below || !lay.inline) throw new Error(`the facts panel is in the wrong place: ${JSON.stringify(lay)}`);
    if (lay.v1) throw new Error('levels, reactions or the old next page are still on the page');
    if (!lay.tools) throw new Error('the Save star is not in the head row');
    /* the head: a kind is its word in its colour, with no dot; no sketch among the tools; the theme switch is in the top
       bar on every page (on a phone, in the menu) */
    const head = await page.evaluate(() => { const k = document.querySelector('.where .kind'); return { dot: k ? getComputedStyle(k, '::before').content : '', sketch: !!document.querySelector('[data-act="sketch"]'), theme: getComputedStyle(/** @type {Element} */ (document.querySelector('#themeBtn'))).display }; });
    if (head.dot !== 'none' || head.sketch || (head.theme === 'none') !== mobile) throw new Error(`the head and the top bar: ${JSON.stringify(head)}`);
    /* reading: body text at 17 px on a measure of 580 px (Will, 2026-10-19: at 20 px on 680 px the eye travelled too far
       for the words each line carried); a link reads as the line around it, underlined in its kind's colour */
    const read = await page.evaluate(() => {
      const p = /** @type {HTMLElement} */ ([...document.querySelectorAll('.a-body .pcol > p')].find(x => !x.classList.contains('lead')) || document.querySelector('.a-body .pcol > p'));
      const a = document.querySelector('.a-body .pcol > p a.hole[data-kind]'); const cs = a && getComputedStyle(a);
      return { size: getComputedStyle(p).fontSize, width: Math.round(p.getBoundingClientRect().width), ink: !!cs && cs.color === getComputedStyle(/** @type {Element} */ (a.closest('p'))).color, underline: !!cs && cs.textDecorationLine.includes('underline') && cs.textDecorationColor !== cs.color };
    });
    if (read.size !== '17px' || read.width > 580 || !read.ink || !read.underline) throw new Error(`reading: ${JSON.stringify(read)}`);
    if (lay.order !== 'cards qs ask' || lay.cards !== 6) throw new Error(`the end of the page: ${JSON.stringify(lay)}`);
    /* the picture's slot is reserved at its own shape, holds that height through the dot field and the reveal, and ends as a plain picture */
    if (!mobile) await page.waitForSelector('.pic-box.shown', { timeout: 8000 });
    /* a plate across the column, saying what it shows and who made it */
    const pic = await page.evaluate(() => ({ n: document.querySelectorAll('figure.pic').length, inFirst: !!document.querySelector('.a-body .pb .mcol figure.pic img'), credit: document.querySelector('figure.pic figcaption a')?.textContent || '', desc: document.querySelector('figure.pic figcaption span')?.textContent || '', wide: Math.abs((document.querySelector('.pic-box')?.getBoundingClientRect().width || 0) - (document.querySelector('.a-body')?.getBoundingClientRect().width || 1)) < 2, h0: Math.round(/** @type {any} */ (window).__picH0), h: Math.round(document.querySelector('.pic-box')?.getBoundingClientRect().height || 0), field: !!document.querySelector('.pic-field') }));
    if (mobile ? pic.n !== 0 : !(pic.inFirst && pic.credit === 'E2E · CC0' && pic.desc === 'A green field, for the test' && pic.wide && pic.h0 > 0 && pic.h === pic.h0 && !pic.field)) throw new Error(`picture: ${JSON.stringify(pic)}`);
    /* the one note that pages can be wrong: once, after the page */
    const foot = await page.evaluate(() => { const f = document.querySelector('#view > .colfoot'); return { text: f?.textContent || '', after: !!f && f.previousElementSibling?.id === 'column', n: document.querySelectorAll('.colfoot').length }; });
    if (!/can make mistakes/.test(foot.text) || !foot.after || foot.n !== 1) throw new Error(`fine note: ${JSON.stringify(foot)}`);
    await page.screenshot({ path: `${shots}/${tag}-3-page.png`, fullPage: false });
    if (!mobile) {
      /* a link's card sits in the margin beside its line, never over the words */
      const hole = page.locator('.a-body .pcol a.hole').nth(1); await hole.scrollIntoViewIfNeeded(); await hole.hover(); await page.waitForSelector('#hcard:not([hidden])', { timeout: 3000 });
      const hc = await page.evaluate(() => { const c = document.querySelector('#hcard').getBoundingClientRect(), b = document.querySelector('.a-body').getBoundingClientRect(); return { margin: document.querySelector('#hcard').classList.contains('in-margin'), clear: c.left >= b.right }; });
      if (!hc.margin || !hc.clear) throw new Error(`the link card covers the text: ${JSON.stringify(hc)}`);
      await page.mouse.move(4, 300); await page.waitForTimeout(700);
      /* once the title has scrolled away, it waits in the top bar */
      await page.evaluate(() => window.scrollTo(0, 900)); await page.waitForTimeout(400);
      const top = await page.evaluate(() => { const t = /** @type {HTMLElement} */ (document.querySelector('#topT')); return { on: document.body.classList.contains('titled'), t: t?.textContent || '', kind: t?.dataset.kind || '', coloured: !!t && getComputedStyle(t).color === getComputedStyle(/** @type {Element} */ (document.querySelector('.where .kind'))).color, dot: !!t?.querySelector('.kind') }; });
      if (!top.on || top.t !== first || !top.kind || !top.coloured || top.dot) throw new Error(`the top bar's title: ${JSON.stringify(top)}`);
    }
    await page.locator('.a-end').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    await page.screenshot({ path: `${shots}/${tag}-4-keep-exploring.png`, fullPage: false });
  });
  await step(`${tag}: a guess keeps its answer until asked`, async () => {
    if (await page.locator('.panel[data-type="guess"] .pn-a').count()) throw new Error('the answer showed before it was asked for');
    await page.locator('.panel[data-type="guess"] .pn-reveal').click();
    await page.waitForFunction(() => !!document.querySelector('.panel[data-type="guess"] .pn-a') && document.activeElement === document.querySelector('.pn-a'), null, { timeout: 5000 });
    /* its number rolls in on reels drawn for the eye; a screen reader hears it once, from text, and none of the reels */
    const heard = await page.locator('.panel[data-type="guess"] .pn-a').ariaSnapshot();
    const reels = await page.$$eval('.panel[data-type="guess"] .odo', os => os.filter(o => !o.closest('[aria-hidden="true"]')).length);
    if (heard.trim() !== '- paragraph: "0"' || reels) throw new Error(`the guess's answer, read aloud: ${heard} (${reels} reels not hidden)`);
  });
  if (mobile) {
    /* on a phone the learning tools live in one gooey button: it opens, Save saves, Escape closes it again */
    await step(`${tag}: the tools button`, async () => {
      await page.locator('.fab-main').tap(); await page.waitForTimeout(450);
      if ((await page.locator('#fab').getAttribute('data-open')) !== 'true') throw new Error('the tools button did not open');
      const labels = await page.$$eval('.fab-item', bs => bs.map(b => b.getAttribute('data-fab')).join(' '));
      if (labels !== 'ask world save land') throw new Error(`the tools: ${labels}`);
      await page.screenshot({ path: `${shots}/${tag}-5-tools.png` });
      await page.locator('[data-fab="save"]').tap(); await page.waitForTimeout(350);
      const st = await page.evaluate(() => ({ saved: document.querySelector('.tool.save')?.getAttribute('aria-pressed'), fab: document.querySelector('#fab')?.getAttribute('data-open') }));
      if (st.saved !== 'true' || st.fab !== 'false') throw new Error(`save from the tools button: ${JSON.stringify(st)}`);
      await page.locator('.fab-main').tap(); await page.waitForTimeout(300); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      const after = await page.evaluate(() => ({ fab: document.querySelector('#fab')?.getAttribute('data-open'), focus: document.activeElement?.classList.contains('fab-main') }));
      if (after.fab !== 'false' || !after.focus) throw new Error(`closing: ${JSON.stringify(after)}`);
    });
    /* the occasional things live in a plain menu in the top bar */
    await step(`${tag}: the menu and the voice sheet`, async () => {
      await page.locator('#menuBtn').tap(); await page.waitForSelector('#menu.is-open [data-mn="voice"]');
      const items = await page.$$eval('#menu .mn-i', bs => bs.filter(b => getComputedStyle(b).display !== 'none').map(b => b.getAttribute('data-mn')).join(' '));
      if (items !== 'keys voice theme export new') throw new Error(`menu: ${items}`);
      const keys = await page.locator('[data-mn="keys"] em').textContent();
      if (keys !== `${PAGES - 1} free`) throw new Error(`the menu’s free pages: ${keys}`);
      await page.waitForTimeout(300); await page.screenshot({ path: `${shots}/${tag}-6-menu.png` });
      await page.locator('[data-mn="voice"]').tap(); await page.waitForSelector('#sheet[open] .voice-pop label');
      const v = await page.evaluate(() => { const l = document.querySelector('#sheet .voice-pop label'); const cs = getComputedStyle(l); return { grid: cs.display, font: getComputedStyle(l.closest('.voice-pop')).fontFamily, focus: document.activeElement?.id || document.activeElement?.className }; });
      if (v.grid !== 'grid' || !/Inter/.test(v.font) || v.focus !== 'sheetBody') throw new Error(`voice sheet: ${JSON.stringify(v)}`);
      /* a choice closes the sheet; the flow then goes back to the encyclopedic voice the same way */
      for (const lens of ['story', 'encyclopedic']) {
        if (lens !== 'story') {
          /* the choice's toast is still up, and the open tools sit above it */
          await page.locator('.fab-main').tap(); await page.waitForTimeout(450);
          const over = await page.evaluate(() => { const t = document.querySelector('.toast')?.getBoundingClientRect(); if (!t) return 'no toast'; for (const b of document.querySelectorAll('.fab-item')) { const r = b.getBoundingClientRect(); const x = (Math.max(r.left, t.left) + Math.min(r.right, t.right)) / 2, y = (Math.max(r.top, t.top) + Math.min(r.bottom, t.bottom)) / 2; if (x > r.left && x < r.right && x > t.left && x < t.right && y > r.top && y < r.bottom && y > t.top && y < t.bottom) { const ts = document.querySelector('.toasts'); ts.style.pointerEvents = 'auto'; const hit = document.elementFromPoint(x, y); ts.style.pointerEvents = ''; return hit?.closest('#fab') ? 'tools on top' : 'toast on top'; } } return 'no overlap'; });
          if (over === 'toast on top') throw new Error('a toast covers the open tools');
          await page.keyboard.press('Escape'); await page.waitForTimeout(300);
          await page.locator('#menuBtn').tap(); await page.waitForSelector('#menu.is-open [data-mn="voice"]'); await page.locator('[data-mn="voice"]').tap(); await page.waitForSelector('#sheet[open] .voice-pop label');
        }
        await page.locator(`#sheet .voice-pop input[value="${lens}"]`).check(); await page.waitForTimeout(400);
        if (await page.evaluate(() => document.querySelector('#sheet')?.hasAttribute('open'))) throw new Error(`the voice sheet stayed open after choosing ${lens}`);
      }
    });
    await step(`${tag}: the ¶ button waits for a tap on its paragraph`, async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      const shown = () => page.evaluate(() => getComputedStyle(document.querySelector('.pb .ptool')).opacity);
      if ((await shown()) !== '0') throw new Error(`¶ shows before any tap (opacity ${await shown()})`);
      const at = await page.evaluate(() => {
        const w = document.createTreeWalker(document.querySelector('.pb .pcol > p'), NodeFilter.SHOW_TEXT); let t;
        while ((t = w.nextNode())) if (!t.parentElement.closest('a') && t.data.trim().length > 3) { const r = document.createRange(); r.setStart(t, 1); r.setEnd(t, 2); const b = r.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }
        return null;
      });
      if (!at) throw new Error('no plain text to tap');
      await page.touchscreen.tap(at.x, at.y); await page.waitForTimeout(300);
      if ((await shown()) !== '1') throw new Error(`¶ still hidden after a tap (opacity ${await shown()})`);
      await page.locator('.pb.tapped .ptool').tap(); await page.waitForSelector('#pmenu:not([hidden])');
      await page.keyboard.press('Escape');
    });
  }
  /* a link's card: on a phone a sheet docked at the bottom, as wide as the column, that never covers its link, swaps to
     another link in place and opens on a second tap; on a desktop the card it always was, beside the link */
  await step(`${tag}: a link's card`, async () => {
    const holes = page.locator('.a-body a.hole');
    const bring = (/** @type {number} */ n, /** @type {number} */ y) => page.evaluate(([n, y]) => { const a = document.querySelectorAll('.a-body a.hole')[n]; window.scrollBy(0, a.getBoundingClientRect().top - y); }, [n, y]);
    const card = () => page.evaluate(() => {
      const h = /** @type {HTMLElement} */ (document.querySelector('#hcard')); const r = h.getBoundingClientRect(); const on = document.querySelector('a.hole.hc-on'); const lr = on ? [...on.getClientRects()].at(-1) : null;
      const col = /** @type {Element} */ (document.querySelector('.a-body')).getBoundingClientRect();
      return { shown: !h.hidden, docked: h.classList.contains('docked'), pos: getComputedStyle(h).position, left: r.left - col.left, right: col.right - r.right, edge: innerHeight - r.bottom, top: r.top, title: h.querySelector('.hc-title')?.textContent || '', on: on ? /** @type {HTMLElement} */ (on).dataset.t : '', linkBottom: lr ? lr.bottom : 0, fab: getComputedStyle(/** @type {Element} */ (document.querySelector('.fab'))).visibility };
    });
    if (!mobile) {
      await bring(1, 300); await holes.nth(1).hover(); await page.waitForSelector('#hcard:not([hidden])', { timeout: 3000 });
      const c = await card();
      if (c.docked || c.pos !== 'absolute' || c.on || (await page.evaluate(() => document.body.classList.contains('hc-docked')))) throw new Error(`the desktop card: ${JSON.stringify(c)}`);
      await page.mouse.move(4, 300); await page.waitForTimeout(700); return;
    }
    if ((await holes.count()) < 3) throw new Error('too few links to try the sheet on');
    /* a link on the bottom line: the sheet docks, and the page moves just enough to keep the link above it */
    const deep = Math.min(5, (await holes.count()) - 1); await bring(deep, 844 - 40); await page.waitForTimeout(200);
    const t2 = await holes.nth(deep).getAttribute('data-t'); await holes.nth(deep).tap(); await page.waitForTimeout(700);
    const a = await card();
    if (!a.shown || !a.docked || a.pos !== 'fixed' || a.title !== t2 || a.on !== t2) throw new Error(`the sheet: ${JSON.stringify(a)}`);
    if (Math.abs(a.left - a.right) > 1 || Math.abs(a.left) > 1 || a.edge < 8 || a.edge > 24) throw new Error(`the sheet's margins: ${JSON.stringify(a)}`);
    if (a.linkBottom > a.top || a.fab !== 'hidden') throw new Error(`the sheet covers its link, or the tools button stayed: ${JSON.stringify(a)}`);
    await page.screenshot({ path: `${shots}/${tag}-4c-link-sheet.png` });
    /* another link swaps what it says, in place */
    const t1 = await holes.nth(1).getAttribute('data-t'); await bring(1, 300); await page.waitForTimeout(200); await holes.nth(1).tap(); await page.waitForTimeout(300);
    const b = await card(); if (!b.shown || b.title !== t1 || b.on !== t1) throw new Error(`the swap: ${JSON.stringify(b)}`);
    /* a tap elsewhere puts it away, and the tools button comes back */
    await page.touchscreen.tap(8, 400); await page.waitForTimeout(400);
    const c = await card(); if (c.shown || c.on || c.fab !== 'visible') throw new Error(`a tap elsewhere: ${JSON.stringify(c)}`);
    /* a second tap on the same link opens its page: one already written, so it costs nothing, then back */
    const all = await holes.evaluateAll(as => as.map(x => x.getAttribute('data-t') || ''));
    const k = all.findIndex(t => t && !fresh(t)); if (k < 0) return;
    const was = await page.evaluate(() => location.pathname); await bring(k, 300); await page.waitForTimeout(200);
    await holes.nth(k).tap(); await page.waitForTimeout(300); await holes.nth(k).tap();
    await page.waitForFunction(t => document.querySelector('.a-title')?.textContent === t, all[k], { timeout: 20000 });
    await page.goBack(); await page.waitForFunction(u => location.pathname === u, was); await waitDone();
  });
  await step(`${tag}: a link opens the next page at its own address`, async () => {
    const targets = await page.$$eval('.a-body a.hole', as => as.map(a => a.getAttribute('data-t') || ''));
    const target = targets.find(fresh);
    if (!target) throw new Error('every link on the page is pre-written or already written');
    const link = page.locator(`.a-body a.hole[data-t="${target}"]`).first();
    if ((await link.getAttribute('href')) !== `/${slugOf(target)}`) throw new Error(`the link's address: ${await link.getAttribute('href')}`);
    if (mobile) { await link.tap(); await page.waitForTimeout(150); await link.tap(); } else await link.click();
    await page.waitForFunction(t => document.querySelector('.a-title')?.textContent === t, target, { timeout: 20000 });
    await waitDone();
    if ((await page.evaluate(() => location.pathname)) !== `/${slugOf(target)}`) throw new Error('the address did not follow');
    if ((await left()) !== String(PAGES - 2)) throw new Error(`free pages ${await left()}`);
  });
  if (mobile) {
    /* the desktop run wrote this page: opening it again is instant and free */
    await step(`${tag}: a page already written opens free`, async () => {
      const hit = page.waitForResponse(r => r.url().endsWith('/api/write') && r.request().postDataJSON()?.task === 'page');
      await page.locator('.ask input').last().fill('Water bears'); await page.locator('.ask input').last().press('Enter');
      const r = await hit; if (r.headers()['x-dh-cache'] !== 'hit') throw new Error(`not reused: ${r.headers()['x-dh-cache']}`);
      await page.waitForFunction(() => document.querySelector('.a-title')?.textContent === 'Water bears', null, { timeout: 20000 }); await waitDone();
      if ((await left()) !== String(PAGES - 2)) throw new Error(`a page already written spent a free page: ${await left()}`);
    });
  }
  if (!mobile) {
    await step(`${tag}: a key opens a card, and back returns to where you were`, async () => {
      await page.evaluate(() => window.scrollTo(0, 600)); await page.waitForTimeout(400);
      const was = await page.evaluate(() => ({ url: location.pathname, y: Math.round(scrollY) }));
      await page.keyboard.press('1');
      await page.waitForFunction(u => location.pathname !== u, was.url, { timeout: 20000 }); await waitDone();
      const next = await page.evaluate(() => ({ url: location.pathname, focused: document.activeElement === document.querySelector('.a-title') }));
      if (!next.focused) throw new Error('focus stayed behind');
      await page.goBack(); await page.waitForFunction(u => location.pathname === u, was.url);
      await page.waitForTimeout(400);
      const back = await page.evaluate(() => Math.round(scrollY));
      if (Math.abs(back - was.y) > 4) throw new Error(`back to ${back}, not ${was.y}`);
      await page.goForward(); await page.waitForFunction(u => location.pathname === u, next.url); await waitDone();
    });
    await step(`${tag}: expand a paragraph`, async () => {
      await page.locator('.pb').first().hover(); await page.locator('.ptool').first().click();
      await page.locator('[data-uf="simpler"]').click();
      await page.waitForFunction(() => /mock writer/.test(document.querySelector('.xp')?.textContent || ''), null, { timeout: 15000 });
    });
    await step(`${tag}: skeptic mode`, async () => { await page.keyboard.press('d'); await page.waitForSelector('.doubt .dq-r > div', { timeout: 15000 }); });
    await step(`${tag}: around this`, async () => { await page.keyboard.press('l'); await page.waitForSelector('.land-list li', { timeout: 15000 }); await page.keyboard.press('Escape'); });
    await step(`${tag}: your trail`, async () => {
      await page.keyboard.press('t'); await page.waitForSelector('.trail-list li', { timeout: 15000 });
      const n = await page.locator('.trail-list li').count(); if (n < 3) throw new Error(`${n} steps on the trail`);
      await page.screenshot({ path: `${shots}/${tag}-5-trail.png` }); await page.keyboard.press('Escape');
    });
    if (!mobile) {
      /* More is a disclosure: Escape closes it with focus back on its button, and a sheet opened from it gives focus back there too */
      const more = '.chamber .tools details.more > summary';
      const onMore = () => page.evaluate(s => document.activeElement === document.querySelector(s), more);
      await step(`${tag}: Escape closes More`, async () => {
        await page.locator(more).focus(); await page.keyboard.press('Enter'); await page.waitForSelector('.chamber details.more[open] .more-pop');
        await page.keyboard.press('Tab'); await page.keyboard.press('Escape');
        await page.waitForFunction(s => !document.querySelector(s).parentElement.hasAttribute('open'), more, { timeout: 5000 });
        if (!(await onMore())) throw new Error(`focus after Escape: ${await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80))}`);
      });
      await step(`${tag}: a sheet opened from More gives focus back to its button`, async () => {
        await page.locator(more).focus(); await page.keyboard.press('Enter'); await page.waitForSelector('.chamber details.more[open] .more-pop');
        await page.locator('.chamber .more-pop [data-act="trail"]').focus(); await page.keyboard.press('Enter');
        await page.waitForSelector('#sheet[open] .trail-list li', { timeout: 15000 }); await page.keyboard.press('Escape');
        await page.waitForFunction(() => !(/** @type {HTMLDialogElement} */ (document.querySelector('#sheet')).open), null, { timeout: 5000 });
        if (!(await onMore())) throw new Error(`focus after the sheet: ${await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80))}`);
      });
    }
    await step(`${tag}: quiz`, async () => { await page.keyboard.press('q'); await page.waitForSelector('.qz-o button', { timeout: 15000 }); await page.keyboard.press('Escape'); });
    await step(`${tag}: recap`, async () => { await page.keyboard.press('f'); await page.waitForSelector('#sheetBody h3', { timeout: 15000 }); await page.keyboard.press('Escape'); });
    await step(`${tag}: save`, async () => {
      await page.waitForTimeout(400); await page.keyboard.press('s');
      await page.waitForFunction(() => document.querySelector('.tool.save')?.getAttribute('aria-pressed') === 'true');
    });
    /* the sidebar: closed, it takes no room; its toggle in the top bar (or M) opens Your world beside the page, then the index and the trails */
    await step(`${tag}: the sidebar`, async () => {
      const shut = await page.evaluate(() => ({ w: document.querySelector('#side')?.getBoundingClientRect().width, exp: document.querySelector('#sideBtn')?.getAttribute('aria-expanded'), rail: !!document.querySelector('#railbar,.rail-n') }));
      if (shut.w !== 0 || shut.exp !== 'false' || shut.rail) throw new Error(`the closed sidebar: ${JSON.stringify(shut)}`);
      await page.locator('#sideBtn').click(); await page.waitForSelector('#miniStage canvas');
      if ((await page.locator('#sideBtn').getAttribute('aria-expanded')) !== 'true') throw new Error('the toggle did not say the sidebar is open');
      await page.waitForTimeout(900); await page.screenshot({ path: `${shots}/${tag}-6-sidebar.png` });
      await page.locator('[data-tab="index"]').click(); await page.waitForSelector('#ixList .ix');
      await page.locator('[data-tab="trails"]').click(); await page.waitForSelector('.trails li');
      await page.locator('[data-tab="world"]').click(); await page.keyboard.press('m');
      if (!(await page.evaluate(() => document.body.classList.contains('side-closed')))) throw new Error('the sidebar stayed open');
    });
    await step(`${tag}: Your world`, async () => {
      const saved = await page.evaluate(() => document.querySelector('.a-title')?.textContent || '');
      await page.keyboard.press('g'); await page.waitForSelector('#wpStage canvas');
      const w = await page.evaluate(() => ({ url: location.pathname, sum: document.querySelector('.wp-sum')?.textContent || '', saved: [...document.querySelectorAll('.wp-saved .wp-list b')].map(b => b.textContent), label: document.querySelector('#wpStage')?.getAttribute('aria-label') || '' }));
      if (w.url !== '/world' || !/topics read/.test(w.sum) || !w.saved.includes(saved) || !/topics you have read/.test(w.label)) throw new Error(`your world: ${JSON.stringify(w)}`);
      await page.waitForTimeout(1200); await page.screenshot({ path: `${shots}/${tag}-7-world.png` });
      /* finding a topic flies to it, and its card opens it */
      await page.fill('#wpFind', saved.slice(0, 5)); await page.press('#wpFind', 'Enter');
      await page.waitForSelector('.gv-tip.act [data-gv="open"]', { timeout: 5000 });
      await page.locator('.gv-tip.act [data-gv="open"]').click();
      await page.waitForFunction(t => document.querySelector('.a-title')?.textContent === t, saved, { timeout: 10000 });
    });
    /* when Your world was last looked at outlives a reload, so what grew since then springs in next time */
    await step(`${tag}: Your world remembers when you last looked`, async () => {
      const seen = () => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('dorkhub:world:v1') || '{}').settings?.worldSeen || 0; } catch (e) { return 0; } });
      await page.waitForFunction(() => { try { return !!JSON.parse(localStorage.getItem('dorkhub:world:v1') || '{}').settings?.worldSeen; } catch (e) { return false; } }, null, { timeout: 3000 }).catch(() => {});
      const was = await seen(); if (!was) throw new Error('Your world did not note the visit');
      await page.reload(); await waitDone();
      /* anything that saves after the reload writes the store back as the loader read it */
      await page.keyboard.press('s'); await page.keyboard.press('s'); await page.waitForTimeout(800);
      const now = await seen(); if (now !== was) throw new Error(`worldSeen was ${was}, ${now} after a reload`);
    });
    /* Your world by keyboard: the map is one tab stop; an arrow selects a topic, shows its card and says it; Enter
       opens it; Escape lets the selection go, a second leaves the map, and Tab moves on */
    await step(`${tag}: Your world by keyboard`, async () => {
      const onMap = () => page.evaluate(() => !!document.activeElement?.classList.contains('gv-canvas'));
      const said = () => page.evaluate(() => document.querySelector('#srLive')?.textContent || '');
      await page.goto(`${base}/world`); await page.waitForSelector('#wpStage canvas'); await page.waitForTimeout(600);
      await page.focus('#wpFind'); for (let i = 0; i < 24 && !(await onMap()); i++) await page.keyboard.press('Tab');
      const map = await page.evaluate(() => ({ role: document.activeElement?.getAttribute('role'), label: document.activeElement?.getAttribute('aria-label') || '' }));
      if (!(await onMap()) || map.role !== 'application' || !/topics? read/.test(map.label)) throw new Error(`the map takes focus: ${JSON.stringify(map)}`);
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => /^.+, .+, (read|not read yet), \d+ links?$/.test(document.querySelector('#srLive')?.textContent || ''), null, { timeout: 3000 });
      if (await page.locator('#wpStage .gv-tip').isHidden()) throw new Error('an arrow showed no card');
      /* walk to a topic already read, so opening it spends nothing */
      for (const k of ['Home', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) { if (/, read, /.test(await said())) break; await page.keyboard.press(k); await page.waitForTimeout(150); }
      const heard = await said(); if (!/, read, /.test(heard)) throw new Error(`no read topic by keyboard: ${heard}`);
      const title = heard.split(', ')[0];
      await page.keyboard.press('Enter');
      await page.waitForFunction(t => document.querySelector('.a-title')?.textContent === t, title, { timeout: 10000 });
      await page.goBack(); await page.waitForSelector('#wpStage canvas'); await page.waitForTimeout(400);
      await page.focus('#wpStage canvas'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150);
      await page.keyboard.press('Escape');
      /* the card leaves the way it came, so it is gone a moment after the key, not at it */
      const gone = await page.locator('#wpStage .gv-tip').waitFor({ state: 'hidden', timeout: 3000 }).then(() => true, () => false);
      if (!gone || !(await onMap())) throw new Error('the first Escape lets the selection go and keeps the map');
      await page.keyboard.press('Escape'); await page.keyboard.press('Tab');
      if (await onMap()) throw new Error('Escape then Tab did not leave the map');
    });
    /* back on the front page, a reader's own world takes the last card's place */
    await step(`${tag}: the front page shows your world`, async () => {
      await page.goto(base); await page.waitForSelector('.wc-world #worldStage canvas');
      const w = await page.evaluate(() => ({ stats: document.querySelector('.wc-world .ww-stats')?.textContent || '', cards: document.querySelectorAll('#ways .wc').length, last: document.querySelector('#bentoB .wc:last-child')?.classList.contains('wc-world') }));
      if (!/topics? read/.test(w.stats) || w.cards !== 13 || !w.last) throw new Error(`the front page's world: ${JSON.stringify(w)}`);
      await page.locator('.wc-world').scrollIntoViewIfNeeded(); await page.waitForTimeout(1500);
      /* its map draws its topics on its own (in their kind colours), with nothing pointed at */
      const lit = await page.evaluate(() => { const c = /** @type {HTMLCanvasElement} */ (document.querySelector('#worldStage canvas')); const d = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d')).getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 100 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 60) n++; return n; });
      if (lit < 40) throw new Error(`the front page's world map is empty (${lit} coloured pixels)`);
      await page.screenshot({ path: `${shots}/${tag}-7b-front-world.png` });
    });
  }
  /* a link from outside: free if it is already written, otherwise written only when asked */
  await step(`${tag}: a link from outside waits to be asked`, async () => {
    const before = await left(); const topic = `Guarded ${tag} topic`;
    await page.goto(`${base}/${slugOf(topic)}`); await page.waitForSelector('.guard [data-act="write-page"]', { timeout: 10000 });
    if ((await left()) !== before) throw new Error('the guard spent a free page');
    await page.screenshot({ path: `${shots}/${tag}-8-guard.png` });
    await page.locator('[data-act="write-page"]').click(); await waitDone();
    if ((await left()) !== String(+before - 1)) throw new Error(`after writing: ${await left()}`);
    if (mobile) {
      /* the desktop run wrote Water bears: from outside, it opens at once */
      await page.goto(`${base}/water-bears`); await waitDone();
      if (await page.locator('.guard').count()) throw new Error('a written page waited to be asked');
    }
  });
  await step(`${tag}: the trial runs out`, async () => {
    for (let i = 1; i <= PAGES && !(await page.locator('.state[data-state="trial_over"]').count()); i++) {
      const title = `Mock ${tag} topic ${i}`;
      await page.locator('.ask input').last().fill(title); await page.locator('.ask input').last().press('Enter');
      await page.waitForFunction(t => document.querySelector('.state[data-state="trial_over"]') || (document.querySelector('.a-title')?.textContent === t && document.querySelector('.a-end .card') && document.querySelector('.article')?.getAttribute('aria-busy') === 'false'), title, { timeout: 20000 });
    }
    await page.waitForSelector('.state[data-state="trial_over"]', { timeout: 20000 });
    if ((await left()) !== '0') throw new Error(`free pages ${await left()}`);
    if ((await page.locator('.state[data-state="trial_over"] .way').count()) !== 3) throw new Error('the paywall offers no free pages');
    await page.locator('.state[data-state="trial_over"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/${tag}-9-paywall.png` });
  });
  await step(`${tag}: a bad key is turned down`, async () => {
    await page.locator('.state[data-state="trial_over"] [data-act="keys"]').click();
    await page.waitForSelector('#keyForm'); await page.waitForTimeout(450);
    await page.fill('#keyIn', 'sk-ant-bad-0000000000'); await page.locator('[data-act="key-save"]').click();
    await page.waitForFunction(() => /turned that key down/.test(document.querySelector('#keyMsg')?.textContent || ''), null, { timeout: 15000 });
  });
  await step(`${tag}: a good key unlocks the page`, async () => {
    await page.locator('.ks-m', { hasText: 'Sonnet' }).click();
    await page.fill('#keyIn', 'sk-ant-test-0000000000'); await page.locator('[data-act="key-save"]').click();
    await page.waitForSelector('#sheet:not([open])', { state: 'attached', timeout: 15000 });
    await waitDone();
    if (!mobile && (await page.locator('#keyBtn').getAttribute('data-state')) !== 'key') throw new Error('key state');
  });
}

/* A browser that read Dorkhub before: its rabbit holes move into Your world, and an old address finds its page. */
async function movingIn() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  const text = (/** @type {string} */ t, /** @type {string} */ k) => `# ${t} :: ${k}\n> A deck about ${t}.\n+++\n[[Ice friction]] :: mystery\n---\nA paragraph about ${t} that links [[Ice friction]].\n\nA second paragraph.\n\nA third.\n===\n- [[Ice friction]] :: why ice is slippery :: mystery\n???\nWhat is ${t}?\n&&&\n[[Ice friction]] :: why ice is slippery\n`;
  const old = { settings: { lens: 'encyclopedic' }, warrens: [{ id: 'wold', created: Date.now() - 864e5, updated: Date.now() - 864e5, root: 'n1', current: 'n2', order: ['n1', 'n2'], nodes: {
    n1: { id: 'n1', title: 'Old topic one', depth: 0, parent: null, from: null, status: 'done', text: text('Old topic one', 'creature'), created: Date.now() - 864e5 },
    n2: { id: 'n2', title: 'Old topic two', depth: 1, parent: 'n1', from: { text: 'x' }, status: 'done', text: text('Old topic two', 'place'), created: Date.now() - 864e5 + 1000, reaction: 'wow' },
  } }] };
  await ctx.addInitScript(o => { if (!localStorage.getItem('dorkhub:holes:v1')) localStorage.setItem('dorkhub:holes:v1', o); }, JSON.stringify(old));
  let writes = 0; page.on('request', r => { if (r.url().endsWith('/api/write') && !r.postDataJSON()?.cachedOnly) writes++; });
  await step('moving in: rabbit holes become Your world', async () => {
    await page.goto(base); await page.waitForSelector('.door-cont');
    const cont = await page.locator('.door-cont').textContent(); if (cont?.trim() !== 'Continue Old topic two') throw new Error(`continue: ${cont}`);
    await page.goto(`${base}/#/w/wold/n1`); await page.waitForFunction(() => location.pathname === '/old-topic-one');
    await page.waitForSelector('.a-end .card');
    if (writes) throw new Error('a page you had read was written again');
    await page.goto(`${base}/world`); await page.waitForSelector('#wpStage canvas');
    const w = await page.evaluate(() => ({ sum: document.querySelector('.wp-sum')?.textContent || '', saved: [...document.querySelectorAll('.wp-saved .wp-list b')].map(b => b.textContent) }));
    if (!/2 topics read/.test(w.sum) || !w.saved.includes('Old topic two')) throw new Error(`moved in: ${JSON.stringify(w)}`);
  });
  await ctx.close();
}

/* The outliers (tests/outliers.js): a page with everything a writer can send that a prompt asks it not to, a 149-character
   question for a title, names of 58 and 63 letters in one word, a heading of 150 characters, wide panel cells and long
   hooks. Whatever it holds, nothing runs past its box, the page never scrolls sideways, and every name stays whole
   where it leads somewhere (Will, 2026-10-19: design for what the writer sends). In a browser of its own, so its pages
   don't join the walk's world. */
async function outliers(mobile) {
  const tag = `outliers ${mobile ? 'mobile' : 'desktop'}`;
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: 'dark' } : { viewport: { width: 1360, height: 900 } });
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  const titles = new Set([QUESTION, VILLAGE, RULES, LAW, DISEASE]);
  await page.route('**/api/write', async r => {
    const b = r.request().postDataJSON() || {};
    if (b.task === 'page' && b.cachedOnly) return r.fulfill({ status: 204 });
    if (b.task === 'page' && titles.has(b.input?.title)) return r.fulfill({ status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' }, body: outlierPage(b.input.title) });
    if (b.task === 'around') return r.fulfill({ status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' }, body: OUTLIER_AROUND });
    return r.continue();
  });
  /* what runs past its box: the page scrolling sideways, a piece of text wider than the box it is set in, or anything
     past the right edge of the screen */
  const spills = (/** @type {string} */ root) => page.evaluate(root => {
    const vw = document.documentElement.clientWidth; const out = [];
    if (document.documentElement.scrollWidth > vw + 1) out.push(`the page scrolls sideways by ${document.documentElement.scrollWidth - vw} px`);
    for (const el of document.querySelectorAll(`${root} *`)) {
      if (el.children.length || !el.getClientRects().length || el.closest('svg')) continue;
      const r = el.getBoundingClientRect(); const txt = (el.textContent || '').trim().slice(0, 30);
      if (getComputedStyle(el).overflowX === 'visible' && el.scrollWidth > el.clientWidth + 2 && el.clientWidth) out.push(`"${txt}" is wider than its box by ${el.scrollWidth - el.clientWidth} px`);
      if (r.right > vw + 1) out.push(`"${txt}" runs ${Math.round(r.right - vw)} px past the screen`);
    }
    return out.slice(0, 5);
  }, root);
  await step(`${tag}: a page of extremes keeps its shape`, async () => {
    await page.goto(base); await page.waitForSelector('#seedIn');
    await page.fill('#seedIn', QUESTION); await page.press('#seedIn', 'Enter');
    await page.waitForFunction(() => { const a = document.querySelector('.chamber .article'); return a && a.getAttribute('aria-busy') === 'false' && a.querySelector('.a-end .card'); }, null, { timeout: 20000 });
    await page.waitForTimeout(400);
    const head = await page.evaluate(() => ({ title: document.querySelector('.a-title')?.className || '', fit: /** @type {HTMLElement | null} */ (document.querySelector('.keyfacts'))?.dataset.fit || '' }));
    if (!/\bt-xl\b/.test(head.title) || head.fit !== 'down') throw new Error(`the head: ${JSON.stringify(head)}`);
    const out = await spills('.article'); if (out.length) throw new Error(out.join('; '));
    await page.screenshot({ path: `${shots}/${mobile ? 'mobile' : 'desktop'}-10-outliers.png` });
    await page.locator('.a-end').scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
    await page.screenshot({ path: `${shots}/${mobile ? 'mobile' : 'desktop'}-10b-outliers-end.png` });
  });
  if (!mobile) await step(`${tag}: a link card holds a 58-letter name`, async () => {
    const hole = page.locator(`.a-body a.hole[data-t="${VILLAGE}"]`).first(); await hole.scrollIntoViewIfNeeded(); await hole.hover();
    await page.waitForSelector('#hcard:not([hidden])', { timeout: 3000 });
    const out = await spills('#hcard'); if (out.length) throw new Error(out.join('; '));
    await page.mouse.move(4, 300); await page.waitForTimeout(500);
  });
  await step(`${tag}: around this keeps every name whole, and its labels apart`, async () => {
    await page.evaluate(() => window.scrollTo(0, 0)); await page.keyboard.press('l'); await page.waitForSelector('.land-list li', { timeout: 15000 });
    const land = await page.evaluate(() => {
      const names = [...document.querySelectorAll('.land-list b')].map(b => b.textContent || '');
      const svg = document.querySelector('.land svg'); const vb = svg && /** @type {SVGSVGElement} */ (svg).viewBox.baseVal;
      const boxes = [...document.querySelectorAll('.land a text')].map(t => /** @type {SVGTextElement} */ (t).getBBox());
      const outside = vb ? boxes.filter(b => b.x < vb.x || b.x + b.width > vb.x + vb.width).length : 0;
      let overlaps = 0; boxes.forEach((a, i) => boxes.slice(i + 1).forEach(b => { if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) overlaps++; }));
      return { names, labels: boxes.length, outside, overlaps };
    });
    if (land.names[0] !== VILLAGE || !land.names.includes(RULES)) throw new Error(`a name was cut: ${JSON.stringify(land.names.slice(0, 3))}`);
    if (!mobile && (!land.labels || land.outside || land.overlaps)) throw new Error(`the map's labels: ${JSON.stringify(land)}`);
    const out = await spills('#sheet'); if (out.length) throw new Error(out.join('; '));
    await page.keyboard.press('Escape');
  });
  await step(`${tag}: Your world holds the long names`, async () => {
    await page.goto(`${base}/world`); await page.waitForSelector('.wp-facts', { timeout: 10000 });
    const out = await spills('.wpage'); if (out.length) throw new Error(out.join('; '));
  });
  await ctx.close();
}

/* A photo that fails never prints its alt text over the page (Will, 2026-10-19): the Northern lights card steps back
   to the aurora drawn under its photo, with no credit for a photo it doesn't show, and a page's lead picture that fails
   on a later visit is dropped, as one that failed the first time is. */
async function failedPhotos() {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  let pictures = true;
  await page.route('**/api/picture?t=*', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ src: '/api/picture?f=a%2Fab%2FTest.jpg&w=500', w: 500, h: 300, alt: 'A test picture', desc: '', credit: 'E2E', license: 'CC0', file: 'https://commons.wikimedia.org/wiki/File:Test.jpg' }) }));
  await page.route('**/api/picture?f=*', r => (pictures && !/Aurora/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300"><rect width="500" height="300" fill="#4a7"/></svg>' }) : r.fulfill({ status: 404, body: '' })));
  await step('a failed photo: the card shows its aurora, never the alt text', async () => {
    await page.goto(base); await page.waitForSelector('#seedIn');
    await page.locator('.wc[data-card="northern-lights"]').scrollIntoViewIfNeeded();
    await page.waitForSelector('.nl-img.gone', { state: 'attached', timeout: 8000 });
    const c = await page.evaluate(() => { const card = document.querySelector('.wc[data-card="northern-lights"]'); const img = card.querySelector('.nl-img'); return { img: getComputedStyle(img).visibility, alt: getComputedStyle(img).color, credit: getComputedStyle(card.querySelector('.wc-cr')).visibility, art: getComputedStyle(card.querySelector('.wc-art')).backgroundImage, title: card.querySelector('.wc-t')?.textContent || '' }; });
    if (c.img !== 'hidden' || c.alt !== 'rgba(0, 0, 0, 0)' || c.credit !== 'hidden' || !/radial-gradient/.test(c.art) || c.title !== 'Northern lights') throw new Error(`the card: ${JSON.stringify(c)}`);
    await page.locator('.wc[data-card="northern-lights"]').screenshot({ path: `${shots}/desktop-11-photo-failed.png` });
  });
  await step('a lead picture that fails on a later visit is dropped', async () => {
    const done = () => page.waitForFunction(() => { const a = document.querySelector('.chamber .article'); return a && a.getAttribute('aria-busy') === 'false' && a.querySelector('.a-end .card'); }, null, { timeout: 20000 });
    await page.fill('#seedIn', 'Moss on lunar soil'); await page.press('#seedIn', 'Enter'); await done();
    await page.waitForSelector('.pic-box.shown', { timeout: 10000 });
    pictures = false; await page.reload(); await done();
    await page.waitForFunction(() => !document.querySelector('figure.pic'), null, { timeout: 8000 });
  });
  await ctx.close();
}

/* Pages people can share: a link unfurls as its page (a page written ahead of time, and by its address a
   topic typed by a reader, which only a link preview is told); the share action hands on the clean address and reports
   nothing; and a trail travels as a link, drawn as threads, each of its pages free if written and otherwise asked for. */
async function sharing() {
  const UA = { bot: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)', reader: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15' };
  const head = async (/** @type {string} */ path, /** @type {string} */ ua) => { const html = await (await fetch(base + path, { headers: { 'user-agent': ua } })).text(); return Object.fromEntries([...html.matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)">/g)].map(m => [m[1], m[2]])); };
  const size = (/** @type {Buffer} */ b) => { if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)]; for (let i = 2; i < b.length;) { const m = b[i + 1]; if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + b.readUInt16BE(i + 2); } return [0, 0]; };
  await step('sharing: a link to a page written ahead of time, or by its address to a typed topic, previews as itself', async () => {
    for (const [path, title, line] of [['/whale-falls', 'Whale falls', /^A whale that sinks after death/], ['/black-holes', 'Black holes', /^A region where gravity wins/]]) {
      for (const ua of [UA.bot, UA.reader]) {
        const t = await head(path, ua);
        if (t['og:title'] !== title || !line.test(t['og:description'] || '') || t['og:url'] !== base + path || t['twitter:card'] !== 'summary_large_image' || t.robots !== 'noindex') throw new Error(`${path}: ${JSON.stringify(t)}`);
        const img = await fetch(t['og:image']); const buf = Buffer.from(await img.arrayBuffer());
        if (!img.ok || !/^image\/(jpeg|png)$/.test(img.headers.get('content-type') || '') || size(buf).join() !== '1200,630' || t['og:image'] === `${base}/share/dorkhub.jpg`) throw new Error(`${path}'s picture: ${t['og:image']} ${img.status} ${size(buf)}`);
      }
    }
    /* a topic nobody wrote ahead of time: a link preview reads its title from the address; a reader gets the page */
    const bot = await head('/octopus-camouflage', UA.bot), reader = await head('/octopus-camouflage', UA.reader);
    if (bot['og:title'] !== 'Octopus camouflage' || bot['og:url'] !== `${base}/octopus-camouflage` || bot['og:image'] !== `${base}/share/dorkhub.jpg` || bot.robots !== 'noindex') throw new Error(`a typed topic, to a preview: ${JSON.stringify(bot)}`);
    if (reader['og:title'] !== 'dorkhub: learn about anything') throw new Error(`a typed topic, to a reader: ${JSON.stringify(reader)}`);
    const trail = await head('/trail/black-holes/supernovas', UA.bot);
    if (trail['og:title'] !== 'A trail from Black holes to Supernovas' || !trail['og:image'].endsWith('/share/black-holes.jpg')) throw new Error(`a trail, to a preview: ${JSON.stringify(trail)}`);
  });
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  /** @type {string[]} */ const sent = []; let writes = 0;
  page.on('request', r => { sent.push(r.url()); if (r.url().endsWith('/api/write') && !r.postDataJSON()?.cachedOnly) writes++; });
  await step('sharing: the share action copies the page’s clean address, and reports nothing', async () => {
    await page.goto(`${base}/whale-falls`); await page.waitForFunction(() => document.querySelector('.article')?.getAttribute('aria-busy') === 'false' && document.querySelector('.a-end .card'), null, { timeout: 20000 });
    const btn = page.locator('.tools [data-act="share"]');
    if ((await btn.getAttribute('data-tip')) !== 'Share this page' || (await btn.textContent())?.trim()) throw new Error('the share action is an icon with its label in a tooltip');
    const before = sent.length; await btn.click(); await page.waitForSelector('.toast');
    const copied = await page.evaluate(() => navigator.clipboard.readText()); const toast = await page.locator('.toast').last().textContent();
    if (copied !== `${base}/whale-falls` || toast !== 'Link copied.') throw new Error(`share: ${copied} / ${toast}`);
    if (sent.length !== before) throw new Error(`sharing sent ${sent.slice(before).join(', ')}`);
    await page.locator('.a-head').screenshot({ path: `${shots}/share-tools.png` });
  });
  await step('sharing: a trail link opens its trail, drawn as threads, and lets you walk it', async () => {
    const w0 = writes;
    await page.goto(`${base}/trail/black-holes/supernovas/whale-falls/octopus-camouflage`); await page.waitForSelector('.fan.tr .fan-door'); await page.waitForTimeout(400);
    const v = await page.evaluate(() => ({ h1: document.querySelector('h1')?.textContent, doors: [...document.querySelectorAll('.fan.tr .fan-door .cd-t')].map(d => d.textContent), threads: document.querySelectorAll('.fan.tr .fan-svg path').length, read: [...document.querySelectorAll('.fan.tr .fan-door')].map(d => d.classList.contains('is-read')), title: document.title }));
    if (v.h1 !== 'From Black holes to Octopus camouflage' || v.doors.join() !== 'Black holes,Supernovas,Whale falls,Octopus camouflage' || v.threads !== 3 || v.read.join() !== 'false,false,true,false' || !/: dorkhub$/.test(v.title)) throw new Error(`the trail: ${JSON.stringify(v)}`);
    await page.screenshot({ path: `${shots}/share-trail.png` });
    /* a page written ahead of time opens free and joins your trail from the step before it */
    await page.locator('.fan-door[data-walk="1"]').click(); await page.waitForURL(`${base}/supernovas`);
    await page.waitForFunction(() => document.querySelector('.article')?.getAttribute('aria-busy') === 'false' && document.querySelector('.a-end .card'), null, { timeout: 20000 });
    const step1 = await page.evaluate(() => { const t = JSON.parse(localStorage.getItem('dorkhub:world:v1') || '{}').trails[0]; return t.steps[t.steps.length - 1]; });
    if (step1[0] !== 't|encyclopedic|supernovas|' || step1[3] !== 'trail') throw new Error(`the walk: ${JSON.stringify(step1)}`);
    await page.goBack(); await page.waitForSelector('.fan.tr .fan-door.is-read >> text=Supernovas');
    /* any other page waits to be asked, as a link from outside does */
    await page.locator('.fan-door[data-walk="3"]').click(); await page.waitForURL(`${base}/octopus-camouflage`);
    await page.waitForSelector('.guard [data-act="write-page"]');
    if (writes !== w0) throw new Error(`walking the trail wrote ${writes - w0} pages`);
  });
  await ctx.close();
  /* a reader's own trail, from a placeholder to the next by a card (both free) */
  const own = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  await own.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const op = await own.newPage(); op.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  await step('sharing: how you got here travels as a trail link', async () => {
    await op.goto(`${base}/black-holes`); await op.waitForSelector('.a-end .card');
    await op.locator('.a-end .card').first().click(); await op.waitForFunction(() => location.pathname !== '/black-holes');
    await op.waitForSelector('.a-end .card'); const here = await op.evaluate(() => location.pathname);
    await op.keyboard.press('t'); await op.locator('[data-act="share-trail"]').click(); await op.waitForTimeout(300);
    const copied = await op.evaluate(() => navigator.clipboard.readText());
    if (copied !== `${base}/trail/black-holes${here}`) throw new Error(`the trail's link: ${copied} (here ${here})`);
    await op.goto(copied); await op.waitForSelector('.fan.tr .fan-door');
    if ((await op.locator('.fan.tr .fan-door.is-read').count()) !== 2) throw new Error('your own trail shows both pages read');
  });
  await own.close();
  /* on a phone, the share sheet */
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: 'dark' });
  await phone.addInitScript(() => { Object.defineProperty(navigator, 'share', { value: async (/** @type {any} */ d) => { /** @type {any} */ (window).shared = d; }, configurable: true }); });
  const mp = await phone.newPage(); mp.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  await step('sharing: on a phone, the share sheet', async () => {
    await mp.goto(`${base}/whale-falls`); await mp.waitForSelector('.a-end .card');
    await mp.locator('.tools [data-act="share"]').click(); await mp.waitForTimeout(200);
    const d = await mp.evaluate(() => /** @type {any} */ (window).shared);
    if (!d || d.url !== `${base}/whale-falls` || d.title !== 'Whale falls') throw new Error(`share sheet: ${JSON.stringify(d)}`);
    await mp.goto(`${base}/trail/black-holes/supernovas/whale-falls`); await mp.waitForSelector('.fan.tr .fan-door'); await mp.waitForTimeout(300);
    const scroll = await mp.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (scroll > 0) throw new Error(`the trail scrolls sideways by ${scroll} px`);
    await mp.screenshot({ path: `${shots}/share-trail-mobile.png` });
  });
  await phone.close();
}

try {
  await step('reduced motion: the beam holds still and stays lit', async () => {
    const still = await browser.newPage({ viewport: { width: 1360, height: 900 }, reducedMotion: 'reduce' });
    await still.goto(base); await still.waitForSelector('#seedBox');
    const b = await still.evaluate(() => { const cs = getComputedStyle(/** @type {Element} */ (document.querySelector('#seedBox'))); return { anim: cs.animationName, on: cs.getPropertyValue('--beam-on').trim() }; });
    await still.close();
    if (b.anim !== 'none' || b.on !== '1') throw new Error(`reduced-motion beam: ${JSON.stringify(b)}`);
  });
  const desk = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  await run(desk);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: 'dark' });
  await run(await ctx.newPage(), { mobile: true });
  await movingIn();
  await outliers(false); await outliers(true);
  await failedPhotos();
  await sharing();
} catch (e) { const pages = browser.contexts().flatMap(c => c.pages()); await pages.at(-1)?.screenshot({ path: `${shots}/failure.png` }).catch(() => {}); }
await browser.close();
server.kill();
console.log(results.join('\n'));
if (errors.length) console.log(`\nbrowser errors:\n${[...new Set(errors)].join('\n')}`);
process.exit(results.some(r => r.startsWith('FAIL')) || errors.length ? 1 : 0);

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
    await page.locator('[data-act="shuffle"]').click(); await page.waitForTimeout(800);
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
      const seenBefore = await page.$$eval('#ways .seen', cs => cs.map(c => c.id || /** @type {HTMLElement} */ (c).dataset.card));
      for (let i = 0; i < 14; i++) { await page.mouse.wheel(0, 150); await page.waitForTimeout(12); }
      let most = 0, played = 0; const t0 = Date.now();
      while (Date.now() - t0 < 5000) { const n = await page.evaluate(() => [document.querySelectorAll('#ways .playing').length, document.querySelectorAll('#ways .seen').length]); most = Math.max(most, n[0]); played = n[1]; await page.waitForTimeout(70); }
      const passed = await page.$$eval('#ways .seen', cs => cs.filter(c => { const r = c.getBoundingClientRect(); return r.bottom <= 0 || r.top >= innerHeight; }).map(c => c.id || /** @type {HTMLElement} */ (c).dataset.card));
      if (most > 1 || !played || passed.some(k => !seenBefore.includes(k))) throw new Error(`the stage played ${most} at once (${played} seen; played though only flung past: ${passed})`);
    }
    /* every card tells its story on its turn, and ends finished: bring each to the middle of the screen and wait for it */
    for (const c of await page.locator('#ways .wc').all()) { await c.evaluate(el => el.scrollIntoView({ block: 'center' })); await page.waitForFunction(el => el.classList.contains('seen') && !el.classList.contains('playing'), await c.elementHandle(), { timeout: 8000 }); }
    await page.waitForTimeout(2200);
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
  await step(`${tag}: a page written ahead of time opens at its own address, free`, async () => {
    await page.fill('#seedIn', 'Tardigrades'); await page.press('#seedIn', 'Enter'); await waitDone();
    const p = await page.evaluate(() => ({ url: location.pathname, title: document.querySelector('.a-title')?.textContent, fine: document.querySelector('.fineprint')?.textContent || '', paras: document.querySelectorAll('.a-body .pb').length, bridge: !!document.querySelector('.bridge') }));
    if (p.url !== '/tardigrades' || p.title !== 'Tardigrades' || p.paras < 3 || !/written ahead of time/i.test(p.fine) || p.bridge) throw new Error(`pre-written page: ${JSON.stringify(p)}`);
    if ((await left()) !== String(PAGES)) throw new Error(`a pre-written page spent a free page: ${await left()}`);
    await page.goto(base); await page.waitForSelector('#seedIn');
  });
  /* a card leads into one of the front page's topics: until its page is written it opens a placeholder, free
     and instant, shaped like a page, and every page it leads to opens free too */
  await step(`${tag}: a card opens its topic free, a placeholder until it is written`, async () => {
    const card = page.locator('.wc[data-card="black-holes"] .wc-t a'); await card.scrollIntoViewIfNeeded(); await card.click(); await waitDone();
    const p = await page.evaluate(() => ({ url: location.pathname, title: document.querySelector('.a-title')?.textContent, kind: document.querySelector('.where .kind')?.textContent || '', fine: document.querySelector('.fineprint')?.textContent || '', paras: document.querySelectorAll('.a-body .pb').length, cards: [.../** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.a-end .card'))].map(c => c.dataset.t || ''), qs: document.querySelectorAll('.a-end [data-q]').length }));
    if (p.url !== '/black-holes' || p.title !== 'Black holes' || p.kind !== 'Phenomenon' || !/placeholder/i.test(p.fine) || p.paras < 3 || p.cards.length !== 6 || p.qs !== 3) throw new Error(`placeholder: ${JSON.stringify(p)}`);
    /* the card's drawing came with it, as the page's plate above its title, and the page lists the sources its claims were checked against */
    const plate = await page.evaluate(() => { const pl = document.querySelector('.a-head > .a-plate'); const t = document.querySelector('.a-title'); return { card: pl?.querySelector('.wc[data-card="black-holes"] svg.vz.bh') ? 'drawn' : pl ? 'empty' : 'none', above: !!pl && !!t && pl.getBoundingClientRect().bottom <= t.getBoundingClientRect().top, sources: document.querySelectorAll('.fineprint details.pv .pv-list a[href^="https://"]').length }; });
    if (plate.card !== 'drawn' || !plate.above || plate.sources < 2) throw new Error(`the card's plate and the sources: ${JSON.stringify(plate)}`);
    if ((await left()) !== String(PAGES)) throw new Error(`a placeholder spent a free page: ${await left()}`);
    await page.screenshot({ path: `${shots}/${tag}-1e-placeholder.png` });
    await page.locator('.a-end .card').first().click();
    await page.waitForFunction(t => document.querySelector('.a-title')?.textContent === t, p.cards[0], { timeout: 20000 }); await waitDone();
    const next = await page.evaluate(() => document.querySelector('.fineprint')?.textContent || '');
    if (!/placeholder/i.test(next) || (await left()) !== String(PAGES)) throw new Error(`the next page: ${next}, ${await left()} free pages`);
    /* once its page is written, the placeholder kept in this browser gives way to it */
    const written = '# Black holes :: phenomenon\n> Written at last.\n---\nThe written page, with a link to [[Supernovas]].\n===\n- [[Supernovas]] :: A star that blew up. :: phenomenon\n???\nWhat is left after a supernova?\n';
    await page.route('**/api/write', async r => { const b = r.request().postDataJSON(); if (b && b.cachedOnly && b.input && b.input.title === 'Black holes') await r.fulfill({ status: 200, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-dh-cache': 'seed' }, body: written }); else await r.continue(); });
    await page.goto(`${base}/black-holes`); await page.waitForFunction(() => /The written page/.test(document.querySelector('.a-body')?.textContent || ''), null, { timeout: 20000 }); await waitDone();
    const after = await page.evaluate(() => document.querySelector('.fineprint')?.textContent || '');
    if (!/written ahead of time/i.test(after)) throw new Error(`the written page: ${after}`);
    await page.unroute('**/api/write');
    await page.goto(base); await page.waitForSelector('#seedIn');
  });
  /* the dice only ever opens a page written ahead of time, and never one already on screen */
  await step(`${tag}: the dice opens a pre-written topic that isn't on screen`, async () => {
    const shown = await page.$$eval('.door[data-seed]', bs => bs.map(b => /** @type {HTMLElement} */ (b).dataset.seed));
    await page.locator('[data-act="surprise"]').click(); await waitDone();
    const p = await page.evaluate(() => ({ title: document.querySelector('.a-title')?.textContent || '', fine: document.querySelector('.fineprint')?.textContent || '' }));
    if (shown.includes(p.title) || !/written ahead of time|placeholder/.test(p.fine)) throw new Error(`dice: ${JSON.stringify({ shown, ...p })}`);
    if ((await left()) !== String(PAGES)) throw new Error(`the dice spent a free page: ${await left()}`);
    await page.goto(base); await page.waitForSelector('#seedIn');
  });
  /* paused (no credits for free pages): nothing is spent, the page says so first and asks nothing,
     and the pages written ahead of time it offers still open */
  await step(`${tag}: a paused page offers pages written ahead of time`, async () => {
    await page.route('**/api/write', async r => { const b = r.request().postDataJSON(); if (b && b.task === 'page' && /moths/.test(JSON.stringify(b.input))) await r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'trial_paused' }) }); else await r.continue(); });
    await page.fill('#seedIn', 'Why do moths fly toward lights?'); await page.press('#seedIn', 'Enter');
    await page.waitForSelector('.statusnote.paused .door', { timeout: 20000 });
    const st = await page.evaluate(() => { const a = document.querySelector('.article'); return { doors: a.querySelectorAll('.statusnote .door').length, ask: !!a.querySelector('.ask'), cards: !!a.querySelector('.card'), tools: a.querySelectorAll('.tools [data-act]').length, first: /** @type {HTMLElement} */ (a.querySelector('.a-end > div'))?.dataset.k }; });
    if (st.doors !== 3 || st.ask || st.cards || st.tools || st.first !== 'status') throw new Error(`paused page: ${JSON.stringify(st)}`);
    if ((await left()) !== String(PAGES)) throw new Error(`a paused page spent a free page: ${await left()}`);
    await page.screenshot({ path: `${shots}/${tag}-2-paused.png` });
    const door = await page.locator('.statusnote .door').first().getAttribute('data-seed');
    await page.locator('.statusnote .door').first().click();
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
      const top = await page.evaluate(() => ({ on: document.body.classList.contains('titled'), t: document.querySelector('#topT')?.textContent || '' }));
      if (!top.on || top.t !== first) throw new Error(`the top bar's title: ${JSON.stringify(top)}`);
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
    await step(`${tag}: sketch`, async () => { await page.keyboard.press('k'); await page.waitForSelector('.sketch .sk-chain', { timeout: 15000 }); });
    await step(`${tag}: skeptic mode`, async () => { await page.keyboard.press('d'); await page.waitForSelector('.doubt ol li', { timeout: 15000 }); });
    await step(`${tag}: around this`, async () => { await page.keyboard.press('l'); await page.waitForSelector('.land-list li', { timeout: 15000 }); await page.keyboard.press('Escape'); });
    await step(`${tag}: your trail`, async () => {
      await page.keyboard.press('t'); await page.waitForSelector('.trail-list li', { timeout: 15000 });
      const n = await page.locator('.trail-list li').count(); if (n < 3) throw new Error(`${n} steps on the trail`);
      await page.screenshot({ path: `${shots}/${tag}-5-trail.png` }); await page.keyboard.press('Escape');
    });
    await step(`${tag}: quiz`, async () => { await page.keyboard.press('q'); await page.waitForSelector('.qz-o button', { timeout: 15000 }); await page.keyboard.press('Escape'); });
    await step(`${tag}: recap`, async () => { await page.keyboard.press('f'); await page.waitForSelector('#sheetBody h1', { timeout: 15000 }); await page.keyboard.press('Escape'); });
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
      const w = await page.evaluate(() => ({ url: location.pathname, sum: document.querySelector('.wp-sum')?.textContent || '', saved: [...document.querySelectorAll('.wp-card:nth-child(3) .wp-list b')].map(b => b.textContent), label: document.querySelector('#wpStage')?.getAttribute('aria-label') || '' }));
      if (w.url !== '/world' || !/topics read/.test(w.sum) || !w.saved.includes(saved) || !/topics you have read/.test(w.label)) throw new Error(`your world: ${JSON.stringify(w)}`);
      await page.waitForTimeout(1200); await page.screenshot({ path: `${shots}/${tag}-7-world.png` });
      /* finding a topic flies to it, and its card opens it */
      await page.fill('#wpFind', saved.slice(0, 5)); await page.press('#wpFind', 'Enter');
      await page.waitForSelector('.gv-tip.act [data-gv="open"]', { timeout: 5000 });
      await page.locator('.gv-tip.act [data-gv="open"]').click();
      await page.waitForFunction(t => document.querySelector('.a-title')?.textContent === t, saved, { timeout: 10000 });
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
    for (let i = 1; i <= PAGES && !(await page.locator('.statusnote.paywall').count()); i++) {
      const title = `Mock ${tag} topic ${i}`;
      await page.locator('.ask input').last().fill(title); await page.locator('.ask input').last().press('Enter');
      await page.waitForFunction(t => document.querySelector('.statusnote.paywall') || (document.querySelector('.a-title')?.textContent === t && document.querySelector('.a-end .card') && document.querySelector('.article')?.getAttribute('aria-busy') === 'false'), title, { timeout: 20000 });
    }
    await page.waitForSelector('.statusnote.paywall', { timeout: 20000 });
    if ((await left()) !== '0') throw new Error(`free pages ${await left()}`);
    if ((await page.locator('.statusnote.paywall .door').count()) !== 3) throw new Error('the paywall offers no free pages');
    await page.locator('.statusnote.paywall').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/${tag}-9-paywall.png` });
  });
  await step(`${tag}: a bad key is turned down`, async () => {
    await page.locator('.statusnote.paywall [data-act="keys"]').click();
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
    const w = await page.evaluate(() => ({ sum: document.querySelector('.wp-sum')?.textContent || '', saved: [...document.querySelectorAll('.wp-card:nth-child(3) .wp-list b')].map(b => b.textContent) }));
    if (!/2 topics read/.test(w.sum) || !w.saved.includes('Old topic two')) throw new Error(`moved in: ${JSON.stringify(w)}`);
  });
  await ctx.close();
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
} catch (e) { const pages = browser.contexts().flatMap(c => c.pages()); await pages.at(-1)?.screenshot({ path: `${shots}/failure.png` }).catch(() => {}); }
await browser.close();
server.kill();
console.log(results.join('\n'));
if (errors.length) console.log(`\nbrowser errors:\n${[...new Set(errors)].join('\n')}`);
process.exit(results.some(r => r.startsWith('FAIL')) || errors.length ? 1 : 0);

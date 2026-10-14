// End-to-end smoke test in a real browser, against a fresh local dev server running the
// mock writer. Not part of `npm test` because it needs Chromium (Playwright):
//   npx playwright install chromium   (once)
//   npm run e2e
// Walks the whole reader flow on desktop and on a phone in dark mode: first page, a link,
// every tool, the end of the trial, a bad key, a good key. Screenshots go to $E2E_SHOTS
// (default .e2e/, which is git-ignored).
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('Playwright is missing: run npm install, then npx playwright install chromium'); process.exit(1); }
const shots = process.env.E2E_SHOTS || '.e2e';
mkdirSync(shots, { recursive: true });
const port = 3900 + Math.floor(Math.random() * 90);
const base = `http://localhost:${port}`;
/* A small trial keeps the run short, and goes through the same setting production uses. */
const PAGES = 4;
const server = spawn(process.execPath, [fileURLToPath(new URL('dev.mjs', import.meta.url))], { env: { ...process.env, PORT: String(port), DH_MOCK: '1', DH_MOCK_PACE: 'quick', DH_PICTURES: 'off', DH_TRIAL_PAGES: String(PAGES) }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.on('data', d => { if (String(d).includes('dorkhub on')) resolve(null); }); server.on('exit', () => reject(new Error('dev server exited'))); });

const browser = await chromium.launch();
const errors = [];
const results = [];
const step = async (name, fn) => { const t = Date.now(); try { await fn(); results.push(`ok   ${name} (${Date.now() - t} ms)`); } catch (e) { results.push(`FAIL ${name}: ${String(e.message).split('\n')[0]}`); throw e; } };

async function run(page, { mobile = false } = {}) {
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL_CONNECTION_FAILED|fonts\.g|status of 40[12]/.test(m.text() + (m.location()?.url || ''))) errors.push(`console: ${m.text()}`); });
  const tag = mobile ? 'mobile' : 'desktop';
  const badge = () => page.locator('#keyBtn .kb-n').textContent();
  /* a page is done when the newest one is no longer busy and its branches are in */
  const waitDone = async () => { await page.waitForFunction(() => { const a = [...document.querySelectorAll('.chamber .article')].pop(); return a && a.getAttribute('aria-busy') === 'false' && a.querySelector('.a-end .row[data-t]'); }, null, { timeout: 20000 }); };

  await step(`${tag}: landing`, async () => {
    await page.goto(base);
    await page.waitForSelector('#seedIn');
    const line = await page.locator('#status').textContent();
    if (!line.includes(`first ${PAGES} pages are on us`)) throw new Error(`status line: ${line}`);
    if ((await badge()) !== String(PAGES)) throw new Error(`badge ${await badge()}`);
    /* the fonts are our own files, so they load under the page's CSP without asking any third party */
    const fams = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')); });
    for (const f of ['Literata', 'Atkinson Hyperlegible Next']) if (!fams.includes(f)) throw new Error(`${f} did not load (${fams.join(', ') || 'none'})`);
    await page.screenshot({ path: `${shots}/${tag}-1-landing.png` });
  });
  await step(`${tag}: a door page is written ahead of time, and free`, async () => {
    await page.fill('#seedIn', 'Tardigrades'); await page.press('#seedIn', 'Enter'); await waitDone();
    const p = await page.evaluate(() => ({ title: document.querySelector('.a-title')?.textContent, fine: document.querySelector('.fineprint span')?.textContent || '', paras: document.querySelectorAll('.a-body .pb').length }));
    if (p.title !== 'Tardigrades' || p.paras < 3 || !/written ahead of time/.test(p.fine)) throw new Error(`door page: ${JSON.stringify(p)}`);
    if ((await badge()) !== String(PAGES)) throw new Error(`a door page spent a free page: badge ${await badge()}`);
    await page.goto(base); await page.waitForSelector('#seedIn');
  });
  /* the dice only ever opens a page written ahead of time, and never one already on screen */
  await step(`${tag}: the dice opens a door that isn't on screen`, async () => {
    const shown = await page.$$eval('.door[data-seed]', bs => bs.map(b => /** @type {HTMLElement} */ (b).dataset.seed));
    await page.locator('[data-act="surprise"]').click(); await waitDone();
    const p = await page.evaluate(() => ({ title: document.querySelector('.a-title')?.textContent || '', fine: document.querySelector('.fineprint span')?.textContent || '' }));
    if (shown.includes(p.title) || !/written ahead of time/.test(p.fine)) throw new Error(`dice: ${JSON.stringify({ shown, ...p })}`);
    if ((await badge()) !== String(PAGES)) throw new Error(`the dice spent a free page: badge ${await badge()}`);
    await page.goto(base); await page.waitForSelector('#seedIn');
  });
  /* the demo is a picture, not a control, and it pauses when asked */
  if (!mobile) {
    await step(`${tag}: the demo pauses and plays`, async () => {
      await page.locator('#demoPause').click();
      const d = await page.evaluate(() => ({ pressed: document.querySelector('#demoPause')?.getAttribute('aria-pressed'), held: !!document.querySelector('#demo.held'), events: getComputedStyle(/** @type {Element} */ (document.querySelector('#demo'))).pointerEvents }));
      if (d.pressed !== 'true' || !d.held || d.events !== 'none') throw new Error(`demo: ${JSON.stringify(d)}`);
      await page.locator('#demoPause').click();
      if (await page.locator('#demo.held').count()) throw new Error('the demo stayed paused');
    });
  }
  /* pictures come from our own endpoint: one found on desktop, none on the phone */
  if (!mobile) {
    await page.route('**/api/picture?t=*', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ src: '/api/picture?f=a%2Fab%2FTest.jpg&w=500', w: 500, h: 300, alt: 'A test picture', credit: 'E2E', license: 'CC0', file: 'https://commons.wikimedia.org/wiki/File:Test.jpg' }) }));
    await page.route('**/api/picture?f=*', r => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300"><rect width="500" height="300" fill="#4a7"/></svg>' }));
  } else await page.route('**/api/picture?t=*', r => r.fulfill({ status: 204 }));
  await step(`${tag}: first page streams in`, async () => {
    await page.evaluate(() => { const w = /** @type {any} */ (window); w.__status = new Set(); new MutationObserver(() => { const s = document.querySelector('.status-line'); if (s) w.__status.add(s.textContent); }).observe(document.body, { childList: true, subtree: true, characterData: true }); });
    await page.fill('#seedIn', 'Water bears'); await page.press('#seedIn', 'Enter');
    await page.waitForSelector('.a-title'); await waitDone();
    const status = await page.evaluate(() => ({ seen: [.../** @type {any} */ (window).__status], now: !!document.querySelector('.status-line') }));
    if (!status.seen.length || status.now) throw new Error(`status line: seen ${JSON.stringify(status.seen)}, still there ${status.now}`);
    const title = await page.locator('.a-title').first().textContent(); if (title !== 'Water bears') throw new Error(`title ${title}`);
    if ((await badge()) !== String(PAGES - 1)) throw new Error(`badge ${await badge()}`);
    /* reading first: the opening paragraph starts on the first screen; a facts panel sits beside its paragraph, or below it on a phone */
    await page.evaluate(() => window.scrollTo(0, 0));
    const lay = await page.evaluate(() => {
      const pb = document.querySelector('.a-body .pb'); const p = pb.querySelector('.pcol > p').getBoundingClientRect(); const f = pb.querySelector('.mcol .panel[data-type="facts"]')?.getBoundingClientRect();
      return { top: p.top, vh: innerHeight, beside: f ? f.left >= p.right : null, below: f ? f.top >= p.bottom : null, v1: !!document.querySelector('.h-side,.glance-band,.drift,.caret'), tools: !!document.querySelector('.a-head .h-row .tools [data-act="sketch"]'), order: [...document.querySelectorAll('.a-end > div')].map(d => d.dataset.k).join(' ') };
    });
    if (lay.top > lay.vh * .75) throw new Error(`the first paragraph starts at ${Math.round(lay.top)} of ${lay.vh}`);
    if (mobile ? !lay.below : !lay.beside) throw new Error(`the facts panel is in the wrong place: ${JSON.stringify(lay)}`);
    if (lay.v1) throw new Error('v1 head furniture is still on the page');
    if (!lay.tools) throw new Error('the page tools are not in the head row');
    if (!/react next branches qs ask/.test(lay.order)) throw new Error(`the end of the page is out of order: ${lay.order}`);
    const pic = await page.evaluate(() => ({ n: document.querySelectorAll('figure.pic').length, inFirst: !!document.querySelector('.a-body .pb .mcol figure.pic img'), credit: document.querySelector('figure.pic figcaption')?.textContent || '' }));
    if (mobile ? pic.n !== 0 : !(pic.inFirst && pic.credit === 'E2E · CC0')) throw new Error(`picture: ${JSON.stringify(pic)}`);
    if (!(await page.locator('#upnext').isHidden())) throw new Error('the up-next pill shows at the top of a page');
    await page.screenshot({ path: `${shots}/${tag}-2-page.png`, fullPage: false });
  });
  await step(`${tag}: a guess keeps its answer until asked`, async () => {
    if (await page.locator('.panel[data-type="guess"] .pn-a').count()) throw new Error('the answer showed before it was asked for');
    await page.locator('.panel[data-type="guess"] .pn-reveal').click();
    await page.waitForFunction(() => document.querySelector('.panel[data-type="guess"] .pn-a')?.textContent === '0' && document.activeElement === document.querySelector('.pn-a'), null, { timeout: 5000 });
  });
  if (mobile) {
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
  await step(`${tag}: a link opens the next page`, async () => {
    const link = await page.locator('.a-body a.hole').first().elementHandle(); const target = await link.getAttribute('data-t');
    if (mobile) { await link.tap(); await page.waitForTimeout(150); await link.tap(); } else await link.click();
    await page.waitForFunction(t => document.querySelector('.a-title')?.textContent === t, target, { timeout: 20000 });
    await waitDone(); if ((await badge()) !== String(PAGES - 2)) throw new Error(`badge ${await badge()}`);
  });
  if (!mobile) {
    await step(`${tag}: J continues below and moves focus to the new title`, async () => {
      const before = await page.locator('.chamber').count();
      await page.keyboard.press('j');
      await page.waitForFunction(n => document.querySelectorAll('.chamber').length > n, before, { timeout: 20000 }); await waitDone();
      const focused = await page.evaluate(() => document.activeElement === [...document.querySelectorAll('.a-title')].pop());
      if (!focused) throw new Error('focus stayed behind');
    });
    await step(`${tag}: expand a paragraph`, async () => {
      await page.locator('.pb').first().hover(); await page.locator('.ptool').first().click();
      await page.locator('[data-uf="simpler"]').click();
      await page.waitForFunction(() => /mock writer/.test(document.querySelector('.xp')?.textContent || ''), null, { timeout: 15000 });
    });
    await step(`${tag}: sketch`, async () => { await page.keyboard.press('k'); await page.waitForSelector('.sketch .sk-chain', { timeout: 15000 }); });
    await step(`${tag}: skeptic mode`, async () => { await page.keyboard.press('d'); await page.waitForSelector('.doubt ol li', { timeout: 15000 }); });
    await step(`${tag}: around this`, async () => { await page.keyboard.press('l'); await page.waitForSelector('.land-list li', { timeout: 15000 }); await page.keyboard.press('Escape'); });
    await step(`${tag}: the thread`, async () => { await page.keyboard.press('t'); await page.waitForSelector('.thread-line', { timeout: 15000 }); await page.keyboard.press('Escape'); });
    await step(`${tag}: quiz`, async () => { await page.keyboard.press('q'); await page.waitForSelector('.qz-o button', { timeout: 15000 }); await page.keyboard.press('Escape'); });
    await step(`${tag}: recap`, async () => { await page.locator('#notesBtn').click({ force: true }).catch(() => page.keyboard.press('f')); await page.waitForSelector('#sheetBody h1', { timeout: 15000 }); await page.keyboard.press('Escape'); });
  }
  await step(`${tag}: the trial runs out`, async () => {
    for (let i = 1; i <= PAGES && !(await page.locator('.statusnote.paywall').count()); i++) {
      const title = `Mock topic ${i}`;
      await page.locator('.ask input').last().fill(title); await page.locator('.ask input').last().press('Enter');
      await page.waitForFunction(t => document.querySelector('.statusnote.paywall') || (document.querySelector('.a-title')?.textContent === t && document.querySelector('.a-end .row[data-t]') && document.querySelector('.article')?.getAttribute('aria-busy') === 'false'), title, { timeout: 20000 });
    }
    await page.waitForSelector('.statusnote.paywall', { timeout: 20000 });
    if ((await badge()) !== '0') throw new Error(`badge ${await badge()}`);
    await page.locator('.statusnote.paywall').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/${tag}-3-paywall.png` });
  });
  await step(`${tag}: a bad key is turned down`, async () => {
    await page.locator('.statusnote.paywall [data-act="keys"]').click();
    await page.waitForSelector('#keyForm'); await page.waitForTimeout(450);
    await page.screenshot({ path: `${shots}/${tag}-4-keys.png` });
    await page.fill('#keyIn', 'sk-ant-bad-0000000000'); await page.locator('[data-act="key-save"]').click();
    await page.waitForFunction(() => /turned that key down/.test(document.querySelector('#keyMsg')?.textContent || ''), null, { timeout: 15000 });
  });
  await step(`${tag}: a good key unlocks the page`, async () => {
    await page.locator('.ks-m', { hasText: 'Sonnet' }).click();
    await page.fill('#keyIn', 'sk-ant-test-0000000000'); await page.locator('[data-act="key-save"]').click();
    await page.waitForSelector('#sheet:not([open])', { state: 'attached', timeout: 15000 });
    await waitDone();
    if ((await page.locator('#keyBtn').getAttribute('data-state')) !== 'key') throw new Error('key state');
    await page.screenshot({ path: `${shots}/${tag}-5-with-key.png` });
  });
}

try {
  const desk = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  await run(desk);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: 'dark' });
  await run(await ctx.newPage(), { mobile: true });
} catch (e) { const pages = browser.contexts().flatMap(c => c.pages()); await pages.at(-1)?.screenshot({ path: `${shots}/failure.png` }).catch(() => {}); }
await browser.close();
server.kill();
console.log(results.join('\n'));
if (errors.length) console.log(`\nbrowser errors:\n${[...new Set(errors)].join('\n')}`);
process.exit(results.some(r => r.startsWith('FAIL')) || errors.length ? 1 : 0);

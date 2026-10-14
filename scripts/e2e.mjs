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
const server = spawn(process.execPath, [fileURLToPath(new URL('dev.mjs', import.meta.url))], { env: { ...process.env, PORT: String(port), DH_MOCK: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
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
  const waitDone = async () => { await page.waitForSelector('.chamber .a-end .row[data-t]', { timeout: 20000 }); await page.waitForFunction(() => !document.querySelector('.caret') && !document.querySelector('.enriching'), null, { timeout: 20000 }); };

  await step(`${tag}: landing`, async () => {
    await page.goto(base);
    await page.waitForSelector('#seedIn');
    const line = await page.locator('#status').textContent();
    if (!/first 6 pages are on us/.test(line)) throw new Error(`status line: ${line}`);
    if ((await badge()) !== '6') throw new Error(`badge ${await badge()}`);
    await page.screenshot({ path: `${shots}/${tag}-1-landing.png` });
  });
  await step(`${tag}: first page streams in`, async () => {
    await page.fill('#seedIn', 'Tardigrades'); await page.press('#seedIn', 'Enter');
    await page.waitForSelector('.a-title'); await waitDone();
    const title = await page.locator('.a-title').first().textContent(); if (title !== 'Tardigrades') throw new Error(`title ${title}`);
    if ((await badge()) !== '5') throw new Error(`badge ${await badge()}`);
    await page.screenshot({ path: `${shots}/${tag}-2-page.png`, fullPage: false });
  });
  await step(`${tag}: a link opens the next page`, async () => {
    const link = await page.locator('.a-body a.hole').first().elementHandle(); const target = await link.getAttribute('data-t');
    if (mobile) { await link.tap(); await page.waitForTimeout(150); await link.tap(); } else await link.click();
    await page.waitForFunction(t => document.querySelector('.a-title')?.textContent === t, target, { timeout: 20000 });
    await waitDone(); if ((await badge()) !== '4') throw new Error(`badge ${await badge()}`);
  });
  if (!mobile) {
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
    for (let i = 1; i <= 6 && !(await page.locator('.statusnote.paywall').count()); i++) {
      const title = `Mock topic ${i}`;
      await page.locator('.ask input').last().fill(title); await page.locator('.ask input').last().press('Enter');
      await page.waitForFunction(t => document.querySelector('.statusnote.paywall') || (document.querySelector('.a-title')?.textContent === t && document.querySelector('.a-end .row[data-t]') && !document.querySelector('.caret')), title, { timeout: 20000 });
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

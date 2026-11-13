// scripts/prove.mjs against a local server: public/ plus the two handlers, with the mock writer.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { Readable } from 'node:stream';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { cacheCounters } from '../lib/counters.js';
import { handleWrite } from '../lib/write.js';
import { prove } from '../scripts/prove.mjs';
import { memoryStore } from './helpers.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const TYPES = /** @type {Record<string, string>} */ ({ '.html': 'text/html; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' });
const servers = /** @type {import('node:http').Server[]} */ ([]);
after(() => { for (const s of servers) s.closeAllConnections(); for (const s of servers) s.close(); });

/** The few lines of scripts/dev.mjs that serve the page and the write handler, with its own store. */
async function serve(/** @type {Record<string, string>} */ envExtra = {}) {
  const store = memoryStore();
  const deps = { env: { ...process.env, DH_MOCK: '1', DH_MOCK_PACE: 'quick', VERCEL_ENV: 'development', ...envExtra }, store, counters: cacheCounters(store), textCache: true };
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    if (url.pathname === '/api/write') {
      const ac = new AbortController(); res.on('close', () => { if (!res.writableFinished) ac.abort(); });
      const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : Readable.toWeb(req);
      const response = await handleWrite(new Request(url, { method: req.method, headers: /** @type {any} */ (req.headers), body, duplex: 'half', signal: ac.signal }), deps);
      for (const [k, v] of response.headers) if (k !== 'set-cookie') res.setHeader(k, v);
      const cookies = response.headers.getSetCookie(); if (cookies.length) res.setHeader('set-cookie', cookies);
      res.writeHead(response.status);
      if (!response.body) { res.end(); return; }
      try { for await (const chunk of /** @type {any} */ (response.body)) res.write(chunk); } catch { /* the reader left */ }
      res.end(); return;
    }
    const rel = normalize(decodeURIComponent(url.pathname));
    const file = join(root, 'public', rel === '/' ? 'index.html' : rel);
    const found = file.startsWith(join(root, 'public')) && existsSync(file) && extname(file) !== '';
    res.writeHead(found ? 200 : 404, { 'content-type': TYPES[extname(found ? file : 'x.html')] || 'application/octet-stream' });
    res.end(readFileSync(found ? file : join(root, 'public', '404.html')));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', () => r(undefined)));
  servers.push(server);
  return `http://127.0.0.1:${/** @type {import('node:net').AddressInfo} */ (server.address()).port}`;
}

/* generous bounds: the mock streams in bursts a few milliseconds apart, so this only asks for "more than one chunk, not all at once" */
const loose = { minChunks: 2, minSpreadMs: 5 };

test('every free and spending check passes against the mock writer', async () => {
  const url = await serve({ DH_TRIAL_PAGES: '5' });
  const out = await prove(url, { spend: true, yes: true, ...loose });
  const bad = out.results.filter(r => r.status === 'FAIL');
  assert.deepEqual(bad, [], JSON.stringify(bad));
  assert.equal(out.ok, true);
  const by = (/** @type {string} */ s) => out.results.filter(r => r.name.startsWith(s));
  assert.equal(by('spend:').filter(r => r.status === 'ok').length, 3);
  assert.equal(by('spend: stop writing')[0].status, 'manual');
  assert.match(by('spend: stop writing')[0].detail, /end: cancelled/);
  assert.equal(by('ratelimit')[0].status, 'skip');
  assert.ok(out.results.filter(r => r.status === 'ok').length >= 11);
});

test('without --yes the spending checks say what they would spend and run nothing', async () => {
  const url = await serve({ DH_TRIAL_PAGES: '1' });
  const out = await prove(url, { spend: true });
  assert.equal(out.ok, true);
  const s = out.results.find(r => r.name === 'spend: live writing');
  assert.equal(s?.status, 'skip'); assert.match(s?.detail || '', /2 fresh pages/);
});

test('a paused trial is reported as paused, not as a crash', async () => {
  const url = await serve({ DH_TRIAL_OFF: '1' });
  const out = await prove(url, { spend: true, yes: true, ...loose });
  assert.equal(out.ok, false);
  const paused = out.results.filter(r => r.paused);
  assert.equal(paused.length, 1);
  assert.match(paused[0].detail, /live writing is paused: no credits or the trial is off/);
  assert.equal(out.results.filter(r => r.status === 'FAIL').length, 1, 'only the paused check fails; the free checks still pass');
});

test('--ratelimit fails plainly when no 429 ever comes', async () => {
  const url = await serve();
  const out = await prove(url, { ratelimit: true, maxPrefetches: 5 });
  const r = out.results.find(x => x.name.startsWith('ratelimit'));
  assert.equal(r?.status, 'FAIL'); assert.match(r?.detail || '', /no 429 after 5 requests/);
});

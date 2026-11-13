// One write per page in flight: a second reader of a page being written reads along instead of writing it again.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cacheCounters } from '../lib/counters.js';
import { handleWrite } from '../lib/write.js';
import { client, memoryStore, pageBody } from './helpers.js';

const ends = (/** @type {any[]} */ logs) => logs.filter(l => l.evt === 'write' && 'end' in l);
const joins = (/** @type {any[]} */ logs) => logs.filter(l => l.evt === 'write' && l.joined);
const texts = (/** @type {{ m: Map<string, unknown> }} */ store) => [...store.m.keys()].filter(k => /^text/.test(k));
const settle = () => new Promise(r => setTimeout(r, 30));

/* A paced writer (about 10 ms a chunk), so readers can come and go while it writes. */
function paced() {
  const store = memoryStore(); /** @type {any[]} */ const logs = [];
  const deps = { env: { DH_MOCK: '1', DH_MOCK_REPLAY: 'off', VERCEL_ENV: 'development', DH_TRIAL_PAGES: '3' }, store, counters: cacheCounters(store), textCache: true, log: (/** @type {any} */ l) => logs.push(l), seeds: new URL('./no-seeds/', import.meta.url) };
  /** @param {unknown} body @param {{ ip: string, signal?: AbortSignal }} o */
  const open = (body, o) => handleWrite(new Request('https://dorkhub.test/api/write', { method: 'POST', signal: o.signal, headers: { 'content-type': 'application/json', origin: 'https://dorkhub.test', 'x-real-ip': o.ip }, body: JSON.stringify(body) }), deps);
  return { store, logs, open };
}
/** @param {Response} res */
async function readAll(res) {
  const t = await res.text(); const z = t.indexOf('\u0000');
  return { text: z < 0 ? t : t.slice(0, z), tail: z < 0 ? null : JSON.parse(t.slice(z + 1)) };
}

test('two readers of the same page at once: one model call, the same page, and the second spends nothing', async () => {
  const store = memoryStore();
  const a = client({ env: { DH_TRIAL_PAGES: '2' }, store });
  const b = client({ env: { DH_TRIAL_PAGES: '2' }, store, counters: a.counters, ip: '198.51.100.4' });
  const [ra, rb] = await Promise.all([a.call(pageBody('Umami')), b.call(pageBody('Umami'))]);
  const logs = [...a.logs, ...b.logs];
  assert.equal(ends(logs).length, 1, 'one write');
  assert.equal(joins(logs).length, 1, 'one reader read along');
  assert.equal(ra.status, 200); assert.equal(rb.status, 200);
  assert.equal(rb.text, ra.text); assert.equal(rb.tail, null); assert.match(ra.text, /^# Umami :: /);
  assert.equal(ra.headers.get('x-dh-trial'), 'pages=1; extras=50', 'the writer\'s reader is charged');
  assert.equal(rb.headers.get('x-dh-trial'), 'pages=2; extras=50', 'the one reading along is not');
  assert.equal(rb.headers.get('x-dh-cache'), null, 'and it is not a cache hit');
  assert.deepEqual(joins(logs)[0], { evt: 'write', task: 'page', model: 'anthropic/claude-haiku-5.5', byok: null, joined: true });
  assert.equal(JSON.stringify(logs).includes('mami'), false, 'logs never name the page');
  await settle();
  assert.equal(texts(store).length, 1, 'kept once');
  assert.equal((await b.call(pageBody('Kombu'))).headers.get('x-dh-trial'), 'pages=1; extras=50', 'their allowance was untouched');
});

test('the first reader leaving does not stop the page for the second', async () => {
  const p = paced();
  const ac = new AbortController();
  const first = await p.open(pageBody('Moths'), { ip: '203.0.113.7', signal: ac.signal });
  const r1 = /** @type {ReadableStream<Uint8Array>} */ (first.body).getReader();
  await r1.read();
  const second = await p.open(pageBody('Moths'), { ip: '198.51.100.4' });
  assert.equal(joins(p.logs).length, 1);
  ac.abort(); await r1.cancel();
  const { text, tail } = await readAll(second);
  assert.equal(tail, null); assert.match(text, /^# Moths :: /); assert.ok(text.length > 1000, 'the whole page');
  await settle();
  assert.equal(ends(p.logs).length, 1); assert.equal(ends(p.logs)[0].end, 'ok'); assert.equal(ends(p.logs)[0].cached, true);
});

test('when every reader has left, the writer stops and nothing is kept', async () => {
  const p = paced();
  const a = new AbortController(); const b = new AbortController();
  const first = await p.open(pageBody('Moths'), { ip: '203.0.113.7', signal: a.signal });
  const r1 = /** @type {ReadableStream<Uint8Array>} */ (first.body).getReader(); await r1.read();
  const second = await p.open(pageBody('Moths'), { ip: '198.51.100.4', signal: b.signal });
  const r2 = /** @type {ReadableStream<Uint8Array>} */ (second.body).getReader(); await r2.read();
  a.abort(); await r1.cancel();
  await settle();
  assert.equal(ends(p.logs).length, 0, 'still writing for the second');
  b.abort(); await r2.cancel();
  await settle(); await settle();
  assert.equal(ends(p.logs).at(-1).end, 'cancelled');
  assert.equal(texts(p.store).length, 0);
  /* the next reader starts a new write rather than joining a stopped one */
  const third = await p.open(pageBody('Moths'), { ip: '192.0.2.1' });
  assert.equal(joins(p.logs).length, 1);
  assert.equal((await readAll(third)).tail, null);
});

test('a failure mid-page reaches every reader, with the same trailer', async () => {
  const store = memoryStore();
  const a = client({ store }); const b = client({ store, counters: a.counters, ip: '198.51.100.4' });
  const [ra, rb] = await Promise.all([a.call(pageBody('Moths [fail-mid]')), b.call(pageBody('Moths [fail-mid]'))]);
  assert.equal(joins([...a.logs, ...b.logs]).length, 1); assert.equal(ends([...a.logs, ...b.logs]).length, 1);
  assert.deepEqual(ra.tail, { error: 'upstream_error' }); assert.deepEqual(rb.tail, ra.tail); assert.equal(rb.text, ra.text);
  await settle();
  assert.equal(texts(store).length, 0);
});

test('a write that fails before its first word is not joined: the second reader goes its own way, and neither pays', async () => {
  const store = memoryStore();
  const a = client({ env: { DH_TRIAL_PAGES: '2' }, store }); const b = client({ env: { DH_TRIAL_PAGES: '2' }, store, counters: a.counters, ip: '198.51.100.4' });
  const [ra, rb] = await Promise.all([a.call(pageBody('Moths [fail-early]')), b.call(pageBody('Moths [fail-early]'))]);
  assert.equal(ra.status, 502); assert.equal(rb.status, 502);
  assert.equal(rb.headers.get('x-dh-trial'), 'pages=2; extras=50');
  assert.equal(joins([...a.logs, ...b.logs]).length, 0); assert.equal(ends([...a.logs, ...b.logs]).length, 2, 'it tried for itself');
});

test('a reader refused by the trial gives way to the one waiting on it', async () => {
  const store = memoryStore();
  const a = client({ env: { DH_TRIAL_PAGES: '0' }, store }); const b = client({ env: { DH_TRIAL_PAGES: '2' }, store, counters: a.counters, ip: '198.51.100.4' });
  const [ra, rb] = await Promise.all([a.call(pageBody('Umami')), b.call(pageBody('Umami'))]);
  assert.equal(ra.status, 402); assert.equal(rb.status, 200); assert.equal(rb.headers.get('x-dh-trial'), 'pages=1; extras=50');
});

test('a rewrite neither joins nor can be joined, and a prefetch never waits on a write', async () => {
  const store = memoryStore();
  const a = client({ store }); const f = client({ store, counters: a.counters, ip: '198.51.100.4' });
  const [fr, ar] = await Promise.all([f.call({ ...pageBody('Umami'), fresh: true }), a.call(pageBody('Umami'))]);
  assert.equal(fr.status, 200); assert.equal(ar.status, 200);
  assert.equal(joins([...a.logs, ...f.logs]).length, 0); assert.equal(ends([...a.logs, ...f.logs]).length, 2);
  const store2 = memoryStore();
  const c = client({ store: store2 }); const d = client({ store: store2, counters: c.counters, ip: '198.51.100.4' });
  const [, rf] = await Promise.all([c.call(pageBody('Kombu')), d.call({ ...pageBody('Kombu'), fresh: true })]);
  assert.equal(rf.status, 200); assert.equal(joins([...c.logs, ...d.logs]).length, 0);
  const store3 = memoryStore();
  const e = client({ store: store3 }); const g = client({ store: store3, counters: e.counters, ip: '198.51.100.4' });
  const [, pre] = await Promise.all([e.call(pageBody('Krill')), g.call({ ...pageBody('Krill'), cachedOnly: true })]);
  assert.equal(pre.status, 204); assert.equal(joins([...e.logs, ...g.logs]).length, 0);
});

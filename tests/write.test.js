import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chooseWriter, mockAllowed } from '../lib/ai.js';
import { redisCounters } from '../lib/counters.js';
import { TASKS } from '../lib/prompts.js';
import { handleWrite, textNs } from '../lib/write.js';
import { KEY, client, fakeUpstash, memoryStore, pageBody } from './helpers.js';

test('a trial page streams, sets the device cookie and reports what is left', async () => {
  const c = client({ env: { DH_TRIAL_PAGES: '2' } });
  const r = await c.call(pageBody('Tardigrades'));
  assert.equal(r.status, 200);
  assert.match(r.text, /^# Tardigrades :: [a-z]+\n/);
  assert.equal(r.tail, null);
  assert.equal(r.headers.get('x-dh-trial'), 'pages=1; extras=50');
  assert.equal(r.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(c.logs.at(-1).end, 'ok');
  assert.equal(JSON.stringify(c.logs).includes('Tardigrades'), false, 'logs never carry what was read');
});

const cachedTexts = (/** @type {{ m: Map<string, unknown> }} */ store) => [...store.m.keys()].filter(k => /^text/.test(k));

test('an exact repeat comes from cache, free, for every reader, however their browser asks', async () => {
  const a = client({ env: { DH_TRIAL_PAGES: '3' } });
  const first = await a.call(pageBody('Umami'));
  assert.equal(first.headers.get('x-dh-trial'), 'pages=2; extras=50');
  const b = client({ store: a.store, ip: '198.51.100.4' });
  const hit = await b.call(pageBody('umami'));
  assert.equal(hit.headers.get('x-dh-cache'), 'hit'); assert.equal(hit.text, first.text);
  assert.equal(hit.headers.get('x-dh-trial'), null, 'a repeat never touches the trial');
  assert.equal(hit.headers.get('set-cookie'), null, 'or remembers the reader');
  const old = await b.call(pageBody('Umami', { depth: 3, path: [{ title: 'Fish sauce', deck: 'd' }], from: { kind: 'passage', text: 'glutamate' }, others: ['Kombu'], ratings: [{ title: 'Fish sauce', rating: 'wow' }] }));
  assert.equal(old.headers.get('x-dh-cache'), 'hit', 'an older browser that still sends its path gets the same page');
  assert.equal(b.logs.at(-1).cached, true); assert.equal(JSON.stringify(b.logs).includes('mami'), false, 'logs never name the page');
  for (const [why, body, h] of /** @type {[string, any, Record<string, string>?][]} */ ([
    ['another voice', pageBody('Umami', { lens: 'story' })],
    ['a question', pageBody('What is umami?')],
    ['a name chosen inside another page', pageBody('Umami', { ctx: 'Japanese cooking' })],
    ['another model', pageBody('Umami'), KEY],
  ])) assert.equal((await b.call(body, h)).headers.get('x-dh-cache'), null, why);
});

test('a rewrite is private: it never reads the shared page and never replaces it', async () => {
  const c = client({ env: { DH_TRIAL_PAGES: '3' } });
  await c.call(pageBody('Umami'));
  const keys = cachedTexts(c.store); const before = c.store.m.get(keys[0]);
  const fresh = await c.call({ ...pageBody('Umami'), fresh: true });
  assert.equal(fresh.headers.get('x-dh-cache'), null);
  assert.equal(fresh.headers.get('x-dh-trial'), 'pages=1; extras=50', 'a rewrite is a new page');
  assert.equal(c.logs.at(-1).cached, false);
  assert.deepEqual(cachedTexts(c.store), keys); assert.equal(c.store.m.get(keys[0]), before);
  const k = await c.call({ ...pageBody('Kombu'), fresh: true }, KEY);
  assert.equal(k.status, 200); assert.equal(cachedTexts(c.store).length, 1, 'with a key too');
});

test('repeats stay free when the trial is over or paused', async () => {
  const c = client({ env: { DH_TRIAL_PAGES: '1' } });
  assert.equal((await c.call(pageBody('Umami'))).status, 200);
  const again = await c.call(pageBody('Umami'));
  assert.equal(again.status, 200); assert.equal(again.headers.get('x-dh-cache'), 'hit');
  assert.equal((await c.call(pageBody('Kombu'))).status, 402);
  const paused = client({ env: { DH_TRIAL_OFF: '1' }, store: c.store });
  assert.equal((await paused.call(pageBody('Umami'))).headers.get('x-dh-cache'), 'hit');
  assert.equal((await paused.call(pageBody('Kombu'))).status, 503);
});

test('a prefetch only reads: 204 or the page, never a write, a reservation or a cookie', async () => {
  const c = client({ env: { DH_TRIAL_PAGES: '2' } });
  const miss = await c.call({ ...pageBody('Umami'), cachedOnly: true });
  assert.equal(miss.status, 204); assert.equal(miss.text, '');
  assert.equal(miss.headers.get('cache-control'), 'no-store');
  assert.equal(miss.headers.get('set-cookie'), null); assert.equal(miss.headers.get('x-dh-trial'), null);
  assert.equal(c.store.m.size, 0, 'nothing written and no trial counter touched');
  assert.deepEqual(c.logs.at(-1), { evt: 'write', task: 'page', cachedOnly: true, cached: false });
  assert.equal((await c.call(pageBody('Umami'))).headers.get('x-dh-trial'), 'pages=1; extras=50', 'the prefetch cost nothing');
  const hit = await c.call({ ...pageBody('Umami'), cachedOnly: true });
  assert.equal(hit.status, 200); assert.equal(hit.headers.get('x-dh-cache'), 'hit'); assert.match(hit.text, /^# Umami/);
  assert.equal((await client({ env: { DH_TRIAL_OFF: '1' }, store: c.store }).call({ ...pageBody('Kombu'), cachedOnly: true })).status, 204, 'a miss while paused is still a quiet 204');
  assert.equal((await c.call({ task: 'peek', input: { title: 'A', passage: 'p', target: 'Krill' }, cachedOnly: true })).status, 400, 'only pages prefetch');
});

test('the cache key carries the deployment, so preview and mock pages never reach production', async () => {
  assert.equal(textNs({ VERCEL_ENV: 'production' }), 'text');
  assert.equal(textNs({ VERCEL_ENV: 'preview' }), 'text-preview');
  assert.equal(textNs({}), 'text-local');
  const c = client({ env: { VERCEL_ENV: 'preview' } });
  await c.call(pageBody('Umami'));
  assert.deepEqual(cachedTexts(c.store).map(k => k.split(':')[0]), ['text-preview']);
});

test('the trial ends with 402, and quick tools have their own allowance', async () => {
  const c = client({ env: { DH_TRIAL_PAGES: '1', DH_TRIAL_EXTRAS: '1' } });
  assert.equal((await c.call(pageBody('A'))).status, 200);
  const over = await c.call(pageBody('B'));
  assert.equal(over.status, 402); assert.deepEqual(over.json(), { error: 'trial_over' });
  assert.equal(over.headers.get('x-dh-trial'), 'pages=0; extras=1');
  const peek = { task: 'peek', input: { title: 'A', path: [], passage: 'p', target: 'Krill' } };
  assert.equal((await c.call(peek)).status, 200);
  const tools = await c.call({ ...peek, input: { ...peek.input, target: 'Squid' } });
  assert.equal(tools.status, 402); assert.deepEqual(tools.json(), { error: 'tools_over' });
});

for (const [name, counters] of [['runtime cache', undefined], ['redis', () => redisCounters({ url: 'https://fake.upstash.io', token: 't' }, fakeUpstash().fetchFn)]]) {
  test(`${name}: twenty pages fired at once get exactly the trial's worth`, async () => {
    const c = client({ env: { DH_TRIAL_PAGES: '6', DH_TRIAL_NETWORK_PAGES: '12' }, counters: counters && counters() });
    await c.call({ task: 'peek', input: { title: 'A', path: [], passage: 'p', target: 'Krill' } }); // sets the device cookie
    const all = await Promise.all(Array.from({ length: 20 }, (_, i) => c.call(pageBody(`Burst ${i}`))));
    assert.equal(all.filter(r => r.status === 200).length, 6);
    assert.equal(all.filter(r => r.status === 402).length, 14);
    assert.equal((await c.call(pageBody('After'))).status, 402);
    // Twenty cookieless requests from the same network share its allowance (6 x 2, 6 already used).
    const rest = await Promise.all(Array.from({ length: 20 }, (_, i) => client({ env: { DH_TRIAL_PAGES: '6', DH_TRIAL_NETWORK_PAGES: '12' }, store: c.store, counters: c.counters }).call(pageBody(`Bare ${i}`))));
    assert.equal(rest.filter(r => r.status === 200).length, 6);
  });
}

test('a reader who hangs up before the writer starts is not charged', async () => {
  const c = client({ env: { DH_TRIAL_PAGES: '2' } });
  await c.call({ task: 'peek', input: { title: 'A', path: [], passage: 'p', target: 'Krill' } });
  const ac = new AbortController(); ac.abort();
  const r = await c.call(pageBody('Gone'), {}, { signal: ac.signal }).catch(() => null);
  assert.ok(r === null || r.status === 499);
  assert.equal((await c.call(pageBody('Here'))).headers.get('x-dh-trial'), 'pages=1; extras=49');
});

test('a page that fails before its first word costs nothing', async () => {
  const c = client({ env: { DH_TRIAL_PAGES: '2' } });
  const r = await c.call(pageBody('Moths [fail-early]'));
  assert.equal(r.status, 502); assert.equal(r.headers.get('x-dh-trial'), 'pages=2; extras=50');
  assert.equal((await c.call(pageBody('Moths'))).headers.get('x-dh-trial'), 'pages=1; extras=50');
});

test('a reader who leaves mid-page stops the writer, and the fragment is never cached', async () => {
  const store = memoryStore(); const logs = [];
  const ac = new AbortController();
  const req = new Request('https://dorkhub.test/api/write', { method: 'POST', signal: ac.signal, headers: { 'content-type': 'application/json', origin: 'https://dorkhub.test', ...KEY }, body: JSON.stringify(pageBody('Moths [slow]')) });
  const res = await handleWrite(req, { env: { DH_MOCK: '1', VERCEL_ENV: 'development' }, store, textCache: true, log: l => logs.push(l) });
  const reader = /** @type {ReadableStream<Uint8Array>} */ (res.body).getReader();
  await reader.read(); ac.abort();
  await reader.read().catch(() => {});
  await new Promise(r => setTimeout(r, 150));
  assert.equal([...store.m.keys()].some(k => /^text/.test(k)), false);
  assert.equal(logs.at(-1).end, 'cancelled');
});

test('a garbled answer is never cached for the next reader', async () => {
  const c = client();
  const around = { task: 'around', input: { title: 'Moths [garbled]', path: [], read: [] } };
  await c.call(around);
  assert.equal(cachedTexts(c.store).length, 0);
  assert.equal(c.logs.at(-1).cached, false);
  await c.call({ task: 'around', input: { title: 'Moths', path: [], read: [] } });
  assert.equal(c.logs.at(-1).cached, true);
});

test('a reader key bypasses the trial and is never logged', async () => {
  const c = client({ env: { DH_TRIAL_PAGES: '0' } });
  assert.equal((await c.call(pageBody('A'))).status, 402);
  const r = await c.call(pageBody('A'), KEY);
  assert.equal(r.status, 200); assert.equal(r.headers.get('x-dh-trial'), null); assert.equal(r.headers.get('set-cookie'), null);
  assert.equal(c.logs.at(-1).model, 'anthropic/claude-sonnet-5.5');
  assert.equal(JSON.stringify(c.logs).includes(KEY['x-dh-key']), false);
});

test('quick tools use the provider’s fast model even when pages use another', async () => {
  const c = client();
  await c.call({ task: 'peek', input: { title: 'A', path: [], passage: 'p', target: 'Krill' } }, KEY);
  assert.equal(c.logs.at(-1).model, 'anthropic/claude-haiku-5.5');
});

test('key problems come back as clean status codes', async () => {
  const c = client();
  assert.equal((await c.call(pageBody('A'), { ...KEY, 'x-dh-key': 'sk-ant-bad-000000000' })).status, 401);
  assert.equal((await c.call(pageBody('A'), { ...KEY, 'x-dh-model': 'openai/gpt-6.1-sol' })).status, 400);
  assert.equal((await c.call(pageBody('A'), { 'x-dh-provider': 'openai', 'x-dh-model': 'openai/gpt-6.1-sol', 'x-dh-key': 'sk-proj-0000000000' })).status, 400);
  assert.equal((await c.call(pageBody('A'), { ...KEY, 'x-dh-key': 'short' })).status, 401);
  assert.equal((await c.call({ task: 'check', input: {} })).status, 400);
  assert.equal((await c.call({ task: 'check', input: {} }, KEY)).text, 'OK');
});

test('failures after the first words arrive as a trailer; before them, as a status', async () => {
  const c = client();
  const mid = await c.call(pageBody('Moths [fail-mid]'), KEY);
  assert.equal(mid.status, 200); assert.deepEqual(mid.tail, { error: 'upstream_error' }); assert.ok(mid.text.length > 100);
  const cut = await c.call(pageBody('Moths [cut]'), KEY);
  assert.deepEqual(cut.tail, { truncated: true });
  const early = await c.call(pageBody('Moths [fail-early]'), KEY);
  assert.equal(early.status, 502); assert.deepEqual(early.json(), { error: 'upstream_error' });
});

test('a failed or cut-off answer is never cached', async () => {
  const c = client();
  await c.call(pageBody('Moths [cut]'), KEY);
  assert.equal(cachedTexts(c.store).length, 0);
});

test('the endpoint refuses what it should', async () => {
  const c = client();
  assert.equal((await c.call(null, {}, { method: 'GET' })).status, 405);
  assert.equal((await c.call(pageBody('A'), { origin: 'https://elsewhere.test' })).status, 403);
  assert.equal((await c.call(null, {}, { raw: '{not json' })).status, 400);
  assert.equal((await c.call({ task: 'chat', input: { prompt: 'write my essay' } })).status, 400);
  assert.equal((await c.call({ task: 'toString', input: {} })).status, 400);
  assert.equal((await c.call(null, {}, { raw: JSON.stringify(pageBody('x'.repeat(70000))) })).status, 413);
  assert.equal((await client({ env: { DH_TRIAL_OFF: '1' } }).call(pageBody('A'))).status, 503);
});

test('the mock writer can never answer in production', async () => {
  const request = new Request('https://dorkhub.com/api/write', { method: 'POST' });
  const w = await chooseWriter({ request, env: { DH_MOCK: '1', VERCEL_ENV: 'production' }, task: TASKS.page, taskName: 'page', input: {} });
  assert.notEqual(/** @type {any} */ (w.model).provider, 'dorkhub-mock');
  assert.equal(w.id, 'anthropic/claude-haiku-5.5');
  assert.equal(mockAllowed({ DH_MOCK: '1' }, request), false, 'no VERCEL_ENV on a real host still means no mock');
  assert.equal(mockAllowed({ DH_MOCK: '1', VERCEL: '1' }, new Request('http://localhost:3000/api/write')), false);
  assert.equal(mockAllowed({ DH_MOCK: '1' }, new Request('http://localhost:3000/api/write')), true);
  assert.equal(mockAllowed({ DH_MOCK: '1', VERCEL_ENV: 'preview' }, request), true);
  assert.equal(mockAllowed({ DH_MOCK: '1' }, new Request('http://192.168.1.20:3000/api/write')), true, 'a phone on the same LAN');
  assert.equal(mockAllowed({ DH_MOCK: '1' }, new Request('http://203.0.113.5/api/write')), false);
});

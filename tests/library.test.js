// The library: one contract for every layer that keeps text, and the endpoint reading and keeping through it.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cacheLayer, memoryLayer, redisLayer, stamped, unstamped } from '../lib/library.js';
import { client, memoryStore, pageBody } from './helpers.js';

/* Upstash's REST pipeline, as far as the library uses it: one GET or SET at a time, a bearer token. */
function fakeRedis() {
  /** @type {Map<string, string>} */ const m = new Map(); /** @type {any[]} */ const calls = [];
  /** @type {any} */ const fetchFn = async (/** @type {string} */ url, /** @type {any} */ init) => {
    calls.push({ url, auth: init.headers.authorization });
    const [[cmd, key, value]] = JSON.parse(init.body);
    const result = cmd === 'SET' ? (m.set(key, value), 'OK') : cmd === 'GET' ? (m.get(key) ?? null) : null;
    return new Response(JSON.stringify([{ result }]), { status: 200 });
  };
  return { m, calls, fetchFn };
}
const layers = {
  'runtime cache': () => cacheLayer(memoryStore()),
  'durable (memory)': () => memoryLayer(),
  'durable (redis)': () => redisLayer({ url: 'https://redis.test', token: 't' }, fakeRedis().fetchFn),
};
const meta = { task: 'page', model: 'anthropic/claude-haiku-5.5' };

for (const [name, make] of Object.entries(layers)) {
  test(`${name}: a miss is null, and what is kept comes back exactly`, async () => {
    const l = make();
    assert.equal(await l.get('text-local:a'), null);
    const text = '# Umami :: concept\n> Savoury, in five languages: 旨味, ümami, “umami”.\n---\nA paragraph.\n';
    await l.set('text-local:a', text, meta);
    assert.equal(await l.get('text-local:a'), text);
    assert.equal(await l.get('text-local:b'), null, 'keys are independent');
  });

  test(`${name}: a second keep replaces the first`, async () => {
    const l = make();
    await l.set('k', 'one', meta); await l.set('k', 'two', meta);
    assert.equal(await l.get('k'), 'two');
  });

  test(`${name}: namespaces are part of the key, so preview never reads production`, async () => {
    const l = make();
    await l.set('text-preview:x', 'preview page', meta);
    assert.equal(await l.get('text:x'), null);
  });
}

test('runtime cache: kept for 14 days under the task\'s name, and anything but text is a miss', async () => {
  /** @type {any[]} */ const sets = [];
  const store = { get: async () => ({ not: 'text' }), set: async (/** @type {any[]} */ ...a) => { sets.push(a); } };
  const l = cacheLayer(store);
  assert.equal(await l.get('k'), null);
  await l.set('k', 'text', meta);
  assert.deepEqual(sets, [['k', 'text', { ttl: 14 * 86400, name: 'text-page' }]]);
});

test('with a durable layer, a finished page is kept in both, and a cache miss is served from it and refilled', async () => {
  const durable = memoryLayer();
  const a = client({ durable });
  const first = await a.call(pageBody('Umami'));
  assert.equal(first.status, 200);
  await new Promise(r => setTimeout(r, 10));
  assert.equal(durable.m.size, 1); const [key] = durable.m.keys();
  assert.match(key, /^text-development:page:/, "the page's own key, in this deployment's namespace");
  assert.equal([...a.store.m.keys()].filter(k => /^text-development:/.test(k)).length, 1, 'in the cache too, under the cache key');
  assert.equal(unstamped(/** @type {any} */ (durable.m.get(key)).text, 'nope'), null, 'stamped with the prompt version it was written under');
  assert.ok(/** @type {any} */ (durable.m.get(key)).text.startsWith('dh1 '));
  assert.deepEqual(/** @type {any} */ (durable.m.get(key)).meta, { task: 'page', model: 'anthropic/claude-haiku-5.5' });
  /* another instance: an empty cache, the same durable layer */
  const b = client({ durable, ip: '198.51.100.4' });
  const hit = await b.call(pageBody('Umami'));
  assert.equal(hit.headers.get('x-dh-cache'), 'hit'); assert.equal(hit.text, first.text);
  assert.equal(hit.headers.get('x-dh-trial'), null, 'free, like any repeat');
  assert.deepEqual(b.logs.at(-1), { evt: 'write', task: 'page', model: 'anthropic/claude-haiku-5.5', byok: null, cached: true, durable: true });
  await new Promise(r => setTimeout(r, 10));
  assert.equal([...b.store.m.keys()].filter(k => /^text-development:/.test(k)).length, 1, 'the cache is refilled');
  assert.equal((await b.call({ ...pageBody('Umami'), cachedOnly: true })).headers.get('x-dh-cache'), 'hit', 'a prefetch reads it too');
  assert.equal(b.logs.at(-1).durable, undefined, 'now from the cache');
});

test('with a durable layer, other tasks stay cache-only and a rewrite touches no layer', async () => {
  const durable = memoryLayer();
  const c = client({ durable });
  await c.call({ task: 'peek', input: { title: 'A', path: [], passage: 'p', target: 'Krill' } });
  await new Promise(r => setTimeout(r, 10));
  assert.equal(durable.m.size, 0, 'a peek is never kept durably');
  assert.equal([...c.store.m.keys()].filter(k => /^text/.test(k)).length, 1, 'but is cached');
  /* a rewrite: the durable page is there, and it is neither read nor replaced */
  const b = client({ durable });
  await b.call(pageBody('Umami')); await new Promise(r => setTimeout(r, 10));
  const [key] = durable.m.keys(); const before = durable.m.get(key);
  const fresh = client({ durable });
  const r = await fresh.call({ ...pageBody('Umami'), fresh: true });
  assert.equal(r.headers.get('x-dh-cache'), null);
  await new Promise(r => setTimeout(r, 10));
  assert.equal(durable.m.get(key), before); assert.equal(durable.m.size, 1);
  assert.equal([...fresh.store.m.keys()].filter(k => /^text/.test(k)).length, 0);
});

test('with a durable layer, preview and local pages never meet', async () => {
  const durable = memoryLayer();
  await client({ durable, env: { VERCEL_ENV: 'preview' } }).call(pageBody('Umami'));
  await new Promise(r => setTimeout(r, 10));
  assert.deepEqual([...durable.m.keys()].map(k => k.split(':')[0]), ['text-preview']);
  const local = client({ durable });
  assert.equal((await local.call({ ...pageBody('Umami'), cachedOnly: true })).status, 204);
});

test('a durable layer that fails is logged and never in the way; without a cache it still serves', async () => {
  const broken = { name: 'broken', get: async () => { throw new Error('down'); }, set: async () => { throw new TypeError('read only'); } };
  const c = client({ durable: broken });
  const r = await c.call(pageBody('Umami'));
  assert.equal(r.status, 200);
  await new Promise(r => setTimeout(r, 10));
  assert.ok(c.logs.some(l => l.evt === 'library' && l.what === 'durable-read' && l.error === 'Error: down'));
  assert.ok(c.logs.some(l => l.evt === 'deferred' && l.what === 'durable-write' && l.error === 'TypeError: read only'));
  assert.equal(c.logs.find(l => l.end === 'ok')?.cached, true, 'the cache still kept it');
  const durable = memoryLayer();
  const noCache = client({ durable, textCache: false });
  await noCache.call(pageBody('Umami')); await new Promise(r => setTimeout(r, 10));
  assert.equal(durable.m.size, 1);
  const again = await client({ durable, textCache: false }).call(pageBody('Umami'));
  assert.equal(again.headers.get('x-dh-cache'), 'hit');
});

/* A durable page is kept under the page's own key with its prompt version beside it, so a new prompt
   neither serves the old page nor leaves it lying there: the page it writes takes the old one's place. */
test('a new prompt version does not serve an older durable page, and replaces it in place', async () => {
  const durable = memoryLayer();
  const old = client({ durable, promptVersion: 'v-old' });
  const first = await old.call(pageBody('Umami')); assert.equal(first.status, 200);
  await new Promise(r => setTimeout(r, 10));
  assert.equal(durable.m.size, 1); const [key] = durable.m.keys();
  assert.equal(unstamped(/** @type {any} */ (durable.m.get(key)).text, 'v-old'), first.text);
  const next = client({ durable, promptVersion: 'v-new', ip: '198.51.100.9' });
  assert.equal((await next.call({ ...pageBody('Umami'), cachedOnly: true })).status, 204, 'the old page is not served');
  const second = await next.call(pageBody('Umami')); assert.equal(second.status, 200); assert.equal(second.headers.get('x-dh-cache'), null);
  await new Promise(r => setTimeout(r, 10));
  assert.equal(durable.m.size, 1, 'one page per topic, whatever the prompt');
  assert.equal(unstamped(/** @type {any} */ (durable.m.get(key)).text, 'v-new'), second.text);
  assert.equal(unstamped(/** @type {any} */ (durable.m.get(key)).text, 'v-old'), null);
});

test('the stamp: only a page written under the same version comes back, and anything else is a miss', () => {
  assert.equal(unstamped(stamped('2026-10-19-v3.1', '# A :: thing\nbody'), '2026-10-19-v3.1'), '# A :: thing\nbody');
  assert.equal(unstamped(stamped('a', 'x'), 'b'), null);
  for (const v of [null, '', 'no stamp', 'dh1 a', 'dh1 a\n']) assert.equal(unstamped(v, 'a'), null);
});

test('redis: one authorised call per read or write, and a failure is an error', async () => {
  const r = fakeRedis(); const l = redisLayer({ url: 'https://redis.test', token: 'secret' }, r.fetchFn);
  await l.set('k', 'page', { task: 'page', model: 'm' }); assert.equal(await l.get('k'), 'page');
  assert.deepEqual(r.calls, [{ url: 'https://redis.test/pipeline', auth: 'Bearer secret' }, { url: 'https://redis.test/pipeline', auth: 'Bearer secret' }]);
  /** @type {any} */ const down = async () => new Response('no', { status: 500 });
  await assert.rejects(redisLayer({ url: 'https://redis.test', token: 't' }, down).get('k'), /redis 500/);
  /** @type {any} */ const refused = async () => new Response(JSON.stringify([{ error: 'WRONGPASS' }]), { status: 200 });
  await assert.rejects(redisLayer({ url: 'https://redis.test', token: 't' }, refused).set('k', 'v', { task: 'page', model: 'm' }), /WRONGPASS/);
});

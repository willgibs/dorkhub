import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cacheCounters, redisCounters } from '../lib/counters.js';
import { networksOf, peek, readCookie, refund, reserve, trialConfig, trialScopes } from '../lib/trial.js';
import { fakeUpstash, memoryStore } from './helpers.js';

const cfg = trialConfig({ DH_TRIAL_PAGES: '3', DH_TRIAL_EXTRAS: '5', DH_TRIAL_IP_FACTOR: '2', DH_TRIAL_WINDOW_DAYS: '30' });
const backends = {
  'runtime cache': () => cacheCounters(memoryStore()),
  redis: () => redisCounters({ url: 'https://fake.upstash.io', token: 't' }, fakeUpstash().fetchFn),
};

for (const [name, make] of Object.entries(backends)) {
  test(`${name}: devices spend their own pages, and a network caps cleared cookies`, async () => {
    const counters = make();
    const a = trialScopes({ deviceId: 'device-a-0000000000', ip: '198.51.100.4', salt: 's' });
    assert.deepEqual(await peek(counters, a, cfg), { pages: 3, extras: 5 });
    assert.deepEqual(await reserve(counters, a, 'pages', cfg), { ok: true, left: 2 });
    await reserve(counters, a, 'pages', cfg); await reserve(counters, a, 'pages', cfg);
    assert.deepEqual(await reserve(counters, a, 'pages', cfg), { ok: false, left: 0 });
    assert.deepEqual(await peek(counters, a, cfg), { pages: 0, extras: 5 });
    // A fresh cookie on the same network only gets what the network has left (3 x 2 = 6).
    const b = trialScopes({ deviceId: 'device-b-0000000000', ip: '198.51.100.4', salt: 's' });
    for (let i = 0; i < 3; i++) assert.equal((await reserve(counters, b, 'pages', cfg)).ok, true);
    const c = trialScopes({ deviceId: 'device-c-0000000000', ip: '198.51.100.4', salt: 's' });
    assert.equal((await reserve(counters, c, 'pages', cfg)).ok, false);
    assert.equal((await peek(counters, c, cfg)).extras, 5);
  });

  test(`${name}: a burst of parallel requests can never overshoot the cap`, async () => {
    const counters = make();
    const s = trialScopes({ deviceId: 'device-d-0000000000', ip: '192.0.2.1', salt: 's' });
    const results = await Promise.all(Array.from({ length: 25 }, () => reserve(counters, s, 'pages', cfg)));
    assert.equal(results.filter(r => r.ok).length, 3);
    assert.deepEqual(await peek(counters, s, cfg), { pages: 0, extras: 5 });
  });

  test(`${name}: a refund gives the unit back and never goes below zero`, async () => {
    const counters = make();
    const s = trialScopes({ deviceId: 'device-e-0000000000', ip: '192.0.2.2', salt: 's' });
    await reserve(counters, s, 'pages', cfg); await refund(counters, s, 'pages'); await refund(counters, s, 'pages');
    assert.equal((await peek(counters, s, cfg)).pages, 3);
  });
}

test('redis: every counter expires with the window, even one recreated by a late increment', async () => {
  let t = Date.UTC(2026, 9, 1); const fake = fakeUpstash(() => t);
  const counters = redisCounters({ url: 'https://fake.upstash.io', token: 't' }, fake.fetchFn);
  const s = trialScopes({ deviceId: 'device-f-0000000000', ip: '192.0.2.3', salt: 's' });
  for (let i = 0; i < 3; i++) await reserve(counters, s, 'pages', cfg);
  assert.equal((await peek(counters, s, cfg)).pages, 0);
  t += 31 * 86400e3;
  assert.equal((await peek(counters, s, cfg)).pages, 3);
  await reserve(counters, s, 'pages', cfg);
  assert.ok([...fake.db.values()].every(e => e.exp != null && e.exp > t));
});

test('a tunnelled IPv6 /48 cannot mint fresh networks', async () => {
  const counters = backends['runtime cache']();
  let ok = 0;
  for (let i = 0; i < 200; i++) {
    const s = trialScopes({ deviceId: `device-${String(i).padStart(12, '0')}`, ip: `2001:db8:abcd:${i.toString(16)}::1`, salt: 's' });
    if ((await reserve(counters, s, 'pages', cfg)).ok) ok++;
  }
  assert.equal(ok, 3 * 2 * 5); // pages x network factor x wide factor
});

test('IPv6 networks are the /64, wide networks the /48', () => {
  assert.equal(networksOf('2001:db8:aaaa:bbbb:1:2:3:4').net, networksOf('2001:db8:aaaa:bbbb:ffff::9').net);
  assert.notEqual(networksOf('2001:db8:aaaa:bbbb::1').net, networksOf('2001:db8:aaaa:cccc::1').net);
  assert.equal(networksOf('2001:db8:aaaa:bbbb::1').wide, networksOf('2001:db8:aaaa:cccc::1').wide);
  assert.deepEqual(networksOf('::ffff:192.0.2.9'), { net: '192.0.2.9', wide: null });
  assert.deepEqual(networksOf('192.0.2.9'), { net: '192.0.2.9', wide: null });
  assert.deepEqual(networksOf(''), { net: 'unknown', wide: null });
});

test('reads one cookie out of many', () => {
  const r = new Request('https://x.test', { headers: { cookie: 'a=1; dh_id=abc_DEF-123; b=2' } });
  assert.equal(readCookie(r, 'dh_id'), 'abc_DEF-123');
  assert.equal(readCookie(r, 'missing'), '');
});

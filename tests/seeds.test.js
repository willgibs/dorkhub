// Pages written ahead of time: served free, only for exactly the path they were written for.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { pageInput } from '../lib/prompts.js';
import { seedText } from '../lib/seeds.js';
import { keyOf, parseArticle, splitLink } from '../src/shared/article.js';
import { KEY, memoryStore, pageBody } from './helpers.js';

const FIX = new URL('./seeds-fixture/', import.meta.url);
const DECK = 'In 1932 Australia sent soldiers after emus.';
const door = { title: 'The Great Emu War', deck: DECK };
const page = (/** @type {Record<string, unknown>} */ o) => pageInput({ title: 'The Great Emu War', depth: 0, path: [], ...o });

test('a door and the pages one click off it are served for the default voice', async () => {
  assert.match(await seedText(page({}), FIX) || '', /A door page/);
  assert.match(await seedText(page({ title: 'the great emu war' }), FIX) || '', /A door page/, 'titles match however they are cased');
  assert.match(await seedText(page({ title: 'Lewis gun', depth: 1, path: [door], from: { kind: 'passage', text: 'Two Lewis guns.' } }), FIX) || '', /A child page/);
  assert.match(await seedText(page({ title: 'Lewis gun', depth: 1, path: [door], from: { kind: 'cont', text: 'next' } }), FIX) || '', /A child page/, 'however the reader got there');
  assert.match(await seedText(page({ title: 'How many emus did the army kill?', depth: 1, path: [door], from: { kind: 'question', question: 'How many emus did the army kill?' } }), FIX) || '', /A question child/);
  assert.match(await seedText(page({ title: 'Why is ice slippery?', from: { kind: 'question', question: 'Why is ice slippery?' } }), FIX) || '', /A question door/);
});

test('anything else goes to a live writer', async () => {
  for (const [why, p] of /** @type {[string, any][]} */ ([
    ['another voice', page({ lens: 'story' })],
    ['not a door', page({ title: 'Tulip mania' })],
    ['a question door typed as a topic', page({ title: 'Why is ice slippery?' })],
    ['a child under a door we did not write (its deck differs)', page({ title: 'Lewis gun', depth: 1, path: [{ title: 'The Great Emu War', deck: 'A live writer wrote this one.' }], from: { kind: 'passage', text: 'x' } })],
    ['a child that is not one of ours', page({ title: 'Bren gun', depth: 1, path: [door], from: { kind: 'passage', text: 'x' } })],
    ['a typed question that is not one of ours', page({ title: 'Lewis gun', depth: 1, path: [door], from: { kind: 'question', question: 'Lewis gun' } })],
    ['a connecting page', page({ title: 'Lewis gun', depth: 1, path: [door], from: { kind: 'bridge', other: 'Tulip mania' } })],
    ['two clicks deep', page({ title: 'Lewis gun', depth: 2, path: [door, { title: 'Lewis gun', deck: 'x' }], from: { kind: 'passage', text: 'x' } })],
  ])) assert.equal(await seedText(p, FIX), null, why);
});

test('the endpoint serves a seed free, even while the trial is paused, but never to a key or a rewrite', async () => {
  const { handleWrite } = await import('../lib/write.js');
  const logs = /** @type {any[]} */ ([]);
  const deps = { env: { DH_MOCK: '1', DH_MOCK_FAST: '1', VERCEL_ENV: 'development', DH_TRIAL_OFF: '1' }, store: memoryStore(), textCache: true, log: (/** @type {any} */ l) => logs.push(l), seeds: FIX };
  const req = (/** @type {any} */ body, /** @type {Record<string, string>} */ h = {}) => handleWrite(new Request('https://dorkhub.test/api/write', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://dorkhub.test', 'x-real-ip': '203.0.113.9', ...h }, body: JSON.stringify(body) }), deps);
  const r = await req(pageBody('The Great Emu War'));
  assert.equal(r.status, 200); assert.equal(r.headers.get('x-dh-cache'), 'seed'); assert.match(await r.text(), /A door page/);
  assert.deepEqual(logs.at(-1), { evt: 'write', task: 'page', seed: true }, 'the log never names the page');
  assert.equal((await req({ ...pageBody('The Great Emu War'), fresh: true })).status, 503, 'a rewrite is a live page, and live pages are paused');
  assert.equal((await req(pageBody('Tulip mania'))).status, 503);
  const keyed = await req(pageBody('The Great Emu War'), KEY);
  assert.notEqual(keyed.headers.get('x-dh-cache'), 'seed', 'a reader with a key gets their own writer');
});

/* The real seeds, once there are any: every page parses completely, and every child is linked from its door. */
test('every pre-written page is complete and reachable from its door', async () => {
  const dir = new URL('../lib/seeds/', import.meta.url);
  const idx = JSON.parse(readFileSync(new URL('index.json', dir), 'utf8'));
  for (const [k, d] of Object.entries(/** @type {Record<string, any>} */ (idx.doors))) {
    assert.equal(keyOf(d.title), k, `${d.title}: keyed by its title`);
    const text = readFileSync(new URL(d.file, dir), 'utf8'); const A = parseArticle(text, false);
    assert.ok(A.title && A.deck && A.bridge && A.blocks.filter(b => b.t === 'p').length >= 3 && A.tunnels.length === 5 && A.next && A.questions.length === 3, `${d.title}: a complete page`);
    const linked = new Set([...A.blocks.flatMap(b => [...b.s.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => keyOf(splitLink(m[1])[1]))), ...A.tunnels.map(t => keyOf(t.target)), keyOf(A.next?.target), ...A.questions.map(keyOf)]);
    for (const [ck, c] of Object.entries(/** @type {Record<string, any>} */ (d.children || {}))) {
      assert.equal(keyOf(c.title), ck); assert.ok(existsSync(new URL(c.file, dir)), `${c.title}: file`);
      assert.ok(linked.has(ck), `${d.title} → ${c.title}: the door links it`);
      const C = parseArticle(readFileSync(new URL(c.file, dir), 'utf8'), false);
      assert.ok(C.title && C.blocks.filter(b => b.t === 'p').length >= 3 && C.tunnels.length === 5, `${c.title}: a complete page`);
    }
  }
});

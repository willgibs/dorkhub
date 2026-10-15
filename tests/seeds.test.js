// Pages written ahead of time: served free for their topic, however the reader got there.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { pageInput } from '../lib/prompts.js';
import { seedText } from '../lib/seeds.js';
import { cardsOf, parseArticle } from '../src/shared/article.js';
import { asksQuestion, topicKey } from '../src/shared/world.js';
import { KEY, memoryStore, pageBody } from './helpers.js';

const FIX = new URL('./seeds-fixture/', import.meta.url);
const DOORS = new URL('./seeds-fixture-doors/', import.meta.url);
const door = { title: 'The Great Emu War', deck: 'In 1932 Australia sent soldiers after emus.' };
const page = (/** @type {Record<string, unknown>} */ o) => pageInput({ title: 'The Great Emu War', ...o });

test('a seed is served for its topic in the default voice, wherever the reader came from', async () => {
  for (const dir of [FIX, DOORS]) {
    const at = dir === FIX ? 'flat index' : 'older index of doors';
    assert.match(await seedText(page({}), dir) || '', /A door page/, at);
    assert.match(await seedText(page({ title: 'the great emu war' }), dir) || '', /A door page/, `${at}: titles match however they are cased`);
    assert.match(await seedText(page({ title: 'Lewis gun' }), dir) || '', /A child page/, `${at}: typed on its own`);
    assert.match(await seedText(page({ title: 'Lewis gun', depth: 1, path: [door], from: { kind: 'passage', text: 'Two Lewis guns.' } }), dir) || '', /A child page/, `${at}: from an older browser's path`);
    assert.match(await seedText(page({ title: 'Lewis gun', depth: 4, path: [{ title: 'Something else', deck: 'x' }], from: { kind: 'cont', text: 'next' } }), dir) || '', /A child page/, `${at}: from anywhere`);
    assert.match(await seedText(page({ title: 'How many emus did the army kill?' }), dir) || '', /A question child/, at);
    assert.match(await seedText(page({ title: 'Why is ice slippery?' }), dir) || '', /A question door/, `${at}: a typed question is a question`);
  }
});

test('anything else goes to a live writer', async () => {
  for (const [why, p] of /** @type {[string, any][]} */ ([
    ['another voice', page({ lens: 'story' })],
    ['not one of ours', page({ title: 'Tulip mania' })],
    ['a topic asked as a question', page({ title: 'Lewis gun', from: { kind: 'question', question: 'Lewis gun' } })],
    ['a question seed asked for as a plain topic', { title: 'Why is ice slippery?', lens: 'encyclopedic', q: false, ctx: '', bridge: null }],
    ['a connecting page', page({ title: 'Lewis gun', path: [door], from: { kind: 'bridge', other: 'Tulip mania' } })],
    ['a connecting page in v3', page({ title: 'Lewis gun and Tulip mania', bridge: ['Lewis gun', 'Tulip mania'] })],
    ['a name chosen inside another page, which may mean something else there', page({ title: 'Lewis gun', ctx: 'Firearms of the 1910s' })],
  ])) assert.equal(await seedText(p, FIX), null, why);
});

test('the endpoint serves a seed free, to keys too and while the trial is paused, but never as a rewrite', async () => {
  const { handleWrite } = await import('../lib/write.js');
  const logs = /** @type {any[]} */ ([]);
  const deps = { env: { DH_MOCK: '1', DH_MOCK_FAST: '1', VERCEL_ENV: 'development', DH_TRIAL_OFF: '1' }, store: memoryStore(), textCache: true, log: (/** @type {any} */ l) => logs.push(l), seeds: FIX };
  const req = (/** @type {any} */ body, /** @type {Record<string, string>} */ h = {}) => handleWrite(new Request('https://dorkhub.test/api/write', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://dorkhub.test', 'x-real-ip': '203.0.113.9', ...h }, body: JSON.stringify(body) }), deps);
  const r = await req(pageBody('The Great Emu War'));
  assert.equal(r.status, 200); assert.equal(r.headers.get('x-dh-cache'), 'seed'); assert.match(await r.text(), /A door page/);
  assert.equal(r.headers.get('set-cookie'), null, 'a seed remembers nothing about the reader');
  assert.deepEqual(logs.at(-1), { evt: 'write', task: 'page', seed: true }, 'the log never names the page');
  const keyed = await req(pageBody('The Great Emu War'), KEY);
  assert.equal(keyed.headers.get('x-dh-cache'), 'seed', 'a reader with a key gets our checked page too');
  assert.equal((await req({ ...pageBody('The Great Emu War'), cachedOnly: true })).headers.get('x-dh-cache'), 'seed', 'a prefetch gets it');
  assert.equal((await req({ ...pageBody('The Great Emu War'), fresh: true })).status, 503, 'a rewrite is a live page, and live pages are paused');
  assert.equal((await req(pageBody('Tulip mania'))).status, 503);
});

/* The real seeds: every page is complete, keyed by its topic, and flagged a question exactly when its title asks one. */
test('every pre-written page is complete and reachable by its title', async () => {
  const dir = new URL('../lib/seeds/', import.meta.url);
  const idx = JSON.parse(readFileSync(new URL('index.json', dir), 'utf8'));
  assert.ok(idx.pages && !idx.doors, 'the index is flat');
  for (const [k, p] of Object.entries(/** @type {Record<string, any>} */ (idx.pages))) {
    assert.equal(topicKey(p.title), k, `${p.title}: keyed by its topic`);
    assert.equal(!!p.question, asksQuestion(p.title), `${p.title}: flagged a question exactly when its title asks one`);
    assert.ok(existsSync(new URL(p.file, dir)), `${p.title}: file`);
    const A = parseArticle(readFileSync(new URL(p.file, dir), 'utf8'), false);
    assert.ok(A.title && A.deck && A.blocks.filter(b => b.t === 'p').length >= 3 && cardsOf(A).length >= 5 && A.questions.length === 3, `${p.title}: a complete page`);
    assert.match(await seedText(pageInput({ title: p.title }), dir) || '', /\S/, `${p.title}: served when typed`);
  }
});

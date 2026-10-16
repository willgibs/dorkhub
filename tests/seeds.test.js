// Pages written ahead of time: served free for their topic, however the reader got there.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { CARDS, DOORS as AHEAD, FRONT, THREADS } from '../lib/front.js';
import { placeholderText } from '../lib/placeholder.js';
import { pageInput, pagePrompt } from '../lib/prompts.js';
import { seedOf, seedText } from '../lib/seeds.js';
import { KINDS, cardsOf, parseArticle } from '../src/shared/article.js';
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
    assert.ok(KINDS.includes(A.kind), `${p.title}: names its kind on the title line, so it opens in its colour from anywhere`);
    assert.match(await seedText(pageInput({ title: p.title }), dir) || '', /\S/, `${p.title}: served when typed`);
  }
});

/* The front page's topics: each opens free, its written page or, until that exists, its placeholder. A
   placeholder is a complete page, every link on it opens another page written ahead of time, and it claims
   nothing lib/front.js hasn't checked: no number on it comes from anywhere else. */
test('every topic on the front page opens free: its page, or a placeholder until it is written', async () => {
  const dir = new URL('../lib/seeds/', import.meta.url);
  const written = new Set(Object.keys(JSON.parse(readFileSync(new URL('index.json', dir), 'utf8')).pages));
  const free = new Set(AHEAD.map(d => topicKey(d.t)));
  const checked = [...FRONT.map(t => t.h), ...CARDS.map(c => c.hook || ''), ...THREADS.map(t => t.l)].join(' ');
  const nums = (/** @type {string} */ s) => s.match(/\d[\d,.]*\d|\d/g) || [];
  for (const T of FRONT) {
    const s = await seedOf(pageInput({ title: T.t }), dir);
    assert.ok(s, `${T.t}: opens free`);
    assert.equal(s.placeholder, !written.has(topicKey(T.t)), `${T.t}: a placeholder exactly while its page isn't written`);
    if (!s.placeholder) continue;
    const A = parseArticle(s.text, false);
    assert.ok(A.title === T.t && A.kind === parseArticle(`# x :: ${T.k}\n`, false).kind && A.deck === T.h, `${T.t}: its title, its kind and its hook`);
    assert.ok(A.blocks.filter(b => b.t === 'p').length >= 3 && A.blocks.filter(b => b.t === 'h').length >= 2 && A.notes.length === 2 && A.panels.length === 2, `${T.t}: shaped like a page`);
    const cards = cardsOf(A); assert.equal(cards.length, 6, `${T.t}: six cards`); assert.equal(A.questions.length, 3, `${T.t}: three questions`);
    const links = [...Object.keys(A.gloss), ...cards.map(c => c.target), ...A.blocks.flatMap(b => [...b.s.matchAll(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g)].map(m => m[1]))];
    for (const l of links) assert.ok(free.has(topicKey(l)), `${T.t}: ${l} opens a page written ahead of time`);
    for (const th of THREADS.filter(x => x.a === T.t || x.b === T.t)) assert.ok(s.text.includes(`(${th.l})`), `${T.t}: the thread to ${th.a === T.t ? th.b : th.a}`);
    const counts = [THREADS.length, FRONT.length, 6, THREADS.filter(x => x.a === T.t || x.b === T.t).length].map(String);
    for (const n of nums(s.text)) assert.ok(checked.includes(n) || counts.includes(n), `${T.t}: ${n} comes from nowhere checked`);
    assert.doesNotMatch(s.text, /mock|lorem/i, `${T.t}: no stand-in from the mock writer`);
  }
  assert.equal(placeholderText('Tulip mania'), null, 'only the front page\'s topics have placeholders');
  assert.equal(await seedOf(pageInput({ title: 'Black holes', lens: 'story' }), dir), null, 'in the default voice only');
  assert.equal(await seedOf(pageInput({ title: 'Black holes?' }), dir), null, 'a question about it is its own page');
  assert.equal(await seedOf(pageInput({ title: 'Black holes', ctx: 'Interstellar' }), dir), null, 'nor a name chosen inside another page');
});

/* the brief a writer gets for one of them: its exact prompt, then everything the front page says about it */
test('the brief for a front-page topic carries its prompt, its card\'s claims and every thread, with sources', () => {
  const out = execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/seeds.mjs', import.meta.url)), 'brief', 'Black holes'], { encoding: 'utf8' });
  assert.ok(out.startsWith(pagePrompt(pageInput({ title: 'Black holes' }))), 'the page\'s own prompt first, unchanged');
  for (const c of [FRONT[0].h, FRONT[0].src, /** @type {any} */ (CARDS.find(c => c.t === 'Black holes')).hook, 'Its card\'s drawing shows a black hole with a disk of gas']) assert.ok(out.includes(c), c);
  for (const th of THREADS.filter(x => x.a === 'Black holes' || x.b === 'Black holes')) assert.ok(out.includes(`- [[${th.a === 'Black holes' ? th.b : th.a}]]: ${th.l} (${th.src})`), th.l);
});

test('a written page takes its placeholder\'s place, and the endpoint says which it served', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'dh-seeds-')); mkdirSync(join(tmp, 'black-holes'));
  writeFileSync(join(tmp, 'black-holes', 'index.txt'), '# Black holes :: phenomenon\n> A written page.\n---\nWritten.\n');
  writeFileSync(join(tmp, 'index.json'), JSON.stringify({ pages: { 'black holes': { title: 'Black holes', file: 'black-holes/index.txt' } } }));
  const dir = pathToFileURL(tmp + '/');
  assert.deepEqual(await seedOf(pageInput({ title: 'Black holes' }), dir), { text: '# Black holes :: phenomenon\n> A written page.\n---\nWritten.\n', placeholder: false });
  assert.equal((await seedOf(pageInput({ title: 'Volcanoes' }), dir))?.placeholder, true);
  const { handleWrite } = await import('../lib/write.js');
  const logs = /** @type {any[]} */ ([]);
  const deps = { env: { DH_MOCK: '1', DH_MOCK_FAST: '1', VERCEL_ENV: 'development', DH_TRIAL_OFF: '1' }, store: memoryStore(), textCache: true, log: (/** @type {any} */ l) => logs.push(l), seeds: dir };
  const req = (/** @type {any} */ body) => handleWrite(new Request('https://dorkhub.test/api/write', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://dorkhub.test', 'x-real-ip': '203.0.113.9' }, body: JSON.stringify(body) }), deps);
  const ph = await req(pageBody('Volcanoes'));
  assert.equal(ph.status, 200); assert.equal(ph.headers.get('x-dh-cache'), 'placeholder'); assert.match(await ph.text(), /^# Volcanoes :: phenomenon\n/);
  assert.deepEqual(logs.at(-1), { evt: 'write', task: 'page', seed: true, placeholder: true }, 'the log never names the page');
  assert.equal((await req({ ...pageBody('Volcanoes'), cachedOnly: true })).headers.get('x-dh-cache'), 'placeholder', 'a prefetch gets it');
  assert.equal((await req(pageBody('Black holes'))).headers.get('x-dh-cache'), 'seed', 'the written page, once there is one');
  assert.equal((await req({ ...pageBody('Volcanoes'), fresh: true })).status, 503, 'a rewrite is a live page, and live pages are paused');
});

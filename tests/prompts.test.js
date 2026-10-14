import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadInput, FORMAT, TASKS, pageInput, pagePrompt } from '../lib/prompts.js';
import { PANELS } from '../src/shared/article.js';

const page = (/** @type {Record<string, unknown>} */ o) => pagePrompt(pageInput({ title: 'Tardigrades', depth: 0, path: [], ...o }));

test('a first page on a topic is titled exactly that topic and ends with the format', () => {
  const p = page({});
  assert.match(p, /This is the first page\. The reader chose to start at: "Tardigrades"\./);
  assert.match(p, /Title it exactly "Tardigrades"/);
  assert.match(p, /Level: 0\. This is the first page/);
  assert.match(p, /Voice: Encyclopedic/);
  assert.ok(p.endsWith(FORMAT));
});

test('a first question gets a topic-style title instead', () => {
  const p = page({ title: 'Why is ice slippery?', from: { kind: 'question', question: 'Why is ice slippery?' } });
  assert.match(p, /That is a question: answer it within the page/);
  assert.match(p, /Title the page with a short, topic-style title\./);
});

test('a clicked link carries the path, the passage, and a locked title', () => {
  const p = page({ title: 'Lewis gun', depth: 1, path: [{ title: 'The Great Emu War', deck: 'Australia vs emus, 1932.' }], from: { kind: 'passage', text: 'Soldiers brought a Lewis gun to the wheatbelt.' } });
  assert.match(p, /Their path so far, oldest first:\n0\. The Great Emu War \(Australia vs emus, 1932\.\)/);
  assert.match(p, /Now they are opening: "Lewis gun"/);
  assert.match(p, /They opened it from this passage in "The Great Emu War": "Soldiers brought a Lewis gun/);
  assert.match(p, /Open the ~ line by connecting this page to that exact moment/);
  assert.match(p, /Title it exactly "Lewis gun"/);
  assert.match(p, /Level: 1\. Go past the overview/);
});

test('the next page hears what the last one covered, so it builds on it instead of retelling it', () => {
  const p = page({ title: 'Lewis gun', depth: 1, path: [{ title: 'The Great Emu War', deck: '' }], from: { kind: 'passage', text: 'Two Lewis guns.' }, seen: ['A flock on the move', 'Soldier settlement scheme'] });
  assert.match(p, /The page they just read already covered, in order: A flock on the move; Soldier settlement scheme\. Build on it; never retell what it said\./);
  assert.doesNotMatch(page({}), /already covered/);
  assert.equal(pageInput({ title: 'A', seen: Array.from({ length: 40 }, (_, i) => `S${i}`.repeat(30)) }).seen.length, 24);
});

test('the format never shows a label the writer could copy, and wild branches must name their thread', () => {
  assert.doesNotMatch(FORMAT, /Deck:|wait, really|wonderful place/i);
  assert.match(FORMAT, /its hook names that thread/);
  assert.match(FORMAT, /stock curiosities/);
});

test('v2 format: kinds before the body, the next page before the branches, hooks last, and every panel named', () => {
  const at = (/** @type {string} */ m) => FORMAT.indexOf(`\n${m}\n`);
  const order = ['+++', '---', '>>>', '===', '???', '&&&'].map(at);
  assert.ok(order.every((x, i) => x > 0 && (i === 0 || x > order[i - 1])), `marker order ${order}`);
  assert.match(FORMAT, /"\[\[Topic\]\] :: kind"/);
  for (const t of PANELS) assert.match(FORMAT, new RegExp(`^::: ${t}\\b`, 'm'), t);
  assert.match(FORMAT, /close it with a line ":::"/);
  assert.doesNotMatch(FORMAT, /@ drift|%%%|: Key = /);
});

test('the kind of the clicked link shapes the page, and recent panels ask for variety', () => {
  const p = page({ title: 'Ball lightning', depth: 1, path: [{ title: 'Lightning' }], kind: 'mystery', panels: ['timeline', 'timeline', 'sparkline', 'figures'] });
  assert.match(p, /They followed a link to a mystery: build the page around the puzzle/);
  assert.match(p, /The pages just before this one used these panels: timeline, figures\./);
  const q = pageInput({ title: 'A', kind: 'idea', panels: 'nope' });
  assert.equal(q.kind, 'concept'); assert.deepEqual(q.panels, []);
  assert.equal(pageInput({ title: 'A', kind: 'spaceship' }).kind, '');
  assert.doesNotMatch(page({}), /followed a link to|panels:/);
});

test('continue reading, questions, connecting pages, history and ratings', () => {
  const path = [{ title: 'Voynich manuscript' }, { title: 'Radiocarbon dating' }];
  assert.match(page({ title: 'Bomb pulse', depth: 2, path, from: { kind: 'cont', text: 'Tests broke the clock.' } }), /They pressed "Continue reading" at the end of "Radiocarbon dating".*Reason it was suggested: Tests broke the clock\./s);
  assert.match(page({ title: 'How old is it?', depth: 2, path, from: { kind: 'question', question: 'How old is it?' } }), /They asked this while reading "Radiocarbon dating": "How old is it\?"/);
  const bridge = page({ title: 'X and Y', depth: 2, path, from: { kind: 'bridge', other: 'Tulip mania' } });
  assert.match(bridge, /how "Radiocarbon dating" connects to "Tulip mania"/);
  assert.match(bridge, /Title the page with a short, topic-style title\./);
  const p = page({ title: 'Grid cells', depth: 5, path, others: ['Umami', 'Whale falls'], ratings: [{ title: 'Radiocarbon dating', rating: 'basic' }] });
  assert.match(p, /Other pages they have already read: Umami; Whale falls\./);
  assert.match(p, /On this path they rated: "Radiocarbon dating": too basic, go further\./);
  assert.match(p, /The reader is very deep/);
});

test('inputs are clipped and validated, never trusted', () => {
  const p = pageInput({ title: 'x'.repeat(500), depth: 999, lens: 'pirate', path: Array.from({ length: 200 }, (_, i) => ({ title: `P${i}` })), others: 'nope', ratings: [{ title: 'A', rating: 'meh' }] });
  assert.equal(p.title.length, 160); assert.equal(p.depth, 99); assert.equal(p.lens, 'encyclopedic');
  assert.equal(p.path.length, 99); assert.equal(p.path.at(-1)?.title, 'P199');
  assert.deepEqual(p.others, []); assert.deepEqual(p.ratings, []);
  assert.throws(() => pageInput({ title: '   ' }), BadInput);
  assert.throws(() => pageInput({ title: 'A', from: { kind: 'bridge' } }), BadInput);
  assert.throws(() => TASKS.unfold.input({ title: 'A', paragraph: 'p', mode: 'louder' }), BadInput);
  assert.throws(() => TASKS.quiz.input({ pages: [{ title: 'only one', text: 't' }] }), BadInput);
});

test('a recap hears what each page said, not just its deck', () => {
  const c = TASKS.recap.input({ pages: [{ title: 'A', deck: 'd', text: 'Ivanovsky filtered sap in 1892.' }, { title: 'B', text: 'x'.repeat(900) }] });
  assert.equal(c.pages[1].text.length, 420);
  assert.match(TASKS.recap.prompt(c), /- level 0: A: d\n  What it said: Ivanovsky filtered sap in 1892\./);
});

test('small tasks name the page and the path', () => {
  const c = TASKS.peek.input({ title: 'Bomb pulse', path: [{ title: 'Voynich manuscript' }], passage: 'p', target: 'Carbon-14' });
  const p = TASKS.peek.prompt(c);
  assert.match(p, /The reader is on the page "Bomb pulse" of Dorkhub.*Their path so far: Voynich manuscript → Bomb pulse\./);
  assert.match(p, /quick peek at "Carbon-14"/);
  assert.match(TASKS.unfold.prompt(TASKS.unfold.input({ title: 'A', paragraph: 'Para.', mode: 'counter' })), /strongest counterpoint/);
  assert.match(TASKS.doubt.prompt(TASKS.doubt.input({ page: 'line one\nline two' })), /PAGE:\nline one\nline two$/);
  assert.equal(TASKS.quiz.cacheable, false);
  assert.equal(TASKS.check.byokOnly, true);
});

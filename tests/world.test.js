// When two page requests are the same page: exact repeats only, nothing clever about meaning.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pageInput } from '../lib/prompts.js';
import { asksQuestion, pageId, topicKey } from '../src/shared/world.js';

const id = (/** @type {Record<string, unknown>} */ o) => pageId(pageInput(o));

test('a topic is the same topic after trivial cleanup, and only then', () => {
  for (const t of ['Black holes', 'black holes', 'The Black Holes', '  Black   holes ', 'Black-holes', 'black holes!']) assert.equal(topicKey(t), 'black holes', t);
  assert.equal(topicKey('Café'), topicKey('cafe'));
  for (const [a, b] of [['Whale', 'Whales'], ['Whales', 'Wales'], ['Whales', 'Blue whale'], ['Mercury', 'Mercury (planet)']]) assert.notEqual(topicKey(a), topicKey(b), `${a} / ${b}`);
});

test('scripts the Latin key cannot read still have a key of their own', () => {
  assert.equal(topicKey('Μαύρη τρύπα'), 'μαύρη τρύπα');
  assert.equal(topicKey('ブラックホール'), 'ブラックホール');
  assert.notEqual(topicKey('ブラックホール'), topicKey('白色矮星'));
  assert.equal(topicKey(''), '');
});

test('what makes a page that page: topic, voice, question, sense and pair', () => {
  assert.equal(id({ title: 'Black holes' }), id({ title: 'black holes', depth: 4, path: [{ title: 'Stars' }], from: { kind: 'passage', text: 't' } }), 'the path never matters');
  assert.notEqual(id({ title: 'Black holes' }), id({ title: 'Black holes', lens: 'story' }), 'voice');
  assert.notEqual(id({ title: 'Black holes' }), id({ title: 'Black holes', q: true }), 'a question is its own page');
  assert.equal(id({ title: 'Why is ice slippery?' }), id({ title: 'why is ice slippery' }), 'a question is a question with or without its mark');
  assert.notEqual(id({ title: 'Atlantis' }), id({ title: 'Atlantis', ctx: 'Space Shuttle' }), 'a name chosen inside another page');
  assert.equal(id({ title: 'Atlantis', ctx: 'Space Shuttle' }), id({ title: 'atlantis', ctx: 'The space shuttle' }));
  assert.ok(asksQuestion('how do magnets work') && !asksQuestion('Magnets'));
});

test('a connecting page is one page whichever side the reader starts from', () => {
  const ab = id({ title: 'Tulip mania and Radiocarbon dating', bridge: ['Tulip mania', 'Radiocarbon dating'] });
  assert.equal(ab, id({ title: 'whatever it was called', bridge: ['radiocarbon dating', 'The Tulip Mania'] }));
  assert.equal(ab, id({ title: 'x', path: [{ title: 'Radiocarbon dating' }], from: { kind: 'bridge', other: 'Tulip mania' } }));
  assert.notEqual(ab, id({ title: 'Tulip mania' }));
  assert.notEqual(ab, id({ title: 'x', bridge: ['Tulip mania', 'Radiocarbon dating'], lens: 'story' }));
});

/* ---------- links ---------- */
import { addStep, migrateHoles, parseRoute, routeOf, slugOf, textsToDrop, titleOfSlug, TRAIL_GAP } from '../src/shared/world.js';

test('a topic lives at its key with hyphens, and the address reads back as the same page', () => {
  assert.equal(routeOf({ title: 'Black holes' }), '/black-holes');
  assert.equal(routeOf({ title: 'The Great Emu War' }), '/great-emu-war');
  assert.equal(routeOf({ title: "Rubik's Cube" }), '/rubiks-cube');
  assert.equal(routeOf({ title: 'Black holes', lens: 'story' }), '/black-holes?v=story');
  assert.equal(routeOf({ title: 'Atlantis', ctx: 'Space Shuttle' }), '/atlantis?in=space-shuttle');
  assert.equal(routeOf({ title: 'Why is ice slippery?', q: true }), '/why-is-ice-slippery', 'a question that says so needs no flag');
  assert.equal(routeOf({ title: 'Ice, slippery?', q: true }), '/ice-slippery?q=1');
  assert.equal(routeOf({ title: 'x', bridge: ['Tulip mania', 'Radiocarbon dating'] }), '/connect/tulip-mania/radiocarbon-dating');
  assert.equal(routeOf({ title: 'World' }), '/world-', 'names the site uses get a trailing hyphen');
  assert.equal(routeOf({ title: 'ブラックホール' }), `/${encodeURIComponent('ブラックホール')}`);
  for (const p of [{ title: 'Black holes' }, { title: "Rubik's Cube" }, { title: 'Atlantis', ctx: 'Space Shuttle', lens: 'kid' }, { title: 'Why is ice slippery?', q: true }, { title: 'Ice, slippery?', q: true }, { title: 'x', bridge: ['Tulip mania', 'Radiocarbon dating'] }, { title: 'World' }, { title: 'Connect' }, { title: 'ブラックホール' }]) {
    const url = new URL(routeOf(p), 'https://dorkhub.com'); const r = parseRoute(url.pathname, url.search);
    assert.equal(r.view, 'page', JSON.stringify(p));
    assert.equal(pageId(/** @type {any} */ (r).input), pageId(pageInput(p)), `${JSON.stringify(p)} → ${url.pathname}${url.search}`);
  }
});

test('addresses that are not pages', () => {
  assert.deepEqual(parseRoute('/'), { view: 'home' });
  assert.deepEqual(parseRoute('/world'), { view: 'world' });
  assert.deepEqual(parseRoute('/a/b'), { view: 'none' });
  assert.deepEqual(parseRoute('/connect/a'), { view: 'none' });
  assert.equal(titleOfSlug('great-emu-war'), 'Great emu war');
  assert.equal(slugOf('  Black   Holes! '), 'black-holes');
});

/* ---------- trails ---------- */
test('a trail is one sitting: it starts from the front page or after half an hour away', () => {
  /** @type {any[]} */ const trails = []; const t0 = 1_000_000;
  addStep(trails, 'a', { at: t0, via: 'start' });
  addStep(trails, 'b', { at: t0 + 60e3, from: 'a', via: 'link' });
  addStep(trails, 'b', { at: t0 + 90e3, from: 'a', via: 'link' });
  assert.equal(trails.length, 1); assert.deepEqual(trails[0].steps.map((/** @type {any} */ s) => s[0]), ['a', 'b'], 'the same page twice in a row is one step');
  addStep(trails, 'c', { at: t0 + 90e3 + TRAIL_GAP + 1, from: 'b', via: 'link' });
  assert.equal(trails.length, 2, 'half an hour away starts a new trail');
  addStep(trails, 'd', { at: t0 + 90e3 + TRAIL_GAP + 2, via: 'start' });
  assert.equal(trails.length, 3, 'so does the front page');
  for (let i = 0; i < 200; i++) addStep(trails, `p${i}`, { at: t0 + 2 * TRAIL_GAP + i, via: 'link' });
  assert.ok(trails.every((/** @type {any} */ t) => t.steps.length <= 120));
  for (let i = 0; i < 40; i++) addStep(trails, `s${i}`, { at: t0 + 3 * TRAIL_GAP + i, via: 'start' });
  assert.equal(trails.length, 30);
});

/* ---------- moving in from rabbit holes ---------- */
const OLD_PAGE = (/** @type {string} */ t, kind = 'creature') => `# ${t} :: ${kind}\n> Deck of ${t}.\n---\nA paragraph.\n`;
const OLD = {
  settings: { lens: 'encyclopedic' },
  warrens: [
    { id: 'w1', created: 100, updated: 500, seenAt: 900, root: 'n1', current: 'n3', order: ['n1', 'n2', 'n3', 'n4'], nodes: {
      n1: { id: 'n1', title: 'Water bears', depth: 0, parent: null, from: null, status: 'done', text: OLD_PAGE('Water bears'), created: 100 },
      n2: { id: 'n2', title: 'Cryptobiosis', depth: 1, parent: 'n1', from: { text: 'x' }, status: 'done', text: OLD_PAGE('Cryptobiosis', 'mechanism'), created: 200, reaction: 'wow', seed: { kind: 'mechanism', gloss: 'Life on pause' } },
      n3: { id: 'n3', title: 'Ice friction', depth: 2, parent: 'n2', from: { question: 'Why is ice slippery?' }, status: 'done', text: OLD_PAGE('Ice friction', 'mystery'), created: 300 },
      n4: { id: 'n4', title: 'Unfinished', depth: 3, parent: 'n3', from: { text: 'y' }, status: 'error', text: '', created: 400 },
    } },
    { id: 'w2', created: 1000, updated: 1200, root: 'm1', current: 'm2', order: ['m1', 'm2', 'm3'], nodes: {
      m1: { id: 'm1', title: 'Tardigrades', depth: 0, parent: null, from: null, status: 'done', text: OLD_PAGE('Tardigrades'), created: 1000 },
      m2: { id: 'm2', title: 'Water bears', depth: 1, parent: 'm1', from: { text: 'z' }, status: 'done', text: OLD_PAGE('Water bears') + 'Newer.\n', created: 1100 },
      m3: { id: 'm3', title: 'Tardigrades and Cryptobiosis', depth: 2, parent: 'm2', from: { bridge: 'zz', bridgeTitle: 'Cryptobiosis' }, status: 'done', text: OLD_PAGE('A bridge'), created: 1150 },
    } },
    { broken: true }, null,
  ],
};

test('rabbit holes become pages and trails, and every old address finds its page', () => {
  const m = migrateHoles(OLD);
  const wb = pageId({ title: 'Water bears' });
  assert.ok(m.pages[wb]); assert.match(m.pages[wb].text, /Newer/, 'the newest text wins');
  assert.equal(m.pages[wb].first, 100, 'the earliest first visit is kept');
  assert.equal(m.pages[pageId({ title: 'Cryptobiosis' })].saved, 200, 'mind-blown becomes saved');
  assert.equal(m.pages[pageId({ title: 'Cryptobiosis' })].kind, 'mechanism');
  assert.ok(m.pages[pageId({ title: 'Why is ice slippery?', q: true })], 'a question page keeps its question as its identity');
  assert.ok(m.pages[pageId({ bridge: ['Water bears', 'Cryptobiosis'] })], 'a connecting page keeps its pair');
  assert.equal(Object.keys(m.pages).length, 5, 'pages without text are not pages yet');
  assert.deepEqual(m.trails.map(t => t.id), ['w2', 'w1'], 'the most recent trail first');
  assert.deepEqual(m.trails[1].steps.map(s => s[3]), ['start', 'link', 'question']);
  assert.equal(m.trails[1].steps[1][2], wb, 'each step remembers where it came from');
  assert.equal(m.legacy.w1.n2, pageId({ title: 'Cryptobiosis' }));
  assert.equal(m.current, wb, 'the page open in the most recently read rabbit hole');
  assert.deepEqual(migrateHoles(null), { pages: {}, trails: [], legacy: {}, current: '' });
  assert.deepEqual(migrateHoles({ warrens: 'nope' }).pages, {});
});

test('when the browser is full, the oldest unsaved texts go first, never the page being read', () => {
  /** @type {Record<string, any>} */ const pages = {};
  for (let i = 0; i < 10; i++) pages[`p${i}`] = { id: `p${i}`, text: 'x', last: i, saved: i === 1 ? 5 : 0 };
  pages.none = { id: 'none', text: null, last: 0 };
  assert.deepEqual(textsToDrop(pages, { keep: 6, protect: ['p0'] }).sort(), ['p2', 'p3']);
  assert.deepEqual(textsToDrop(pages, { keep: 100 }), []);
});

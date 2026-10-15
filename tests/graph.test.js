// Your world as data and physics: what is drawn, within caps, and a layout that settles.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildGraph, createSim, fitView, isHot, localGraph, nodeKeyOf, tick } from '../src/shared/graph.js';
import { pageId, topicKey } from '../src/shared/world.js';

/** A read page with links: [title, kind][]. @param {string} title @param {[string, string][]} links @param {number} last */
const page = (title, links = [], last = 1, extra = {}) => {
  const req = { title, lens: 'encyclopedic', q: false, ctx: '', bridge: null };
  return { id: pageId(req), req, title, status: 'done', text: 'x', kind: 'concept', last, first: last, links: links.map(([t, k]) => [topicKey(t), t, k, `${t} hook`]), ...extra };
};
/** @param {any[]} list */
const byId = list => Object.fromEntries(list.map(p => [p.id, p]));

test('read topics, the unread topics they point at, and the links and moves between them', () => {
  const a = page('Volcanoes', [['Pompeii', 'place'], ['Magma', 'thing'], ['Diamonds', 'thing']], 3);
  const b = page('Pompeii', [['Volcanoes', 'phenomenon'], ['Vesuvius', 'place'], ['Magma', 'thing']], 5);
  const story = { ...page('Volcanoes', [], 9), id: pageId({ title: 'Volcanoes', lens: 'story' }), req: { title: 'Volcanoes', lens: 'story', q: false, ctx: '', bridge: null } };
  const failed = { ...page('Atlantis', [], 7), status: 'error' };
  const g = buildGraph(byId([a, b, story, failed]), [{ steps: [[a.id, 1, null, 'start'], [b.id, 2, a.id, 'link']] }], { current: b.id });
  const keys = g.nodes.map(n => n.key);
  assert.deepEqual(g.nodes.filter(n => n.read).map(n => n.key).sort(), ['pompeii', 'volcanoes'], 'one node per topic, in any voice; nothing unread is "read"');
  assert.equal(g.nodes.find(n => n.key === 'volcanoes')?.pid, story.id, 'a topic opens at its latest page');
  assert.ok(!keys.includes('atlantis'), 'a page that never came through is not in your world');
  const magma = g.nodes.find(n => n.key === 'magma'); assert.equal(magma?.read, false); assert.equal(magma?.count, 2); assert.equal(magma?.hook, 'Magma hook');
  const edge = (/** @type {string} */ x, /** @type {string} */ y) => g.edges.find(e => [g.nodes[e.a].key, g.nodes[e.b].key].sort().join() === [x, y].sort().join());
  assert.ok(edge('volcanoes', 'pompeii')?.move, 'the move you made rides on the link you used');
  assert.ok(edge('volcanoes', 'magma')?.unread);
  assert.equal(g.edges.filter(e => [g.nodes[e.a].key, g.nodes[e.b].key].includes('magma')).length, 2);
  assert.ok(g.nodes.find(n => n.key === 'pompeii')?.cur);
});

test('caps: the most recent read topics, the most linked unread ones, and always the current page’s links', () => {
  const pages = []; for (let i = 0; i < 30; i++) pages.push(page(`Topic ${i}`, [['Shared', 'thing'], [`Only ${i}`, 'thing']], i));
  const cur = page('Current', [['Lonely', 'thing']], 100); pages.push(cur);
  const g = buildGraph(byId(pages), [], { current: cur.id, maxRead: 10, maxUnread: 2 });
  assert.equal(g.nodes.filter(n => n.read).length, 10);
  assert.ok(g.nodes.find(n => n.key === 'current'), 'the most recent are kept');
  assert.ok(!g.nodes.find(n => n.key === 'topic 0'), 'the oldest go');
  const unread = g.nodes.filter(n => !n.read).map(n => n.key);
  assert.ok(unread.includes('lonely'), 'the current page’s own links always show');
  assert.ok(unread.includes('shared'), 'then the most linked');
  assert.ok(unread.length <= 3);
});

test('a connecting page is a place between its pair', () => {
  const c = { ...page('Tulip mania and Radiocarbon dating'), req: { title: 'x', lens: 'encyclopedic', q: false, ctx: '', bridge: ['Tulip mania', 'Radiocarbon dating'] } };
  assert.equal(nodeKeyOf(c), 'c:radiocarbon dating|tulip mania');
});

test('the small map beside a page: its neighbourhood first, within the cap', () => {
  const pages = [page('Hub', [['Spoke 1', 'thing'], ['Spoke 2', 'thing'], ['Far', 'thing']], 50)];
  for (let i = 0; i < 80; i++) pages.push(page(`Other ${i}`, [[`Leaf ${i}`, 'thing']], i));
  pages.push(page('Spoke 1', [['Hub', 'thing'], ['Deeper', 'thing']], 40));
  const g = buildGraph(byId(pages), []);
  const local = localGraph(g, 'hub', 30);
  const keys = local.nodes.map(n => n.key);
  assert.ok(local.nodes.length <= 30);
  for (const k of ['hub', 'spoke 1', 'spoke 2', 'far', 'deeper']) assert.ok(keys.includes(k), k);
  assert.ok(local.edges.every(e => e.a < local.nodes.length && e.b < local.nodes.length));
});

/** A world of n read topics in clusters, each linking its neighbours and a few unread ones. @param {number} n */
function world(n) {
  const pages = [];
  for (let i = 0; i < n; i++) {
    const links = /** @type {[string, string][]} */ ([[`Topic ${(i + 1) % n}`, 'thing'], [`Topic ${(i + 7) % n}`, 'thing'], [`Unread ${i % 300}`, 'thing']]);
    pages.push(page(`Topic ${i}`, links, i));
  }
  return buildGraph(byId(pages), []);
}

test('the layout settles: no runaway values, linked topics closer than strangers, and then it stops', () => {
  const g = world(60); const sim = createSim(g);
  assert.ok(isHot(sim)); let ticks = 0;
  while (isHot(sim) && ticks < 2000) { tick(sim); ticks++; }
  assert.ok(ticks < 400, `cools in ${ticks} ticks`); assert.ok(!isHot(sim));
  for (const n of g.nodes) assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y) && Math.abs(n.x) < 5000 && Math.abs(n.y) < 5000, n.key);
  const d = (/** @type {any} */ a, /** @type {any} */ b) => Math.hypot(a.x - b.x, a.y - b.y);
  const linked = g.edges.reduce((s, e) => s + d(g.nodes[e.a], g.nodes[e.b]), 0) / g.edges.length;
  let all = 0, pairs = 0; for (let i = 0; i < g.nodes.length; i += 3) for (let j = i + 1; j < g.nodes.length; j += 5) { all += d(g.nodes[i], g.nodes[j]); pairs++; }
  assert.ok(linked < all / pairs, `linked ${linked.toFixed(0)} < average ${(all / pairs).toFixed(0)}`);
  const again = world(60); const s2 = createSim(again); tick(s2, ticks);
  assert.deepEqual(again.nodes.map(n => Math.round(n.x)), g.nodes.map(n => Math.round(n.x)), 'the same world settles the same way');
});

test('saved places stay put, and a new topic starts beside its neighbour', () => {
  const g = world(12); const s = createSim(g); tick(s, 300);
  const pos = Object.fromEntries(g.nodes.map(n => [n.key, /** @type {[number, number]} */ ([n.x, n.y])]));
  const g2 = world(13); const s2 = createSim(g2, { pos, alpha: 0 });
  const known = g2.nodes.find(n => n.key === 'topic 3'); assert.deepEqual([known?.x, known?.y], pos['topic 3']);
  const fresh = g2.nodes.find(n => n.key === 'topic 12'); assert.ok(fresh && Number.isFinite(fresh.x));
  assert.equal(isHot(s2), false);
});

test('a big world stays quick: 500 read and 300 unread topics settle in a few hundred milliseconds', () => {
  const g = world(500); assert.ok(g.nodes.length >= 790, `${g.nodes.length} nodes`);
  const sim = createSim(g); const t0 = performance.now(); tick(sim, 300); const ms = performance.now() - t0;
  assert.ok(ms < 2500, `300 ticks took ${ms.toFixed(0)} ms`);
  assert.ok(g.nodes.every(n => Number.isFinite(n.x)));
});

test('the camera fits what it is asked to show', () => {
  const v = fitView([{ x: -100, y: -50 }, { x: 300, y: 150 }], 800, 400, { pad: 40 });
  assert.equal(v.x, 100); assert.equal(v.y, 50);
  assert.ok(v.k <= (800 - 80) / 400 && v.k <= (400 - 80) / 200 + 1e-9);
  assert.equal(fitView([{ x: 5, y: 5 }], 800, 400).k, 2.2, 'one topic is not zoomed absurdly close');
});

test('a page offers a handful of invitations, and a topic two pages lead to always shows', () => {
  const many = Array.from({ length: 20 }, (_, i) => /** @type {[string, string]} */ ([`Far ${i}`, 'thing']));
  const a = page('Alpha', [...many, ['Shared', 'place']], 2);
  const b = page('Beta', [['Shared', 'place']], 3);
  const g = buildGraph(byId([a, b]), []);
  const unread = g.nodes.filter(n => !n.read).map(n => n.key);
  assert.equal(unread.filter(k => k.startsWith('far')).length, 8, 'the first eight, the page’s own cards first');
  assert.ok(unread.includes('shared'), 'a bridge between two of your pages');
  const lens = new Set(g.edges.filter(e => e.unread).map(e => e.len));
  assert.ok(lens.size > 3, 'invitations hang at their own distances');
});

test('a move remembers the way you went, in the small map too', () => {
  const a = page('Volcanoes', [['Pompeii', 'place']], 3); const b = page('Pompeii', [['Volcanoes', 'phenomenon']], 5);
  const g = buildGraph(byId([a, b]), [{ steps: [[b.id, 1, null, 'start'], [a.id, 2, b.id, 'link']] }]);
  const e = g.edges.find(x => x.move); assert.ok(e && e.from != null);
  assert.equal(g.nodes[/** @type {number} */ (e.from)].key, 'pompeii', 'from Pompeii to Volcanoes');
  const local = localGraph(g, 'volcanoes', 10); const le = local.edges.find(x => x.move);
  assert.equal(local.nodes[/** @type {number} */ (le?.from)].key, 'pompeii');
});

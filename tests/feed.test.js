// The front page's feed: every card says only what its page says, and every page written ahead of
// time has one. src/static/feed.json is made by `node scripts/seeds.mjs feed`; this keeps it honest.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { doorsOf, feedEntry } from '../lib/feed.js';
import { KINDS } from '../src/shared/article.js';
import { topicKey } from '../src/shared/world.js';

const read = (/** @type {string} */ f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const feed = JSON.parse(read('src/static/feed.json'));
const { pages } = JSON.parse(read('lib/seeds/index.json'));
const doors = doorsOf(read('src/app/13-landing.js'));

test('every door on the front page is read from it, title, hook and kind', () => {
  assert.equal(doors.length, 12);
  for (const d of doors) { assert.ok(d.t && d.h.length > 20, d.t); assert.ok(KINDS.includes(d.k), `${d.t}: ${d.k}`); }
});

test('the feed has a card for every page written ahead of time, and says only what the page says', () => {
  const written = doors.filter(d => pages[topicKey(d.t)]);
  assert.deepEqual(feed.topics.map((/** @type {any} */ f) => f.t), written.map(d => d.t), 'one card per written door, in the doors\' order');
  for (const d of written) {
    const f = feed.topics.find((/** @type {any} */ x) => x.t === d.t);
    const { pic, ...card } = f;
    assert.deepEqual(card, feedEntry(d, read(`lib/seeds/${pages[topicKey(d.t)].file}`)), `${d.t}: run node scripts/seeds.mjs feed after changing a page`);
    assert.ok(KINDS.includes(f.k), `${d.t}: a kind the page can colour`);
    assert.equal(f.q.length, 3, `${d.t}: three open questions`); assert.equal(f.cards.length, 6, `${d.t}: six topics to keep exploring`);
    if (pic) { assert.match(pic.src, /^\/api\/picture\?f=/, `${d.t}: the picture comes through our own origin`); assert.ok(pic.w > 0 && pic.h > 0 && pic.license, `${d.t}: sized and licensed`); }
  }
});

test('the feed carries the formats the front page draws: big numbers and myths where the pages have them', () => {
  assert.ok(feed.topics.filter((/** @type {any} */ f) => f.fig).length >= 2, 'big numbers');
  assert.ok(feed.topics.filter((/** @type {any} */ f) => f.myth).length >= 2, 'myths put right');
  assert.ok(feed.topics.every((/** @type {any} */ f) => !f.fig || (f.fig[0].length <= 16 && f.fig[1].length > 10)), 'a big number is short, and says what it counts');
});

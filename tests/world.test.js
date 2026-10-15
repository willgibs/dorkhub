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

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { capFirst, isQuestion, keyOf, parseArticle, plain, titleIsLocked, yearOf } from '../src/shared/article.js';
import { mockModel } from '../lib/mock.js';
import { streamText } from 'ai';

/** A complete page in the real format, from the mock writer. */
async function samplePage(title = 'Tardigrades', extra = {}) {
  const input = { title, depth: 0, lens: 'encyclopedic', path: [], from: null, others: [], ratings: [], ...extra };
  const r = streamText({ model: mockModel({ task: 'page', input, fast: true }), prompt: 'x' });
  return await r.text;
}

test('parses every part of a finished page', async () => {
  const A = parseArticle(await samplePage(), false);
  assert.equal(A.title, 'Tardigrades');
  assert.match(A.deck, /stand-in page/);
  assert.match(A.bridge, /first page/);
  assert.equal(A.drift, 0);
  assert.equal(A.facts.length, 3);
  assert.equal(A.time.length, 3);
  assert.deepEqual(A.time.map(t => t.y), [1404, 1859, 1969]);
  assert.equal(Object.keys(A.gloss).length >= 10, true);
  assert.equal(A.blocks.filter(b => b.t === 'h').length, 3);
  assert.ok(A.notes.length >= 2);
  assert.equal(A.tunnels.length, 5);
  assert.deepEqual(new Set(A.tunnels.map(t => t.dir)), new Set(['deeper', 'sideways', 'wild']));
  assert.ok(A.tunnels.every(t => t.kind));
  assert.ok(A.next && A.next.target);
  assert.equal(A.questions.length, 3);
  assert.equal(A.bodyDone, true);
});

test('streaming text never shows a half-written link or bold run', () => {
  const A = parseArticle('# Moths\n> Deck\n---\nThey navigate by the [[Moon|moon]] and **bright lig', true);
  const body = A.blocks.map(b => b.s).join(' ');
  assert.match(body, /\[\[Moon\|moon\]\]/);
  assert.doesNotMatch(body, /\*\*/);
  const B = parseArticle('# Moths\n---\nThey navigate by [[transverse orient', true);
  assert.doesNotMatch(B.blocks.map(b => b.s).join(' '), /\[\[/);
});

test('the link plan accepts bulleted lines and pre-body blocks do not end the body', () => {
  const A = parseArticle('# T\n+++\n- [[Lewis gun]] :: A machine gun aimed at birds :: thing\n---\nText with [[Lewis gun]].', false);
  assert.equal(A.gloss[keyOf('Lewis gun')].gloss, 'A machine gun aimed at birds');
  assert.equal(A.bodyDone, false);
});

test('a clicked topic keeps its title; questions and connecting pages choose their own', () => {
  assert.equal(titleIsLocked({ title: 'Lewis gun', depth: 1, from: { kind: 'passage' } }), true);
  assert.equal(titleIsLocked({ title: 'Lewis gun', depth: 1, from: { text: 'clicked' } }), true);
  assert.equal(titleIsLocked({ title: 'Why is ice slippery?', depth: 0, from: null }), false);
  assert.equal(titleIsLocked({ title: 'Ice', depth: 2, from: { kind: 'question', question: 'Why?' } }), false);
  assert.equal(titleIsLocked({ title: 'A and B', depth: 2, from: { bridge: 'abc' } }), false);
});

test('small helpers', () => {
  assert.equal(keyOf('The Voynich Manuscript'), 'voynich manuscript');
  assert.equal(keyOf('Café Théâtre’s'), 'cafe theatres');
  assert.equal(isQuestion('how do moths navigate'), true);
  assert.equal(isQuestion('Moth navigation'), false);
  assert.equal(capFirst('lewis gun'), 'Lewis gun');
  assert.equal(plain('A [[shown|Target]] and **bold**'), 'A shown and bold');
  assert.equal(yearOf('300 BCE'), -300);
  assert.equal(yearOf('1950s'), 1950);
});

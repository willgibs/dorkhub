import assert from 'node:assert/strict';
import { test } from 'node:test';
import { capFirst, hookOf, isQuestion, keyOf, panelLines, parseArticle, plain, splitLink, timeOf, titleIsLocked, yearOf } from '../src/shared/article.js';
import { FIXTURES } from './fixtures.js';
import { mockModel, page as mockPage } from '../lib/mock.js';
import { RECORDED } from '../lib/recorded.js';
import { streamText } from 'ai';

/** A complete page in the real format, from the mock writer. */
async function samplePage(title = 'Tardigrades', extra = {}) {
  const input = { title, depth: 0, lens: 'encyclopedic', path: [], from: null, others: [], ratings: [], ...extra };
  const r = streamText({ model: mockModel({ task: 'page', input, pace: 'fast' }), prompt: 'x' });
  return await r.text;
}

test('parses every part of a finished page', async () => {
  const A = parseArticle(await samplePage(), false);
  assert.equal(A.title, 'Tardigrades');
  assert.match(A.deck, /stand-in page/);
  assert.match(A.bridge, /first page/);
  assert.ok(A.panels.length >= 1 && A.panels.length <= 2);
  assert.ok(A.panels.every(p => p.done && p.rows.length && p.at >= 1));
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

test('links point at the planned topic, whichever way round the writer wrote them', () => {
  const A = parseArticle('# Emus\n+++\n[[Gizzard stone]] :: grinds seeds :: mechanism\n[[Thylacine]] :: a lost marsupial :: creature\n[[Emu]] :: a fast bird :: creature\n---\nPebbles sit in a muscular [[Gizzard stone|gizzard]]. Bounties paid for [[thylacines]], and [[emus|Emu]] ran, past an [[unplanned topic]].', false);
  assert.equal(A.blocks[0].s, 'Pebbles sit in a muscular [[gizzard|Gizzard stone]]. Bounties paid for [[thylacines|Thylacine]], and [[emus|Emu]] ran, past an [[unplanned topic]].');
  assert.equal(plain(A.blocks[0].s), 'Pebbles sit in a muscular gizzard. Bounties paid for thylacines, and emus ran, past an unplanned topic.');
});

test('a copied "Deck:" label never reaches the page', () => {
  assert.equal(parseArticle('# Ice\n> Deck: Ice is slippery.', false).deck, 'Ice is slippery.');
  assert.equal(parseArticle('# Ice\n> **Deck:** Ice is slippery.', false).deck, 'Ice is slippery.');
  assert.equal(parseArticle('# Ice\n> Dec', true).deck, '');
  assert.equal(parseArticle('# Ice\n> Deckhands know it.', false).deck, 'Deckhands know it.');
});

test('recorded pages from real writers parse completely', () => {
  assert.ok(RECORDED.length >= 4);
  for (const r of RECORDED) {
    const A = parseArticle(r.text, false);
    assert.ok(A.title && A.deck && A.bridge, r.title);
    assert.doesNotMatch(A.deck, /^\W*deck\b/i, r.title);
    assert.ok(A.blocks.filter(b => b.t === 'p').length >= 3, r.title);
    assert.equal(A.tunnels.length, 5, r.title);
    assert.ok(A.next && A.questions.length === 3, r.title);
    assert.ok(A.notes.length >= 1, r.title);
    for (const b of A.blocks) assert.doesNotMatch(b.s, /::|^\[\[[^\]]+\]\]\s*$/, `${r.title}: a line from the plan or timeline reached the body`);
    const p1 = A.blocks.findIndex(b => b.t === 'p') + 1;
    assert.ok(A.panels.length <= 2 && A.panels.every(p => p.done && p.rows.length && (p.v1 ? p.at === p1 : p.at >= p1)), `${r.title}: panels sit below the first paragraph`);
    if (!/\n---\n/.test(r.text) || /^(@ drift|%%%)/m.test(r.text)) continue;
    assert.ok(/\n&&&\n/.test(r.text) && Object.values(A.gloss).filter(g => g.gloss).length >= 8, `${r.title}: v2 pages end with hooks for the planned links`);
  }
});

/* Every point a stream can stop at, near line breaks (where the format changes mode) and at a stride elsewhere. */
const cutsOf = (/** @type {string} */ t) => { const c = new Set([t.length]); for (let i = 0; i < t.length; i++) { if (t[i] === '\n') for (let d = -3; d <= 6; d++) c.add(Math.max(1, i + d)); else if (i % 13 === 0) c.add(i); } return [...c].sort((a, b) => a - b); };

const linkKeys = (/** @type {any} */ A) => [...A.blocks.map((/** @type {any} */ b) => b.s), ...A.notes.map((/** @type {any} */ n) => n.s), ...A.panels.flatMap((/** @type {any} */ p) => [...p.heads, ...p.rows.flat()])].flatMap(s => [...String(s).matchAll(/\[\[([^\]]+)\]\]/g)].map(m => keyOf(splitLink(m[1])[1])));
const MOCKS = Array.from({ length: 8 }, (_, d) => ({ title: `mock page, level ${d}`, text: mockPage({ title: `Mock ${d}`, depth: d, path: d ? [{ title: 'Parent' }] : [], from: null }) }));
const STREAMED = [...RECORDED, ...FIXTURES, ...MOCKS];

test('streaming never shows something that later changes or disappears', () => {
  for (const r of STREAMED) {
    const final = parseArticle(r.text, false);
    /** @type {any} */ let prev = null;
    for (const n of cutsOf(r.text)) {
      const A = parseArticle(r.text.slice(0, n), true); const at = `${r.title}, ${n} chars in`;
      for (const b of A.blocks) assert.doesNotMatch(b.s, /^:::|\s::\s|^\[\[[^\]]+\]\]\s*::/, `${at}: a line from the plan, a panel or the hooks flashed into the body`);
      for (const b of A.blocks) assert.doesNotMatch(plain(b.s), /\[\[|\]\]/, `${at}: link brackets showed`);
      assert.ok(A.panels.length <= 2, `${at}: more than two panels`);
      A.panels.filter(p => !p.v1).forEach((p, i, a) => { if (i) assert.ok(p.after > a[i - 1].after, `${at}: two panels in a row`); });
      if (A.blocks.length) assert.equal(A.wait, false, `${at}: still waiting with words on the page`);
      /* a link's colour is right the moment it appears: planned topics arrive with their kind */
      for (const k of linkKeys(A)) if (final.gloss[k] && A.gloss[k]) assert.equal(A.gloss[k].kind, final.gloss[k].kind, `${at}: the kind of ${k} changed`);
      if (prev) {
        assert.ok(A.title.startsWith(prev.title), `${at}: the title changed`);
        assert.ok(A.deck.startsWith(prev.deck), `${at}: the deck changed`);
        prev.blocks.slice(0, -1).forEach((/** @type {any} */ b, /** @type {number} */ i) => assert.deepEqual(A.blocks[i], b, `${at}: an earlier block changed`));
        const last = prev.blocks.length - 1;
        if (last >= 0) assert.ok(A.blocks[last] && A.blocks[last].t === prev.blocks[last].t && plain(A.blocks[last].s).startsWith(plain(prev.blocks[last].s)), `${at}: the block being written changed`);
        prev.notes.forEach((/** @type {any} */ x, /** @type {number} */ i) => assert.ok(A.notes[i] && A.notes[i].n === x.n && plain(A.notes[i].s).startsWith(plain(x.s)), `${at}: a margin note moved or changed`));
        prev.panels.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
          const q = A.panels[i]; assert.ok(q, `${at}: a panel disappeared`);
          for (const f of ['type', 'title', 'at', 'after', 'o']) assert.deepEqual(q[f], p[f], `${at}: a panel's ${f} changed`);
          assert.deepEqual(q.heads, p.heads, `${at}: a panel's headers changed`);
          p.rows.forEach((/** @type {any} */ row, /** @type {number} */ j) => assert.deepEqual(q.rows[j], row, `${at}: a panel row changed`));
          assert.ok(q.done || !p.done, `${at}: a finished panel reopened`);
          assert.deepEqual(A.blocks[p.at - 1], prev.blocks[p.at - 1], `${at}: the paragraph above a panel changed`);
        });
        for (const [k, g] of Object.entries(prev.gloss)) {
          const h = A.gloss[k]; assert.ok(h && h.name === /** @type {any} */ (g).name, `${at}: ${k} left the plan`);
          if (/** @type {any} */ (g).kind) assert.equal(h.kind, /** @type {any} */ (g).kind, `${at}: ${k} changed kind`);
          if (/** @type {any} */ (g).gloss) assert.equal(h.gloss, /** @type {any} */ (g).gloss, `${at}: ${k} changed its hook`);
        }
        assert.ok(A.tunnels.length >= prev.tunnels.length && A.questions.length >= prev.questions.length, `${at}: something disappeared`);
      }
      prev = A;
    }
  }
});

test('panels: rows, titles, headers and their place on the page', () => {
  const [clean] = FIXTURES; const A = parseArticle(clean.text, false);
  assert.deepEqual(A.panels.map(p => [p.type, p.at, p.after, p.rows.length]), [['timeline', 1, 1, 2], ['compare', 3, 3, 2]]);
  assert.deepEqual(A.panels[1].heads, ['Lewis gun', '[[Bren|Bren gun]]']);
  assert.deepEqual(A.panels[1].rows[0], ['Weight', '13 kg', '10 kg']);
  assert.equal(A.notes[0].n, 2, 'a note after a panel still belongs to the paragraph before it');
  assert.deepEqual(timeOf(A).map(t => t.y), [1932, 1932]);
  assert.ok(panelLines(A).includes('Weight: Lewis gun 13 kg; [[Bren|Bren gun]] 10 kg'));
  const figures = parseArticle(FIXTURES[3].text, false).panels;
  assert.deepEqual(figures.map(p => [p.type, p.title]), [['figures', 'By the numbers'], ['sparkline', '']]);
  assert.deepEqual(figures[0].rows, [['986', 'emus confirmed killed'], ['9,860', 'rounds fired']]);
});

test('a half-written row waits for its newline, and the panel shows as soon as it opens', () => {
  const page = '# T\n---\nFirst paragraph.\n\n::: timeline\n1932 :: Soldiers reach Campion\n1933 :: They gi';
  const A = parseArticle(page, true);
  assert.equal(A.panels.length, 1); assert.deepEqual(A.panels[0].rows, [['1932', 'Soldiers reach Campion']]); assert.equal(A.panels[0].done, false);
  assert.equal(parseArticle('# T\n---\nFirst paragraph.\n\n::: time', true).panels.length, 0, 'an opener waits until its type is complete');
});

test('a panel before the first paragraph waits for it, then sits below it', () => {
  const page = FIXTURES.find(f => f.title.startsWith('a panel before'))?.text || '';
  const cut = page.indexOf('drew farmers');
  assert.equal(parseArticle(page.slice(0, cut), true).panels.length, 0, 'held while the first paragraph is written');
  const A = parseArticle(page.slice(0, page.indexOf('A second paragraph')), true);
  assert.deepEqual(A.panels.map(p => [p.type, p.at, p.after]), [['theories', 1, 1]]);
  assert.deepEqual(A.panels[0].rows[1], ['Fences', 'Rabbit-proof fences funnelled them', 'partly']);
});

test('at most two panels, never two in a row, and a dropped panel never leaks its rows', () => {
  const A = parseArticle(FIXTURES.find(f => f.title.startsWith('extra'))?.text, false);
  assert.deepEqual(A.panels.map(p => p.type), ['facts', 'guess']);
  for (const b of A.blocks) assert.doesNotMatch(b.s, /Myth|Equation/);
});

test('a missing closer ends at prose, a heading or a note', () => {
  const A = parseArticle(FIXTURES[1].text, false);
  assert.equal(A.panels[0].rows.length, 2);
  assert.ok(A.blocks.some(b => /shrouded barrel/.test(b.s)), 'the prose after the rows is a paragraph');
  const B = parseArticle(FIXTURES[2].text, false);
  assert.equal(B.panels[0].rows.length, 2); assert.equal(B.panels[0].title, 'How it fed');
  assert.ok(B.blocks.some(b => b.t === 'h' && b.s === 'Where it served')); assert.equal(B.notes.length, 1);
});

test('a panel between list items splits the list instead of landing above it', () => {
  const A = parseArticle(FIXTURES.find(f => f.title.includes('list items'))?.text, false);
  assert.deepEqual(A.blocks.map(b => b.t), ['p', 'li', 'li', 'li', 'p']);
  assert.equal(A.panels[0].at, 3);
});

test('kinds arrive with the plan, hooks at the end, and both feed hover cards', () => {
  const page = FIXTURES[0].text; const before = parseArticle(page.slice(0, page.indexOf('&&&')), true);
  assert.equal(before.gloss[keyOf('Lewis gun')].kind, 'thing'); assert.equal(before.gloss[keyOf('Lewis gun')].gloss, '');
  assert.equal(hookOf(before, keyOf('Bren gun')), 'The Czech design Britain adopted in 1935', 'a branch lends its hook until the hooks arrive');
  const A = parseArticle(page, false);
  assert.equal(A.gloss[keyOf('Lewis gun')].gloss, 'A First World War machine gun sent after birds.');
  assert.equal(hookOf(A, keyOf('Gizzard stone')), 'Why emus swallow pebbles');
  assert.equal(A.gloss[keyOf('Gizzard stone')].kind, 'mechanism');
  const last = parseArticle(FIXTURES.at(-1)?.text, false);
  assert.equal(last.gloss[keyOf('Lewis gun')].gloss, 'Hooks under a second plan marker still count.');
  assert.ok(last.blocks.some(b => b.s.includes('std::vector') && b.s.includes('fe80::1')), '"::" without spaces stays prose');
  /* without the hooks, the blocks, notes and panels are exactly the same */
  const bare = parseArticle(page.slice(0, page.indexOf('&&&')), false);
  assert.deepEqual([bare.blocks, bare.notes, bare.panels], [A.blocks, A.notes, A.panels]);
});

test('v1 pages: head facts and timelines become panels below the first paragraph', () => {
  const v1 = '# Ice\n> Deck.\n~ Bridge.\n@ drift 0\n: Melting point = 0 °C\n: Friction = about 0.03\n%%%\n1850s :: Faraday describes a film\n1939 :: Bowden and Hughes\n+++\n[[Regelation]] :: Ice refreezes :: phenomenon\n---\nIce is slippery. [[Regelation]] helps.\n\nMore.\n';
  const A = parseArticle(v1, false);
  assert.deepEqual(A.panels.map(p => [p.type, p.at, p.v1, p.rows.length]), [['facts', 1, true, 2], ['timeline', 1, true, 2]]);
  assert.equal(A.gloss[keyOf('Regelation')].gloss, 'Ice refreezes'); assert.equal(A.gloss[keyOf('Regelation')].kind, 'phenomenon');
  assert.equal(parseArticle(v1.slice(0, v1.indexOf('More')), true).panels.length, 2, 'they appear once the first paragraph is finished');
  assert.equal(parseArticle(v1.slice(0, v1.indexOf('helps')), true).panels.length, 0);
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

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { KINDS, capFirst, cardsOf, hookOf, isQuestion, keyOf, panelLines, parseArticle, plain, splitLink, timeOf, titleIsLocked, yearOf } from '../src/shared/article.js';
import { FIXTURES } from './fixtures.js';
import { mockModel, page as mockPage } from '../lib/mock.js';
import { RECORDED } from '../lib/recorded.js';
import { streamText } from 'ai';

/** A complete page in the format pages are written in now, from the mock writer. */
async function samplePage(title = 'Tardigrades', extra = {}) {
  const input = { title, lens: 'encyclopedic', q: false, ctx: '', bridge: null, ...extra };
  const r = streamText({ model: mockModel({ task: 'page', input, pace: 'fast' }), prompt: 'x' });
  return await r.text;
}

test('parses every part of a finished page', async () => {
  const A = parseArticle(await samplePage(), false);
  assert.equal(A.title, 'Tardigrades');
  assert.ok(KINDS.includes(A.kind), `the title line names the page's kind, not "${A.kind}"`);
  assert.match(A.deck, /stand-in page/);
  assert.equal(A.bridge, '');
  assert.ok(A.panels.length >= 1 && A.panels.length <= 2);
  assert.ok(A.panels.every(p => p.done && p.rows.length && p.at >= 1));
  assert.equal(Object.keys(A.gloss).length >= 10, true);
  assert.equal(A.blocks.filter(b => b.t === 'h').length, 3);
  assert.ok(A.notes.length >= 2);
  assert.equal(A.next, null);
  const cards = cardsOf(A);
  assert.equal(cards.length, 6);
  assert.ok(cards.every(c => c.kind && c.teaser && c.target), 'every card has a topic, a hook and a kind');
  assert.ok(A.tunnels.every(t => t.dir === ''), 'cards carry no direction');
  assert.equal(A.questions.length, 3);
  assert.equal(A.bodyDone, true);
});

test('the title line: the kind counts once the line is whole, and "::" never shows', () => {
  const at = (/** @type {string} */ t, streaming = true) => { const A = parseArticle(t, streaming); return [A.title, A.kind]; };
  assert.deepEqual(at('# Tardigrades :'), ['Tardigrades', '']);
  assert.deepEqual(at('# Tardigrades ::'), ['Tardigrades', '']);
  assert.deepEqual(at('# Tardigrades :: crea'), ['Tardigrades', ''], 'a kind still being written waits');
  assert.deepEqual(at('# Tardigrades :: creature\n'), ['Tardigrades', 'creature']);
  assert.deepEqual(at('# Tardigrades :: creatures', false), ['Tardigrades', 'creature']);
  assert.deepEqual(at('# Tardigrades:: creature\n'), ['Tardigrades', 'creature']);
  assert.deepEqual(at('# Tardigrades :: animal\n'), ['Tardigrades', ''], 'an unknown kind is dropped, never shown');
  assert.deepEqual(at('# std::vector\n'), ['std::vector', ''], '"::" without spaces is part of the title');
  assert.deepEqual(at('# Lewis gun\n> Deck.', false), ['Lewis gun', ''], 'older pages have no kind');
});

/* A page arrives in two shapes: v3 (kind on the title line, six cards) and, from older browsers'
   history and the fixtures below, v2 (a bridge, one next page, three branches with directions). */
test('older pages still give six cards at most, their next page first', () => {
  const A = parseArticle(FIXTURES[0].text, false);
  assert.match(A.bridge, /the page before/);
  assert.deepEqual(cardsOf(A).map(c => c.target), ['Bren gun', 'Campion', 'Gizzard stone']);
  assert.equal(cardsOf(A)[0].teaser, 'The gun that replaced it, and why the army wanted a lighter one.');
  assert.equal(cardsOf(A)[2].kind, 'mechanism');
  const many = parseArticle(`# T\n---\nP.\n===\n${Array.from({ length: 9 }, (_, i) => `- [[Topic ${i}]] :: hook ${i} :: thing`).join('\n')}\n- [[T]] :: the page itself :: thing\n`, false);
  assert.equal(cardsOf(many).length, 6);
  assert.ok(!cardsOf(parseArticle('# T\n---\nP.\n===\n- [[T]] :: itself :: thing\n', false)).length, 'a page never offers itself');
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
  assert.equal(titleIsLocked({ title: 'Lewis gun' }), true);
  assert.equal(titleIsLocked({ title: 'Why is ice slippery?', q: true }), false);
  assert.equal(titleIsLocked({ title: 'A and B', bridge: ['A', 'B'] }), false);
  /* older requests carried a depth and a "from" */
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
    assert.ok(A.title && A.deck && KINDS.includes(A.kind), `${r.title}: a title, its kind and a deck`);
    assert.ok(!A.bridge && !A.next && !/^(~|>>>)/m.test(r.text), `${r.title}: no bridge and no single next page`);
    assert.doesNotMatch(A.deck, /^\W*deck\b/i, r.title);
    assert.ok(A.blocks.filter(b => b.t === 'p').length >= 3, r.title);
    const cards = cardsOf(A);
    assert.equal(cards.length, 6, r.title);
    assert.ok(cards.every(c => c.kind && c.teaser), `${r.title}: every card has a hook and a kind`);
    assert.equal(A.questions.length, 3, r.title);
    assert.ok(A.notes.length >= 1, r.title);
    for (const b of A.blocks) assert.doesNotMatch(b.s, /::|^\[\[[^\]]+\]\]\s*$/, `${r.title}: a line from the plan or timeline reached the body`);
    const p1 = A.blocks.findIndex(b => b.t === 'p') + 1;
    assert.ok(A.panels.length <= 2 && A.panels.every(p => p.done && p.rows.length && (p.v1 ? p.at === p1 : p.at >= p1)), `${r.title}: panels sit below the first paragraph`);
    if (!/\n---\n/.test(r.text) || /^(@ drift|%%%)/m.test(r.text)) continue;
    assert.ok(/\n&&&\n/.test(r.text) && Object.values(A.gloss).filter(g => g.gloss).length >= 8, `${r.title}: pages end with hooks for the planned links`);
  }
});

/* Every point a stream can stop at, near line breaks (where the format changes mode) and at a stride elsewhere. */
const cutsOf = (/** @type {string} */ t) => { const c = new Set([t.length]); for (let i = 0; i < t.length; i++) { if (t[i] === '\n') for (let d = -3; d <= 6; d++) c.add(Math.max(1, i + d)); else if (i % 13 === 0) c.add(i); } return [...c].sort((a, b) => a - b); };

const linkKeys = (/** @type {any} */ A) => [...A.blocks.map((/** @type {any} */ b) => b.s), ...A.notes.map((/** @type {any} */ n) => n.s), ...A.panels.flatMap((/** @type {any} */ p) => [...p.heads, ...p.rows.flat()])].flatMap(s => [...String(s).matchAll(/\[\[([^\]]+)\]\]/g)].map(m => keyOf(splitLink(m[1])[1])));
const MOCKS = Array.from({ length: 8 }, (_, i) => ({ title: `mock page ${i}`, text: mockPage({ title: `Mock ${i}`, lens: 'encyclopedic' }) }));
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
      assert.doesNotMatch(A.title, /\s::|::\s|::$/, `${at}: the kind's separator showed in the title`);
      if (A.kind) assert.equal(A.kind, final.kind, `${at}: the page's kind showed before it was certain`);
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
  assert.deepEqual(parseArticle('# T\n---\nP.\n\n::: compare A | B\nWeight :: 13 kg :: 10 kg\n:::\n', false).panels[0].rows[0], ['Weight', '13 kg', '10 kg'], 'values split by :: still make columns');
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
  assert.equal(yearOf('2 Nov 1932'), 1932, 'the year, not the day');
  assert.equal(yearOf('Early Feb 1637'), 1637);
  assert.equal(yearOf('AD 79'), 79);
  assert.equal(yearOf('14th century'), 1350);
  assert.equal(yearOf('5th century BCE'), -450);
  assert.equal(yearOf('1404–1438'), 1404);
  assert.equal(yearOf('65 million years ago'), new Date().getFullYear() - 65e6);
  assert.equal(yearOf('soon'), null);
});

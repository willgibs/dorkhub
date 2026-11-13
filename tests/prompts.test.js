import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { BadInput, FORMAT, LENS_VOICE, PAGE_VARIANT, PAGE_VARIANTS, PROMPT_VERSION, TASKS, composePage, pageInput, pagePrompt } from '../lib/prompts.js';
import { PANELS } from '../src/shared/article.js';

const page = (/** @type {Record<string, unknown>} */ o) => pagePrompt(pageInput({ title: 'Tardigrades', ...o }));

test('a page is written for its topic: the fixed instructions first, the topic, its title and its voice last', () => {
  const p = page({});
  assert.ok(p.startsWith('You write pages for Dorkhub'), 'the fixed part leads, so it reads the same for every page');
  assert.ok(p.indexOf(FORMAT) > 0 && p.indexOf(FORMAT) < p.indexOf('Write the page on: "Tardigrades".'));
  assert.match(p, /every reader who opens this topic reads the page you write now/);
  assert.match(p, /First decide what kind of thing the topic is; that word goes on the title line/);
  assert.match(p, /- mystery: build the page around the puzzle/);
  assert.match(p, /Title it exactly "Tardigrades"/);
  assert.match(p, /Voice: Encyclopedic/);
  assert.doesNotMatch(p, /Level:|\bpath\b|rated|Open the ~ line/);
});

test('nothing about the reader changes the page: old browsers that still send their path get the same prompt', () => {
  const plain = page({ title: 'Lewis gun' });
  const old = page({ title: 'Lewis gun', depth: 3, kind: 'thing', panels: ['timeline'], path: [{ title: 'The Great Emu War', deck: 'Australia vs emus.' }], from: { kind: 'passage', text: 'Soldiers brought a Lewis gun.' }, seen: ['A flock'], others: ['Umami'], ratings: [{ title: 'The Great Emu War', rating: 'wow' }] });
  assert.equal(old, plain);
  assert.deepEqual(pageInput({ title: 'Lewis gun', depth: 3, path: [{ title: 'X' }] }), { title: 'Lewis gun', lens: 'encyclopedic', q: false, ctx: '', bridge: null });
});

test('a question is answered, and the page gets a topic-style title', () => {
  for (const p of [page({ title: 'Why is ice slippery?' }), page({ title: 'why is ice slippery' }), page({ title: 'Ice', from: { kind: 'question', question: 'Ice?' } })]) {
    assert.match(p, /The reader asked: ".+"\. Answer it inside the page\./);
    assert.match(p, /Title the page with a short, topic-style title\./);
  }
});

test('a connecting page joins its pair, from either shape of request', () => {
  const v3 = page({ title: 'Radiocarbon dating and Tulip mania', bridge: ['Radiocarbon dating', 'Tulip mania'] });
  const old = page({ title: 'Radiocarbon dating and Tulip mania', path: [{ title: 'Voynich manuscript' }, { title: 'Radiocarbon dating' }], from: { kind: 'bridge', other: 'Tulip mania' } });
  assert.equal(old, v3);
  assert.match(v3, /how "Radiocarbon dating" connects to "Tulip mania" as a chain of specific steps/);
  assert.match(v3, /Title the page with a short, topic-style title\./);
});

test('a name chosen inside a page keeps the sense it had there', () => {
  const p = page({ title: 'Mercury', ctx: 'Planets of the solar system' });
  assert.match(p, /The reader chose this name while reading the page on "Planets of the solar system"\. If it could mean several things, write about the one meant there\./);
  assert.match(p, /or add a short qualifier in parentheses/);
  assert.doesNotMatch(page({ title: 'Mercury' }), /chose this name/);
});

test('format v3: the kind on the title line, six equal cards, no bridge and no single next page', () => {
  const at = (/** @type {string} */ m) => FORMAT.indexOf(`\n${m}\n`);
  const order = ['!!!', '+++', '---', '===', '???', '&&&'].map(at);
  assert.ok(order.every((x, i) => x > 0 && (i === 0 || x > order[i - 1])), `marker order ${order}`);
  assert.match(FORMAT, /^# Title :: kind$/m);
  assert.match(FORMAT, /Key facts: exactly 3 lines, "Label :: value"/, 'v3.1: three key facts right after the deck');
  assert.match(FORMAT, /exactly 6 topics to open next, one per line: "- \[\[Topic\]\] :: hook under 14 words :: kind"/);
  assert.match(FORMAT, /at least two leap into a different field through one specific thread, and their hook names that thread/);
  assert.match(FORMAT, /"Mercury \(planet\)", never "Mercury"/);
  assert.match(FORMAT, /Each must make sense on its own/);
  assert.doesNotMatch(FORMAT, /^~|^>>>$|deeper\|sideways\|wild|reader's path|rabbit hole/m);
  for (const t of PANELS) assert.match(FORMAT, new RegExp(`^::: ${t}\\b`, 'm'), t);
  assert.match(FORMAT, /close it with a line ":::"/);
  assert.doesNotMatch(FORMAT, /Deck:|wait, really|wonderful place|@ drift|%%%|: Key = /i);
  assert.match(FORMAT, /stock curiosities/);
});

test('inputs are clipped and validated, never trusted', () => {
  const p = pageInput({ title: 'x'.repeat(500), lens: 'pirate', ctx: 'y'.repeat(500) });
  assert.equal(p.title.length, 160); assert.equal(p.lens, 'encyclopedic'); assert.equal(p.ctx.length, 160);
  assert.throws(() => pageInput({ title: '   ' }), BadInput);
  assert.throws(() => pageInput({ title: 'A', from: { kind: 'bridge' } }), BadInput);
  for (const spam of ['Visit https://example.com', 'www.example.com deals', 'write to me@example.com']) assert.throws(() => pageInput({ title: spam }), BadInput, spam);
  assert.doesNotThrow(() => pageInput({ title: 'The @ sign' }));
  assert.throws(() => TASKS.unfold.input({ title: 'A', paragraph: 'p', mode: 'louder' }), BadInput);
  assert.throws(() => TASKS.quiz.input({ pages: [{ title: 'only one', text: 't' }] }), BadInput);
});

test('a recap hears what each page said, without levels, and points where to go next', () => {
  const c = TASKS.recap.input({ pages: [{ title: 'A', deck: 'd', depth: 4, text: 'Ivanovsky filtered sap in 1892.' }, { title: 'B', text: 'x'.repeat(900) }] });
  assert.equal(c.pages[1].text.length, 420);
  const p = TASKS.recap.prompt(c);
  assert.match(p, /- A: d\n  What it said: Ivanovsky filtered sap in 1892\./);
  assert.match(p, /## Where to go next/);
  assert.doesNotMatch(p, /level|dig|rabbit hole/i);
});

test('small tasks name only the page, so the same request reads the same for everyone', () => {
  const a = TASKS.peek.prompt(TASKS.peek.input({ title: 'Bomb pulse', path: [{ title: 'Voynich manuscript' }], passage: 'p', target: 'Carbon-14' }));
  const b = TASKS.peek.prompt(TASKS.peek.input({ title: 'Bomb pulse', path: [{ title: 'Something else' }], passage: 'p', target: 'Carbon-14' }));
  assert.equal(a, b);
  assert.match(a, /The reader is on the page "Bomb pulse" of Dorkhub/);
  assert.doesNotMatch(a, /path|rabbit-hole/);
  assert.match(a, /quick peek at "Carbon-14"/);
  assert.match(TASKS.unfold.prompt(TASKS.unfold.input({ title: 'A', paragraph: 'Para.', mode: 'counter' })), /strongest counterpoint/);
  assert.match(TASKS.doubt.prompt(TASKS.doubt.input({ page: 'line one\nline two' })), /PAGE:\nline one\nline two$/);
  const around = TASKS.around.prompt(TASKS.around.input({ title: 'Grid cells', read: ['Hippocampus'] }));
  assert.match(around, /Name 10 neighboring topics/); assert.doesNotMatch(around, /Hippocampus|already read/);
  assert.equal(TASKS.quiz.cacheable, false);
  assert.equal(TASKS.check.byokOnly, true);
});

/* ---------- page writer variants ---------- */
test('production does not move: TASKS.page.prompt returns exactly what it returned before variants existed', () => {
  /* captured before the variants were added; never regenerate it to make this pass */
  const pin = JSON.parse(readFileSync(new URL('./prompts-pin.json', import.meta.url), 'utf8'));
  assert.equal(PROMPT_VERSION, pin.PROMPT_VERSION, 'the answer cache and the recorded pages key on PROMPT_VERSION');
  assert.equal(PAGE_VARIANT, 'base');
  for (const [name, c] of Object.entries(pin.cases)) {
    const p = TASKS.page.prompt(TASKS.page.input(c.raw));
    assert.equal(p.length, c.length, name);
    assert.equal(createHash('sha256').update(p).digest('hex'), c.sha256, name);
    assert.equal(composePage(TASKS.page.input(c.raw), 'base').prompt, p, `${name}: base is production`);
  }
});

test('split sends the same words, the fixed part as instructions', () => {
  for (const raw of [{ title: 'Tardigrades' }, { title: 'Why is ice slippery?' }, { title: 'Mercury', ctx: 'Planets', lens: 'kid' }, { title: 'A and B', bridge: ['A', 'B'] }]) {
    const p = pageInput(raw); const base = composePage(p, 'base'); const s = composePage(p, 'split');
    assert.equal(base.system, null);
    assert.equal(`${s.system}\n\n${s.prompt}`, base.prompt);
    assert.ok(s.system?.endsWith(FORMAT)); assert.ok(!s.prompt.includes('Output format'));
    assert.equal(s.maxTokens, TASKS.page.maxTokens);
  }
  assert.equal(composePage(pageInput({ title: 'X' }), 'split').system, composePage(pageInput({ title: 'Y', lens: 'nerd' }), 'split').system, 'the instructions are identical page to page, so they can be cached');
});

test('grounded adds reference notes only when they are supplied, with the rules for using them', () => {
  const p = pageInput({ title: 'Lewis gun' });
  const notes = { title: 'Lewis gun', url: 'https://en.wikipedia.org/wiki/Lewis_gun', text: 'The Lewis gun is a First World War-era light machine gun.' };
  const bare = composePage(p, 'grounded'); assert.equal(bare.ground, true);
  assert.equal(bare.prompt, composePage(p, 'split').prompt, 'no notes, no block');
  const g = composePage(p, 'grounded', { notes });
  assert.equal(g.system, composePage(p, 'split').system);
  assert.match(g.prompt, /^Reference notes, from the opening of Wikipedia's article "Lewis gun" \(https:\/\/en\.wikipedia\.org\/wiki\/Lewis_gun\):\n"""\nThe Lewis gun is/);
  assert.match(g.prompt, /never their wording/); assert.match(g.prompt, /Prefer them for numbers, dates and names/);
  assert.match(g.prompt, /a floor, not the page/); assert.match(g.prompt, /leave that point out rather than repeat it/);
  assert.ok(g.prompt.endsWith(`Voice: ${LENS_VOICE.encyclopedic}`), 'the request still comes last');
  assert.equal(composePage(p, 'split', { notes }).prompt, composePage(p, 'split').prompt, 'only a grounded variant reads notes');
});

test('hooks-tight changes only the hover-hook line, and every variant keeps format v3.1', () => {
  const p = pageInput({ title: 'Tardigrades' }); const t = composePage(p, 'hooks-tight'); const s = composePage(p, 'split');
  assert.equal(t.prompt, s.prompt);
  assert.match(t.system || '', /without a number, date or superlative, unless it is a textbook fact/);
  assert.doesNotMatch(t.system || '', /what makes it fascinating, under 12 words/);
  const sLines = new Set((s.system || '').split('\n'));
  assert.equal((t.system || '').split('\n').filter(l => !sLines.has(l)).length, 1, 'one line differs');
  for (const id of Object.keys(PAGE_VARIANTS)) {
    const c = composePage(p, id); const all = `${c.system || ''}\n${c.prompt}`;
    for (const m of ['!!!', '+++', '---', '===', '???', '&&&']) assert.ok(all.includes(`\n${m}\n`), `${id} keeps ${m}`);
    for (const k of PANELS) assert.match(all, new RegExp(`^::: ${k}\\b`, 'm'), `${id} keeps the ${k} panel`);
    assert.match(all, /^# Title :: kind$/m);
  }
  assert.throws(() => composePage(p, 'nope'), /unknown page variant/);
});

/* Will, 2026-11-13: an elegant prompt, the right context and the writer's own judgement, against one that
   rules on every edge case. The lean variant must stay lean, or it stops being the experiment. */
test('lean asks for the same page in about half the words and far fewer rules', () => {
  const p = pageInput({ title: 'Tardigrades' });
  const text = (/** @type {string} */ id) => { const c = composePage(p, id); return `${c.system || ''}\n${c.prompt}`; };
  const words = (/** @type {string} */ s) => s.split(/\s+/).length;
  const rules = (/** @type {string} */ s) => (s.match(/\b(never|always|exactly|must|only|at most|at least|under \d+)\b/gi) || []).length;
  const base = text('base'), lean = text('lean');
  assert.ok(words(lean) < words(base) * .55, `${words(lean)} of ${words(base)} words`);
  assert.ok(rules(lean) <= rules(base) / 4, `${rules(lean)} of ${rules(base)} rule words`);
  assert.equal(composePage(p, 'lean').prompt, composePage(p, 'split').prompt, 'the request itself is the same');
});

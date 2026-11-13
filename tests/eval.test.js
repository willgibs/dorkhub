/* The writer eval's instrument (scripts/eval.mjs, scripts/eval/): proven on the mock writer and fakes only.
   Nothing here calls a model or the network. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mockModel, page as mockPage } from '../lib/mock.js';
import { FRONT, EARLIER } from '../lib/front.js';
import { KIND_SHAPE, pageInput } from '../lib/prompts.js';
import { checksOf, compliance, isUmbrella, scorePage } from '../scripts/eval/score.js';
import { bootstrap, signTest } from '../scripts/eval/stats.js';
import { factParts, fakeJudge, plainPage, readFacts, readPair, tallyFacts } from '../scripts/eval/judge.js';
import { armsOf, loadTopics, planJob, readPrices } from '../scripts/eval/plan.js';
import { buildReview, readPicks, runJob, spendGate } from '../scripts/eval/run.js';
import { winRates } from '../scripts/eval/summary.js';
import { dryFetch, main } from '../scripts/eval.mjs';

const PARA = (/** @type {string} */ s) => `${s} It has a second sentence with more detail. And a third one, to make a real paragraph.`;
const PAGE = `# Lewis gun :: thing
> A light machine gun that armed aircraft and infantry alike.
!!!
Designed :: 1911, in the United States
Calibre :: .303 British
Weight in action :: about 13 kg with a pan magazine of the old kind
+++
[[Isaac Newton Lewis]] :: person
[[Birmingham Small Arms Company]] :: thing
[[France]] :: place
[[World War I]] :: event
[[Tardigrade]] :: creature
[[Pan magazine]] :: thing
[[Mercury (planet)]] :: place
[[Air cooling]] :: mechanism
---
${PARA('The gun by [[Isaac Newton Lewis]] was built by the [[Birmingham Small Arms Company]].')}
^ An aside under thirty words.

## In the air
${PARA('It flew over [[France]] in [[World War I]], fed by a [[Pan magazine]] and cooled by [[Air cooling]].')}

${PARA('Nothing to do with [[Mercury (planet)]] or a [[Tardigrade]].')}
===
- [[Vickers machine gun]] :: its heavier cousin :: thing
- [[Synchronization gear]] :: how a gun fired through a spinning propeller without hitting it at all ever :: mechanism
- [[Scarff ring]] :: a gunner's mount :: thing
- [[Hotchkiss M1909]] :: the French rival :: thing
- [[Albert Ball]] :: a pilot who loved it :: person
- [[Foster mounting]] :: a rail on a top wing :: thing
???
Why did the Lewis gun suit aircraft?
How did a pan magazine feed a gun?
Who made the Lewis gun in Britain?
&&&
[[Isaac Newton Lewis]] :: an army officer whose design the army turned down
[[Birmingham Small Arms Company]] :: built over 145,000 of them, the largest maker
[[France]] :: where it mattered most
[[World War I]] :: where it was used
[[Tardigrade]] :: tiny and tough
[[Pan magazine]] :: a flat drum that spun as it fed rounds into the gun one by one
[[Mercury (planet)]] :: a planet
[[Air cooling]] :: why the barrel wore a fat shroud
`;

test('a page is scored on what the prompt asks: people, umbrella links, stock curiosities, lengths, cards, questions, title', () => {
  const s = scorePage(PAGE, { input: pageInput({ title: 'Lewis gun' }) });
  assert.equal(s.planned, 8); assert.equal(s.links, 14);
  assert.equal(s.people, 2); assert.ok(Math.abs(s.personShare - 2 / 14) < 1e-9);
  assert.deepEqual(s.umbrella, ['France', 'World War I']);
  assert.deepEqual(s.stock, ['Tardigrade']);
  assert.equal(s.deckWords, 10);
  assert.deepEqual(s.factLabelWords, [1, 1, 3]); assert.equal(s.factValuesOver, 1);
  assert.equal(s.sixCards, true); assert.equal(s.threeQs, true);
  assert.equal(s.hooksOver, 1, 'one hover hook runs to 12 words or more');
  assert.equal(s.hooksNumeric, 2, '"145,000 … the largest" and "mattered most"');
  assert.equal(s.cardHooksOver, 1);
  assert.equal(s.titleKept, true);
  assert.equal(s.usable, true);
  assert.equal(s.unlinked, 0);
  const c = checksOf(s);
  assert.equal(c['no umbrella links'], false); assert.equal(c['no stock curiosities'], false); assert.equal(c['exactly 6 cards'], true);
  assert.ok(compliance(s) > 0 && compliance(s) < 1);
  /* a locked title swapped for another is caught; a question's title is free */
  assert.equal(scorePage(PAGE.replace('# Lewis gun', '# Machine guns'), { input: pageInput({ title: 'Lewis gun' }) }).titleKept, false);
  assert.equal(scorePage(PAGE.replace('# Lewis gun', '# The Lewis guns (weapon)'), { input: pageInput({ title: 'Lewis gun', ctx: 'X' }) }).titleKept, true);
  assert.equal(scorePage(PAGE, { input: pageInput({ title: 'Why was the Lewis gun light?' }) }).titleKept, null);
  /* a page about a stock curiosity may link it */
  assert.deepEqual(scorePage(PAGE.replace('# Lewis gun', '# Tardigrades'), {}).stock, []);
  const cut = scorePage(PAGE.split('\n===\n')[0]);
  assert.equal(cut.sixCards, false); assert.equal(cut.usable, false);
});

test('umbrella links: a heuristic that catches the obvious ones and leaves specific topics alone', () => {
  for (const u of ['World War II', 'the Cold War', '19th century', 'Nineteenth century', '1920s', 'Physics', 'Japan', 'History of Rome', 'The Renaissance']) assert.ok(isUmbrella(u), u);
  for (const s of ['Lewis gun', 'Antarctica', 'Mercury (planet)', 'Battle of the Somme', 'Kessler syndrome', 'Physics of skiing']) assert.ok(!isUmbrella(s), s);
});

test('statistics: bootstrap intervals are seeded and sensible, the sign test is exact', () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const a = bootstrap(xs, { seed: 3 }), b = bootstrap(xs, { seed: 3 });
  assert.deepEqual(a, b); assert.equal(a.mean, 5.5); assert.ok(/** @type {number} */ (a.lo) < 5.5 && /** @type {number} */ (a.hi) > 5.5);
  assert.deepEqual(bootstrap([null, undefined, NaN]), { mean: null, lo: null, hi: null, n: 0 });
  assert.ok(Math.abs(signTest(9, 1) - 0.021484375) < 1e-9);
  assert.equal(signTest(5, 5), 1); assert.equal(signTest(0, 0), 1);
  assert.ok(Math.abs(signTest(0, 6) - 0.03125) < 1e-9);
  const w = winRates(['x', 'y'], [{ topic: 't', run: 1, a: 'x', b: 'y', winner: 'x' }, { topic: 't', run: 2, a: 'y', b: 'x', winner: 'x' }, { topic: 'u', run: 1, a: 'x', b: 'y', winner: 'tie' }]);
  assert.deepEqual({ n: w[0].n, aWins: w[0].aWins, bWins: w[0].bWins, ties: w[0].ties, verdict: w[0].verdict }, { n: 3, aWins: 2, bWins: 0, ties: 1, verdict: 'not significant' });
});

test('judges: answers are read tolerantly, and claims tallied by part', () => {
  assert.deepEqual(readPair('Sure! ```json\n{"winner": "b", "why": "more specific"}\n```'), { winner: 'B', scores: null, why: 'more specific' });
  assert.equal(readPair('{"winner": "Tie"}')?.winner, 'tie');
  assert.equal(readPair('{"winner": "C"}'), null); assert.equal(readPair('no json'), null);
  const f = readFacts(JSON.stringify({ body: [{ claim: 'built 1911', verdict: 'Supported' }, { claim: 'x', verdict: 'maybe' }], keyFacts: [{ claim: '13 kg', verdict: 'contradicted', note: '12.7 kg' }], hooks: 'oops' }));
  assert.ok(f); assert.equal(f.body.length, 1); assert.equal(f.hooks.length, 0);
  const t = tallyFacts(f);
  assert.equal(t.total, 2); assert.equal(t.contradicted, 1); assert.equal(t.by.keyFacts.contradicted, 1); assert.equal(t.supportedShare, 0.5);
  const parts = factParts(PAGE);
  assert.match(parts.keyFacts, /Calibre: \.303 British/); assert.match(parts.hooks, /Albert Ball: a pilot who loved it/); assert.doesNotMatch(parts.body, /\[\[/);
  const plain = plainPage(PAGE);
  assert.match(plain, /^# Lewis gun \(thing\)/); assert.match(plain, /Keep exploring:\n- Vickers machine gun: its heavier cousin/); assert.doesNotMatch(plain, /\[\[|:::|&&&/);
});

test('the topic set is a proposal unlike the front page: two of every kind, questions, a connecting pair, an ambiguous name', () => {
  const T = loadTopics();
  const front = new Set([...FRONT, ...EARLIER].map(f => f.t.toLowerCase().replace(/^the /, '')));
  for (const t of T) { assert.ok(!front.has(String(t.input.title).toLowerCase().replace(/^the /, '')), t.id); assert.doesNotThrow(() => pageInput(t.input), t.id); }
  for (const k of Object.keys(KIND_SHAPE)) assert.equal(T.filter(t => t.kind === k).length, 2, k);
  assert.ok(T.filter(t => pageInput(t.input).q).length >= 3);
  assert.equal(T.filter(t => pageInput(t.input).bridge).length, 1);
  assert.equal(T.filter(t => pageInput(t.input).ctx).length, 1);
  assert.ok(T.filter(t => t.numbers).length >= 5);
  assert.equal(new Set(T.map(t => t.id)).size, T.length);
  assert.match(JSON.parse(readFileSync(new URL('../scripts/eval/topics.json', import.meta.url), 'utf8')).note, /PROPOSAL/);
});

test('plan: every call counted, tokens estimated, dollars only from supplied prices', () => {
  const topics = loadTopics().slice(0, 3);
  const arms = armsOf(['base', 'grounded', 'split@other/model'], ['m/one', 'm/two']);
  assert.deepEqual(arms.map(a => a.id), ['base@m/one', 'base@m/two', 'grounded@m/one', 'grounded@m/two', 'split@other/model']);
  assert.throws(() => armsOf(['nope']), /unknown variant/);
  const P = planJob({ arms, topics, runs: 2, judge: 'j/judge' });
  assert.equal(P.calls.filter(c => c.type === 'writer').length, 5 * 3 * 2);
  assert.equal(P.calls.filter(c => c.type === 'pair').length, 10 * 3 * 2);
  assert.equal(P.calls.filter(c => c.type === 'facts').length, 5 * 3 * 2);
  assert.equal(P.total.usd, null, 'no prices, no dollars');
  const g = P.calls.find(c => c.type === 'writer' && c.arm.variant === 'grounded'), b = P.calls.find(c => c.type === 'writer' && c.arm.variant === 'base');
  assert.ok(g && b && g.in > b.in, 'grounded pays for its notes');
  const prices = readPrices({ flags: ['m/one=1/2', 'm/two=1/2', 'other/model=1/2', 'j/judge=10/20'] });
  const Q = planJob({ arms, topics, runs: 2, judge: 'j/judge', prices });
  assert.ok(Q.total.usd && Q.total.usd > 0 && Q.ceiling && Q.ceiling > Q.total.usd);
  assert.throws(() => readPrices({ flags: ['m/one=cheap'] }), /model=in\/out/);
});

test('a live run refuses to start without --yes-spend, a budget, known prices and a budget that covers the plan', async () => {
  const plan = { total: { usd: 3.2 } };
  assert.match(String(spendGate({ budget: 10 }, plan)), /--yes-spend/);
  assert.match(String(spendGate({ yesSpend: true }, plan)), /--budget/);
  assert.match(String(spendGate({ yesSpend: true, budget: 10 }, { total: { usd: null } })), /price unknown/);
  assert.match(String(spendGate({ yesSpend: true, budget: 3 }, plan)), /over the budget/);
  assert.equal(spendGate({ yesSpend: true, budget: 3.5 }, plan), null);
  /* through the command line too: it says why and stops before anything is written or called */
  for (const argv of [['run', '--live'], ['run', '--live', '--yes-spend'], ['run', '--live', '--yes-spend', '--budget', '100'], ['run', '--live', '--yes-spend', '--budget', '0.01', '--price', 'anthropic/claude-haiku-5.5=1/5', '--price', 'anthropic/claude-opus-5.5=5/25']]) {
    const out = /** @type {string[]} */ ([]);
    assert.equal(await main(argv, { log: s => out.push(s) }), 2, argv.join(' '));
    assert.match(out.join('\n'), /Refusing to start/);
  }
});

/** @param {(dir: string) => Promise<void>} fn */
const inTemp = async fn => { const d = mkdtempSync(join(tmpdir(), 'dh-eval-')); try { await fn(d); } finally { rmSync(d, { recursive: true, force: true }); } };
const mockWriter = (/** @type {any} */ _arm, /** @type {any} */ input) => mockModel({ task: 'page', input, pace: 'fast' });

test('a dry run goes end to end on the mock writer and a fake judge, and writes everything', () => inTemp(async dir => {
  const topics = loadTopics().filter(t => ['axolotl', 'why-cats-purr'].includes(t.id));
  const arms = armsOf(['base', 'grounded'], ['m/x']);
  const plan = planJob({ arms, topics, runs: 1, judge: 'j/y' });
  const r = await runJob({ plan, outDir: dir, runId: 'test-dry', live: false, writerModel: mockWriter, judge: fakeJudge, fetch: dryFetch });
  assert.equal(r.stopped, null);
  assert.equal(r.pages.length, 4); assert.equal(r.pairs.length, 2);
  for (const f of ['pages.jsonl', 'judgements.jsonl', 'summary.json', 'report.html', 'review.html', 'review-key.json']) assert.ok(existsSync(join(dir, f)), f);
  assert.equal(readdirSync(join(dir, 'pages', 'axolotl', 'run1')).length, 2);
  const p = JSON.parse(readFileSync(join(dir, 'pages.jsonl'), 'utf8').split('\n')[0]);
  assert.ok(p.ms.first != null && p.ms.firstBody != null && p.ms.total >= p.ms.firstBody && p.ms.firstBody >= p.ms.first);
  assert.ok(p.usage.output > 0 && p.score.usable && p.facts.total > 0);
  const grounded = r.pages.find(x => x.variant === 'grounded' && x.topic === 'axolotl');
  assert.equal(grounded.notes.url, 'https://en.wikipedia.org/wiki/Axolotls');
  assert.equal(r.pages.find(x => x.variant === 'grounded' && x.topic === 'why-cats-purr').notes, null, 'a question gets no notes');
  const S = JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8'));
  assert.match(S.note, /DRY RUN/); assert.equal(S.pairwise.length, 1);
  assert.ok(S.pairwise.every((/** @type {any} */ w) => w.verdict === 'not significant'));
  assert.ok(S.perArm['base@m/x'].compliance.mean > 0);
  const report = readFileSync(join(dir, 'report.html'), 'utf8');
  assert.match(report, /not significant/); assert.doesNotMatch(report, /<script/);
  /* the review page is blind: no arm or variant names anywhere in it */
  const review = readFileSync(join(dir, 'review.html'), 'utf8');
  for (const a of arms) { assert.ok(!review.includes(a.id)); assert.ok(!review.includes(a.variant)); }
  assert.ok(!review.includes('m/x'));
  assert.match(review, /localStorage/); assert.match(review, /Export picks/); assert.doesNotMatch(review, /<script src/);
}));

test('a live run stops cleanly when its spending reaches the budget (mock writer, fake prices)', () => inTemp(async dir => {
  const topics = loadTopics().slice(0, 3);
  const arms = armsOf(['base', 'split'], ['m/x']);
  const prices = readPrices({ flags: ['m/x=1000/1000', 'j/y=1000/1000'] });
  const plan = planJob({ arms, topics, runs: 1, judge: 'j/y', prices });
  const budget = /** @type {number} */ (plan.total.usd) / 3;
  /* a judge that reports real-looking usage, so judging spends too */
  const costly = { pair: async (/** @type {any} */ c) => ({ ...(await fakeJudge.pair(c)), usage: { input: 3000, output: 300 } }), facts: async (/** @type {any} */ c) => ({ ...(await fakeJudge.facts(c)), usage: { input: 4800, output: 1500 } }) };
  const r = await runJob({ plan, outDir: dir, runId: 'test-budget', live: true, writerModel: mockWriter, judge: costly, fetch: dryFetch, prices, budget });
  assert.match(String(r.stopped), /^budget/);
  assert.ok(r.spent <= budget, `spent ${r.spent} of ${budget}`);
  assert.ok(r.pages.length > 0 && r.pages.length < arms.length * topics.length);
  const S = JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8'));
  assert.match(S.stopped, /^budget/); assert.match(readFileSync(join(dir, 'report.html'), 'utf8'), /Stopped early/);
}));

test("the owner's blind picks are read back through the review key", () => {
  const pages = ['a', 'b', 'c'].flatMap(arm => ['t1', 't2'].map(topic => ({ arm, topic, run: 1, text: `# ${topic} by ${arm}` })));
  const { pairs, key } = buildReview('r1', pages, ['a', 'b', 'c'], 7);
  assert.equal(pairs.length, 6); assert.equal(Object.keys(key.pairs).length, 6);
  const picks = Object.fromEntries(pairs.map(p => [p.id, key.pairs[p.id].left === 'a' ? 'left' : key.pairs[p.id].right === 'a' ? 'right' : 'tie']));
  const owner = readPicks(key, { runId: 'r1', picks });
  assert.equal(owner.length, 6);
  const w = winRates(['a', 'b', 'c'], owner);
  assert.equal(w[0].aWins, 2); assert.equal(w[1].aWins, 2); assert.equal(w[2].ties, 2);
  assert.throws(() => readPicks(key, { runId: 'other', picks }), /not r1/);
  assert.equal(mockPage({ title: 'x', q: false, ctx: '', bridge: null, lens: 'encyclopedic' }).startsWith('# X'), true);
});

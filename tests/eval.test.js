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
import { factParts, factPrompt, fakeJudge, plainPage, readFacts, readPair, tallyFacts } from '../scripts/eval/judge.js';
import { PRESETS, armsOf, loadTopics, planJob, planText, readPrices } from '../scripts/eval/plan.js';
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

test('judges: answers are read tolerantly, and claims tallied by part and by where their evidence was', async () => {
  assert.deepEqual(readPair('Sure! ```json\n{"winner": "b", "why": "more specific"}\n```'), { winner: 'B', scores: null, why: 'more specific' });
  assert.equal(readPair('{"winner": "Tie"}')?.winner, 'tie');
  assert.equal(readPair('{"winner": "C"}'), null); assert.equal(readPair('no json'), null);
  const f = readFacts(JSON.stringify({
    body: [{ claim: 'built 1911', verdict: 'Supported', where: 'lead' }, { claim: 'x', verdict: 'maybe' }, { claim: 'fired 550 rounds a minute', verdict: 'supported', where: 'REST' },
      { claim: 'BSA made 145,000', verdict: 'contradicted', where: 'rest', note: 'about 145,000 by BSA and Savage' }, { claim: 'nicknamed the Belgian rattlesnake', verdict: 'absent', where: 'rest' }],
    keyFacts: [{ claim: '13 kg', verdict: 'contradicted', where: 'lead', note: '12.7 kg' }, { claim: 'weighs 28 lb', verdict: 'supported' }],
    hooks: 'oops',
  }));
  assert.ok(f); assert.equal(f.body.length, 4); assert.equal(f.hooks.length, 0);
  assert.deepEqual(f.body.map(c => c.where), ['lead', 'rest', 'rest', null], 'an absent claim has no evidence anywhere');
  assert.equal(f.keyFacts[1].where, null, 'a settled claim without a readable "where" is never beyond the notes');
  const t = tallyFacts(f);
  assert.deepEqual({ n: t.all.n, c: t.all.contradicted, a: t.all.absent, sr: t.all.settledRest, cr: t.all.contradictedRest }, { n: 6, c: 2, a: 1, sr: 2, cr: 1 });
  assert.equal(t.all.contradictedRate, 2 / 6); assert.equal(t.all.beyondRate, 1 / 2); assert.equal(t.all.absentShare, 1 / 6);
  assert.equal(t.body.beyondRate, 1 / 2); assert.equal(t.keyFacts.contradictedRate, 1 / 2);
  assert.equal(t.keyFacts.beyondRate, null, 'nothing in the key facts was settled beyond the lead');
  assert.equal(t.hooks.contradictedRate, null); assert.equal(tallyFacts(null).all.n, 0);
  /* restating the notes can't move the headline: lead-settled claims stay out of it */
  const padded = readFacts(JSON.stringify({ body: [...Array(20)].map((_, i) => ({ claim: `lead fact ${i}`, verdict: 'supported', where: 'lead' })).concat([{ claim: 'invented', verdict: 'contradicted', where: 'rest' }]) }));
  assert.equal(tallyFacts(padded).all.beyondRate, 1); assert.ok(/** @type {number} */ (tallyFacts(padded).all.contradictedRate) < 0.05);
  const fake = readFacts((await fakeJudge.facts({ parts: { title: '', deck: '', body: 'In 1932 it was 3 mm, and 3,000 years later 77.', keyFacts: '', hooks: '' }, source: { title: 't', url: 'u', lead: 'In 1932, 3 mm.', rest: 'Then 3,000 years.' } })).text);
  assert.deepEqual(fake?.body.map(c => [c.claim, c.verdict, c.where]), [['1932', 'supported', 'lead'], ['3', 'supported', 'lead'], ['3,000', 'supported', 'rest'], ['77', 'absent', null]]);
  assert.match(factPrompt({ topic: 'T', parts: factParts(PAGE), source: { title: 'S', url: 'u', lead: 'LEAD TEXT', rest: 'REST TEXT' } }), /LEAD:\nLEAD TEXT\n\nREST:\nREST TEXT/);
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
/* every claim carries where its evidence was, and absent ones none */
const PARTS_OK = (/** @type {any} */ f) => ['body', 'keyFacts', 'hooks'].every(p => f[p].every((/** @type {any} */ c) => (c.verdict === 'absent' ? c.where === null : ['lead', 'rest'].includes(c.where))));

test('presets: "first" is the default and a small first look; "full" is everything; the judge can be any model', async () => {
  const out = /** @type {string[]} */ ([]);
  assert.equal(await main(['plan', '--brief'], { log: s => out.push(s) }), 0);
  const first = out.join('\n');
  assert.match(first, /preset first\): 5 arms x 12 topics x 1 run\./);
  assert.match(first, /A FIRST LOOK, NOT A VERDICT/);
  assert.match(first, /automatic checks only, no judge call: base@\S+ vs split@/);
  assert.match(first, /^writers\s+60\s/m); assert.match(first, /^judges \(anthropic\/claude-opus-5\.5\)\s+84\s/m); assert.match(first, /^total\s+144\s/m);
  const T = loadTopics(); const ids = PRESETS.first.topics;
  assert.deepEqual([...new Set(ids.map(id => T.find(t => t.id === id)?.kind))].sort(), Object.keys(KIND_SHAPE).sort(), 'one topic per kind');
  const arms = armsOf(PRESETS.first.variants, ['m/x']);
  const P = planJob({ arms, topics: T.filter(t => ids.includes(t.id)), runs: 1, judge: 'cheap/judge', pairs: PRESETS.first.pairs, auto: PRESETS.first.auto, facts: PRESETS.first.facts });
  const pairs = P.calls.filter(c => c.type === 'pair').map(c => /** @type {any} */ (c)).map(c => `${c.a.variant}|${c.b.variant}`);
  assert.deepEqual([...new Set(pairs)], ['split|lean', 'split|grounded', 'split|hooks-tight']);
  assert.deepEqual([...new Set(P.calls.filter(c => c.type === 'facts').map(c => /** @type {any} */ (c).arm.variant))], ['split', 'lean', 'grounded', 'hooks-tight']);
  assert.ok(P.calls.filter(c => c.type !== 'writer').every(c => c.model === 'cheap/judge'));
  assert.match(planText(P, { list: false }), /^judges \(cheap\/judge\)/m);
  const full = /** @type {string[]} */ ([]);
  await main(['plan', '--brief', '--preset', 'full', '--judge', 'cheap/judge'], { log: s => full.push(s) });
  assert.match(full.join('\n'), /5 arms x 29 topics x 2 runs/); assert.match(full.join('\n'), /^total\s+1160\s/m); assert.match(full.join('\n'), /^judges \(cheap\/judge\)\s+870\s/m);
  await assert.rejects(main(['plan', '--preset', 'huge']), /unknown preset/);
  const small = /** @type {string[]} */ ([]);
  await main(['plan', '--brief', '--source-tokens', '1000'], { log: s => small.push(s) });
  assert.match(small.join('\n'), /Fact-check source: ~1,000 tokens/);
});

test('the first preset runs dry end to end: auto-only base vs split, judged pairs, and the first-look warning', () => inTemp(async dir => {
  const T = loadTopics().filter(t => ['benfords-law', 'escapement'].includes(t.id));
  const arms = armsOf(PRESETS.first.variants, ['m/x']);
  const plan = planJob({ arms, topics: T, runs: 1, judge: 'j/y', pairs: PRESETS.first.pairs, auto: PRESETS.first.auto, facts: PRESETS.first.facts, preset: 'first', note: PRESETS.first.note });
  const r = await runJob({ plan, outDir: dir, runId: 'test-first', live: false, writerModel: mockWriter, judge: fakeJudge, fetch: dryFetch });
  assert.equal(r.pages.length, 10); assert.equal(r.pairs.length, 6);
  assert.equal(r.pages.filter(p => p.facts).length, 8, 'base is not fact-checked');
  const S = r.summary;
  assert.deepEqual(S.auto.map((/** @type {any} */ w) => [w.a, w.b, w.n]), [['base@m/x', 'split@m/x', 2]]);
  assert.deepEqual(S.pairwise.map((/** @type {any} */ w) => [w.a, w.b].sort().join(' vs ')).sort(), ['grounded@m/x vs split@m/x', 'hooks-tight@m/x vs split@m/x', 'lean@m/x vs split@m/x']);
  assert.match(S.presetNote, /FIRST LOOK, NOT A VERDICT/);
  const report = readFileSync(join(dir, 'report.html'), 'utf8');
  assert.match(report, /FIRST LOOK, NOT A VERDICT/); assert.match(report, /Automatic checks only/); assert.match(report, /beyond the notes/);
  const key = JSON.parse(readFileSync(join(dir, 'review-key.json'), 'utf8'));
  assert.equal(Object.keys(key.pairs).length, 6, 'Will reviews the judged pairs, not every pair');
}));

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
  assert.ok(p.usage.output > 0 && p.score.usable && p.facts.all.n > 0);
  assert.ok(r.pages.some(x => x.facts?.all.settledRest > 0), 'some claims are settled beyond the lead');
  const grounded = r.pages.find(x => x.variant === 'grounded' && x.topic === 'axolotl');
  assert.equal(grounded.notes.url, 'https://en.wikipedia.org/wiki/Axolotls');
  assert.equal(typeof grounded.notes.isLead, 'boolean');
  const facts = readFileSync(join(dir, 'judgements.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(j => j.type === 'facts');
  assert.ok(facts.every(j => PARTS_OK(j.parsed)));
  assert.equal(r.pages.find(x => x.variant === 'grounded' && x.topic === 'why-cats-purr').notes, null, 'a question gets no notes');
  const S = JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8'));
  assert.match(S.note, /DRY RUN/); assert.equal(S.pairwise.length, 1);
  assert.ok(S.pairwise.every((/** @type {any} */ w) => w.verdict === 'not significant'));
  assert.ok(S.perArm['base@m/x'].compliance.mean > 0);
  assert.equal(S.measures[0].key, 'beyondRate_all', 'the headline accuracy number comes first');
  for (const k of ['beyondRate', 'contradictedRate', 'absentShare']) for (const part of ['all', 'body', 'keyFacts', 'hooks']) assert.ok(`${k}_${part}` in S.perArm['grounded@m/x'], `${k}_${part}`);
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

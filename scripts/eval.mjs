// The writer eval: arms (writer variant x model) x topics x runs, scored automatically, fact-checked against
// Wikipedia and compared blind in pairs. See docs/eval-plan.md.
//
//   node scripts/eval.mjs plan [options]            the exact job and its estimated tokens; spends nothing
//   node scripts/eval.mjs run --dry [options]       the whole pipeline on the mock writer and a fake judge; spends nothing
//   node scripts/eval.mjs run --live --yes-spend --budget <dollars> --prices <file> [options]
//                                                   spends money: only with Will's go on the printed plan
//   node scripts/eval.mjs run --live --via claude --yes-spend --budget <dollars> --price <model>=<in>/<out> ...
//                                                   the same run on the Claude subscription the local `claude` CLI is
//                                                   signed in to: no dollars; the budget, at list prices, bounds the tokens
//   ... --judge-via claude                          only the judges on the subscription, the writers on the gateway:
//                                                   the judges are nearly all of a run's cost, and the CLI cannot turn a
//                                                   writer's thinking off, which production's writer needs
//   node scripts/eval.mjs picks <run dir> <picks.json>   read Will's blind picks (exported from review.html) back in
//
// Options: --preset first | full   first (the default): 4 arms, 12 topics, 1 run, a few judged pairs; full: everything, twice
//          --arms base,split[@model]   variants, crossed with --models (default: today's free writer); judges every pair
//          --models a,b   --topics id,id | file.json   --runs n   --judge model (any id; a cheaper judge is fine)
//          --source-tokens n   a fact check's source, lead and rest (default 6000)
//          --prices file.json ({"model": {"in": usd/M, "out": usd/M}})   --price model=in/out (repeatable)
//          --no-pairwise  --no-factcheck  --brief (plan: totals only)  --out dir (default .eval/<run id>)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGE_VARIANTS } from '../lib/prompts.js';
import { mockModel } from '../lib/mock.js';
import { DEFAULT_JUDGE, DEFAULT_MODELS, DEFAULT_RUNS, PRESETS, SOURCE_TOKENS, armsOf, loadTopics, planJob, planText, readPrices, usd } from './eval/plan.js';
import { fakeJudge } from './eval/judge.js';
import { askJudge } from './eval/writer.js';
import { claudeCli } from './eval/claude-cli.js';
import { readPicks, runJob, spendGate } from './eval/run.js';
import { summarize } from './eval/summary.js';
import { reportHtml } from './eval/report.js';

const repo = fileURLToPath(new URL('..', import.meta.url));

/** @param {string[]} argv */
export function parseArgs(argv) {
  /** @type {Record<string, any>} */ const o = { _: [], price: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { o._.push(a); continue; }
    const k = a.slice(2);
    if (['dry', 'live', 'yes-spend', 'no-pairwise', 'no-factcheck', 'brief'].includes(k)) { o[k] = true; continue; }
    const v = argv[++i]; if (v === undefined) throw new Error(`${a} needs a value`);
    if (k === 'price') o.price.push(v); else o[k] = v;
  }
  return o;
}
/** @param {string | undefined} s */
const list = s => (s ? String(s).split(',').map(x => x.trim()).filter(Boolean) : undefined);

/* A preset sets arms, topics, runs and what is judged; --arms, --topics and --runs override it, and naming
   your own --arms judges every pair of them and fact-checks all of them. */
/** @param {Record<string, any>} o */
export function jobOf(o) {
  const name = o.preset || 'first';
  const preset = PRESETS[/** @type {keyof typeof PRESETS} */ (name)]; if (!preset) throw new Error(`unknown preset "${name}" (known: ${Object.keys(PRESETS).join(', ')})`);
  let topics = o.topics && /\.json$/.test(o.topics) ? loadTopics(o.topics) : loadTopics();
  const only = o.topics && !/\.json$/.test(o.topics) ? list(o.topics) : o.topics ? null : preset.topics;
  if (only) { const miss = only.filter(id => !topics.some(t => t.id === id)); if (miss.length) throw new Error(`unknown topics: ${miss.join(', ')}`); topics = topics.filter(t => only.includes(t.id)); }
  const ownArms = list(o.arms);
  const arms = armsOf(ownArms || preset.variants || Object.keys(PAGE_VARIANTS), list(o.models) || DEFAULT_MODELS);
  const runs = o.runs ? Number(o.runs) : preset.runs ?? DEFAULT_RUNS; if (!(runs >= 1 && Number.isInteger(runs))) throw new Error('--runs wants a whole number');
  const sourceTokens = o['source-tokens'] ? Number(o['source-tokens']) : SOURCE_TOKENS; if (!(sourceTokens >= 500)) throw new Error('--source-tokens wants a number of at least 500');
  const prices = readPrices({ file: o.prices, flags: o.price });
  const plan = planJob({ arms, topics, runs, judge: o.judge || DEFAULT_JUDGE, prices, pairwise: !o['no-pairwise'], factcheck: !o['no-factcheck'],
    pairs: ownArms ? 'all' : preset.pairs, auto: ownArms ? [] : preset.auto, facts: ownArms ? 'all' : preset.facts, sourceTokens, preset: name,
    note: o.topics || o.runs || ownArms ? '' : preset.note });
  return { plan, prices };
}

/* A stand-in for Wikipedia in a dry run: no request leaves the machine. */
/** @type {typeof fetch} */
export const dryFetch = /** @type {any} */ (async (/** @type {string} */ url) => {
  const title = new URL(url).searchParams.get('titles') || 'the topic';
  const lead = `${title} is described here by a stand-in source, written for a dry run of the eval so that nothing is fetched. It mentions about 3 mm and the year 1932, so a fact check has numbers to find. A second sentence adds that the source is not real, and a third that every judgement made against it is fake.`;
  const rest = 'Further down, the stand-in article mentions a span of 3,000 years, sixteen topics and 0 real words, so some claims are settled only beyond the lead.';
  const extract = new URL(url).searchParams.get('exintro') === '1' ? lead : `${lead}\n\n\n== More ==\n${rest}`;
  return { ok: true, status: 200, json: async () => ({ query: { pages: [{ title, extract }] } }) };
});

/** @param {string} mode */
const runIdOf = mode => `${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}-${mode}`;

/** @param {string[]} argv @param {{ log?: (s: string) => void }} [io] */
export async function main(argv, { log = console.log } = {}) {
  const o = parseArgs(argv); const cmd = o._[0];
  if (cmd === 'plan') {
    const { plan } = jobOf(o);
    log(planText(plan, { list: !o.brief }));
    return 0;
  }
  if (cmd === 'run') {
    if (!!o.dry === !!o.live) throw new Error('run wants exactly one of --dry or --live');
    const { plan, prices } = jobOf(o);
    log(planText(plan, { list: false }));
    const live = !!o.live;
    const via = o.via || 'gateway'; if (via !== 'gateway' && via !== 'claude') throw new Error('--via wants gateway or claude');
    const judgeVia = o['judge-via'] || via; if (judgeVia !== 'gateway' && judgeVia !== 'claude') throw new Error('--judge-via wants gateway or claude');
    if ((via === 'claude' || judgeVia === 'claude') && !live) throw new Error('--via claude goes with --live: a dry run calls no model');
    if (live) {
      const budget = o.budget === undefined ? null : Number(o.budget);
      const why = spendGate({ yesSpend: !!o['yes-spend'], budget }, plan);
      if (why) { log(`Refusing to start: ${why}.`); return 2; }
    }
    const runId = o.id || runIdOf(live ? 'live' : 'dry');
    const outDir = o.out || join(repo, '.eval', runId);
    const { summary, stopped } = await runJob({
      plan, outDir, runId, live, prices, budget: live ? Number(o.budget) : null, log,
      writerModel: live ? (via === 'claude' ? arm => claudeCli(arm.model) : arm => arm.model) : (_arm, input) => mockModel({ task: 'page', input, pace: 'fast' }),
      judge: live ? liveJudge(judgeVia === 'claude' ? claudeCli(plan.judge) : plan.judge) : fakeJudge,
      fetch: live ? globalThis.fetch : dryFetch,
    });
    log(`\n${summary.note ? summary.note + '\n' : ''}Wrote ${outDir}: pages/, pages.jsonl, judgements.jsonl, summary.json, report.html, review.html (review-key.json maps review pairs to arms: don't open it before reviewing).`);
    if (via === 'claude') log('Run on the Claude subscription through the local CLI: no dollars were spent; the figure below is what the same tokens cost at list prices.');
    else if (judgeVia === 'claude') log('Judged on the Claude subscription through the local CLI: only the writers spent dollars; the figure below prices every token at list.');
    log(`Tokens: writer ${summary.tokens.writer.input} in, ${summary.tokens.writer.output} out; judge ${summary.tokens.judge.input} in, ${summary.tokens.judge.output} out; ${usd(summary.usd)}.`);
    if (stopped) log(`Stopped early: ${stopped}`);
    return 0;
  }
  if (cmd === 'picks') {
    const [, dir, file] = o._; if (!dir || !file) throw new Error('picks wants <run dir> <picks.json>');
    const key = JSON.parse(readFileSync(join(dir, 'review-key.json'), 'utf8'));
    const owner = readPicks(key, JSON.parse(readFileSync(file, 'utf8')));
    const prev = JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8'));
    const pages = existsSync(join(dir, 'pages.jsonl')) ? readFileSync(join(dir, 'pages.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
    const J = readFileSync(join(dir, 'judgements.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
    const pairs = J.filter(j => j.type === 'pair' && j.winner !== 'invalid'), auto = J.filter(j => j.type === 'auto');
    const S = { ...summarize({ runId: prev.runId, mode: prev.mode, arms: prev.arms, pages, pairs, auto, tokens: prev.tokens, usd: prev.usd, stopped: prev.stopped, planned: prev.planned, owner, preset: prev.preset, presetNote: prev.presetNote }), createdAt: prev.createdAt };
    writeFileSync(join(dir, 'summary.json'), JSON.stringify(S, null, 2));
    writeFileSync(join(dir, 'report.html'), reportHtml(S));
    log(`Read ${owner.length} picks into ${join(dir, 'summary.json')} and report.html.`);
    return 0;
  }
  log('usage: node scripts/eval.mjs plan | run --dry | run --live [--via claude] --yes-spend --budget <dollars> | picks <run dir> <picks.json>  (see the top of scripts/eval.mjs)');
  return cmd ? 1 : 0;
}

/** @param {import('ai').LanguageModel} model @returns {import('./eval/run.js').Judge} */
const liveJudge = model => ({
  pair: c => askJudge({ model, prompt: c.prompt, maxTokens: 800 }),
  facts: c => askJudge({ model, prompt: c.prompt, maxTokens: 3000 }),
});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code; }, e => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; });
}

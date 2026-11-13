// The pipeline: write every arm's page for a topic, fact-check each against the topic's source, compare
// every pair of arms blind, then summarize and render. Everything that could spend is injected (the writer's
// model, the judge, fetch), so a dry run and the tests drive the same code a live run would.
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { composePage, pageInput } from '../../lib/prompts.js';
import { referenceNotes } from '../../lib/grounding.js';
import { checksOf, compliance, scorePage } from './score.js';
import { factParts, factPrompt, pairPrompt, plainPage, readFacts, readPair, tallyFacts } from './judge.js';
import { dollars, SOURCE_TOKENS } from './plan.js';
import { hashOf, rng } from './stats.js';
import { summarize } from './summary.js';
import { reportHtml, reviewHtml } from './report.js';
import { streamPage } from './writer.js';

/** @param {string} s */
export const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* The spend gate for a live run: both flags, a budget that covers the plan's estimate, and a price for every model. */
/** @param {{ yesSpend?: boolean, budget?: number | null }} flags @param {{ total: { usd: number | null } }} plan @returns {string | null} why it refuses, or null */
export function spendGate({ yesSpend, budget }, plan) {
  if (!yesSpend) return 'a live run spends money: add --yes-spend once Will has approved this plan';
  if (budget == null || !Number.isFinite(budget) || budget <= 0) return 'a live run needs --budget <dollars>';
  if (plan.total.usd == null) return 'price unknown for at least one model: supply --prices <file> or --price model=in/out, so the budget can be checked';
  if (plan.total.usd > budget) return `the plan's estimate ($${plan.total.usd.toFixed(2)}) is over the budget ($${budget.toFixed(2)})`;
  return null;
}

/**
 * @typedef {{ text: string, usage: { input: number, output: number } }} JudgeAnswer
 * @typedef {{ pair: (c: { prompt: string, left: string, right: string, leftScore: number, rightScore: number }) => Promise<JudgeAnswer>,
 *   facts: (c: { prompt: string, parts: ReturnType<typeof factParts>, source: { title: string, url: string, text: string } }) => Promise<JudgeAnswer> }} Judge
 */

/**
 * @param {{ plan: ReturnType<typeof import('./plan.js').planJob>, outDir: string, runId: string, live: boolean,
 *   writerModel: (arm: import('./plan.js').Arm, input: any) => import('ai').LanguageModel, judge: Judge, fetch: typeof fetch,
 *   prices?: import('./plan.js').Prices, budget?: number | null, seed?: number, log?: (s: string) => void }} o
 */
export async function runJob({ plan, outDir, runId, live, writerModel, judge, fetch, prices = {}, budget = null, seed = 7, log = () => {} }) {
  mkdirSync(outDir, { recursive: true });
  const { arms, topics, runs } = plan;
  /** @type {any[]} */ const pages = []; /** @type {any[]} */ const pairs = [];
  const tokens = { writer: { input: 0, output: 0 }, judge: { input: 0, output: 0 } };
  let spent = 0; /** @type {string | null} */ let stopped = null;
  /* dollars only when every model in the job has a price, so a partial sum never passes for the cost */
  const priced = plan.total.usd != null;
  /* the budget, checked before every call at its worst case (its output limit) and after it at what it really used */
  /** @param {string} model @param {number} tin @param {number} maxOut */
  const affordable = (model, tin, maxOut) => {
    if (!live || budget == null) return true;
    const d = dollars(prices, model, tin, maxOut);
    if (d == null || spent + d > budget) { stopped = `budget: $${spent.toFixed(4)} spent of $${budget.toFixed(2)}; the next call could pass it`; return false; }
    return true;
  };
  /** @param {'writer' | 'judge'} who @param {string} model @param {{ input: number, output: number }} u */
  const account = (who, model, u) => {
    tokens[who].input += u.input; tokens[who].output += u.output;
    const d = dollars(prices, model, u.input, u.output); if (d != null) spent += d;
  };
  const sources = new Map();
  /** @param {import('./plan.js').Topic} t */
  const sourceOf = async t => {
    if (!sources.has(t.id)) sources.set(t.id, t.source ? await referenceNotes(t.source, { fetch, intro: false, maxTokens: SOURCE_TOKENS, timeoutMs: 5000 }) : null);
    return sources.get(t.id);
  };
  const pagesFile = join(outDir, 'pages.jsonl'); const judgeFile = join(outDir, 'judgements.jsonl');
  writeFileSync(pagesFile, ''); writeFileSync(judgeFile, '');

  outer: for (let run = 1; run <= runs; run++) for (const topic of topics) {
    const input = pageInput(topic.input);
    /** @type {Map<string, any>} */ const here = new Map();
    for (const arm of arms) {
      const call = plan.calls.find(c => c.type === 'writer' && c.arm.id === arm.id && c.topic.id === topic.id && c.run === run);
      const notes = composePage(input, arm.variant).ground ? await referenceNotes(String(topic.input.title), { fetch }) : null;
      const c = composePage(input, arm.variant, { notes });
      if (!affordable(arm.model, call ? call.in : 0, c.maxTokens)) { pages.push(...here.values()); break outer; }
      const r = await streamPage({ model: writerModel(arm, input), system: c.system, prompt: c.prompt, maxTokens: c.maxTokens });
      account('writer', arm.model, r.usage);
      const file = join('pages', topic.id, `run${run}`, `${slug(arm.id)}.txt`);
      mkdirSync(join(outDir, 'pages', topic.id, `run${run}`), { recursive: true });
      writeFileSync(join(outDir, file), r.text);
      const score = scorePage(r.text, { input });
      const checks = checksOf(score);
      const rec = { arm: arm.id, variant: arm.variant, model: arm.model, topic: topic.id, run, file, ms: r.ms, usage: r.usage, finish: r.finish, error: r.error,
        notes: notes ? { title: notes.title, url: notes.url, tokens: notes.tokens } : null, score, compliance: compliance(score),
        failed: Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k), facts: /** @type {any} */ (null), text: r.text };
      here.set(arm.id, rec);
      log(`write  ${topic.id} run ${run} ${arm.id}: ${r.text.length} chars, first ${Math.round(r.ms.first ?? -1)} ms, ${r.usage.output} out tokens${r.error ? `, ERROR ${r.error}` : ''}`);
    }
    /* fact check: each page against the topic's source */
    const source = await sourceOf(topic);
    for (const rec of here.values()) {
      if (!source || !rec.text) continue;
      const parts = factParts(rec.text);
      const prompt = factPrompt({ topic: String(topic.input.title), parts, source });
      const call = plan.calls.find(c => c.type === 'facts' && c.arm.id === rec.arm && c.topic.id === topic.id && c.run === run);
      if (!call) continue;
      if (!affordable(call.model, call.in, call.maxOut)) { pages.push(...here.values()); break outer; }
      const ans = await judge.facts({ prompt, parts, source });
      account('judge', call.model, ans.usage);
      const f = readFacts(ans.text);
      rec.facts = f ? tallyFacts(f) : null;
      appendFileSync(judgeFile, JSON.stringify({ type: 'facts', topic: topic.id, run, arm: rec.arm, source: { title: source.title, url: source.url }, parsed: f, raw: f ? undefined : ans.text }) + '\n');
    }
    /* blind pairwise: sides drawn at random, arm names never shown */
    for (const call of plan.calls) {
      if (call.type !== 'pair' || call.topic.id !== topic.id || call.run !== run) continue;
      const A = here.get(call.a.id), B = here.get(call.b.id); if (!A || !B) continue;
      const swap = rng(seed ^ hashOf(`${topic.id}|${run}|${call.a.id}|${call.b.id}`))() < 0.5;
      const [L, R] = swap ? [B, A] : [A, B];
      const left = plainPage(L.text), right = plainPage(R.text);
      if (!affordable(call.model, call.in, call.maxOut)) { pages.push(...here.values()); break outer; }
      const ans = await judge.pair({ prompt: pairPrompt({ topic: String(topic.input.title), left, right }), left, right, leftScore: L.compliance, rightScore: R.compliance });
      account('judge', call.model, ans.usage);
      const v = readPair(ans.text);
      const winner = !v ? 'invalid' : v.winner === 'tie' ? 'tie' : v.winner === 'A' ? L.arm : R.arm;
      const rec = { topic: topic.id, run, a: call.a.id, b: call.b.id, left: L.arm, right: R.arm, winner, why: v?.why || '', scores: v?.scores || null };
      pairs.push(rec);
      appendFileSync(judgeFile, JSON.stringify({ type: 'pair', ...rec, raw: v ? undefined : ans.text }) + '\n');
    }
    pages.push(...here.values());
    if (live && budget != null && spent >= budget) { stopped = `budget: $${spent.toFixed(4)} spent of $${budget.toFixed(2)}`; break outer; }
  }

  for (const p of pages) { const { text, ...rest } = p; appendFileSync(pagesFile, JSON.stringify(rest) + '\n'); }
  const summary = summarize({ runId, mode: live ? 'live' : 'dry', arms: arms.map(a => a.id), pages, pairs: pairs.filter(p => p.winner !== 'invalid'), tokens,
    usd: priced ? spent : null, stopped, planned: { calls: plan.calls.length, usd: plan.total.usd } });
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  writeFileSync(join(outDir, 'report.html'), reportHtml(summary));
  /* the owner's blind review: run 1, every topic, every pair of arms, sides drawn afresh */
  const review = buildReview(runId, pages.filter(p => p.run === 1), arms.map(a => a.id), seed);
  writeFileSync(join(outDir, 'review-key.json'), JSON.stringify(review.key, null, 2));
  writeFileSync(join(outDir, 'review.html'), reviewHtml(runId, review.pairs));
  if (stopped) log(`STOPPED: ${stopped}`);
  return { summary, pages, pairs, stopped, spent, tokens };
}

/** @param {string} runId @param {any[]} pages @param {string[]} arms @param {number} seed */
export function buildReview(runId, pages, arms, seed) {
  /** @type {{ id: string, topic: string, left: string, right: string }[]} */ const pairs = [];
  /** @type {Record<string, { topic: string, left: string, right: string }>} */ const key = {};
  const r = rng(seed * 31 + 5);
  const topics = [...new Set(pages.map(p => p.topic))];
  for (const t of topics) for (let i = 0; i < arms.length; i++) for (let j = i + 1; j < arms.length; j++) {
    const A = pages.find(p => p.topic === t && p.arm === arms[i]), B = pages.find(p => p.topic === t && p.arm === arms[j]);
    if (!A || !B) continue;
    const [L, R] = r() < 0.5 ? [A, B] : [B, A];
    const id = `p${String(pairs.length + 1).padStart(3, '0')}`;
    pairs.push({ id, topic: t, left: L.text, right: R.text });
    key[id] = { topic: t, left: L.arm, right: R.arm };
  }
  /* shuffle the order too, so neighbouring pairs don't give an arm away */
  for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]]; }
  return { pairs, key: { runId, pairs: key } };
}

/* The owner's picks (exported from review.html) read back in: each pick mapped to an arm through the key. */
/** @param {{ runId: string, pairs: Record<string, { topic: string, left: string, right: string }> }} key @param {{ runId?: string, picks: Record<string, string> }} exported */
export function readPicks(key, exported) {
  if (exported.runId && exported.runId !== key.runId) throw new Error(`these picks are for run ${exported.runId}, not ${key.runId}`);
  const out = [];
  for (const [id, pick] of Object.entries(exported.picks || {})) {
    const k = key.pairs[id]; if (!k || !['left', 'right', 'tie'].includes(pick)) continue;
    const [a, b] = [k.left, k.right].sort();
    out.push({ topic: k.topic, run: 1, a, b, winner: pick === 'tie' ? 'tie' : pick === 'left' ? k.left : k.right });
  }
  return out;
}

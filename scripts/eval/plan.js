// The job: arms (variant x model) x topics x runs, every call it makes, and what those calls would cost.
// Nothing here calls anything: it is arithmetic on prompt lengths, so `plan` is free.
import { readFileSync } from 'node:fs';
import { PAGE_VARIANTS, composePage, pageInput } from '../../lib/prompts.js';
import { RECORDED } from '../../lib/recorded.js';
import { factPrompt, pairPrompt } from './judge.js';

/* The writer production uses for free pages today (docs/eval-plan.md); override with --models. */
export const DEFAULT_MODELS = ['anthropic/claude-haiku-5.5'];
/* A judge from a stronger tier; override with --judge. */
export const DEFAULT_JUDGE = 'anthropic/claude-opus-5.5';
export const DEFAULT_RUNS = 2;

/* Presets: `first` is the default, a small first look to put in front of Will; `full` is every pair and every
   fact check over the whole topic set, twice. Pairs and fact checks name variants, matched within one model.
   `auto` pairs are compared on the automatic checks only, with no judge call (base and split are the same words). */
export const PRESETS = {
  first: {
    variants: ['base', 'split', 'grounded', 'hooks-tight'],
    /* one per kind in KIND_SHAPE: of each pair in topics.json, the one whose numbers are easiest to get wrong */
    topics: ['benfords-law', 'sonoluminescence', 'escapement', 'lost-wax-casting', 'wow-signal', 'prince-ruperts-drop',
      'darvaza', 'halifax-explosion', 'carboniferous', 'ramanujan', 'greenland-shark', 'bayeux-tapestry'],
    runs: 1,
    pairs: /** @type {[string, string][]} */ ([['split', 'grounded'], ['split', 'hooks-tight']]),
    auto: /** @type {[string, string][]} */ ([['base', 'split']]),
    facts: ['split', 'grounded', 'hooks-tight'],
    note: 'A FIRST LOOK, NOT A VERDICT: 12 topics at one run each cannot separate writers that differ by a few points. Read it for large gaps and broken pages; decide with the full preset.',
  },
  full: { variants: null, topics: null, runs: 2, pairs: /** @type {'all'} */ ('all'), auto: /** @type {[string, string][]} */ ([]), facts: /** @type {'all'} */ ('all'), note: '' },
};

/* about four characters a token in English; every token figure here is an estimate, marked "~" */
export const CHARS_PER_TOKEN = 4;
/** @param {string} s */
export const tokensOf = s => Math.ceil(String(s || '').length / CHARS_PER_TOKEN);
/* a page's length, from the real writer output the mock replays (lib/recorded.js): no guess */
export const PAGE_OUT = Math.round(RECORDED.reduce((a, r) => a + tokensOf(r.text), 0) / RECORDED.length);
export const NOTES_TOKENS = 500;    // the grounded variant's notes, at most (lib/grounding.js)
export const SOURCE_TOKENS = 6000;  // a fact check's source: lead and rest of the article, clipped (--source-tokens)
export const PAIR_OUT = 300;
export const FACT_OUT = 1500;

/** @typedef {{ id: string, kind: string, input: Record<string, unknown>, source?: string, numbers?: boolean, why?: string }} Topic */
/** @typedef {{ id: string, variant: string, model: string }} Arm */

/** @param {string} [file] @returns {Topic[]} */
export const loadTopics = (file = new URL('./topics.json', import.meta.url).pathname) => JSON.parse(readFileSync(file, 'utf8')).topics;

/* "--arms base,split" crossed with "--models a,b"; an arm that names its own model ("split@a") keeps it. */
/** @param {string[]} [variants] @param {string[]} [models] @returns {Arm[]} */
export function armsOf(variants = Object.keys(PAGE_VARIANTS), models = DEFAULT_MODELS) {
  /** @type {Arm[]} */ const out = [];
  for (const v of variants) {
    const [variant, own] = v.split('@');
    if (!PAGE_VARIANTS[variant]) throw new Error(`unknown variant "${variant}" (known: ${Object.keys(PAGE_VARIANTS).join(', ')})`);
    for (const model of own ? [own] : models) { const id = `${variant}@${model}`; if (!out.some(a => a.id === id)) out.push({ id, variant, model }); }
  }
  return out;
}

/** @typedef {{ in: number, out: number }} Price  USD per million tokens */
/** @typedef {Record<string, Price>} Prices */
/* Prices only from a file or flags: a price nobody supplied is unknown, never guessed. */
/** @param {{ file?: string, flags?: string[] }} o @returns {Prices} */
export function readPrices({ file, flags = [] }) {
  /** @type {Prices} */ const P = {};
  if (file) for (const [m, p] of Object.entries(JSON.parse(readFileSync(file, 'utf8')))) if (m !== 'note' && p && typeof p === 'object') P[m] = { in: Number(/** @type {any} */ (p).in), out: Number(/** @type {any} */ (p).out) };
  for (const f of flags) { const m = /^(.+)=([\d.]+)\/([\d.]+)$/.exec(f); if (!m) throw new Error(`--price wants model=in/out (USD per million tokens), got "${f}"`); P[m[1]] = { in: +m[2], out: +m[3] }; }
  for (const [m, p] of Object.entries(P)) if (!(p.in >= 0 && p.out >= 0)) throw new Error(`bad price for ${m}`);
  return P;
}
/** @param {Prices} prices @param {string} model @param {number} tin @param {number} tout @returns {number | null} */
export const dollars = (prices, model, tin, tout) => (prices[model] ? (tin * prices[model].in + tout * prices[model].out) / 1e6 : null);

/**
 * @typedef {{ type: 'writer', arm: Arm, topic: Topic, run: number, model: string, in: number, out: number, maxOut: number }} WriterCall
 * @typedef {{ type: 'pair', a: Arm, b: Arm, topic: Topic, run: number, model: string, in: number, out: number, maxOut: number }} PairCall
 * @typedef {{ type: 'facts', arm: Arm, topic: Topic, run: number, model: string, in: number, out: number, maxOut: number }} FactCall
 * @typedef {WriterCall | PairCall | FactCall} Call
 */


/* Which pairs of arms a spec names: 'all', or [variant, variant] pairs matched within one model. */
/** @param {Arm[]} arms @param {'all' | [string, string][]} spec @returns {[Arm, Arm][]} */
export function pairsOf(arms, spec) {
  /** @type {[Arm, Arm][]} */ const out = [];
  if (spec === 'all') { for (let i = 0; i < arms.length; i++) for (let j = i + 1; j < arms.length; j++) out.push([arms[i], arms[j]]); return out; }
  for (const [x, y] of spec) for (const a of arms) for (const b of arms) if (a.variant === x && b.variant === y && a.model === b.model) out.push([a, b]);
  return out;
}

/**
 * Every call a job makes, with estimated tokens, and the totals (writers and judges apart).
 * @param {{ arms: Arm[], topics: Topic[], runs: number, judge: string, prices?: Prices, pairwise?: boolean, factcheck?: boolean,
 *   pairs?: 'all' | [string, string][], auto?: [string, string][], facts?: 'all' | string[], sourceTokens?: number, preset?: string, note?: string }} o
 */
export function planJob({ arms, topics, runs, judge, prices = {}, pairwise = true, factcheck = true, pairs = 'all', auto = [], facts = 'all', sourceTokens = SOURCE_TOKENS, preset = '', note = '' }) {
  /** @type {Call[]} */ const calls = [];
  const pairFixed = tokensOf(pairPrompt({ topic: '', left: '', right: '' }));
  const factFixed = tokensOf(factPrompt({ topic: '', parts: { title: '', deck: '', body: '', keyFacts: '', hooks: '' }, source: { title: '', url: '', lead: '', rest: '' } }));
  const judged = pairwise ? pairsOf(arms, pairs) : [];
  const autoPairs = pairsOf(arms, auto);
  const checked = factcheck ? arms.filter(a => facts === 'all' || facts.includes(a.variant)) : [];
  for (let run = 1; run <= runs; run++) for (const topic of topics) {
    const input = pageInput(topic.input);
    for (const arm of arms) {
      const c = composePage(input, arm.variant);
      calls.push({ type: 'writer', arm, topic, run, model: arm.model, in: tokensOf(`${c.system || ''}\n\n${c.prompt}`) + (c.ground ? NOTES_TOKENS : 0), out: Math.min(PAGE_OUT, c.maxTokens), maxOut: c.maxTokens });
    }
    for (const [a, b] of judged) calls.push({ type: 'pair', a, b, topic, run, model: judge, in: pairFixed + tokensOf(topic.input.title) + 2 * Math.round(PAGE_OUT * 0.85), out: PAIR_OUT, maxOut: 800 });
    for (const arm of checked) calls.push({ type: 'facts', arm, topic, run, model: judge, in: factFixed + tokensOf(topic.input.title) + PAGE_OUT + sourceTokens, out: FACT_OUT, maxOut: 3000 });
  }
  /** @type {Map<string, { label: string, model: string, n: number, in: number, out: number, usd: number | null, judge: boolean }>} */ const groups = new Map();
  for (const c of calls) {
    const label = c.type === 'writer' ? `writer ${c.arm.id}` : c.type === 'pair' ? 'judge: blind pairwise' : 'judge: fact check';
    const g = groups.get(label) || { label, model: c.model, n: 0, in: 0, out: 0, usd: 0, judge: c.type !== 'writer' };
    g.n++; g.in += c.in; g.out += c.out;
    const d = dollars(prices, c.model, c.in, c.out); g.usd = g.usd == null || d == null ? null : g.usd + d;
    groups.set(label, g);
  }
  const G = [...groups.values()];
  /** @param {typeof G} gs */
  const sum = gs => ({ n: gs.reduce((a, g) => a + g.n, 0), in: gs.reduce((a, g) => a + g.in, 0), out: gs.reduce((a, g) => a + g.out, 0), usd: gs.every(g => g.usd != null) ? gs.reduce((a, g) => a + /** @type {number} */ (g.usd), 0) : null });
  const total = sum(G), writers = sum(G.filter(g => !g.judge)), judges = sum(G.filter(g => g.judge));
  /* the worst case: every call writes to its output limit, for the spend gate */
  const ceiling = calls.every(c => prices[c.model]) ? calls.reduce((a, c) => a + /** @type {number} */ (dollars(prices, c.model, c.in, c.maxOut)), 0) : null;
  return { arms, topics, runs, judge, calls, autoPairs, groups: G, total, writers, judges, ceiling, sourceTokens, preset, note };
}

/** @param {number} n */
const fmt = n => Math.round(n).toLocaleString('en-US');
/** @param {number | null} d */
export const usd = d => (d == null ? 'price unknown' : `$${d.toFixed(2)}`);

/** @param {ReturnType<typeof planJob>} P @param {{ list?: boolean }} [o] @returns {string} */
export function planText(P, { list = true } = {}) {
  const L = [];
  if (list) {
    L.push('Every call (tokens are estimates: ~4 characters a token):');
    for (const c of P.calls) {
      const what = c.type === 'writer' ? `write   ${c.arm.id}` : c.type === 'pair' ? `pair    ${c.a.id} vs ${c.b.id}` : `facts   ${c.arm.id}`;
      L.push(`  run ${c.run}  ${c.topic.id.padEnd(24)} ${what.padEnd(70)} ${c.model.padEnd(30)} in ~${fmt(c.in).padStart(6)}  out ~${fmt(c.out).padStart(5)}`);
    }
    L.push('');
  }
  L.push(`Job${P.preset ? ` (preset ${P.preset})` : ''}: ${P.arms.length} arms x ${P.topics.length} topics x ${P.runs} run${P.runs === 1 ? '' : 's'}. Judge: ${P.judge}. Fact-check source: ~${fmt(P.sourceTokens)} tokens.`);
  if (P.autoPairs.length) L.push(`Compared on automatic checks only, no judge call: ${P.autoPairs.map(([a, b]) => `${a.id} vs ${b.id}`).join('; ')}.`);
  if (P.note) L.push(P.note);
  L.push(`${'calls'.padEnd(52)}${'model'.padEnd(30)}${'n'.padStart(6)}${'in/call'.padStart(10)}${'out/call'.padStart(10)}${'in total'.padStart(12)}${'out total'.padStart(12)}  dollars`);
  /** @param {string} label @param {{ n: number, in: number, out: number, usd: number | null }} t */
  const line = (label, t) => `${label.padEnd(82)}${String(t.n).padStart(6)}${''.padStart(20)}${('~' + fmt(t.in)).padStart(12)}${('~' + fmt(t.out)).padStart(12)}  ${usd(t.usd)}`;
  for (const g of P.groups) L.push(`${g.label.padEnd(52)}${g.model.padEnd(30)}${String(g.n).padStart(6)}${('~' + fmt(g.in / g.n)).padStart(10)}${('~' + fmt(g.out / g.n)).padStart(10)}${('~' + fmt(g.in)).padStart(12)}${('~' + fmt(g.out)).padStart(12)}  ${usd(g.usd)}`);
  L.push(line('writers', P.writers), line(`judges (${P.judge})`, P.judges), line('total', P.total));
  L.push(`Worst case (every call to its output limit): ${usd(P.ceiling)}. Output estimates exclude any reasoning tokens a model adds.`);
  return L.join('\n');
}

// From a run's records to its summary: per-arm means with bootstrap intervals, pairwise win rates with a sign
// test, and the owner's own blind picks once they are read back in.
import { bootstrap, signTest, verdict } from './stats.js';

/**
 * @typedef {{ arm: string, topic: string, run: number, ms: { first: number | null, firstBody: number | null, total: number },
 *   usage: { input: number, output: number }, error: string | null, score: any, compliance: number, failed: string[],
 *   facts: ReturnType<typeof import('./judge.js').tallyFacts> | null }} PageRecord
 * @typedef {{ topic: string, run: number, a: string, b: string, winner: string }} PairRecord  winner: an arm id or "tie"
 */

/* Accuracy, per part of the page. The headline is "beyond the notes": contradicted claims over claims settled
   by the article's REST only. The plain contradicted rate flatters the grounded arm, which was handed the
   article's LEAD as notes and earns "supported" for restating it; claims settled beyond the lead are the ones
   every arm wrote from its own knowledge, so only there do arms compete on equal ground. */
/** @typedef {[string, string, (p: PageRecord) => number | null | undefined]} Measure */
const PART_LABEL = { all: 'all claims', body: 'body', keyFacts: 'key facts', hooks: 'hooks' };
/** @type {Measure[]} */
const ACCURACY = [];
for (const [stat, what] of /** @type {const} */ ([['beyondRate', 'contradicted, beyond the notes (headline)'], ['contradictedRate', 'contradicted, of all checked'], ['absentShare', 'absent (unverifiable)']])) {
  for (const part of /** @type {const} */ (['all', 'body', 'keyFacts', 'hooks'])) {
    ACCURACY.push([`${stat}_${part}`, `${what}: ${PART_LABEL[part]}`, p => (p.facts ? p.facts[part][stat] : null)]);
  }
}

/* What each arm is measured on, in the order the report shows them. Accuracy first: it is the gate. */
/** @type {Measure[]} */
export const MEASURES = [
  ...ACCURACY,
  ['compliance', 'share of format checks passed', (/** @type {PageRecord} */ p) => p.compliance],
  ['usable', 'usable page (servable from cache)', (/** @type {PageRecord} */ p) => (p.score.usable ? 1 : 0)],
  ['words', 'body words', (/** @type {PageRecord} */ p) => p.score.words],
  ['personShare', 'share of links to people', (/** @type {PageRecord} */ p) => p.score.personShare],
  ['umbrella', 'umbrella links a page (heuristic)', (/** @type {PageRecord} */ p) => p.score.umbrella.length],
  ['hooksNumeric', 'hover hooks with a number or superlative', (/** @type {PageRecord} */ p) => p.score.hooksNumeric],
  ['first', 'ms to first character', (/** @type {PageRecord} */ p) => p.ms.first],
  ['firstBody', 'ms to first body character', (/** @type {PageRecord} */ p) => p.ms.firstBody],
  ['total', 'ms to the end', (/** @type {PageRecord} */ p) => p.ms.total],
  ['outTokens', 'output tokens', (/** @type {PageRecord} */ p) => p.usage.output],
];

/** @param {string[]} arms @param {PairRecord[]} pairs */
export function winRates(arms, pairs) {
  const out = [];
  for (let i = 0; i < arms.length; i++) for (let j = i + 1; j < arms.length; j++) {
    const a = arms[i], b = arms[j];
    const these = pairs.filter(p => (p.a === a && p.b === b) || (p.a === b && p.b === a));
    const aWins = these.filter(p => p.winner === a).length, bWins = these.filter(p => p.winner === b).length, ties = these.length - aWins - bWins;
    if (!these.length) continue;   // a pair this job never compared
    const p = signTest(aWins, bWins);
    out.push({ a, b, n: these.length, aWins, bWins, ties, aRate: aWins + bWins ? aWins / (aWins + bWins) : null, p, verdict: verdict(p) });
  }
  return out;
}

/**
 * @param {{ runId: string, mode: string, arms: string[], pages: PageRecord[], pairs: PairRecord[], tokens: any, usd: number | null,
 *   stopped: string | null, planned: { calls: number, usd: number | null }, owner?: PairRecord[] | null, auto?: PairRecord[],
 *   preset?: string, presetNote?: string }} o
 */
export function summarize({ runId, mode, arms, pages, pairs, tokens, usd, stopped, planned, owner = null, auto = [], preset = '', presetNote = '' }) {
  /** @type {Record<string, any>} */ const perArm = {};
  arms.forEach((arm, ai) => {
    const P = pages.filter(p => p.arm === arm);
    /** @type {Record<string, any>} */ const m = { pages: P.length, errors: P.filter(p => p.error).length };
    MEASURES.forEach(([key, , get], mi) => { m[key] = bootstrap(P.map(get), { seed: 1 + ai * 101 + mi }); });
    /** @type {Record<string, number>} */ const failed = {};
    for (const p of P) for (const f of p.failed) failed[f] = (failed[f] || 0) + 1;
    m.failedChecks = Object.fromEntries(Object.entries(failed).sort((x, y) => y[1] - x[1]));
    perArm[arm] = m;
  });
  return {
    runId, mode, preset, createdAt: new Date().toISOString(), arms, stopped, planned, tokens, usd,
    measures: MEASURES.map(([key, label]) => ({ key, label })),
    perArm, pairwise: winRates(arms, pairs), auto: winRates(arms, auto), owner: owner ? winRates(arms, owner) : null,
    presetNote,
    note: mode === 'dry' ? 'DRY RUN: every page is the mock writer and every judgement the fake judge. These numbers test the plumbing and mean nothing about the writers.' : '',
  };
}

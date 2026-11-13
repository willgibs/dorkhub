// From a run's records to its summary: per-arm means with bootstrap intervals, pairwise win rates with a sign
// test, and the owner's own blind picks once they are read back in.
import { bootstrap, signTest, verdict } from './stats.js';

/**
 * @typedef {{ arm: string, topic: string, run: number, ms: { first: number | null, firstBody: number | null, total: number },
 *   usage: { input: number, output: number }, error: string | null, score: any, compliance: number, failed: string[],
 *   facts: { total: number, contradicted: number, supported: number, supportedShare: number | null, by: Record<string, { supported: number, contradicted: number, absent: number }> } | null }} PageRecord
 * @typedef {{ topic: string, run: number, a: string, b: string, winner: string }} PairRecord  winner: an arm id or "tie"
 */

/* What each arm is measured on, in the order the report shows them. Accuracy first: it is the gate. */
export const MEASURES = /** @type {const} */ ([
  ['contradicted', 'contradicted claims a page', (/** @type {PageRecord} */ p) => p.facts ? p.facts.contradicted : null],
  ['contradictedKeyFacts', '… in key facts', (/** @type {PageRecord} */ p) => p.facts ? p.facts.by.keyFacts.contradicted : null],
  ['contradictedHooks', '… in hooks', (/** @type {PageRecord} */ p) => p.facts ? p.facts.by.hooks.contradicted : null],
  ['supportedShare', 'share of claims the source supports', (/** @type {PageRecord} */ p) => p.facts ? p.facts.supportedShare : null],
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
]);

/** @param {string[]} arms @param {PairRecord[]} pairs */
export function winRates(arms, pairs) {
  const out = [];
  for (let i = 0; i < arms.length; i++) for (let j = i + 1; j < arms.length; j++) {
    const a = arms[i], b = arms[j];
    const these = pairs.filter(p => (p.a === a && p.b === b) || (p.a === b && p.b === a));
    const aWins = these.filter(p => p.winner === a).length, bWins = these.filter(p => p.winner === b).length, ties = these.length - aWins - bWins;
    const p = signTest(aWins, bWins);
    out.push({ a, b, n: these.length, aWins, bWins, ties, aRate: aWins + bWins ? aWins / (aWins + bWins) : null, p, verdict: verdict(p) });
  }
  return out;
}

/**
 * @param {{ runId: string, mode: string, arms: string[], pages: PageRecord[], pairs: PairRecord[], tokens: any, usd: number | null,
 *   stopped: string | null, planned: { calls: number, usd: number | null }, owner?: PairRecord[] | null }} o
 */
export function summarize({ runId, mode, arms, pages, pairs, tokens, usd, stopped, planned, owner = null }) {
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
    runId, mode, createdAt: new Date().toISOString(), arms, stopped, planned, tokens, usd,
    measures: MEASURES.map(([key, label]) => ({ key, label })),
    perArm, pairwise: winRates(arms, pairs), owner: owner ? winRates(arms, owner) : null,
    note: mode === 'dry' ? 'DRY RUN: every page is the mock writer and every judgement the fake judge. These numbers test the plumbing and mean nothing about the writers.' : '',
  };
}

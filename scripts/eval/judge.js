// The eval's judges: their prompts (tooling prompts, not product prompts: they never reach a reader), how
// their answers are read, and a deterministic fake judge for dry runs and tests.
import { cardsOf, looseJSON, panelLines, parseArticle, plain } from '../../src/shared/article.js';
import { hashOf } from './stats.js';

/* A page as plain readable text: what a reader sees, without markup, links or arm names. */
/** @param {string} text */
export function plainPage(text) {
  const A = parseArticle(text, false);
  const L = [`# ${A.title}${A.kind ? ` (${A.kind})` : ''}`];
  if (A.deck) L.push(plain(A.deck));
  if (A.keyFacts.length) L.push('', 'Key facts:', ...A.keyFacts.map(f => `- ${f.label}: ${f.value}`));
  L.push('');
  let para = 0;
  A.blocks.forEach((b, i) => {
    if (b.t === 'h') L.push('', `## ${plain(b.s)}`);
    else if (b.t === 'li') L.push(`- ${plain(b.s)}`);
    else { para++; L.push('', plain(b.s)); for (const n of A.notes.filter(x => x.n === para)) L.push(`(Aside: ${plain(n.s)})`); }
    for (const p of A.panels.filter(x => x.at === i + 1)) L.push('', `[${p.type}${p.title ? `: ${plain(p.title)}` : ''}]`, ...panelLines({ ...A, panels: [p] }).map(r => `  ${plain(r)}`));
  });
  const cards = cardsOf(A);
  if (cards.length) L.push('', 'Keep exploring:', ...cards.map(c => `- ${c.target}: ${plain(c.teaser)}`));
  if (A.questions.length) L.push('', 'Open questions:', ...A.questions.map(q => `- ${plain(q)}`));
  return L.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* The parts a fact check reads separately. Hooks are the hover hooks (&&&) and the six cards' hooks. */
/** @param {string} text */
export function factParts(text) {
  const A = parseArticle(text, false);
  const body = A.blocks.map(b => plain(b.s)).concat(A.notes.map(n => plain(n.s)), panelLines(A).map(plain)).join('\n');
  const keyFacts = A.keyFacts.map(f => `${f.label}: ${f.value}`).join('\n');
  const hooks = Object.values(A.gloss).filter(g => g.gloss).map(g => `${g.name}: ${plain(g.gloss)}`)
    .concat(cardsOf(A).map(c => `${c.target}: ${plain(c.teaser)}`)).join('\n');
  return { title: A.title, deck: plain(A.deck), body, keyFacts, hooks };
}

/* ---------- (a) blind pairwise comparison ---------- */
/** @param {{ topic: string, left: string, right: string }} c  left and right are plainPage text */
export const pairPrompt = ({ topic, left, right }) => `You are judging two pages from a generative encyclopedia for curious people, both written for the topic "${topic}". They come from two different writers; which is which does not matter and is hidden from you. Judge only the pages.

Read both, then decide which page a curious reader would rather keep reading. Weigh four things:
- specificity: concrete names, numbers, mechanisms and cases, not generalities
- surprise: things a curious reader did not know and would want to tell someone
- clarity: easy to follow for a newcomer, without padding
- links: whether the topics it points to (in the text and under "Keep exploring") make the reader want to click
Do not reward length for its own sake. If one page states something you are confident is false, count that against it.

PAGE A:
${left}

PAGE B:
${right}

Reply with only a JSON object:
{"winner": "A" | "B" | "tie", "scores": {"A": {"specificity": 1-5, "surprise": 1-5, "clarity": 1-5, "links": 1-5}, "B": {...the same}}, "why": "two or three sentences on what decided it"}`;

const SIDES = ['A', 'B', 'tie'];
/** @param {string} text @returns {{ winner: 'A' | 'B' | 'tie', scores: any, why: string } | null} */
export function readPair(text) {
  const v = looseJSON(text); if (!v || typeof v !== 'object') return null;
  const w = String(v.winner ?? '').trim().toUpperCase(); const winner = /** @type {'A' | 'B' | 'tie'} */ (w === 'TIE' ? 'tie' : w);
  if (!SIDES.includes(winner)) return null;
  return { winner, scores: v.scores && typeof v.scores === 'object' ? v.scores : null, why: typeof v.why === 'string' ? v.why : '' };
}

/* ---------- (b) fact check against a source ---------- */
/* The source comes in two labelled parts. LEAD is exactly what the grounded writer was handed as notes
   (lib/grounding.js factSource), REST is the article after it. Each verdict says where its evidence was found,
   so a claim settled by REST alone is one no writer could have copied from its notes. */
/** @typedef {{ title: string, url: string, lead: string, rest: string }} FactSource */
/** @param {{ topic: string, parts: ReturnType<typeof factParts>, source: FactSource }} c */
export const factPrompt = ({ topic, parts, source }) => `You are fact-checking a page from a generative encyclopedia, written for the topic "${topic}", against a source text in two parts, LEAD and REST.

From each of the three parts below, separately, list every checkable claim: a number, a date, a name, or an attribution (who did, found, said or made what). Copy each claim in a few words close to the page's own. Then mark each one against the SOURCE only:
- "supported": the source states it, or states something that clearly implies it (rounding is fine)
- "contradicted": the source states something incompatible with it
- "absent": the source does not settle it either way
Use only the source, not your own knowledge, and never mark a claim contradicted because the source is silent.
For every claim, say where the evidence that settled it is: "lead" if the LEAD settles it, otherwise "rest" if only the REST does, and null when it is absent.

BODY:
${parts.body}

KEY FACTS:
${parts.keyFacts || '(none)'}

HOOKS:
${parts.hooks || '(none)'}

SOURCE ("${source.title}", ${source.url}):
LEAD:
${source.lead}

REST:
${source.rest || '(none)'}

Reply with only a JSON object:
{"body": [{"claim": string, "type": "number" | "date" | "name" | "attribution", "verdict": "supported" | "contradicted" | "absent", "where": "lead" | "rest" | null, "note": "for a contradiction, what the source says"}], "keyFacts": [...the same shape], "hooks": [...the same shape]}`;

export const PARTS = /** @type {const} */ (['body', 'keyFacts', 'hooks']);
const VERDICTS = ['supported', 'contradicted', 'absent'];
/** @typedef {{ claim: string, type: string, verdict: 'supported' | 'contradicted' | 'absent', where: 'lead' | 'rest' | null, note: string }} Claim */
/** @param {string} text @returns {Record<'body' | 'keyFacts' | 'hooks', Claim[]> | null} */
export function readFacts(text) {
  const v = looseJSON(text); if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  /** @type {any} */ const out = {};
  for (const p of PARTS) {
    const list = Array.isArray(v[p]) ? v[p] : [];
    out[p] = list.filter((/** @type {any} */ c) => c && typeof c.claim === 'string' && VERDICTS.includes(String(c.verdict).toLowerCase()))
      .map((/** @type {any} */ c) => {
        const verdict = String(c.verdict).toLowerCase(); const w = String(c.where ?? '').toLowerCase();
        /* an absent claim has no evidence anywhere; a settled one without a readable "where" counts in every total but never as beyond the notes */
        return { claim: c.claim, type: String(c.type || ''), verdict, where: verdict === 'absent' ? null : w === 'lead' || w === 'rest' ? w : null, note: typeof c.note === 'string' ? c.note : '' };
      });
  }
  return out;
}

/* Three numbers per part (body, key facts, hooks) and for the page as a whole:
   - contradictedRate: contradicted claims over every claim checked.
   - beyondRate: contradicted over claims settled by REST only. This is the headline for comparing arms,
     because it is the one grounding cannot game: a grounded writer that restates its notes earns
     "supported, lead" verdicts that pad the plain rate, while claims settled only by REST are ones its
     notes never gave it, the same ground every other arm writes on.
   - absentShare: claims the source cannot settle either way (unverifiable, not wrong). */
/** @typedef {{ n: number, contradicted: number, absent: number, settledRest: number, contradictedRest: number, contradictedRate: number | null, beyondRate: number | null, absentShare: number | null }} FactTally */
/** @param {Claim[]} cs @returns {FactTally} */
function tallyOf(cs) {
  const n = cs.length, contradicted = cs.filter(c => c.verdict === 'contradicted').length, absent = cs.filter(c => c.verdict === 'absent').length;
  const rest = cs.filter(c => c.verdict !== 'absent' && c.where === 'rest'); const contradictedRest = rest.filter(c => c.verdict === 'contradicted').length;
  return { n, contradicted, absent, settledRest: rest.length, contradictedRest, contradictedRate: n ? contradicted / n : null, beyondRate: rest.length ? contradictedRest / rest.length : null, absentShare: n ? absent / n : null };
}
/** @param {Record<'body' | 'keyFacts' | 'hooks', Claim[]> | null} f @returns {{ all: FactTally, body: FactTally, keyFacts: FactTally, hooks: FactTally }} */
export function tallyFacts(f) {
  return { all: tallyOf(PARTS.flatMap(p => f?.[p] || [])), body: tallyOf(f?.body || []), keyFacts: tallyOf(f?.keyFacts || []), hooks: tallyOf(f?.hooks || []) };
}

/* ---------- the fake judge: deterministic, free, for dry runs and tests ----------
   Pairwise: the page that passes more of the automatic checks wins, a tie is broken by a hash of both
   texts. Fact check: every number in a part is a claim, supported when the source holds the same number
   (where: the lead if the lead holds it, else the rest), absent otherwise. It exercises the plumbing; it
   measures nothing. */
export const fakeJudge = {
  /** @param {{ left: string, right: string, leftScore: number, rightScore: number }} c */
  pair: async c => {
    const d = c.leftScore - c.rightScore;
    const winner = Math.abs(d) > 1e-9 ? (d > 0 ? 'A' : 'B') : ['A', 'B', 'tie'][hashOf(c.left + c.right) % 3];
    return { text: JSON.stringify({ winner, scores: null, why: 'fake judge: the page passing more automatic checks wins' }), usage: { input: 0, output: 0 } };
  },
  /** @param {{ parts: ReturnType<typeof factParts>, source: FactSource }} c */
  facts: async c => {
    const nums = (/** @type {string} */ s) => [...new Set(s.match(/\d[\d,.]*\d|\d/g) || [])];
    const { lead, rest } = c.source;
    /** @type {any} */ const out = {};
    for (const p of PARTS) out[p] = nums(c.parts[p]).map(n => { const where = lead.includes(n) ? 'lead' : rest.includes(n) ? 'rest' : null; return { claim: n, type: 'number', verdict: where ? 'supported' : 'absent', where, note: '' }; });
    return { text: JSON.stringify(out), usage: { input: 0, output: 0 } };
  },
};

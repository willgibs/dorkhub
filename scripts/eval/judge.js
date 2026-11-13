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
/** @param {{ topic: string, parts: ReturnType<typeof factParts>, source: { title: string, url: string, text: string } }} c */
export const factPrompt = ({ topic, parts, source }) => `You are fact-checking a page from a generative encyclopedia, written for the topic "${topic}", against a source text.

From each of the three parts below, separately, list every checkable claim: a number, a date, a name, or an attribution (who did, found, said or made what). Copy each claim in a few words close to the page's own. Then mark each one against the SOURCE only:
- "supported": the source states it, or states something that clearly implies it (rounding is fine)
- "contradicted": the source states something incompatible with it
- "absent": the source does not settle it either way
Use only the source, not your own knowledge, and never mark a claim contradicted because the source is silent.

BODY:
${parts.body}

KEY FACTS:
${parts.keyFacts || '(none)'}

HOOKS:
${parts.hooks || '(none)'}

SOURCE ("${source.title}", ${source.url}):
${source.text}

Reply with only a JSON object:
{"body": [{"claim": string, "type": "number" | "date" | "name" | "attribution", "verdict": "supported" | "contradicted" | "absent", "note": "for a contradiction, what the source says"}], "keyFacts": [...the same shape], "hooks": [...the same shape]}`;

export const PARTS = /** @type {const} */ (['body', 'keyFacts', 'hooks']);
const VERDICTS = ['supported', 'contradicted', 'absent'];
/** @typedef {{ claim: string, type: string, verdict: 'supported' | 'contradicted' | 'absent', note: string }} Claim */
/** @param {string} text @returns {Record<'body' | 'keyFacts' | 'hooks', Claim[]> | null} */
export function readFacts(text) {
  const v = looseJSON(text); if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  /** @type {any} */ const out = {};
  for (const p of PARTS) {
    const list = Array.isArray(v[p]) ? v[p] : [];
    out[p] = list.filter((/** @type {any} */ c) => c && typeof c.claim === 'string' && VERDICTS.includes(String(c.verdict).toLowerCase()))
      .map((/** @type {any} */ c) => ({ claim: c.claim, type: String(c.type || ''), verdict: String(c.verdict).toLowerCase(), note: typeof c.note === 'string' ? c.note : '' }));
  }
  return out;
}

/** @param {Record<'body' | 'keyFacts' | 'hooks', Claim[]> | null} f */
export function tallyFacts(f) {
  /** @type {Record<string, { supported: number, contradicted: number, absent: number }>} */ const by = {};
  for (const p of PARTS) { by[p] = { supported: 0, contradicted: 0, absent: 0 }; for (const c of f?.[p] || []) by[p][c.verdict]++; }
  const total = PARTS.reduce((a, p) => a + by[p].supported + by[p].contradicted + by[p].absent, 0);
  const contradicted = PARTS.reduce((a, p) => a + by[p].contradicted, 0);
  const supported = PARTS.reduce((a, p) => a + by[p].supported, 0);
  return { by, total, contradicted, supported, supportedShare: total ? supported / total : null };
}

/* ---------- the fake judge: deterministic, free, for dry runs and tests ----------
   Pairwise: the page that passes more of the automatic checks wins, a tie is broken by a hash of both
   texts. Fact check: every number in a part is a claim, supported when the source holds the same number,
   absent otherwise. It exercises the plumbing; it measures nothing. */
export const fakeJudge = {
  /** @param {{ left: string, right: string, leftScore: number, rightScore: number }} c */
  pair: async c => {
    const d = c.leftScore - c.rightScore;
    const winner = Math.abs(d) > 1e-9 ? (d > 0 ? 'A' : 'B') : ['A', 'B', 'tie'][hashOf(c.left + c.right) % 3];
    return { text: JSON.stringify({ winner, scores: null, why: 'fake judge: the page passing more automatic checks wins' }), usage: { input: 0, output: 0 } };
  },
  /** @param {{ parts: ReturnType<typeof factParts>, source: { text: string } }} c */
  facts: async c => {
    const nums = (/** @type {string} */ s) => [...new Set(s.match(/\d[\d,.]*\d|\d/g) || [])];
    const src = c.source.text;
    /** @type {any} */ const out = {};
    for (const p of PARTS) out[p] = nums(c.parts[p]).map(n => ({ claim: n, type: 'number', verdict: src.includes(n) ? 'supported' : 'absent', note: '' }));
    return { text: JSON.stringify(out), usage: { input: 0, output: 0 } };
  },
};

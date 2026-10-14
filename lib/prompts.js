/* ================= prompts: the only place Dorkhub's instructions live =================
   The browser never sends a prompt. It names a task and sends the structured context
   (titles, the path, a passage), and this module turns that into the prompt. That keeps
   the endpoint from being a general-purpose chatbot, keeps prompts versioned in one
   place, and leaves room for per-model variants once models have been evaluated.

   Every task has: a validator that clips and normalizes its input, a builder, an
   output budget, the quota it spends ("page", "extra", or none), and whether
   identical requests may be answered from cache. */

import { KINDS, PANELS, capFirst, clip, looseJSON, parseArticle, titleIsLocked } from '../src/shared/article.js';

/* Bump when the output format or a prompt changes in a way that should not reuse cached text. */
export const PROMPT_VERSION = '2026-10-14-v2';

export class BadInput extends Error {
  /** @param {string} message */
  constructor(message) { super(message); this.name = 'BadInput'; }
}

/* ---------- input helpers: clip, never trust ---------- */
/** @param {unknown} v @param {number} max */
const str = (v, max) => (typeof v === 'string' ? clip(v.replace(/\s+/g, ' ').trim(), max) : '');
/* Multi-line text (a whole page) keeps its line breaks. */
/** @param {unknown} v @param {number} max */
const text = (v, max) => (typeof v === 'string' ? clip(v.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(), max) : '');
/** @param {unknown} v @param {number} max @param {string} field @param {(v: unknown, max: number) => string} [read] */
const need = (v, max, field, read = str) => { const s = read(v, max); if (!s) throw new BadInput(`missing ${field}`); return s; };
/** @param {unknown} v @param {number} min @param {number} max @param {number} def */
const int = (v, min, max, def) => { const n = typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : def; return Math.max(min, Math.min(max, n)); };
/** @template T @param {unknown} v @param {number} max @param {(x: any) => T | null} fn @returns {T[]} */
const list = (v, max, fn) => (Array.isArray(v) ? v.slice(-max).map(fn).filter(/** @returns {x is T} */ x => x != null) : []);
/** @param {unknown} v */
const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? /** @type {Record<string, unknown>} */ (v) : {});
/** @param {unknown} v */
const pathOf = v => list(v, 99, x => { const o = obj(x); const title = str(o.title, 160); return title ? { title, deck: str(o.deck, 400) } : null; });

/* ---------- the page ---------- */
export const LENS_VOICE = {
  encyclopedic: 'Encyclopedic: precise, dense with concrete specifics, like the best reference article ever written, but warm and readable.',
  story: 'Storyteller: build the article around people, moments and scenes. Vivid, but every detail factual.',
  nerd: 'Deep nerd: assume an expert reader. Mechanisms, numbers, edge cases, and jargon glossed in a few words.',
  kid: 'Curious kid: explain for a sharp 12-year-old. Concrete comparisons, short sentences, never condescending.',
  skeptic: 'Skeptic: clearly separate what is well established from what is claimed, disputed or legend. Name the kind of evidence.',
};

const RATING = { basic: 'too basic, go further', right: 'just right', lost: 'lost them, slow down and explain more', wow: 'loved it, more like this' };

export const FORMAT = `Output format. Plain text, no code fences, no preamble. Write everything in exactly this order. The reader starts reading the top of the page while you are still writing the rest, so nothing may ever be added above what they have already read.

# Title
> One sentence under 25 words that makes the reader want to keep going.
~ One sentence addressed to the reader ("you") that connects this page to exactly where they came from. On the first page, name two or three of the unexpected places this topic leads, plainly; never call it a wonderful or great place to start.
+++
Your link plan: before writing the body, choose the 10 to 14 most rabbit-hole-worthy topics you will link in it, one per line: "[[Topic]] :: kind". Kind is one of: concept, phenomenon, mechanism, mystery, technique, thing, place, event, era, person, creature, work.
---
Body: an opening paragraph, then 2 to 4 sections, each starting "## Section heading". About 450 to 600 words, blank lines between paragraphs. Link every topic from your plan as [[Topic]] or [[shown text|Topic]], using the exact topic names from the plan, spread through the whole page.
Margin notes: directly after 1 or 2 of the paragraphs, add one line starting with "^ " holding an aside under 30 words that sits beside that paragraph: a surprising connection, a number that recontextualizes, or a detail that makes the reader stop. State it plainly, with no stock opener. If an earlier page on the reader's path genuinely connects, make one note a callback that links it as [[Its exact title]].
Panels: the body is the page, and most of it is prose. A panel earns its place only when it shows something prose can't: dates in order, a process step by step, things side by side, numbers that matter. Use at most two, and none when the prose says it best. Put each on its own lines directly after the paragraph it belongs to: never before the first paragraph, never two in a row. Let the panel carry the details so the prose can tell the story; never repeat what the prose says. Open a panel with one of these lines, and close it with a line ":::".
::: timeline (3 to 6 rows "WHEN :: what happened, under 12 words", oldest first, only for a real chronology)
::: facts (3 to 6 rows "Label :: value under 8 words", for a concrete thing, creature, place or person)
::: steps (3 to 6 rows "Step :: what happens, under 16 words", for a process or a chain of causes)
::: compare A | B (3 to 5 rows "Attribute :: A's value | B's value", for two or three things the page contrasts)
::: theories (2 to 4 rows "Explanation :: the claim, under 14 words :: accepted, partly, disputed or rejected", for a question that has had rival answers)
::: figures (2 to 4 rows "NUMBER :: what it measures, under 10 words", only well-established numbers, rounded)
::: myth (a row "Myth :: what people wrongly believe", then a row "Actually :: what is true", for a misconception people really hold)
::: formula (a row "Equation :: the equation", then one row per symbol "x :: what it stands for", only for a real, named equation)
::: guess (rows "Question :: a question with a surprising answer", "Answer :: the answer", "Why :: one sentence", so the reader predicts before they see it)
>>>
One line: "[[Topic]] :: why it is the natural next page, under 20 words". The single best continuation for someone who just wants to keep reading.
===
Exactly 5 branches onward, one per line: "- [[Topic]] :: hook under 14 words :: deeper|sideways|wild :: kind". Deeper stays in this subject but gets more specific; sideways moves to a neighboring subject; wild is a far jump into a different field that still connects to this page through one specific thread, and its hook names that thread. Include at least one of each, and don't repeat the next page. Make each hook irresistible and specific.
???
3 questions a curious reader might ask next, one per line, each under 14 words.
&&&
For every topic in your link plan, one line: "[[Topic]] :: what makes it fascinating, under 12 words". Never a dictionary definition.

Choosing links. The best links are specific and surprising: ideas, phenomena, mechanisms, mysteries, techniques, strange objects, places and events that open a whole new world, the things a curious person would stop reading to look up. Prefer the specific over the general: on a page about the Great Emu War, link "Lewis gun" or "the Western Australian wheatbelt", not "First World War" or "Australia". Every link must belong to this page's own story: never add a sentence or a section just to fit in an unrelated topic. Variety comes from linking different kinds of things, not from detours. Never reach for stock curiosities that could follow any page (tardigrades, the Antikythera mechanism, the Voynich manuscript, the Tunguska event) unless this page genuinely leads there. Link a person only when their own story is a rabbit hole, and keep people to at most a quarter of the links. Never link generic words, dates, numbers, broad umbrella subjects (a whole war, country, century or science) mentioned in passing, or the page's own title.

Accuracy: stay factual. If something is uncertain, disputed or legend, say so plainly. Never invent quotes, citations, statistics or dates; leave a panel out rather than guess what goes in it.`;

/* What kind of thing the clicked link leads to shapes the page around it. */
export const KIND_SHAPE = {
  concept: 'show what it explains, where it came from and where it breaks down',
  phenomenon: 'show what happens, why it happens and where to see it',
  mechanism: 'show how it works, step by step, and where it turns up',
  technique: 'show how it is done and what it made possible',
  mystery: 'build the page around the puzzle, the rival explanations and what would settle it',
  thing: 'show what it is, how it came to be and why it matters',
  place: 'show what makes it singular and what happened there',
  event: 'tell what happened, what led to it and what it changed',
  era: 'show what defined it, what changed in it and what it left behind',
  person: 'tell the work and the turning points, not a whole biography',
  creature: 'show how it lives and what makes it strange',
  work: 'show what it is, how it was made and what it changed',
};

/** @param {number} d */
export function depthHint(d) {
  if (d === 0) return 'This is the first page: a vivid overview that opens many different doors.';
  if (d <= 2) return 'Go past the overview: favor surprising specifics over general background.';
  if (d <= 4) return 'The reader is hooked now: be specific, technical where it helps, and surprising.';
  return 'The reader is very deep: go niche, granular and strange. Give them the details nobody else bothers with.';
}

/** @typedef {{ kind: 'passage' | 'cont' | 'question' | 'bridge', text: string, question: string, other: string }} From */
/** @typedef {{ title: string, depth: number, lens: keyof typeof LENS_VOICE, kind: string, panels: string[], path: { title: string, deck: string }[], from: From | null, seen: string[], others: string[], ratings: { title: string, rating: keyof typeof RATING }[] }} PageInput */

/** @param {unknown} raw @returns {PageInput} */
export function pageInput(raw) {
  const o = obj(raw); const f = obj(o.from);
  const kind = /** @type {From['kind'] | ''} */ (['passage', 'cont', 'question', 'bridge'].includes(/** @type {string} */ (f.kind)) ? f.kind : '');
  const from = kind ? { kind, text: str(f.text, 600), question: str(f.question, 240), other: str(f.other, 160) } : null;
  if (from && from.kind === 'question' && !from.question) throw new BadInput('missing from.question');
  if (from && from.kind === 'bridge' && !from.other) throw new BadInput('missing from.other');
  const lens = /** @type {keyof typeof LENS_VOICE} */ (typeof o.lens === 'string' && o.lens in LENS_VOICE ? o.lens : 'encyclopedic');
  return {
    title: need(o.title, 160, 'title'),
    depth: int(o.depth, 0, 99, 0),
    lens,
    kind: typeof o.kind === 'string' && KINDS.includes(o.kind) ? (o.kind === 'idea' ? 'concept' : o.kind) : '',
    panels: [...new Set(list(o.panels, 6, x => (typeof x === 'string' && PANELS.includes(x) ? x : null)))],
    path: pathOf(o.path),
    from,
    seen: list(o.seen, 24, x => str(x, 80) || null),
    others: list(o.others, 24, x => str(x, 160) || null),
    ratings: list(o.ratings, 3, x => { const r = obj(x); const t = str(r.title, 160); return t && typeof r.rating === 'string' && r.rating in RATING ? { title: t, rating: /** @type {keyof typeof RATING} */ (r.rating) } : null; }),
  };
}

/** @param {PageInput} p */
export function titleRule(p) {
  if (!titleIsLocked(p)) return 'Title the page with a short, topic-style title.';
  return `The reader chose this exact topic, so the page must be about it. Title it exactly "${capFirst(p.title)}" (you may only fix capitalization or spelling). Approach it from the reader's path and go as deep as the level calls for, but never swap in a narrower, broader or different subject as the title or the focus.`;
}

/** @param {PageInput} p */
export function pagePrompt(p) {
  const parent = p.path[p.path.length - 1]; const L = [];
  L.push('You write pages for Dorkhub, a generative encyclopedia for curious people. A reader follows links from topic to topic, and every page is written on the spot for the exact path they took to reach it. Write the next page.', '');
  if (parent) {
    L.push('Their path so far, oldest first:');
    p.path.forEach((n, i) => L.push(`${i}. ${n.title}${n.deck ? ` (${n.deck})` : ''}`));
    L.push('', `Now they are opening: "${p.title}"`);
    const f = p.from;
    if (f && f.kind === 'bridge') L.push(`This is a connecting page. The reader asked how "${parent.title}" connects to "${f.other}", another page they read. Explain the connection as a chain of specific steps (people, mechanisms, ideas, events), each one leading to the next. Title it after the connecting thread, not "From A to B".`);
    else if (f && f.kind === 'cont') L.push(`They pressed "Continue reading" at the end of "${parent.title}", so write this as the next chapter: pick the thread up directly, without re-explaining what they just read. Reason it was suggested: ${f.text}`);
    else if (f && f.kind === 'question') L.push(`They asked this while reading "${parent.title}": "${f.question}". Answer it inside the page, and give the page a short topic-style title.`);
    else if (f && f.text) L.push(`They opened it from this passage in "${parent.title}": "${clip(f.text, 420)}"`);
    if (p.seen.length) L.push(`The page they just read already covered, in order: ${p.seen.join('; ')}. Build on it; never retell what it said.`);
    L.push('Open the ~ line by connecting this page to that exact moment. Where it is natural, echo earlier steps of their path in the body so the reading feels like one continuous journey.');
  } else {
    L.push(`This is the first page. The reader chose to start at: "${p.title}".`);
    if (p.from && p.from.kind === 'question') L.push('That is a question: answer it within the page, and give the page a short topic-style title.');
  }
  if (p.others.length) L.push('', `Other pages they have already read: ${p.others.join('; ')}. When one of these, or an earlier step of the path, is genuinely relevant, link it using its exact title so they can loop back.`);
  if (p.ratings.length) L.push(`On this path they rated: ${p.ratings.map(r => `"${r.title}": ${RATING[r.rating]}`).join('; ')}. Calibrate difficulty and pacing on this page to match.`);
  L.push('', 'Choose links for any curious reader, not for this reader\'s history: never steer them toward the subjects they have already visited, so they can always jump somewhere new.');
  if (p.kind && p.kind in KIND_SHAPE) L.push(`They followed a link to a ${p.kind}: ${KIND_SHAPE[/** @type {keyof typeof KIND_SHAPE} */ (p.kind)]}.`);
  if (p.panels.length) L.push(`The pages just before this one used these panels: ${p.panels.join(', ')}. Choose a different one, or none, unless this page truly calls for the same.`);
  L.push('', titleRule(p));
  L.push('', `Level: ${p.depth}. ${depthHint(p.depth)}`, `Voice: ${LENS_VOICE[p.lens]}`, '', FORMAT);
  return L.join('\n');
}

/* ---------- the small tasks around a page ---------- */
/** @param {{ title: string, path: { title: string }[] }} c */
const ctxLine = c => `The reader is on the page "${c.title}" of Dorkhub, a generative encyclopedia. Their path so far: ${[...c.path.map(n => n.title), c.title].join(' → ')}.`;
/** @param {unknown} raw */
const onPage = raw => { const o = obj(raw); return { o, title: need(o.title, 160, 'title'), path: pathOf(o.path) }; };

export const UNFOLD = {
  simpler: 'Rewrite this paragraph so a sharp 12-year-old gets it: 50 to 90 words, same key facts, concrete comparisons, never condescending.',
  deeper: 'Go one level deeper than this paragraph: the mechanism, the numbers or the nuance it skipped. 70 to 110 words.',
  example: 'Give one concrete, vivid, real example or case that illustrates this paragraph. 60 to 100 words.',
  counter: 'Give the strongest counterpoint, caveat or competing view on this paragraph, and who holds it. 60 to 100 words. If the paragraph is uncontroversial, explain what people commonly get wrong about it instead.',
};

/**
 * @typedef {object} Task
 * @property {(raw: unknown) => any} input  validate and normalize
 * @property {(input: any) => string} prompt
 * @property {number} maxTokens  output budget
 * @property {'page' | 'extra' | null} spends  which trial allowance it uses
 * @property {boolean} cacheable  identical requests may share an answer
 * @property {(text: string) => boolean} [usable]  a finished answer worth caching (default: any text)
 * @property {boolean} [quick]  written by the fast model for the key's provider
 * @property {boolean} [byokOnly]
 */

/* What a finished answer must look like before it may be served to anyone else from cache. */
/** @param {string} t */
const usablePage = t => { const A = parseArticle(t, false); return !!A.title && A.blocks.filter(b => b.t === 'p').length >= 3 && A.tunnels.length >= 3; };
/** @param {string} t */
const usableText = t => t.trim().length >= 40;
/** @param {(v: any) => boolean} shape @returns {(t: string) => boolean} */
const usableJSON = shape => t => { const v = looseJSON(t); return v != null && shape(v); };

/** @type {Record<string, Task>} */
export const TASKS = {
  page: { input: pageInput, prompt: pagePrompt, maxTokens: 3000, spends: 'page', cacheable: true, usable: usablePage },

  peek: {
    input: raw => { const { o, title, path } = onPage(raw); return { title, path, passage: str(o.passage, 600), target: need(o.target, 160, 'target') }; },
    prompt: c => `${ctxLine(c)}
They are reading this passage: "${c.passage}"
They want a quick peek at "${c.target}" without leaving the page. Write one paragraph of 70 to 100 words: what ${c.target} is, what makes it fascinating, and exactly why it matters in this passage. Wrap 2 to 4 rabbit-hole-worthy ideas or phenomena as [[Topic]]. Plain text, no heading. Stay factual and flag anything uncertain.`,
    usable: usableText, maxTokens: 400, spends: 'extra', cacheable: true, quick: true,
  },

  unfold: {
    input: raw => { const { o, title, path } = onPage(raw); const mode = typeof o.mode === 'string' && o.mode in UNFOLD ? /** @type {keyof typeof UNFOLD} */ (o.mode) : null; if (!mode) throw new BadInput('bad mode'); return { title, path, paragraph: need(o.paragraph, 900, 'paragraph'), mode }; },
    prompt: c => `${ctxLine(c)}
Paragraph: "${c.paragraph}"
${UNFOLD[/** @type {keyof typeof UNFOLD} */ (c.mode)]} Wrap 2 or 3 rabbit-hole-worthy ideas or phenomena as [[Topic]]. One paragraph of plain text, no heading, no preamble. Stay factual and flag anything uncertain.`,
    usable: usableText, maxTokens: 400, spends: 'extra', cacheable: true, quick: true,
  },

  doubt: {
    input: raw => ({ page: need(obj(raw).page, 9000, 'page', text) }),
    prompt: c => `Here is a page from a generative encyclopedia. Find the 3 to 5 specific factual claims in it most worth double-checking: dates, numbers, attributions, superlatives, disputed ideas. For each, copy a short span of 4 to 14 words exactly as it appears in the page, explain in one sentence why it deserves checking and what to verify, and rate it "solid", "check" or "shaky".
Reply with only a JSON array of objects: {"quote": string, "note": string, "rating": "solid" | "check" | "shaky"}.

PAGE:
${c.page}`,
    usable: usableJSON(v => Array.isArray(v) && v.some(d => d && d.quote)), maxTokens: 900, spends: 'extra', cacheable: true, quick: true,
  },

  thread: {
    input: raw => {
      const steps = list(obj(raw).steps, 99, x => { const o = obj(x); const title = str(o.title, 160); return title ? { title, deck: str(o.deck, 400), via: str(o.via, 200) } : null; });
      if (steps.length < 2) throw new BadInput('a thread needs two pages');
      return { steps };
    },
    prompt: c => `A reader of Dorkhub, a generative encyclopedia, read these pages in order:
${c.steps.map((/** @type {{ title: string, deck: string, via: string }} */ n, /** @type {number} */ i) => `${i + 1}. ${n.title}${n.deck ? `: ${n.deck}` : ''}${n.via ? `\n   (reached via: "${n.via}")` : ''}`).join('\n')}

Write "the thread": one paragraph of 110 to 160 words in the second person ("you started at…") that tells the story of how they got from the first page to the last, making each leap feel natural and naming the most surprising turn. Then a final line that starts with "Thread: " followed by a 3 to 8 word phrase naming the hidden idea that ties the whole path together. Plain text, no headings.`,
    usable: usableText, maxTokens: 450, spends: 'extra', cacheable: true, quick: true,
  },

  recap: {
    input: raw => {
      const o = obj(raw);
      const pages = list(o.pages, 90, x => { const p = obj(x); const title = str(p.title, 160); return title ? { depth: int(p.depth, 0, 99, 0), title, deck: str(p.deck, 400), text: str(p.text, 420) } : null; });
      if (pages.length < 2) throw new BadInput('a recap needs two pages');
      return { pages, untaken: list(o.untaken, 14, x => str(x, 160) || null) };
    },
    prompt: c => `A reader just went down a rabbit hole on Dorkhub, a generative encyclopedia where each link opens a new page. The pages they read, in order:
${c.pages.map((/** @type {{ depth: number, title: string, deck: string, text: string }} */ n) => `- level ${n.depth}: ${n.title}${n.deck ? `: ${n.deck}` : ''}${n.text ? `\n  What it said: ${n.text}` : ''}`).join('\n')}

Branches they saw but did not take: ${c.untaken.join('; ') || 'none'}

Write their recap in Markdown, faithful to the pages above:
# Recap: <a 3 to 7 word title for this rabbit hole>
One short paragraph summarizing the journey and its shape.
## Five things you now know
- five bullets, one sentence each: the most surprising specifics from the pages (numbers, names, mechanisms), never a restated summary
## The strangest connection
One or two sentences.
## Where to dig next
- three bullets, from the branches they skipped or natural next steps
Under 350 words. No preamble.`,
    usable: usableText, maxTokens: 900, spends: 'extra', cacheable: true, quick: true,
  },

  around: {
    input: raw => { const { o, title, path } = onPage(raw); return { title, path, read: list(o.read, 90, x => str(x, 160) || null) }; },
    prompt: c => `${ctxLine(c)}
Survey the territory of knowledge around "${c.title}". Name 8 neighboring topics a curious reader could open next, spread across different bearings: history, science, people, culture, mechanism, and elsewhere (a surprising far connection). Do not include any of these, which they already read: ${c.read.join('; ')}.
Reply with only a JSON array of 8 objects: {"name": "2 to 4 words", "relation": "under 12 words on how it connects to ${c.title}", "kind": "person|place|thing|idea|event|era|creature|work", "bearing": "history|science|people|culture|mechanism|elsewhere", "distance": 1 | 2 | 3}. Distance 1 is right next door; 3 is far but genuinely connected.`,
    usable: usableJSON(v => Array.isArray(v) && v.filter(o => o && o.name).length >= 4), maxTokens: 900, spends: 'extra', cacheable: true, quick: true,
  },

  sketch: {
    input: raw => { const { o, title, path } = onPage(raw); return { title, path, page: need(o.page, 5000, 'page', text) }; },
    prompt: c => `${ctxLine(c)}
Here is the page they are reading:
${c.page}

Draw the single most useful explanatory diagram for this page, as data. Pick the shape that fits best:
- "chain": a process, mechanism or cause-and-effect sequence (4 to 7 steps, in order)
- "cycle": something that loops back on itself (3 to 6 stages)
- "hub": a central idea and the parts, forces or players around it (4 to 7 spokes)
Use only facts from the page. Reply with only JSON:
{"shape": "chain" | "cycle" | "hub", "title": "under 8 words", "caption": "one sentence under 25 words saying what the diagram shows", "center": "hub only: the central label, under 4 words", "nodes": [{"label": "1 to 4 words", "note": "under 12 words"}], "links": ["chain only: a verb phrase under 4 words for each arrow between consecutive nodes"]}`,
    usable: usableJSON(v => v && Array.isArray(v.nodes) && v.nodes.length >= 3), maxTokens: 800, spends: 'extra', cacheable: true, quick: true,
  },

  quiz: {
    input: raw => {
      const pages = list(obj(raw).pages, 8, x => { const p = obj(x); const title = str(p.title, 160); const text = typeof p.text === 'string' ? p.text.trim().slice(0, 900) : ''; return title && text ? { title, text } : null; });
      if (pages.length < 2) throw new BadInput('a quiz needs two pages');
      return { pages };
    },
    prompt: c => `A reader has been reading these pages on Dorkhub, a generative encyclopedia:

${c.pages.map((/** @type {{ title: string, text: string }} */ p) => `## ${p.title}\n${p.text}`).join('\n\n')}

Write 5 multiple-choice questions that check whether the most interesting specifics stuck. Spread them across different pages and use only facts stated above. Vary which position holds the correct answer.
Reply with only a JSON array of objects: {"q": "question under 22 words", "options": ["four short options"], "answer": index of the correct option from 0 to 3, "why": "one sentence on why it's right", "chamber": "the exact page title it comes from"}`,
    maxTokens: 1200, spends: 'extra', cacheable: false, quick: true,
  },

  /* Proves a key works with the chosen model before the browser saves it. */
  check: { input: () => ({}), prompt: () => 'Reply with the single word OK.', maxTokens: 5, spends: null, cacheable: false, byokOnly: true },
};

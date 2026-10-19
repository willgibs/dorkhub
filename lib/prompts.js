/* ================= prompts: the only place Dorkhub's instructions live =================
   The browser never sends a prompt. It names a task and sends the structured context
   (a title, a passage), and this module turns that into the prompt. That keeps
   the endpoint from being a general-purpose chatbot, keeps prompts versioned in one
   place, and leaves room for per-model variants once models have been evaluated.

   Every task has: a validator that clips and normalizes its input, a builder, an
   output budget, the quota it spends ("page", "extra", or none), and whether
   identical requests may be answered from cache. */

import { capFirst, cardsOf, clip, looseJSON, parseArticle, titleIsLocked } from '../src/shared/article.js';
import { asksQuestion } from '../src/shared/world.js';

/* Bump when the output format or a prompt changes in a way that should not reuse cached text. */
export const PROMPT_VERSION = '2026-10-19-v3.1';

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

export const FORMAT = `Output format. Plain text, no code fences, no preamble. Write everything in exactly this order. The reader starts reading the top of the page while you are still writing the rest, so nothing may ever be added above what they have already read.

# Title :: kind
The first line is the title, then " :: " and the kind of thing the page is about, one of: concept, phenomenon, mechanism, mystery, technique, thing, place, event, era, person, creature, work.
> One sentence under 25 words that makes the reader want to keep going.
!!!
Key facts: exactly 3 lines, "Label :: value", the facts a curious reader wants at a glance, chosen for the kind: a creature's size, lifespan or home; a place's whereabouts, age or what happened there; an event's date, place and toll; a phenomenon's scale, where it is seen or the number that defines it; a thing's maker and date, material or defining number; a mystery's first telling, best evidence and whether it is settled; a concept's origin and the number or case that defines it; a technique's beginnings and what it made possible; a person's dates and what they did. For a question, the facts its answer rests on. A label is 1 to 3 words; a value is under 7 words, its numbers rounded and with units. Never repeat the deck, and no superlatives (largest, first, only) unless they are textbook facts. Only facts you are sure of: if you are unsure of a number, choose another fact.
+++
Your link plan: before writing the body, choose the 10 to 14 topics most worth opening from this page, one per line: "[[Topic]] :: kind", with kind from the same list. Name every topic by the plain name an encyclopedia gives it ("Pumice", "Kraken", "Herculaneum"), and add a qualifier in parentheses only when that name alone means several different things: "Mercury (planet)", never "Mercury".
---
Body: an opening paragraph that gives a newcomer a vivid, concrete picture, then 2 to 4 sections, each starting "## Section heading", that go past the overview to the surprising specifics, mechanisms and numbers most introductions skip. About 450 to 600 words, blank lines between paragraphs. Every paragraph runs 3 to 6 sentences: never leave a sentence on its own, and never write one that only leads into the next. When a discovery, record or event is well documented, say who, where and when, not "researchers" or "for a long time". Link every topic from your plan as [[Topic]] or [[shown text|Topic]], using the exact topic names from the plan, spread through the whole page.
Margin notes: directly after 1 or 2 of the paragraphs, add one line starting with "^ " holding an aside under 30 words that sits beside that paragraph and adds what it doesn't say: a surprising connection, a number that recontextualizes, or a detail that makes the reader stop. State it plainly, with no stock opener.
Panels: the body is the page, and most of it is prose. A panel earns its place only when it shows something prose can't: dates in order, a process step by step, things side by side, numbers that matter. Most pages need one panel or none. Use two only when the page holds two different shapes of information, say a chronology and a comparison, and never more. Put each on its own lines directly after the paragraph it belongs to: never before the first paragraph, never two in a row. Let the panel carry the details so the prose can tell the story; never repeat what the prose says, and never mention a panel in the prose. Open a panel with one of these lines, and close it with a line ":::".
::: timeline (3 to 6 rows "WHEN :: what happened, under 12 words", oldest first, only for a real chronology)
::: facts (3 to 6 rows "Label :: value under 8 words", when this page's own subject is a concrete thing, creature, place or person)
::: steps (3 to 6 rows "Step :: what happens, under 16 words", for a process or a chain of causes)
::: compare A | B (3 to 5 rows "Attribute :: A's value | B's value", for two or three things the page contrasts)
::: theories (2 to 4 rows "Explanation :: the claim, under 14 words :: accepted, partly, disputed or rejected", for a question that has had rival answers)
::: figures (2 to 4 rows "NUMBER :: what it measures, under 10 words", only well-established numbers, rounded)
::: myth (a row "Myth :: what people wrongly believe", then a row "Actually :: what is true", for a misconception people really hold)
::: formula (a row "Equation :: the equation", then one row per symbol "x :: what it stands for", only for a real, named equation)
::: guess (rows "Question :: a question with a surprising answer", "Answer :: the answer", "Why :: one sentence", so the reader predicts before they see it)
===
Keep exploring: exactly 6 topics to open next, one per line: "- [[Topic]] :: hook under 14 words :: kind". Some go further into this subject; at least two leap into a different field through one specific thread, and their hook names that thread. Never this page's own topic, never a broad umbrella subject. Make each hook irresistible and specific.
???
3 questions a curious reader might ask next, one per line, each under 14 words. Each must make sense on its own: name its subject, never "it" or "this".
&&&
For every topic in your link plan, one line: "[[Topic]] :: what makes it fascinating, under 12 words". Never a dictionary definition.

Choosing links. The best links are specific and surprising: ideas, phenomena, mechanisms, mysteries, techniques, strange objects, places and events that open a whole new world, the things a curious person would stop reading to look up. Prefer the specific over the general: on a page about the Great Emu War, link "Lewis gun" or "the Western Australian wheatbelt", not "First World War" or "Australia". Every link must belong to this page's own story: never add a sentence or a section just to fit in an unrelated topic. Variety comes from linking different kinds of things, not from detours. Never reach for stock curiosities that could follow any page (tardigrades, the Antikythera mechanism, the Voynich manuscript, the Tunguska event) unless this page genuinely leads there. Link a person only when their own story is worth a page, and keep people to at most a quarter of the links. Never link generic words, dates, numbers, broad umbrella subjects (a whole war, country, century or science) mentioned in passing, or the page's own title.

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
  person: 'tell what makes them worth a page, the work or the turning point, not a whole biography',
  creature: 'show how it lives and what makes it strange',
  work: 'show what it is, how it was made and what it changed',
};


/** @typedef {{ title: string, lens: keyof typeof LENS_VOICE, q: boolean, ctx: string, bridge: [string, string] | null }} PageInput */

/* A page is written for its topic, so its input is only what makes it that page: the topic, the
   voice, whether it is a question, the sense of a name chosen inside another page (ctx), and the
   pair a connecting page joins. Older browsers still send the path and their history; it is read
   only to find a connecting page's pair, and otherwise ignored. */
/** @param {unknown} raw @returns {PageInput} */
export function pageInput(raw) {
  const o = obj(raw); const f = obj(o.from);
  const lens = /** @type {keyof typeof LENS_VOICE} */ (typeof o.lens === 'string' && o.lens in LENS_VOICE ? o.lens : 'encyclopedic');
  /** @type {[string, string] | null} */ let bridge = null;
  if (Array.isArray(o.bridge)) { const a = str(o.bridge[0], 160), b = str(o.bridge[1], 160); if (a && b) bridge = [a, b]; }
  else if (f.kind === 'bridge') {
    const b = str(f.other, 160); if (!b) throw new BadInput('missing from.other');
    const path = pathOf(o.path); const a = path.length ? path[path.length - 1].title : ''; if (a) bridge = [a, b];
  }
  const title = bridge ? str(o.title, 160) || `${bridge[0]} and ${bridge[1]}` : need(o.title, 160, 'title');
  /* a topic, not a link or an address: shared links must not carry ads or spam onto Dorkhub */
  if (/:\/\/|\bwww\.|\S@\S+\.\S/i.test(title)) throw new BadInput('not a topic');
  const q = !bridge && (o.q === true || f.kind === 'question' || asksQuestion(title));
  return { title, lens, q, ctx: bridge ? '' : str(o.ctx, 160), bridge };
}

/** @param {PageInput} p */
export function titleRule(p) {
  if (!titleIsLocked(p)) return 'Title the page with a short, topic-style title.';
  return `Title it exactly "${capFirst(p.title)}" (you may only fix capitalization or spelling${p.ctx ? ', or add a short qualifier in parentheses' : ''}), and keep the page on that exact subject: never swap in a narrower, broader or different one.`;
}

/* The fixed part comes first and the request last, so the long instructions stay identical from page to page. */
const PAGE_INTRO = `You write pages for Dorkhub, an encyclopedia for curious people who move freely from topic to topic. One page is written per topic, and every reader who opens this topic reads the page you write now, so write it for any curious reader: the best page on its subject anywhere, vivid, specific and surprising.

First decide what kind of thing the topic is; that word goes on the title line. Then shape the page to it:
${Object.entries(KIND_SHAPE).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`;

/** @param {PageInput} p */
export function pagePrompt(p) {
  const L = [PAGE_INTRO, '', FORMAT, ''];
  if (p.bridge) L.push(`This is a connecting page: explain how "${p.bridge[0]}" connects to "${p.bridge[1]}" as a chain of specific steps (people, mechanisms, ideas, events), each one leading to the next. Title it after the connecting thread, not "From A to B".`);
  else if (p.q) L.push(`The reader asked: "${p.title}". Answer it inside the page.`);
  else L.push(`Write the page on: "${p.title}".`);
  if (p.ctx) L.push(`The reader chose this name while reading the page on "${p.ctx}". If it could mean several things, write about the one meant there.`);
  L.push(titleRule(p), `Voice: ${LENS_VOICE[p.lens]}`);
  return L.join('\n');
}

/* For a page written ahead of time that the front page leads into (`node scripts/seeds.mjs brief`, never a
   live page): what the front page already says about it, so the page keeps its promises, and the threads
   the front page draws from it, so the page leads where the map says. Added after the page's own prompt. */
/** @param {{ promises: { text: string, src: string[] }[], threads: { to: string, label: string, src: string }[], kind?: string }} b */
export function seedBrief({ promises, threads, kind = '' }) {
  const L = ['', "This page opens from Dorkhub's front page, which already says this about it. Bear out each claim on the page, in your own words:"];
  for (const p of promises) L.push(`- ${p.text} (${p.src.join(', ')})`);
  /* its card shows its kind in that kind's colour, so the page opens in the same one */
  /* the front page's word for it, as the format names kinds (its "idea" is the format's "concept") */
  const k = kind === 'idea' ? 'concept' : kind;
  if (k) L.push('', `The front page shows it as ${/^[aeiou]/.test(k) ? 'an' : 'a'} ${k}: name that kind on the title line.`);
  L.push('', "The front page also draws a thread from this topic to each of these. Use exactly this name, so it opens that topic's own page. Where a thread belongs to this page's story, link it in the body (and so in your link plan); where it doesn't, make it one of your six topics to keep exploring, with a hook that names the thread. Never add a sentence only to fit one in:");
  for (const t of threads) L.push(`- [[${t.to}]]: ${t.label} (${t.src})`);
  return L.join('\n');
}

/* ---------- the small tasks around a page ---------- */
/** @param {{ title: string }} c */
const ctxLine = c => `The reader is on the page "${c.title}" of Dorkhub, an encyclopedia for curious people.`;
/** @param {unknown} raw */
const onPage = raw => { const o = obj(raw); return { o, title: need(o.title, 160, 'title') }; };

export const UNFOLD = {
  simpler: 'Rewrite this paragraph so a sharp 12-year-old gets it: 50 to 90 words, same key facts, concrete comparisons, never condescending.',
  deeper: 'Go further than this paragraph: the mechanism, the numbers or the nuance it skipped. 70 to 110 words.',
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
const usablePage = t => { const A = parseArticle(t, false); return !!A.title && A.bodyDone && A.blocks.filter(b => b.t === 'p').length >= 3 && cardsOf(A).length >= 4 && Object.keys(A.gloss).length >= 6; };
/** @param {string} t */
const usableText = t => t.trim().length >= 40;
/** @param {(v: any) => boolean} shape @returns {(t: string) => boolean} */
const usableJSON = shape => t => { const v = looseJSON(t); return v != null && shape(v); };

/** @type {Record<string, Task>} */
export const TASKS = {
  page: { input: pageInput, prompt: pagePrompt, maxTokens: 3000, spends: 'page', cacheable: true, usable: usablePage },

  peek: {
    input: raw => { const { o, title } = onPage(raw); return { title, passage: str(o.passage, 600), target: need(o.target, 160, 'target') }; },
    prompt: c => `${ctxLine(c)}
They are reading this passage: "${c.passage}"
They want a quick peek at "${c.target}" without leaving the page. Write one paragraph of 70 to 100 words: what ${c.target} is, what makes it fascinating, and exactly why it matters in this passage. Wrap 2 to 4 ideas or phenomena worth opening as [[Topic]]. Plain text, no heading. Stay factual and flag anything uncertain.`,
    usable: usableText, maxTokens: 400, spends: 'extra', cacheable: true, quick: true,
  },

  unfold: {
    input: raw => { const { o, title } = onPage(raw); const mode = typeof o.mode === 'string' && o.mode in UNFOLD ? /** @type {keyof typeof UNFOLD} */ (o.mode) : null; if (!mode) throw new BadInput('bad mode'); return { title, paragraph: need(o.paragraph, 900, 'paragraph'), mode }; },
    prompt: c => `${ctxLine(c)}
Paragraph: "${c.paragraph}"
${UNFOLD[/** @type {keyof typeof UNFOLD} */ (c.mode)]} Wrap 2 or 3 ideas or phenomena worth opening as [[Topic]]. One paragraph of plain text, no heading, no preamble. Stay factual and flag anything uncertain.`,
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
      const pages = list(o.pages, 90, x => { const p = obj(x); const title = str(p.title, 160); return title ? { title, deck: str(p.deck, 400), text: str(p.text, 420) } : null; });
      if (pages.length < 2) throw new BadInput('a recap needs two pages');
      return { pages, untaken: list(o.untaken, 14, x => str(x, 160) || null) };
    },
    prompt: c => `A reader just explored these pages on Dorkhub, an encyclopedia where every topic leads to more, in this order:
${c.pages.map((/** @type {{ title: string, deck: string, text: string }} */ n) => `- ${n.title}${n.deck ? `: ${n.deck}` : ''}${n.text ? `\n  What it said: ${n.text}` : ''}`).join('\n')}

Topics they saw but did not open: ${c.untaken.join('; ') || 'none'}

Write their recap in Markdown, faithful to the pages above:
# Recap: <a 3 to 7 word title for this trail>
One short paragraph summarizing the journey and its shape.
## Five things you now know
- five bullets, one sentence each: the most surprising specifics from the pages (numbers, names, mechanisms), never a restated summary
## The strangest connection
One or two sentences.
## Where to go next
- three bullets, from the topics they skipped or natural next steps
Under 350 words. No preamble.`,
    usable: usableText, maxTokens: 900, spends: 'extra', cacheable: true, quick: true,
  },

  around: {
    input: raw => { const { title } = onPage(raw); return { title }; },
    prompt: c => `${ctxLine(c)}
Survey the territory of knowledge around "${c.title}". Name 10 neighboring topics a curious reader could open next, spread across different bearings: history, science, people, culture, mechanism, and elsewhere (a surprising far connection).
Reply with only a JSON array of 10 objects: {"name": "2 to 4 words", "relation": "under 12 words on how it connects to ${c.title}", "kind": "person|place|thing|idea|event|era|creature|work", "bearing": "history|science|people|culture|mechanism|elsewhere", "distance": 1 | 2 | 3}. Distance 1 is right next door; 3 is far but genuinely connected.`,
    usable: usableJSON(v => Array.isArray(v) && v.filter(o => o && o.name).length >= 4), maxTokens: 900, spends: 'extra', cacheable: true, quick: true,
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

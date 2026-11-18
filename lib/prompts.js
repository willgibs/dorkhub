/* ================= prompts: the only place Dorkhub's instructions live =================
   The browser never sends a prompt. It names a task and sends the structured context
   (a title, a passage), and this module turns that into the prompt. That keeps
   the endpoint from being a general-purpose chatbot, keeps prompts versioned in one
   place, and leaves room for per-model variants once models have been evaluated.

   Every task has: a validator that clips and normalizes its input, a builder, an
   output budget, the quota it spends ("page", "extra", or none), and whether
   identical requests may be answered from cache. */

import { KINDS, capFirst, cardsOf, clip, keyOf, looseJSON, parseArticle, splitLink, titleIsLocked } from '../src/shared/article.js';
import { asksQuestion } from '../src/shared/world.js';

/* Bump when the output format or a prompt changes in a way that should not reuse cached text. */
export const PROMPT_VERSION = '2026-10-19-v3.1';
/* How Dorkhub's own writer writes a page: 'split', in four calls (head and plan at once, body, ways on: "the split
   writer" below), or 'one-pass', the page in one call (TASKS.page.prompt). Readers' own keys and the mock always write
   in one pass. Pages the split writer wrote are kept under their own version, so no page written in one pass is served
   for one of its. */
export const PAGE_WRITER = /** @type {'split' | 'one-pass'} */ ('split');
export const SPLIT_VERSION = '2026-11-18-split3';

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

/* The request: what makes this page this page, after the fixed instructions. */
/** @param {PageInput} p @returns {string[]} */
function pageRequest(p) {
  const L = [];
  if (p.bridge) L.push(`This is a connecting page: explain how "${p.bridge[0]}" connects to "${p.bridge[1]}" as a chain of specific steps (people, mechanisms, ideas, events), each one leading to the next. Title it after the connecting thread, not "From A to B".`);
  else if (p.q) L.push(`The reader asked: "${p.title}". Answer it inside the page.`);
  else L.push(`Write the page on: "${p.title}".`);
  if (p.ctx) L.push(`The reader chose this name while reading the page on "${p.ctx}". If it could mean several things, write about the one meant there.`);
  L.push(titleRule(p), `Voice: ${LENS_VOICE[p.lens]}`);
  return L;
}

/* ---------- page writer variants ----------
   Named ways of asking for the same page, compared by the eval (scripts/eval.mjs, docs/eval-plan.md).
   Every variant keeps output format v3.1, so the parser and the page never change with one. A variant
   says only how it differs from today's prompt: `split` sends the fixed part as instructions (so a
   provider can cache it), `ground` asks for reference notes, `format` swaps in a reworded FORMAT.
   Production writes with PAGE_VARIANT through TASKS.page.prompt; changing which variant that is changes
   the answer cache's text, so it goes with a PROMPT_VERSION bump. */

/** Reference notes for a grounded page (lib/grounding.js). @typedef {{ title: string, url: string, text: string }} PageNotes */
/**
 * @typedef {object} PageVariant
 * @property {string} note  what it changes, in a line
 * @property {boolean} [split]  the fixed part goes in `system`, the request in `prompt`
 * @property {boolean} [ground]  wants reference notes, added to the prompt when supplied
 * @property {string} [format]  replaces FORMAT
 * @property {string} [intro]  replaces the opening (PAGE_INTRO)
 */

/* One line of FORMAT reworded, failing loudly if FORMAT no longer holds the line being replaced. */
/** @param {string} from @param {string} to */
const reword = (from, to) => { if (!FORMAT.includes(from)) throw new Error(`FORMAT no longer contains: ${from.slice(0, 60)}`); return FORMAT.replace(from, to); };

const HOOK_LINE = 'For every topic in your link plan, one line: "[[Topic]] :: what makes it fascinating, under 12 words". Never a dictionary definition.';
/* Hover hooks were the most error-prone line of a page: a dozen confident claims with no room for a hedge. */
const HOOK_LINE_TIGHT = 'For every topic in your link plan, one line: "[[Topic]] :: why it is worth opening, under 12 words". Say what makes it fascinating without a number, date or superlative, unless it is a textbook fact. Never a dictionary definition.';

/* ---------- lean: the same page, asked for in half the words and a sixth of the rules ----------
   Will, 2026-11-13: there is an elegance that wins. A prompt that tries to rule on every edge case
   distils to the point where rules get lost and no creativity goes into the article; given the right
   context, a writer this capable can use its discretion. So this variant says who the page is for and
   what a great one does, shows the page's shape once (a program reads the markers, so those stay
   exact), and leaves the rest to judgement: no sentence counts, no word limits, no lists of what never
   to do. The page's design holds the outliers, and the parser already holds the structure (two panels
   at most, never above the first paragraph). Whether it writes better pages is the eval's to say. */
const LEAN_INTRO = `You write pages for Dorkhub, an encyclopedia for curious people who wander from topic to topic. One page is written per topic, and everyone who opens it reads the page you write now.

Write the page you would be glad to find: the one that makes a curious newcomer think "I had no idea" and then want to open something. Go past the overview to what most introductions skip: who, where and when; how it actually works; the number that changes how it looks. Be right. If something is uncertain, disputed or legend, say so plainly, and leave out what you are not sure of rather than guess. Use your judgement about everything this does not spell out.`;

const LEAN_FORMAT = `The reader starts reading the top of the page while you are still writing the rest, so write it in this order and never go back. A program reads the markers, so keep them exactly. Plain text, no preamble.

# Title :: kind
> One sentence that makes the reader want the rest.
!!!
Label :: value
Label :: value
Label :: value
+++
[[Topic]] :: kind
---
The body.
===
- [[Topic]] :: why open it :: kind
???
A question a curious reader would ask next.
&&&
[[Topic]] :: why it is worth opening

What goes where:
- kind says what the page is about, one of: concept, phenomenon, mechanism, mystery, technique, thing, place, event, era, person, creature, work. Let it shape the page: a mystery is its puzzle and the rival answers, a mechanism is how it works.
- After "!!!", the three facts worth knowing at a glance, a short label and a short value each, and only ones you are sure of.
- After "+++", your links: the 10 to 14 topics from this page most worth opening, one per line, each by the plain name an encyclopedia would give it. Then link each one where it comes up in the body, as [[Topic]] or [[words shown|Topic]]. Links are the point of Dorkhub: choose the specific, surprising thing a curious person would stop reading to look up (the Lewis gun, not the First World War), and only where this page's own story leads there.
- The body opens with a paragraph that puts a picture in a newcomer's head, then has a few sections, each starting "## Heading": about 500 words in all. Where a paragraph leaves room for one, add an aside on the next line, starting "^ ": a sentence that adds something the paragraph did not say.
- When rows would show something better than prose can, put a panel (one, rarely two) after the paragraph it belongs to. Open it with one of these lines, give it a few rows, and close it with a line ":::".
::: timeline (rows "WHEN :: what happened")
::: facts (rows "Label :: value")
::: steps (rows "Step :: what happens")
::: compare A | B (name the things compared; rows "Attribute :: A's value | B's value")
::: theories (rows "Explanation :: the claim :: accepted, partly, disputed or rejected")
::: figures (rows "NUMBER :: what it measures")
::: myth (a row "Myth :: what people believe", then a row "Actually :: what is true")
::: formula (a row "Equation :: the equation", then a row "x :: what it stands for" per symbol)
::: guess (rows "Question :: a question with a surprising answer", "Answer :: the answer", "Why :: one sentence")
- After "===", exactly six topics to open next, one per line: some deeper into this subject, some a leap into another field, each with a hook that makes it hard not to click.
- After "???", three questions, each making sense on its own.
- After "&&&", one line for every topic in your link plan.`;

/** @type {Record<string, PageVariant>} */
export const PAGE_VARIANTS = {
  base: { note: "today's prompt as one message: the control" },
  split: { note: 'the same words, the fixed part as instructions and the request as the prompt', split: true },
  grounded: { note: 'split, plus the lead of the topic\'s Wikipedia article as reference notes', split: true, ground: true },
  lean: { note: 'the same page asked for in half the words and a sixth of the rules: context and the shape, then the writer\'s judgement', split: true, intro: LEAN_INTRO, format: LEAN_FORMAT },
  'hooks-tight': { note: 'split, with hover hooks that carry no number, date or superlative unless textbook', split: true, format: reword(HOOK_LINE, HOOK_LINE_TIGHT) },
};
/* The variant production writes with. */
export const PAGE_VARIANT = 'base';

/** @param {PageNotes} n */
export const notesBlock = n => `Reference notes, from the opening of Wikipedia's article "${n.title}" (${n.url}):
"""
${n.text}
"""
Take facts from these notes but never their wording. Prefer them for numbers, dates and names. They are a floor, not the page: keep going past them to the surprising specifics they leave out. If the notes look wrong or outdated on a point, leave that point out rather than repeat it.`;

/**
 * The page writer's call for one variant: `system` is null when everything goes in one message.
 * @param {PageInput} p @param {string} [variantId] @param {{ notes?: PageNotes | null }} [o]
 * @returns {{ system: string | null, prompt: string, maxTokens: number, ground: boolean }}
 */
export function composePage(p, variantId = PAGE_VARIANT, { notes = null } = {}) {
  const v = PAGE_VARIANTS[variantId]; if (!v) throw new Error(`unknown page variant: ${variantId}`);
  const { fixed, request } = pageText(p, v, notes);
  return v.split
    ? { system: fixed, prompt: request, maxTokens: 3000, ground: !!v.ground }
    : { system: null, prompt: `${fixed}\n\n${request}`, maxTokens: 3000, ground: !!v.ground };
}

/** What every page of a variant shares, and what makes this page this page. @param {PageInput} p @param {PageVariant} v @param {PageNotes | null} [notes] */
function pageText(p, v, notes = null) {
  return {
    fixed: [v.intro ?? PAGE_INTRO, '', v.format ?? FORMAT].join('\n'),
    request: [...(v.ground && notes ? [notesBlock(notes), ''] : []), ...pageRequest(p)].join('\n'),
  };
}

/** @param {PageInput} p */
export function pagePrompt(p) { return composePage(p, PAGE_VARIANT).prompt; }

/* The page's prompt in its two parts: the instructions every page shares (with the blank line after them), then what
   makes this page this page. Joined, they are pagePrompt's words exactly (a test holds it, and fails if production's
   variant ever stops sending one message). The shared part comes first so a provider can cache it once for every
   page (lib/ai.js `cachedPrompt`): only what a call costs changes, never what the writer reads. */
/** @param {PageInput} p @param {string} [variantId] another variant's words, for a try (scripts/seeds/batch.js ARMS)
    @returns {{ fixed: string, request: string }} */
export function pageParts(p, variantId = PAGE_VARIANT) {
  const v = PAGE_VARIANTS[variantId]; if (!v) throw new Error(`unknown page variant: ${variantId}`);
  const { fixed, request } = pageText(p, v);
  return { fixed: `${fixed}\n\n`, request };
}

/* For a page written ahead of time that the front page leads into (`node scripts/seeds.mjs brief`, never a
   live page): what the front page already says about it, so the page keeps its promises, and the threads
   the front page draws from it, so the page leads where the map says. Added after the page's own prompt. */
/** @param {{ promises: { text: string, src: string[] }[], threads: { to: string, label: string, src: string }[], kind?: string }} b */
export function seedBrief({ promises, threads, kind = '' }) {
  /* the reader opens it with nothing in mind but the topic (Will, 2026-11-17, of a "Time travel" page that opened on
     GPS clocks, its card's claim: "I just assumed I was coming in with a preconceived notion of a topic within it") */
  const L = ['', "This page opens from Dorkhub's front page, where a reader picks it with nothing in mind but the topic: it is their way into the whole subject, so open on the topic itself and its world, not on one corner of it. The front page already says this about it; bear out each claim somewhere on the page, in your own words:"];
  for (const p of promises) L.push(`- ${p.text} (${p.src.join(', ')})`);
  /* its card shows its kind in that kind's colour, so the page opens in the same one */
  /* the front page's word for it, as the format names kinds (its "idea" is the format's "concept") */
  const k = kind === 'idea' ? 'concept' : kind;
  if (k) L.push('', `The front page shows it as ${/^[aeiou]/.test(k) ? 'an' : 'a'} ${k}: name that kind on the title line.`);
  L.push('', "The front page also draws a thread from this topic to each of these. Use exactly this name, so it opens that topic's own page. Where a thread belongs to this page's story, link it in the body (and so in your link plan); where it doesn't, make it one of your six topics to keep exploring, with a hook that names the thread. Never add a sentence only to fit one in:");
  for (const t of threads) L.push(`- [[${t.to}]]: ${t.label} (${t.src})`);
  return L.join('\n');
}

/* ---------- the split writer (2026-11-17; live since #57) ----------
   Claude Haiku 5.5 writes well with one job at a time, and loses the links when one pass asks for everything: on
   production's own call 16 of 44 bodies linked nothing, while given only the body (and the plan) 2 of 44 did
   (docs/decisions.md). So a page is written in four calls, each in the shape that suits it and all in the page's own
   lines: its head (title, kind, deck, key facts) and its plan (the topics it links) at once, its body as prose written
   to both, and its ways on written from that body. `pageFromParts` joins them into the page's text (format v3.1), so
   the parser, the cache and the page don't change. Haiku copies a prompt's phrases into the page (a list of what a
   section might cover became 39 pages' headings), so these say what is wanted with nothing in them to copy.
   The head and plan (one call, the frame) and the ways on were structured output at first, and the body's first words
   came 1.8 s after the one pass's: JSON waited 1.2 to 1.8 s for its first token and ran to twice the tokens of the
   same lines (2026-11-18). Then the frame's head lines still made the body wait for the head and the plan in turn. */
const SPLIT_KINDS = KINDS.filter(k => k !== 'idea');
const SPLIT_INTRO = 'Dorkhub is an encyclopedia for curious people who wander from topic to topic. One page is written per topic, and everyone who opens that topic reads the same page, so it should be the best page on its subject anywhere: vivid, specific, surprising and right.';
/* the head and the plan both name the kind, from the same words, so they read the topic the same way */
const KIND_TEXT = `The title line holds the page's title and the kind of thing the topic is, one of ${SPLIT_KINDS.join(', ')}. The kind shapes the whole page. ${Object.entries(KIND_SHAPE).map(([k, v]) => `A ${k}'s page should ${v}.`).join(' ')}`;

const HEAD_FIXED = `${SPLIT_INTRO}

Before the page is written, write its head: these lines, in this order, and nothing after them.

# Title :: kind
> deck
!!!
Label :: value
Label :: value
Label :: value

${KIND_TEXT}
The deck is one sentence under 25 words that makes a curious reader want the page.
After "!!!" come the three facts a reader wants at a glance, chosen for the kind (a creature's size or home, a place's whereabouts, an event's date and toll, a mystery's best evidence, a concept's origin and defining case), each a label of one to three words and a value under seven words, numbers rounded and with units. Only facts you are sure of.
The topics it links and its body are written separately, so stop after the last fact.`;

const PLAN_FIXED = `${SPLIT_INTRO}

Before the page is written, choose the topics it links: write these lines, in this order, and nothing after them.

# Title :: kind
+++
[[Topic]] :: kind

${KIND_TEXT}
After "+++" come the 10 to 14 topics most worth opening from this page, one to a line as "[[Topic]] :: kind", each by the plain name an encyclopedia gives it, with a qualifier in parentheses only when the name alone means several things. The best are specific and surprising (ideas, phenomena, mechanisms, mysteries, techniques, strange objects, places, events), the things a curious person would stop reading to look up, and each belongs to this page's own story. Prefer the specific to the general, a person only when their own story is worth a page, and never a broad umbrella subject (a whole war, country, century or science) or this page's own topic.
The page itself is written separately, so stop after the last topic.`;
/* where the head's call stops if the writer goes on into the topics or a body, and where the plan's does */
export const HEAD_STOP = ['\n+++', '\n---', '\n## '];
export const PLAN_STOP = ['\n---', '\n## '];

const BODY_FIXED = `${SPLIT_INTRO}

You write the body of one page. Its title, deck and key facts are already on the page above your text, and the topics it links are chosen. Write what goes under them.
Start on the topic itself, so a newcomer knows at once what it is and why it is remarkable. Then go past the overview in two to four sections, each under a heading of your own that names what that section is about on this page, with "## " before it. A reader should leave knowing what most introductions never mention: who found it and where, how it works, the numbers that matter, what is still unknown. About 500 words, in paragraphs of three to six sentences.
Link each chosen topic once, where the story reaches it, by its exact name: [[Topic]], or [[the words shown|Topic]] when other words read better, spread through the whole body. Leave out any the story doesn't reach: never add a sentence only to fit one in, and never say more about a topic than you are sure of.
An aside may follow a paragraph on a line of its own, starting "^ ": one sentence that adds what the paragraph didn't say. When rows would show something better than prose (a chronology, steps, a comparison, figures), one panel may follow the paragraph it belongs to: a line "::: timeline", "::: steps", "::: compare A | B", "::: figures" or "::: facts", a few rows "label :: text", then a line ":::".
Say plainly what is uncertain, disputed or legend, and leave out what you are not sure of. Write only the body, in plain text: no title, no preamble, nothing after it.`;

const WAYS_FIXED = `${SPLIT_INTRO}

A page has just been written; it is below. Write what comes after it, for a reader who has just finished it: these lines, in this order, and nothing after them.

===
- [[Topic]] :: hook :: kind
???
Question?
&&&
[[Topic]] :: hook

After "===" come six topics to open next, one to a line as "- [[Topic]] :: hook :: kind". Some go further into this subject; at least two leap into a different field through one specific thread, which their hook names. Each by the plain name an encyclopedia gives it (never this page's own topic or a broad umbrella subject), with a hook under 14 words that makes it hard not to open, and its kind, one of ${SPLIT_KINDS.join(', ')}.
After "???" come three questions this reader might ask next, one to a line, each under 14 words and making sense on its own: it names its subject.
After "&&&" comes a line for each topic the page links, as "[[Topic]] :: hook": under 12 words on what makes it fascinating, never a definition.`;

/** What makes this page this page: for the frame, as the one pass asks it; for the body, without the title it doesn't write.
    @param {PageInput} p @param {boolean} [titled] */
const splitRequest = (p, titled = true) => pageRequest(p).filter(l => titled || l !== titleRule(p)).join('\n');
/** @param {PageInput} p @returns {{ fixed: string, request: string }} */
export const headParts = p => ({ fixed: `${HEAD_FIXED}\n\n`, request: splitRequest(p) });
/** @param {PageInput} p @returns {{ fixed: string, request: string }} */
export const planParts = p => ({ fixed: `${PLAN_FIXED}\n\n`, request: splitRequest(p) });
/** @typedef {{ title: string, kind: string, deck: string, facts: { label: string, value: string }[], links: { topic: string, kind: string }[] }} Frame */
/* how a head line can slip: a preamble above the title, the format's own names as labels, a key fact with one colon,
   a bar or a colon too many (3 of 88 live frames, 2026-11-18), a planned topic numbered, bulleted, without its brackets
   or with its kind in parentheses ("Wild yeast (creature)", 4 of 24 live frames before the prompt showed the line), a
   second "+++" */
const TITLE_LINE = /^\s*#\s*\S|\S\s*::\s*[a-z]+\s*$/i;
const MARK = /^(?:[-*•]|\d{1,2}[.)])\s*/;
/** @param {string} w */
const isKind = w => KINDS.includes(w) || KINDS.includes(w.replace(/s$/, ''));
/** a key fact as "Label :: value", from "Label: value", "Label | value" or "Label: :: value" @param {string} t */
function factLine(t) {
  const s = t.replace(MARK, '').replace(/\*\*/g, '');
  const m = /\s*::\s*/.exec(s) || /\s+\|\s+/.exec(s) || /:\s+/.exec(s);
  if (!m) return t;
  const label = s.slice(0, m.index).replace(/:\s*$/, '').trim(); const value = s.slice(m.index + m[0].length).trim();
  return label && value && (m[0].includes('::') || label.split(/\s+/).length <= 4) ? `${label} :: ${value}` : t;
}
const FACTS_LABEL = /^[-*•#\s]*\**\s*key\s+facts?\s*\**\s*:?\s*$/i;
const LINKS_LABEL = /^[-*•#\s]*\**\s*(?:your\s+)?(?:link\s+plan|links|topics)\s*\**\s*:?\s*$/i;
/** A frame from the head lines written so far, read by the page's own parser. While the call runs only whole lines
    count, and each list keeps an empty last place, so `headSoFar` puts each line out as soon as it is whole; the deck
    counts only above the facts and topics, so nothing a reader has seen ever changes.
    @param {string} text @param {boolean} [done] @returns {Partial<Frame>} */
export function frameOfLines(text, done = true) {
  const all = String(text || ''); const upto = done ? all : all.slice(0, all.lastIndexOf('\n') + 1);
  const raw = upto.split('\n'); const top = raw.findIndex(L => TITLE_LINE.test(L));
  if (top < 0) return done ? { title: '', kind: '', deck: '', facts: [], links: [] } : {};
  let facts = false, links = false;
  const lines = raw.slice(top).map((L, i) => {
    const t = L.trim();
    if (i && (t === '!!!' || FACTS_LABEL.test(t))) { facts = true; return '!!!'; }
    if (i && (t === '+++' || LINKS_LABEL.test(t))) { const again = links; links = true; return again ? '' : '+++'; }
    if (i && (facts || links) && /^(?:>|#\s)/.test(t)) return '';
    if (!links) return facts && t ? factLine(t) : L;
    const s = t.replace(MARK, '');
    if (/^\[\[[^\]\n]+\]\]/.test(s)) return s;
    const m = /^([^:[\]\n]{2,80}?)\s*::\s*([a-z]+)$/i.exec(s);
    if (m) return `[[${m[1].trim()}]] :: ${m[2].toLowerCase()}`;
    /* a name alone, or with its kind in parentheses; other parentheses are the name's own ("Mercury (planet)") */
    if (!/^[\p{L}\p{N}][^:[\]\n]{1,79}$/u.test(s) || /[.!?]$/.test(s) || s.split(/\s+/).length > 10) return L;
    const p = /^(.+?)\s*\(([a-z]+)\)$/.exec(s);
    return p && isKind(p[2]) ? `[[${p[1]}]] :: ${p[2]}` : `[[${s}]]`;
  });
  const A = parseArticle(lines.join('\n'), false);
  const planned = Object.values(A.gloss).map(g => ({ topic: g.name, kind: g.kind || '' }));
  if (done) return { title: A.title, kind: A.kind, deck: A.deck, facts: A.keyFacts, links: planned };
  /** @type {any} */ const f = { title: A.title, kind: A.kind, deck: A.deck };
  if (A.deck || facts || links) f.facts = [...A.keyFacts, null];
  if (links) f.links = [...planned, null];
  return f;
}
/** The topics a page links, from the lines its plan's call wrote, read as a head's topics are: everything above its
    "+++" is its title line, written without its "#" on 20 of 44 live plans ("Venus flytrap :: creature", 2026-11-18);
    with no "+++", every line but a title is a topic. @param {string} text */
export function planOfLines(text) {
  const lines = String(text || '').split('\n'); const at = lines.findIndex(L => L.trim() === '+++' || LINKS_LABEL.test(L.trim()));
  const topics = at >= 0 ? lines.slice(at + 1) : lines.filter(L => !/^\s*#\s/.test(L));
  return /** @type {Frame} */ (frameOfLines(`# Page\n+++\n${topics.join('\n')}`, true)).links;
}
/** @param {PageInput} p @param {Frame} f @returns {{ fixed: string, request: string }} */
export const bodyParts = (p, f) => ({ fixed: `${BODY_FIXED}\n\n`, request: [splitRequest(p, false), `The page's kind: ${f.kind}. ${KIND_SHAPE[/** @type {keyof typeof KIND_SHAPE} */ (f.kind)] ? `Its page should ${KIND_SHAPE[/** @type {keyof typeof KIND_SHAPE} */ (f.kind)]}.` : ''}`, `Its deck: ${f.deck}`, `Its key facts: ${f.facts.map(x => `${x.label}: ${x.value}`).join('; ')}`, `The topics it links, by their exact names: ${plannedNames(p, f).join('; ')}`].join('\n') });
/** The ways on's request: the page as a reader has it, and the topics its body links (only those get hooks).
    @param {PageInput} p @param {Frame} f @param {string} body the body as linked
    @returns {{ fixed: string, request: string }} */
export const waysParts = (p, f, body) => ({ fixed: `${WAYS_FIXED}\n\n`, request: [`The page "${pageTitle(p, f)}", a ${f.kind}, links: ${linkedNames(plannedNames(p, f), body).join('; ')}`, '"""', f.deck, '', body.trim(), '"""'].join('\n') });

/* the title: a clicked topic stays the title (titleIsLocked); a question or a connecting page names its own */
/** @param {PageInput} p @param {Frame} f */
const pageTitle = (p, f) => (titleIsLocked(p) ? capFirst(p.title) : (f.title || '').trim() || capFirst(p.title));
/** a field's words on one line, without the format's own marks @param {unknown} s */
const flat = s => String(s ?? '').replace(/\s*::+\s*/g, ': ').replace(/\[\[|\]\]/g, '').replace(/\s+/g, ' ').trim();

/* The page's text, built from its parts as they arrive: each line goes out only once its field is whole (the field after
   it has begun, or the call has ended), so what a reader has seen never changes; the text only grows. */
/** the items of a list that are whole: all of them once the list is done, else all but the one still being written
    @template T @param {T[] | undefined} a @param {boolean} done @returns {T[]} */
const whole = (a, done) => (Array.isArray(a) ? (done ? a : a.slice(0, -1)) : []);
/** The page's text down to its body, from its frame so far. @param {PageInput} p @param {Partial<Frame>} f @param {boolean} [done] */
export function headSoFar(p, f, done = true) {
  if (!done && f.deck === undefined) return '';
  const kind = SPLIT_KINDS.includes(String(f.kind)) ? ` :: ${f.kind}` : '';
  const L = [`# ${pageTitle(p, /** @type {Frame} */ (f))}${kind}`];
  if (done || f.facts !== undefined) {
    if (flat(f.deck)) L.push(`> ${flat(f.deck)}`);
    const factsDone = done || f.links !== undefined;
    const facts = whole(f.facts, factsDone).slice(0, 3).filter(x => x && flat(x.label) && flat(x.value)).map(x => `${flat(x.label)} :: ${flat(x.value)}`);
    if (facts.length) L.push('!!!', ...facts);
    if (factsDone) {
      L.push('+++', ...plannedTopics(p, f, done).map(l => `[[${flat(l.topic)}]]${SPLIT_KINDS.includes(String(l.kind)) ? ` :: ${l.kind}` : ''}`));
    }
  }
  if (done) L.push('---');
  return `${L.join('\n')}\n`;
}
/** @typedef {{ next: { topic: string, hook: string, kind: string }[], questions: string[], hooks: { topic: string, hook: string }[] }} Ways */
/** The page's end, from its ways on so far. @param {Partial<Ways>} w @param {boolean} [done] */
export function tailSoFar(w, done = true) {
  const L = [];
  const next = whole(w.next, done || w.questions !== undefined).slice(0, 6).filter(n => n && flat(n.topic)).map(n => `- [[${flat(n.topic)}]] :: ${flat(n.hook)}${SPLIT_KINDS.includes(String(n.kind)) ? ` :: ${n.kind}` : ''}`);
  if (next.length) L.push('===', ...next);
  if (done || w.questions !== undefined) {
    const questions = whole(w.questions, done || w.hooks !== undefined).slice(0, 3).map(flat).filter(Boolean);
    if (questions.length) L.push('???', ...questions);
    const hooks = whole(w.hooks, done).filter(h => h && flat(h.topic) && flat(h.hook)).map(h => `[[${flat(h.topic)}]] :: ${flat(h.hook)}`);
    if (hooks.length) L.push('&&&', ...hooks);
  }
  return L.length ? `\n\n${L.join('\n')}\n` : '';
}
/** What to add to the page's end so far: what is new, or, where a line came to read differently once the call ended,
    each section not yet begun, so what a reader has seen stays and one misread line never costs the page its end (a
    first topic read as body while streaming, then dropped, cut 2 of 44 live ends short, 2026-11-18).
    @param {string} shown @param {string} now @param {boolean} done */
export function moreTail(shown, now, done) {
  if (now.startsWith(shown)) return now.slice(shown.length);
  if (!done) return '';
  const at = ['\n???\n', '\n&&&\n'].map(m => (shown.includes(m) ? -1 : now.indexOf(m))).find(i => i >= 0);
  return at === undefined ? '' : now.slice(at);
}
/** The ways on from the end lines their call has written so far, read by the page's own parser (which also reads them
    with a marker left out, by each section's line shape). The end begins with its six topics, so lines above any
    marker are those: Haiku left the "===" out of 43 of 44 live ends, and a topic line with no kind or one outside the
    list then read as body, while streaming and finished alike (2026-11-18). While the call runs only whole lines
    count, and each list keeps an empty last place, so `tailSoFar` puts each line out as soon as it is whole.
    @param {string} text @param {boolean} [done] @returns {Partial<Ways>} */
export function waysOfLines(text, done = true) {
  const all = String(text || ''); const cut = done ? all : all.slice(0, all.lastIndexOf('\n') + 1);
  const first = cut.split('\n').find(L => L.trim());
  const upto = first && !/^(?:===|\?\?\?|&&&)$/.test(first.trim()) ? `===\n${cut}` : cut;
  /** @type {Record<string, boolean>} */ const seen = {};
  for (const L of upto.split('\n')) { const k = { '===': 'next', '???': 'questions', '&&&': 'hooks' }[L.trim()]; if (k) seen[k] = true; }
  const A = parseArticle(`# Page\n---\nThe page.\n\n${upto}`, false);
  const next = A.tunnels.map(t => ({ topic: t.target, hook: t.teaser, kind: t.kind || '' }));
  const questions = A.questions;
  const hooks = Object.values(A.gloss).filter(g => g.gloss).map(g => ({ topic: g.name, hook: g.gloss }));
  if (done) return { next, questions, hooks };
  /** @type {any} */ const w = {};
  if (next.length || seen.next) w.next = [...next, null];
  if (questions.length || seen.questions || seen.hooks || hooks.length) w.questions = [...questions, null];
  if (hooks.length || seen.hooks) w.hooks = [...hooks, null];
  return w;
}
/* a line the body shouldn't open with: a title, the deck or a fence the writer added on top */
const LEAD = /^\s*(#\s|>|```)/;
/** A body as the writer sent it, without a title, deck or fence it may have added on top. @param {string} b */
export const bodyOf = b => { let s = String(b || ''); for (let m; (m = /^([^\n]*)\n/.exec(s)) && (LEAD.test(m[1]) || !m[1].trim());) s = s.slice(m[0].length); return s.replace(/\n```\s*$/, '').trim(); };
/** a topic's key, loose enough that a page never plans itself ("Venus flytrap" on "Venus flytraps", "The Antikythera
    mechanism" on "Antikythera mechanism", both in live plans, 2026-11-18) @param {unknown} t */
const selfKey = t => keyOf(flat(t)).replace(/(\w\w)s\b/g, '$1');
/** The topics the page's head plans, in its order: never the page itself, never one twice, at most 14.
    @param {PageInput} p @param {Partial<Frame>} f @param {boolean} [done] */
export function plannedTopics(p, f, done = true) {
  const own = selfKey(pageTitle(p, /** @type {Frame} */ (f))); /** @type {Set<string>} */ const seen = new Set();
  return whole(f.links, done).filter(l => { const k = flat(l?.topic).toLowerCase(); if (!k || seen.has(k) || selfKey(l?.topic) === own) return false; seen.add(k); return true; }).slice(0, 14);
}

/* A planned topic is linked where the body first mentions it, if the writer left it plain: given the plan, Haiku 5.5
   still wrote no brackets at all on 5 of 44 bodies, though they named 8 to 12 planned topics each (2026-11-17). It
   streams: text goes on as it comes, held back only while a planned name might still be completing at its end (the
   longest name's length) or a link is still open, so a reader never sees a word turn into a link. A topic the writer
   linked first is left as it linked it; headings are never linked, nor a name inside the page's own title (a planned
   "Lightning" in "Ball lightning", 2026-11-18). */
/** @param {string} s */
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** a name as whole words, and for a planned topic its plural too ("emus" for "Emu", 2026-11-18)
    @param {string} name @param {boolean} [plural] */
const named = (name, plural = false) => new RegExp(`(?<![\\p{L}\\p{N}])${escRe(name)}${plural ? '(?:e?s)?' : ''}(?![\\p{L}\\p{N}])`, 'giu');
/** @param {string[]} topics @param {string[]} [own] names never linked, nor any topic inside one
    @returns {{ push: (chunk: string) => string, end: () => string }} */
export function mentionLinker(topics, own = []) {
  /** @type {{ topic: string, key: string, len: number, re: RegExp }[]} */ const plan = [];
  for (const topic of topics) {
    const name = String(topic || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (name.length >= 3 && !plan.some(x => x.key === topic.toLowerCase())) plan.push({ topic, key: topic.toLowerCase(), len: name.length, re: named(name, true) });
  }
  const kept = own.map(n => String(n || '').trim()).filter(n => n.length >= 3).map(n => ({ len: n.length, re: named(n) }));
  /* a shorter name never links inside a longer planned one ("orbit" in "low Earth orbit"), nor inside the page's own */
  /** @param {string} text @param {(typeof plan)[number]} x @param {number} s @param {number} e */
  const inLonger = (text, x, s, e) => [...plan, ...kept].some(y => {
    if (y.len <= x.len) return false;
    y.re.lastIndex = Math.max(0, e - y.len - 3); let m;
    while ((m = y.re.exec(text)) && m.index <= s) if (m.index + m[0].length >= e) return true;
    return false;
  });
  const longest = Math.max(0, ...plan.map(x => x.topic.length + 2), ...kept.map(y => y.len));
  /** @type {Set<string>} */ const done = new Set();
  let held = '';
  /** whether the line being passed on is a heading, once its start is seen @type {boolean | null} */
  let heading = null;
  /* link the first mentions in text[0, upto) (a mention may run past upto, never past the text), and say how far it went */
  /** @param {string} text @param {number} upto */
  function link(text, upto) {
    let out = '', i = 0;
    const open = (() => { const o = text.lastIndexOf('[['); return o >= 0 && text.indexOf(']]', o) < 0 ? o : Infinity; })();
    /* a writer's link names its topic on either side, as the parser reads it (canonLinks) */
    const spans = [...text.matchAll(/\[\[([^\]\n]*)\]\]/g)].map(m => ({ a: /** @type {number} */ (m.index), b: /** @type {number} */ (m.index) + m[0].length, keys: splitLink(m[1]).map(k => k.toLowerCase()) }));
    for (;;) {
      const span = spans.find(x => x.a >= i);
      /** @type {{ s: number, e: number, x: (typeof plan)[number], words: string } | null} */ let best = null;
      if (!heading) for (const x of plan) {
        if (done.has(x.key)) continue;
        x.re.lastIndex = i; let m;
        while ((m = x.re.exec(text)) && m.index < upto) {
          const s = m.index, e = s + m[0].length;
          if (e > open || spans.some(y => s < y.b && e > y.a) || inLonger(text, x, s, e)) continue;
          if (!best || s < best.s) best = { s, e, x, words: m[0] };
          break;
        }
      }
      if (span && span.a < upto && (!best || span.a < best.s)) { out += text.slice(i, span.b); span.keys.forEach(k => done.add(k)); i = span.b; continue; }
      if (best) { out += text.slice(i, best.s) + (best.words === best.x.topic ? `[[${best.x.topic}]]` : `[[${best.words}|${best.x.topic}]]`); done.add(best.x.key); i = best.e; continue; }
      const to = Math.max(i, Math.min(upto, open));
      return { out: out + text.slice(i, to), went: to };
    }
  }
  /** @param {boolean} last */
  function take(last) {
    let out = '';
    while (held) {
      const nl = held.indexOf('\n');
      if (heading === null) { const t = held.replace(/^[ \t]+/, ''); if (!t && !last) break; heading = /^#/.test(t); }
      if (nl >= 0) { const r = link(held.slice(0, nl + 1), nl + 1); out += r.out; held = held.slice(r.went); if (r.went === nl + 1) heading = null; continue; }
      if (last) { const r = link(held, held.length); out += r.out + held.slice(r.went); held = ''; break; }
      let cut = held.length - longest - 1;
      while (cut > 0 && !/\s/.test(held[cut - 1])) cut--;
      /* never between the words of a name already whole (a longer planned one, the page's own title): the words after
         the cut would no longer know they were inside it */
      for (let moved = true; moved && cut > 0;) {
        moved = false;
        for (const y of [...plan, ...kept]) {
          y.re.lastIndex = 0; let m;
          while ((m = y.re.exec(held)) && m.index < cut) if (m.index + m[0].length > cut) { cut = m.index; moved = true; }
        }
      }
      if (cut <= 0) break;
      const r = link(held, cut); if (!r.went) break;
      out += r.out; held = held.slice(r.went); break;
    }
    return out;
  }
  return { push: chunk => { held += chunk; return take(false); }, end: () => take(true) };
}
/** @param {string[]} topics @param {string} text @param {string[]} [own] */
export const linkMentions = (topics, text, own = []) => { const L = mentionLinker(topics, own); return L.push(text) + L.end(); };
/** The planned topics by the names the page's head gives them. @param {PageInput} p @param {Frame} f */
export const plannedNames = (p, f) => plannedTopics(p, f).map(l => flat(l.topic));
/** The linker for a page's body: its planned topics, never inside its own title.
    @param {PageInput} p @param {Frame} f */
export const pageLinker = (p, f) => mentionLinker(plannedNames(p, f), [flat(pageTitle(p, f))]);
/** The topics a body links, by the plan's names where a link names a planned topic on either side, in the order the
    body first links them. @param {string[]} planned @param {string} body */
export function linkedNames(planned, body) {
  const byKey = new Map(planned.map(n => [n.toLowerCase(), n])); /** @type {Map<string, string>} */ const out = new Map();
  for (const m of String(body || '').matchAll(/\[\[([^\]\n]+)\]\]/g)) {
    const [a, b] = splitLink(m[1]); const name = byKey.get(b.toLowerCase()) || byKey.get(a.toLowerCase()) || b;
    if (name && !out.has(name.toLowerCase())) out.set(name.toLowerCase(), name);
  }
  return [...out.values()];
}

/** The whole page, as one pass would have written it. @param {PageInput} p @param {Frame} f @param {string} body @param {Ways} w */
export const pageFromParts = (p, f, body, w) => { const L = pageLinker(p, f); return `${headSoFar(p, f)}${L.push(bodyOf(body))}${L.end()}${tailSoFar(w)}`; };

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
 * @property {(input: any) => { fixed: string, request: string }} [parts]  the same prompt in two parts, the first the
 *   same on every call, so the provider caches it (lib/ai.js `cachedPrompt`)
 * @property {number} maxTokens  output budget
 * @property {'page' | 'extra' | null} spends  which trial allowance it uses
 * @property {boolean} cacheable  identical requests may share an answer
 * @property {(text: string) => boolean} [usable]  a finished answer worth caching (default: any text)
 * @property {boolean} [quick]  written by the fast model for the key's provider
 * @property {boolean} [byokOnly]
 */

/* What a finished answer must look like before it may be served to anyone else from cache. */
/** @param {string} t */
export const usablePage = t => { const A = parseArticle(t, false); return !!A.title && A.bodyDone && A.blocks.filter(b => b.t === 'p').length >= 3 && cardsOf(A).length >= 4 && Object.keys(A.gloss).length >= 6; };
/** @param {string} t */
const usableText = t => t.trim().length >= 40;
/** @param {(v: any) => boolean} shape @returns {(t: string) => boolean} */
const usableJSON = shape => t => { const v = looseJSON(t); return v != null && shape(v); };

/** @type {Record<string, Task>} */
export const TASKS = {
  page: { input: pageInput, prompt: pagePrompt, parts: pageParts, maxTokens: 3000, spends: 'page', cacheable: true, usable: usablePage },

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

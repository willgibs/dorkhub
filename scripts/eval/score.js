// Automatic measures of one page's text against what the page prompt (FORMAT in lib/prompts.js) asks for.
// Pure functions: text in, numbers out. Used by scripts/score.mjs (a table of pages on disk) and by the eval
// harness (scripts/eval.mjs). Reads nothing and spends nothing.
import { cardsOf, keyOf, parseArticle, splitLink, titleIsLocked } from '../../src/shared/article.js';
import { usablePage } from '../../lib/prompts.js';

export const words = (/** @type {string} */ s) => String(s || '').split(/\s+/).filter(Boolean).length;
export const sentences = (/** @type {string} */ s) => s.replace(/\b(?:c|ca|St|Mt|Dr|Mr|Mrs|No|vs|e\.g|i\.e|approx)\./g, '$&#').split(/(?<=[.!?])\s+(?=[A-Z"“(])/).filter(x => x.trim());
const VAGUE = /\b(researchers|scientists|experts|scholars|historians|astronomers|archaeologists)\b|\bfor a long time\b|\bit is said\b|\bsome (?:say|believe)\b/gi;
export const SUPER = /\b(largest|biggest|smallest|first|only|oldest|fastest|deepest|highest|most)\b/i;
const NUMBERISH = /\d|\b(?:largest|biggest|smallest|first|only|oldest|fastest|deepest|highest|most|longest|earliest)\b/i;

/* The stock curiosities the prompt bars unless the page genuinely leads there. */
export const STOCK = ['Tardigrade', 'Antikythera mechanism', 'Voynich manuscript', 'Tunguska event'];

/* Umbrella subjects (a whole war, country, century or science). THIS IS A HEURISTIC: a small lexicon plus a
   few patterns. It catches the obvious offenders ("World War II", "France", "19th century", "Physics") and
   misses subtler ones ("Ancient Rome", "Evolution"); it can be wrong about a page that is genuinely about
   one of these. Read its count as a trend across many pages, never as a verdict on one. */
const UMBRELLA_WORDS = new Set([
  // sciences and broad fields
  'physics', 'chemistry', 'biology', 'mathematics', 'math', 'maths', 'astronomy', 'geology', 'ecology', 'medicine', 'psychology', 'economics',
  'history', 'philosophy', 'engineering', 'technology', 'science', 'art', 'music', 'literature', 'religion', 'anthropology', 'archaeology',
  'linguistics', 'sociology', 'politics', 'geography', 'botany', 'zoology', 'genetics', 'neuroscience', 'computer science', 'oceanography',
  'meteorology', 'paleontology', 'evolution', 'quantum mechanics', 'biochemistry', 'astrophysics', 'architecture',
  // wars
  'world war i', 'world war ii', 'world war 1', 'world war 2', 'first world war', 'second world war', 'cold war', 'american civil war',
  'civil war', 'vietnam war', 'korean war', 'napoleonic wars', 'hundred years war', 'thirty years war', 'american revolution', 'french revolution',
  // continents and big regions (not Antarctica or an ocean, which are places with stories of their own)
  'europe', 'asia', 'africa', 'north america', 'south america', 'oceania', 'australia', 'middle east', 'earth', 'the world',
  'roman empire', 'british empire', 'ancient egypt', 'ancient greece',
  // countries (the common ones a writer reaches for)
  'united states', 'usa', 'america', 'united kingdom', 'uk', 'britain', 'great britain', 'england', 'scotland', 'ireland', 'france', 'germany',
  'italy', 'spain', 'portugal', 'netherlands', 'belgium', 'switzerland', 'austria', 'poland', 'russia', 'soviet union', 'ussr', 'ukraine',
  'sweden', 'norway', 'denmark', 'finland', 'iceland', 'greece', 'turkey', 'egypt', 'israel', 'iran', 'iraq', 'india', 'pakistan', 'china',
  'japan', 'korea', 'south korea', 'north korea', 'indonesia', 'philippines', 'vietnam', 'thailand', 'canada', 'mexico', 'brazil',
  'argentina', 'chile', 'peru', 'colombia', 'south africa', 'nigeria', 'kenya', 'ethiopia', 'morocco', 'new zealand', 'saudi arabia',
]);
const UMBRELLA_PATTERNS = [
  /^\d{1,2}(?:st|nd|rd|th) century(?: (?:bc|bce|ad|ce))?$/,        // 19th century
  /^(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|twenty first) century$/,
  /^\d{3,4}s$/,                                                     // 1920s
  /^(?:the )?(?:middle ages|renaissance|enlightenment|industrial revolution|bronze age|iron age|stone age|victorian era)$/,
  /^history of /,                                                   // History of X
];
/** @param {string} name */
export function isUmbrella(name) {
  const k = keyOf(name).replace(/\s+/g, ' ');
  return UMBRELLA_WORDS.has(k) || UMBRELLA_PATTERNS.some(r => r.test(k));
}
/** @param {string} name */
const isStock = name => { const k = keyOf(name).replace(/s$/, ''); return STOCK.some(s => keyOf(s) === k); };

/** @param {string} text the link plan: the lines between +++ and --- */
export const planOf = text => [...((String(text).split('\n+++\n')[1] || '').split('\n---\n')[0]).matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1]);

/**
 * Everything measured on one page.
 * @param {string} text  the page as the writer sent it
 * @param {{ input?: { title: string, q?: boolean, ctx?: string, bridge?: unknown } | null, expectKind?: string, threads?: string[] }} [o]
 *   input: the page's PageInput, for the title lock; expectKind and threads: what the front page says about it (scripts/score.mjs).
 */
export function scorePage(text, { input = null, expectKind = '', threads = [] } = {}) {
  const A = parseArticle(text, false);
  const paras = A.blocks.filter(b => b.t === 'p').map(b => b.s.replace(/\[\[([^\]]+)\]\]/g, (_, i) => splitLink(i)[0]));
  const plan = planOf(text);
  const names = plan.concat(A.tunnels.map(t => t.target));
  const linked = new Set(A.blocks.flatMap(b => [...b.s.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => keyOf(splitLink(m[1])[1]))));
  const echo = A.notes.filter(n => { const p = (paras[n.n - 1] || '').toLowerCase(); const w = n.s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(x => x.length > 4); return w.length > 0 && w.filter(x => p.includes(x)).length / w.length >= .6; });
  const offered = threads.filter(t => plan.some(n => keyOf(splitLink(n)[1]) === keyOf(t)) || A.tunnels.some(c => keyOf(c.target) === keyOf(t)));
  const body = paras.join(' ');

  /* the links: every planned topic and every card, once */
  const linkKeys = [...new Set(names.map(n => keyOf(splitLink(n)[1])).filter(Boolean))];
  const kindOf = (/** @type {string} */ k) => A.gloss[k]?.kind || '';
  const people = linkKeys.filter(k => kindOf(k) === 'person').length;
  const self = keyOf(A.title).replace(/s$/, '');
  const umbrella = names.map(n => splitLink(n)[1]).filter((n, i, all) => isUmbrella(n) && all.findIndex(x => keyOf(x) === keyOf(n)) === i);
  const stock = names.map(n => splitLink(n)[1]).filter((n, i, all) => isStock(n) && keyOf(n).replace(/s$/, '') !== self && all.findIndex(x => keyOf(x) === keyOf(n)) === i);

  const hooks = Object.values(A.gloss).map(g => g.gloss).filter(Boolean);
  const cards = cardsOf(A);
  const factLabels = A.keyFacts.map(f => words(f.label));
  const factValues = A.keyFacts.map(f => words(f.value));
  const kept = input ? titleKept(A.title, input) : null;

  return {
    // the measures scripts/score.mjs has always printed
    words: words(body), paras: paras.length, solo: paras.filter(p => sentences(p).length === 1).length,
    qual: names.filter(n => /\([^)]+\)\s*$/.test(n)).length, names: names.length,
    unlinked: plan.filter(n => !linked.has(keyOf(splitLink(n)[1]))).length,
    vague: (body.match(VAGUE) || []).length, years: (body.match(/\b1[0-9]{3}\b|\b20[0-2][0-9]\b/g) || []).length,
    notes: A.notes.length, echo: echo.length, facts: A.keyFacts.length, superl: A.keyFacts.filter(f => SUPER.test(f.value)).length,
    panels: A.panels.map(p => p.type).join('+') || '-', panelCount: A.panels.length,
    kind: !expectKind || A.kind === parseArticle(`# x :: ${expectKind}\n`, false).kind,
    threads: `${offered.length}/${threads.length}`, cards: A.tunnels.length, qs: A.questions.length,
    // what the prompt asks for that nothing checked before
    title: A.title, pageKind: A.kind,
    links: linkKeys.length, planned: plan.length, people, personShare: linkKeys.length ? people / linkKeys.length : 0,
    umbrella, stock,
    deckWords: words(A.deck), deckChars: A.deck.length,
    factLabelWords: factLabels, factValueWords: factValues,
    factLabelsOver: factLabels.filter(n => n < 1 || n > 3).length, factValuesOver: factValues.filter(n => n >= 7).length,
    /* the writer's own six: without a "===" block the parser falls back to the body's links */
    sixCards: /^={3,}\s*$/m.test(text) && cards.length === 6 && A.tunnels.length === 6, threeQs: A.questions.length === 3,
    hooks: hooks.length, hookWordsMax: Math.max(0, ...hooks.map(words)), hooksOver: hooks.filter(h => words(h) >= 12).length,
    hooksNumeric: hooks.filter(h => NUMBERISH.test(h)).length,
    cardHookWordsMax: Math.max(0, ...cards.map(c => words(c.teaser))), cardHooksOver: cards.filter(c => words(c.teaser) >= 14).length,
    titleKept: kept, usable: usablePage(text),
  };
}

/* A clicked topic stays the title: the same words, give or take capitals, an article ("The"), a plural or a
   qualifier in parentheses. Null when the title isn't locked (a question or a connecting page). */
/** @param {string} written @param {{ title: string, q?: boolean, ctx?: string, bridge?: unknown }} input */
export function titleKept(written, input) {
  if (!titleIsLocked({ title: input.title, q: input.q, bridge: input.bridge })) return null;
  const k = (/** @type {string} */ s) => keyOf(s.replace(/\s*\([^)]*\)\s*$/, '')).replace(/s$/, '');
  return k(written) === k(input.title);
}

/* The yes/no checks a page should pass, for one compliance figure per page. */
/** @param {ReturnType<typeof scorePage>} s @returns {Record<string, boolean>} */
export function checksOf(s) {
  const c = {
    usable: s.usable,
    'body 450-600 words': s.words >= 430 && s.words <= 650,
    'no one-sentence paragraphs': s.solo === 0,
    '3 key facts': s.facts === 3,
    'key-fact labels 1-3 words': s.facts > 0 && s.factLabelsOver === 0,
    'key-fact values under 7 words': s.facts > 0 && s.factValuesOver === 0,
    'no superlative key facts': s.superl === 0,
    'deck under 25 words': s.deckWords > 0 && s.deckWords < 25,
    '10-14 planned links': s.planned >= 10 && s.planned <= 14,
    'every planned link used': s.unlinked === 0,
    'people at most a quarter': s.personShare <= 0.25,
    'no umbrella links': s.umbrella.length === 0,
    'no stock curiosities': s.stock.length === 0,
    'exactly 6 cards': s.sixCards,
    'exactly 3 questions': s.threeQs,
    'hooks under 12 words': s.hooks > 0 && s.hooksOver === 0,
    'card hooks under 14 words': s.cardHooksOver === 0,
    'at most 2 panels': s.panelCount <= 2,
    '1-2 margin notes': s.notes >= 1 && s.notes <= 2,
  };
  if (s.titleKept !== null) /** @type {Record<string, boolean>} */ (c)['locked title kept'] = s.titleKept;
  return c;
}

/** @param {ReturnType<typeof scorePage>} s */
export const compliance = s => { const c = Object.values(checksOf(s)); return c.filter(Boolean).length / c.length; };

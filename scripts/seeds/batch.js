/* Pages written ahead of time, asked for exactly as production asks for a page (lib/write.js: the same model, prompt,
   output limit and thinking), plus, for one of the front page's topics, what the front page says about it
   (lib/prompts.js seedBrief). scripts/seeds.mjs prints these prompts (`prompt`, `brief`) and sends them as one batch
   through Anthropic's Message Batches API (`batch`): half the price of a live page, written within the hour, never
   for a reader who is waiting. tests/seeds-batch.test.js holds a batch's request to production's own call. */
import { writerSettings } from '../../lib/ai.js';
import { CARDS, FRONT, THREADS } from '../../lib/front.js';
import { TASKS, pageInput, pageParts, seedBrief, usablePage } from '../../lib/prompts.js';
import { KINDS, cardsOf, keyOf, parseArticle } from '../../src/shared/article.js';
import { PAGE_TOKENS, directId, findModel } from '../../src/shared/models.js';
import { topicKey } from '../../src/shared/world.js';

/** A page's folder under lib/seeds. @param {string} t */
export const slug = t => keyOf(t).replace(/\s+/g, '-');
/** The front page's topic by that name, if it is one. @param {string | undefined} t */
export const frontTopic = t => FRONT.find(f => topicKey(f.t) === topicKey(t || ''));
/** @param {string} s */
const unesc = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** What the front page says about one of its topics, and the threads it draws from it, as the writer's brief.
    @param {typeof FRONT[number]} t */
export function briefOf(t) {
  /* what the front page says about it: the hook its suggestion and the map carry, and its card's hook and drawings */
  const card = CARDS.find(c => c.t === t.t); const promises = [{ text: t.h, src: [t.src] }];
  if (card) {
    if (card.hook && card.hook !== t.h) promises.push({ text: card.hook, src: card.src });
    for (const m of (card.art() + (card.more || '')).matchAll(/role="img" aria-label="([^"]+)"/g)) promises.push({ text: `Its card's drawing shows ${unesc(m[1]).replace(/^(A|An|The) /, w => w.toLowerCase())}.`, src: card.src });
  }
  const threads = THREADS.filter(x => x.a === t.t || x.b === t.t).map(x => ({ to: x.a === t.t ? x.b : x.a, label: x.l, src: x.src }));
  return seedBrief({ promises, threads, kind: t.k });
}

/**
 * A page's prompt in its two parts: what every page shares, then this page, with its brief when the front page leads
 * to it. Joined, they are what `node scripts/seeds.mjs brief` (or `prompt`) prints.
 * @param {string} title @returns {{ fixed: string, rest: string }}
 */
export function seedParts(title) {
  const t = frontTopic(title);
  const { fixed, request } = pageParts(pageInput({ title: t ? t.t : title, lens: 'encyclopedic' }));
  return { fixed, rest: t ? `${request}\n${briefOf(t)}\n` : request };
}

/** writerSettings (lib/ai.js) speaks the AI SDK's providerOptions; the Messages API takes the same settings as its own
    fields. @param {string} model */
export function apiSettings(model) {
  const a = /** @type {{ thinking?: unknown, effort?: string }} */ (writerSettings(model).options?.anthropic ?? {});
  return { ...(a.thinking ? { thinking: a.thinking } : {}), ...(a.effort ? { output_config: { effort: a.effort } } : {}) };
}

/**
 * One page's request in a batch: production's own call, with what every page shares cached for the hour a batch may
 * take (a batch runs its requests in any order).
 * @param {string} customId @param {string} title @param {string} model a catalog id, e.g. anthropic/claude-haiku-5.5
 */
export function seedRequest(customId, title, model) {
  const { fixed, rest } = seedParts(title);
  return {
    custom_id: customId,
    params: {
      model: directId(model), max_tokens: TASKS.page.maxTokens + writerSettings(model).room, ...apiSettings(model),
      messages: [{ role: 'user', content: [{ type: 'text', text: fixed, cache_control: { type: 'ephemeral', ttl: '1h' } }, { type: 'text', text: rest }] }],
    },
  };
}

/**
 * One page from a batch's results: its text when the writer stopped on its own, else why there isn't one.
 * @param {any} r a result line @returns {{ text: string | null, why: string | null, usage: any }}
 */
export function readResult(r) {
  const res = r.result;
  if (res.type !== 'succeeded') return { text: null, why: res.type === 'errored' ? `errored (${res.error?.error?.type || res.error?.type || 'unknown'})` : res.type, usage: null };
  const m = res.message;
  const text = m.content.filter((/** @type {any} */ b) => b.type === 'text').map((/** @type {any} */ b) => b.text).join('').replace(/\u0000/g, '');
  if (m.stop_reason !== 'end_turn') return { text: null, why: `stopped at ${m.stop_reason}`, usage: m.usage };
  return { text, why: null, usage: m.usage };
}

/**
 * What keeps a page from being kept: production's bar for keeping a page, then the checks tests/seeds.test.js makes
 * of a page written ahead of time. None, and it can be kept.
 * @param {string} title @param {string} text @returns {string[]}
 */
export function seedProblems(title, text) {
  const A = parseArticle(text, false); /** @type {string[]} */ const P = [];
  if (!usablePage(text)) P.push('not a whole page');
  if (!(A.title && A.deck && A.blocks.filter(b => b.t === 'p').length >= 3 && cardsOf(A).length >= 5 && A.questions.length === 3)) P.push('incomplete: a deck, three paragraphs, five cards and three questions');
  if (!KINDS.includes(A.kind)) P.push('no kind on its title line');
  const t = frontTopic(title);
  if (t) {
    const kind = parseArticle(`# x :: ${t.k}\n`, false).kind;
    if (A.kind !== kind) P.push(`a ${A.kind || 'missing'} kind, not the front page's ${kind}`);
    for (const th of THREADS.filter(x => x.a === t.t || x.b === t.t)) { const to = th.a === t.t ? th.b : th.a; if (!A.gloss[keyOf(to)]) P.push(`no link to ${to}, its thread on the front page`); }
    if (A.keyFacts.length !== 3) P.push(`${A.keyFacts.length} key facts, not three`);
    else for (const f of A.keyFacts) if (f.label.split(/\s+/).length > 3 || f.value.split(/\s+/).length > 7) P.push(`a long key fact: "${f.label} :: ${f.value}"`);
  }
  return P;
}

/**
 * What a batch's tokens cost: half the model's price, a cache write (kept an hour) at twice the input price, a read at
 * a tenth (on Sonnet and Opus a twentieth, so this errs high there).
 * @param {string} model @param {any[]} usages the results' `usage`, null for a page that failed
 */
export function batchCost(model, usages) {
  const [pin, pout] = findModel(model)?.price ?? [0, 0];
  let dollars = 0;
  for (const u of usages) if (u) dollars += ((u.input_tokens || 0) * pin + (u.cache_creation_input_tokens || 0) * pin * 2 + (u.cache_read_input_tokens || 0) * pin * 0.1 + (u.output_tokens || 0) * pout) / 2e6;
  return dollars;
}

/**
 * A batch's likely cost before it is sent: each prompt at about four characters a token, nothing from the cache, and a
 * page's usual length out.
 * @param {string} model @param {string[]} titles @returns {{ input: number, output: number, dollars: number }}
 */
export function estimate(model, titles) {
  const [pin, pout] = findModel(model)?.price ?? [0, 0];
  const input = titles.reduce((n, t) => { const { fixed, rest } = seedParts(t); return n + Math.ceil((fixed.length + rest.length) / 4); }, 0);
  const output = titles.length * PAGE_TOKENS[1];
  return { input, output, dollars: (input * pin + output * pout) / 2e6 };
}

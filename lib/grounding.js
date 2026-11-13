/* ================= grounding: reference notes for a page writer =================
   The opening of the topic's English Wikipedia article as plain text, clipped to about 500 tokens,
   with the article's title and address for credit. Used only by the eval (scripts/eval.mjs) for
   now, by the `grounded` writer variant (lib/prompts.js); factSource gives a fact check the same
   lead and, labelled apart, the rest of the article.

   It never throws and never waits long: any failure, a timeout (about 800 ms by default), a
   disambiguation page, a missing article or a question-shaped title gives null, and the page is
   written without notes. `fetch` is injected, so tests never touch the network. */

import { isQuestion } from '../src/shared/article.js';

const UA = 'Dorkhub/1.0 (https://dorkhub.com; reference notes for a page)';
const API = 'https://en.wikipedia.org/w/api.php';
/* about four characters a token in English prose */
const CHARS_PER_TOKEN = 4;

/** @typedef {{ title: string, url: string, text: string, tokens: number }} Notes */

/* Cut at the last sentence end that fits, else at a word. */
/** @param {string} s @param {number} max */
export function clipText(s, max) {
  if (s.length <= max) return s;
  const head = s.slice(0, max); const end = Math.max(head.lastIndexOf('. '), head.lastIndexOf('.\n'));
  if (end > max * 0.5) return head.slice(0, end + 1);
  return head.replace(/\s+\S*$/, '') + '…';
}

/** @param {string} title */
export const articleUrl = title => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_')).replace(/%2F/g, '/').replace(/%3A/g, ':')}`;

/* One article's plain-text extract (the lead, or the whole article), or null. Never throws, never waits past timeoutMs. */
/** @param {string} topic @param {{ get: typeof fetch, timeoutMs: number, intro: boolean }} o @returns {Promise<{ title: string, raw: string } | null>} */
async function extract(topic, { get, timeoutMs, intro }) {
  const t = String(topic || '').replace(/\s+/g, ' ').trim();
  if (!t || t.length > 160 || isQuestion(t) || !get) return null;
  const q = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', redirects: '1', prop: 'extracts|pageprops', ppprop: 'disambiguation', explaintext: '1', titles: t });
  if (intro) q.set('exintro', '1');
  const ac = new AbortController();
  /** @type {ReturnType<typeof setTimeout> | undefined} */ let timer;
  const late = new Promise(/** @param {(v: null) => void} done */ done => { timer = setTimeout(() => { ac.abort(); done(null); }, timeoutMs); });
  const ask = (async () => {
    const r = await get(`${API}?${q}`, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: ac.signal });
    if (!r.ok) return null;
    const body = /** @type {any} */ (await r.json());
    const page = body?.query?.pages?.[0];
    if (!page || page.missing || page.invalid || page.pageprops?.disambiguation !== undefined) return null;
    const raw = String(page.extract || '');
    /* a list of senses that isn't flagged as one: "X may refer to:" */
    if (/\b(?:may|might|can|could) (?:also )?refer to\b/i.test(raw.slice(0, 300))) return null;
    return { title: String(page.title || t), raw };
  })().catch(() => null);
  try { return await Promise.race([ask, late]); }
  finally { clearTimeout(timer); }
}
/** @param {string} raw */
const clean = raw => raw.replace(/\n{2,}/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n=+ [^\n]* =+\n?/g, '\n').trim();

/**
 * Reference notes on a topic, or null.
 * @param {string} topic
 * @param {{ fetch?: typeof fetch, timeoutMs?: number, maxTokens?: number, intro?: boolean }} [o]
 *   `intro: false` reads the whole article (still clipped to maxTokens).
 * @returns {Promise<Notes | null>}
 */
export async function referenceNotes(topic, { fetch: get = globalThis.fetch, timeoutMs = 800, maxTokens = 500, intro = true } = {}) {
  const e = await extract(topic, { get, timeoutMs, intro }); if (!e) return null;
  const text = clipText(clean(e.raw), maxTokens * CHARS_PER_TOKEN);
  if (text.length < 80) return null;
  return { title: e.title, url: articleUrl(e.title), text, tokens: Math.ceil(text.length / CHARS_PER_TOKEN) };
}

/**
 * A fact check's source, in two labelled parts: `lead` is exactly the text referenceNotes hands a grounded
 * writer (same request, cleaning and clip), and `rest` is the article after its lead, up to `maxTokens` in all.
 * A claim settled only by the rest is one the notes could not have handed the writer.
 * @param {string} topic
 * @param {{ fetch?: typeof fetch, timeoutMs?: number, maxTokens?: number, leadTokens?: number }} [o]
 * @returns {Promise<{ title: string, url: string, lead: string, rest: string, tokens: number } | null>}
 */
export async function factSource(topic, { fetch: get = globalThis.fetch, timeoutMs = 5000, maxTokens = 6000, leadTokens = 500 } = {}) {
  const [intro, whole] = await Promise.all([extract(topic, { get, timeoutMs, intro: true }), extract(topic, { get, timeoutMs, intro: false })]);
  if (!intro || !whole) return null;
  const lead = clipText(clean(intro.raw), leadTokens * CHARS_PER_TOKEN);
  if (lead.length < 80) return null;
  const all = clean(whole.raw); const introAll = clean(intro.raw);
  const after = all.startsWith(introAll) ? all.slice(introAll.length) : all.slice(Math.min(all.length, introAll.length));
  const rest = clipText(after.trim(), Math.max(0, maxTokens * CHARS_PER_TOKEN - lead.length));
  return { title: intro.title, url: articleUrl(intro.title), lead, rest, tokens: Math.ceil((lead.length + rest.length) / CHARS_PER_TOKEN) };
}

/* ================= the world: when two page requests are the same page =================
   Pages are written for their topic, never for the reader's path. So an exact repeat (the same
   topic after trivial cleanup, the same voice, the same question-ness, the same sense for a name
   chosen inside a page, the same pair for a connecting page) is the same page, and the server may
   serve the one written before. Similar but different topics ("whale", "blue whale") are simply
   different pages: nothing here tries to be clever about meaning. Shared by the browser and the
   server; the build strips the import and the exports and inlines it after article.js. */
import { isQuestion, keyOf } from './article.js';

/* A topic's key: keyOf (case, accents, punctuation, a leading "the"), or, for scripts keyOf can't
   read, the text itself lowercased, so a page in Greek or Japanese still has a key. */
/** @param {unknown} t */
export const topicKey = t => keyOf(t) || String(t || '').normalize('NFKC').toLowerCase().replace(/["\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);

/* A question is answered rather than titled after itself, so it is its own page. */
/** @param {string} title */
export const asksQuestion = title => isQuestion(String(title || '').trim());

/**
 * What makes a page the page it is. A connecting page's pair is unordered: A↔B is B↔A.
 * @param {{ title?: string, lens?: string, q?: boolean, ctx?: string, bridge?: string[] | null }} p
 */
export function pageId({ title = '', lens = 'encyclopedic', q = false, ctx = '', bridge = null }) {
  if (bridge && bridge.length === 2) return ['c', lens, ...bridge.map(topicKey).sort()].join('|');
  return [q ? 'q' : 't', lens, topicKey(title), ctx ? topicKey(ctx) : ''].join('|');
}

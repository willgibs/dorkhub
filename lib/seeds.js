/* ================= pages written ahead of time =================
   The landing's topics, written ahead of time and fact-checked, so a visitor can start reading
   without spending a credit, even while the trial is paused. lib/seeds/index.json lists them:
     { "pages": { "<topicKey(title)>": { "title", "file", "question"? } } }
   (an older index held { "doors": { … "children": { … } } }; both shapes load). Each page is a
   text file in the page format. Pages are written for their topic, so a seed is served for any
   request on that topic in the default voice, wherever the reader came from. Seeds never expire
   with prompt versions, because the parser keeps reading older formats. One of the front page's topics
   whose page isn't written yet is served its placeholder (lib/placeholder.js) the same way, until it is. */
import { readFile } from 'node:fs/promises';
import { placeholderText } from './placeholder.js';
import { topicKey } from '../src/shared/world.js';

/** @typedef {{ title: string, file: string, question?: boolean }} SeedPage */
/** @typedef {{ pages: Record<string, SeedPage> }} SeedIndex */

const DEFAULT_DIR = new URL('./seeds/', import.meta.url);
/** @type {Map<string, Promise<SeedIndex>>} */ const indexes = new Map();
/** @type {Map<string, Promise<string | null>>} */ const pages = new Map();

/** @param {URL} dir @param {string} file */
const readPage = (dir, file) => {
  const url = new URL(file, dir); const k = url.href;
  if (!pages.has(k)) pages.set(k, readFile(url, 'utf8').catch(() => null));
  return /** @type {Promise<string | null>} */ (pages.get(k));
};
/** @param {URL} dir @returns {Promise<SeedIndex>} */
function load(dir) {
  if (!indexes.has(dir.href)) indexes.set(dir.href, (async () => {
    /** @type {any} */ let idx;
    try { idx = JSON.parse(await readFile(new URL('index.json', dir), 'utf8')); } catch { return { pages: {} }; }
    /** @type {Record<string, SeedPage>} */ const flat = { ...(idx.pages || {}) };
    /** @param {SeedPage} p */
    const add = p => { if (p && p.title && p.file && !flat[topicKey(p.title)]) flat[topicKey(p.title)] = { title: p.title, file: p.file, ...(p.question ? { question: true } : {}) }; };
    for (const d of Object.values(idx.doors || {})) { add(/** @type {SeedPage} */ (d)); for (const c of Object.values(/** @type {any} */ (d).children || {})) add(/** @type {SeedPage} */ (c)); }
    return { pages: flat };
  })());
  return /** @type {Promise<SeedIndex>} */ (indexes.get(dir.href));
}

/**
 * The pre-written page for this request, { text, placeholder }, or null when it should be written
 * live. A seed is in the default voice; it never answers a connecting page or a name chosen inside
 * another page (that name may mean something else there: "Atlantis" on a page about space shuttles),
 * and a question matches only a question. (The caller never asks for a private rewrite.)
 * @param {import('./prompts.js').PageInput} p @param {URL} [dir]
 * @returns {Promise<{ text: string, placeholder: boolean } | null>}
 */
export async function seedOf(p, dir = DEFAULT_DIR) {
  if (p.lens !== 'encyclopedic' || p.bridge || p.ctx) return null;
  const s = (await load(dir)).pages[topicKey(p.title)];
  if (s) { const text = !!s.question === !!p.q ? await readPage(dir, s.file) : null; return text ? { text, placeholder: false } : null; }
  const text = p.q ? null : placeholderText(p.title);
  return text ? { text, placeholder: true } : null;
}
/** The pre-written text alone. @param {import('./prompts.js').PageInput} p @param {URL} [dir] */
export const seedText = async (p, dir = DEFAULT_DIR) => (await seedOf(p, dir))?.text ?? null;

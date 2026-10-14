/* ================= pages written ahead of time: the landing's doors, and every page one click off them =================
   A visitor who starts at a recommended topic can read two pages deep without spending a credit,
   which is where most short visits end. lib/seeds/index.json lists them:
     { "doors": { "<keyOf(title)>": { "title", "file", "question"?, "children": { "<keyOf(title)>": { "title", "file", "question"? } } } } }
   and each page is a text file in the page format, written for exactly the path it is served on.
   They are served only on the free trial's path (no reader key), in the default voice: a door for a
   first page, a child only when the page before it was that door as we wrote it (its deck matches).
   They never expire with prompt versions, because the parser keeps reading older formats. */
import { readFile } from 'node:fs/promises';
import { clip, keyOf, parseArticle } from '../src/shared/article.js';

/** @typedef {{ title: string, file: string, question?: boolean }} SeedPage */
/** @typedef {SeedPage & { children?: Record<string, SeedPage>, deck?: string }} SeedDoor */
/** @typedef {{ doors: Record<string, SeedDoor> }} SeedIndex */

const DEFAULT_DIR = new URL('./seeds/', import.meta.url);
/** @type {Map<string, Promise<SeedIndex>>} */ const indexes = new Map();
/** @type {Map<string, Promise<string | null>>} */ const pages = new Map();

/** @param {URL} dir @param {string} file */
const readPage = (dir, file) => {
  const url = new URL(file, dir); const k = url.href;
  if (!pages.has(k)) pages.set(k, readFile(url, 'utf8').catch(() => null));
  return /** @type {Promise<string | null>} */ (pages.get(k));
};
/* The deck a door was written with, as the page will send it back: the reader's path carries it. */
/** @param {string} s */
const asSent = s => clip(s.replace(/\s+/g, ' ').trim(), 400);
/** @param {URL} dir @returns {Promise<SeedIndex>} */
function load(dir) {
  if (!indexes.has(dir.href)) indexes.set(dir.href, (async () => {
    /** @type {SeedIndex} */ let idx;
    try { idx = JSON.parse(await readFile(new URL('index.json', dir), 'utf8')); } catch { return { doors: {} }; }
    for (const d of Object.values(idx.doors || {})) { const t = await readPage(dir, d.file); d.deck = t ? asSent(parseArticle(t, false).deck) : ''; }
    return idx;
  })());
  return /** @type {Promise<SeedIndex>} */ (indexes.get(dir.href));
}

/**
 * The pre-written text for this page request, or null when it should be written live.
 * @param {import('./prompts.js').PageInput} p @param {URL} [dir]
 */
export async function seedText(p, dir = DEFAULT_DIR) {
  if (p.lens !== 'encyclopedic' || (p.from && p.from.kind === 'bridge')) return null;
  const asked = !!(p.from && p.from.kind === 'question');
  const { doors } = await load(dir);
  /** @param {SeedPage | undefined} s */
  const serve = s => (s && !!s.question === asked ? readPage(dir, s.file) : null);
  if (p.depth === 0 && !p.path.length) return serve(doors[keyOf(p.title)]);
  if (p.depth === 1 && p.path.length === 1) {
    const d = doors[keyOf(p.path[0].title)];
    if (!d || !d.deck || d.deck !== p.path[0].deck) return null;
    return serve((d.children || {})[keyOf(p.title)]);
  }
  return null;
}

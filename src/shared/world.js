/* ================= the world: pages by topic, their links, and the trails a reader takes =================
   Pages are written for their topic, never for the reader's path. So an exact repeat (the same
   topic after trivial cleanup, the same voice, the same question-ness, the same sense for a name
   chosen inside a page, the same pair for a connecting page) is the same page, and the server may
   serve the one written before. Similar but different topics ("whale", "blue whale") are simply
   different pages: nothing here tries to be clever about meaning. Shared by the browser and the
   server; the build strips the import and the exports and inlines it after article.js. */
import { capFirst, isQuestion, keyOf, parseArticle } from './article.js';

/* A topic's key: keyOf (case, accents, punctuation, a leading "the"), or, for scripts keyOf can't
   read, the text itself lowercased, so a page in Greek or Japanese still has a key. */
/** @param {unknown} t */
export const topicKey = t => keyOf(t) || String(t || '').normalize('NFKC').toLowerCase().replace(/["\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);

/* A question is answered rather than titled after itself, so it is its own page. */
/** @param {string} title */
export const asksQuestion = title => isQuestion(String(title || '').trim());

/** @typedef {{ title: string, lens: string, q: boolean, ctx: string, bridge: string[] | null }} PageReq */

/**
 * What makes a page the page it is. A connecting page's pair is unordered: A↔B is B↔A.
 * @param {{ title?: string, lens?: string, q?: boolean, ctx?: string, bridge?: string[] | null }} p
 */
export function pageId({ title = '', lens = 'encyclopedic', q = false, ctx = '', bridge = null }) {
  if (bridge && bridge.length === 2) return ['c', lens, ...bridge.map(topicKey).sort()].join('|');
  return [q ? 'q' : 't', lens, topicKey(title), ctx ? topicKey(ctx) : ''].join('|');
}

/* ---------- links: one topic per screen, at a clean address ----------
   A topic lives at its key with hyphens (dorkhub.com/black-holes). Another voice (?v=), the sense of
   a name chosen inside a page (?in=) and a question the address alone can't show (?q=1) ride in the
   query; a connecting page lives at /connect/a/b. Names the site itself uses get a trailing hyphen,
   which no topic's own address ever has. */
const RESERVED = ['world', 'connect', 'trail', 'share', 'api', 'fonts', 'index', 'about', 'pro', 'privacy', 'terms', 'help', 'settings', 'new', 'search', 'saved', 'trails', 'keys', 'licenses', '404'];
/** @param {unknown} t */
export function slugOf(t) { const k = topicKey(t).replace(/ /g, '-'); return RESERVED.includes(k) ? `${k}-` : k; }
/** @param {string} s */
export const titleOfSlug = s => capFirst(String(s || '').replace(/-+$/, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim());
/** @param {string} s */
const dec = s => { try { return decodeURIComponent(s); } catch { return s; } };

/** The address of a page. @param {Partial<PageReq>} p */
export function routeOf({ title = '', lens = 'encyclopedic', q = false, ctx = '', bridge = null }) {
  const qs = new URLSearchParams(); let path;
  if (lens && lens !== 'encyclopedic') qs.set('v', lens);
  if (bridge && bridge.length === 2) path = `/connect/${encodeURIComponent(slugOf(bridge[0]))}/${encodeURIComponent(slugOf(bridge[1]))}`;
  else {
    const s = slugOf(title); path = `/${encodeURIComponent(s)}`;
    if (ctx) qs.set('in', slugOf(ctx));
    if (q && !asksQuestion(titleOfSlug(s))) qs.set('q', '1');
  }
  const t = qs.toString(); return t ? `${path}?${t}` : path;
}

/* ---------- a trail as a link: how a reader got somewhere, page by page ----------
   /trail/<a>/<b>/<c>: each page's address word in the order it was first opened (a connecting page is its pair
   joined by "+"), the latest TRAIL_MAX of them. It names topics and nothing else: a voice, the sense of a name and
   a question the words can't show stay with the reader who took it, and the trail opens each page in the default
   voice, where the pages written ahead of time are free. */
export const TRAIL_MAX = 12;
/** @param {Partial<PageReq>[]} reqs */
export function trailRouteOf(reqs) {
  /** @type {string[]} */ const words = [];
  for (const r of reqs) {
    const w = r.bridge && r.bridge.length === 2 ? r.bridge.map(b => encodeURIComponent(slugOf(b))).join('+') : encodeURIComponent(slugOf(r.title));
    if (w && !/^\+|\+$/.test(w) && !words.includes(w)) words.push(w);
  }
  return words.length ? `/trail/${words.slice(-TRAIL_MAX).join('/')}` : '';
}
/** The pages a trail's address names, in its order, each once. @param {string[]} words @returns {PageReq[]} */
function trailOf(words) {
  /** @type {PageReq[]} */ const out = []; const ids = new Set();
  for (const w of words) {
    const pair = w.split('+'); /** @type {PageReq | null} */ let req = null;
    if (pair.length === 2) { const [a, b] = pair.map(titleOfSlug); if (a && b) req = { title: `${a} and ${b}`, lens: 'encyclopedic', q: false, ctx: '', bridge: [a, b] }; }
    else if (pair.length === 1) { const title = titleOfSlug(w); if (title) req = { title, lens: 'encyclopedic', q: asksQuestion(title), ctx: '', bridge: null }; }
    if (!req) continue; const id = pageId(req); if (ids.has(id)) continue;
    ids.add(id); out.push(req); if (out.length === TRAIL_MAX) break;
  }
  return out;
}

/**
 * What an address shows: the front page, Your world, a page, a trail, or nothing we know.
 * @param {string} pathname @param {string} [search]
 * @returns {{ view: 'home' } | { view: 'world' } | { view: 'none' } | { view: 'page', input: PageReq } | { view: 'trail', steps: PageReq[] }}
 */
export function parseRoute(pathname, search = '') {
  const parts = String(pathname || '/').split('/').filter(Boolean).map(dec);
  const qs = new URLSearchParams(search || ''); const lens = (qs.get('v') || 'encyclopedic').toLowerCase();
  if (!parts.length) return { view: 'home' };
  if (parts.length === 1 && parts[0] === 'world') return { view: 'world' };
  if (parts[0] === 'trail') { const steps = trailOf(parts.slice(1)); return steps.length ? { view: 'trail', steps } : { view: 'none' }; }
  if (parts.length === 3 && parts[0] === 'connect') {
    const a = titleOfSlug(parts[1]), b = titleOfSlug(parts[2]);
    if (a && b) return { view: 'page', input: { title: `${a} and ${b}`, lens, q: false, ctx: '', bridge: [a, b] } };
  }
  if (parts.length === 1) {
    const title = titleOfSlug(parts[0]); const ctx = titleOfSlug(qs.get('in') || '');
    if (title) return { view: 'page', input: { title, lens, q: qs.get('q') === '1' || asksQuestion(title), ctx, bridge: null } };
  }
  return { view: 'none' };
}

/* ---------- trails: the reader's own moves, kept beside the pages, never shaping them ----------
   A trail is one sitting: it starts from the front page, or after half an hour away. Each step is
   [page id, when, the page it came from, how]. */
export const TRAIL_GAP = 30 * 60e3, MAX_TRAILS = 30, MAX_STEPS = 120;
/** @typedef {[string, number, string | null, string]} Step */
/** @typedef {{ id: string, steps: Step[] }} Trail */
/**
 * @param {Trail[]} trails @param {string} pid
 * @param {{ at?: number, from?: string | null, via?: string, id?: string }} [o]
 */
export function addStep(trails, pid, { at = Date.now(), from = null, via = '', id = '' } = {}) {
  let t = trails[0]; const last = t ? t.steps[t.steps.length - 1] : null;
  if (!t || !last || via === 'start' || at - last[1] > TRAIL_GAP || t.steps.length >= MAX_STEPS) {
    t = { id: id || `t${at.toString(36)}${trails.length.toString(36)}`, steps: [] };
    trails.unshift(t); if (trails.length > MAX_TRAILS) trails.length = MAX_TRAILS;
  } else if (last[0] === pid) { last[1] = at; return t; }
  t.steps.push([pid, at, from, via]);
  return t;
}

/* ---------- moving in: rabbit holes from the old store become pages and trails ----------
   Pure, so it can be tested: a page read in two rabbit holes becomes one page (its newest text,
   its earliest first visit), a "mind-blown" becomes saved, each rabbit hole becomes a trail, and
   every old address maps to its page. Anything that can't be read is skipped, never fatal. */
/** @param {any} old @param {string} [lens] */
export function migrateHoles(old, lens = 'encyclopedic') {
  /** @type {Record<string, any>} */ const pages = {}; /** @type {Trail[]} */ const trails = [];
  /** @type {Record<string, Record<string, string>>} */ const legacy = {}; let current = '', currentAt = 0;
  const warrens = Array.isArray(old && old.warrens) ? old.warrens : [];
  for (const w of warrens) {
    try {
      if (!w || !w.nodes || !Array.isArray(w.order)) continue;
      const seen = w.seenAt || w.updated || w.created || 0;
      /** @type {Record<string, string>} */ const map = {}; legacy[String(w.id)] = map;
      /** @type {Step[]} */ const steps = [];
      /** @param {any} n */
      const reqOf = n => {
        const f = n.from || {}; const nl = n.wlens || n.lens || lens; const parent = n.parent ? w.nodes[n.parent] : null;
        if (f.bridge) { const other = w.nodes[f.bridge]; const b = other ? other.title : f.bridgeTitle; if (parent && b) return { title: n.title, lens: nl, q: false, ctx: '', bridge: [parent.title, b] }; }
        const q = !!f.question || (!n.depth && isQuestion(String(n.title || '')));
        return { title: q && f.question ? f.question : n.title, lens: nl, q, ctx: '', bridge: null };
      };
      for (const nid of w.order) {
        try {
          const n = w.nodes[nid]; if (!n || !n.title) continue;
          const req = reqOf(n); const pid = pageId(req); map[nid] = pid;
          const text = typeof n.text === 'string' ? n.text : '';
          const status = n.status === 'digging' ? (text ? 'partial' : 'empty') : n.status;
          if (!text || (status !== 'done' && status !== 'partial')) continue;
          const at = n.created || seen; const A = parseArticle(text, false);
          const p = { id: pid, title: String(n.title).slice(0, 120), req, text, status, deck: n.deck || A.deck || '', kind: A.kind || (n.seed && n.seed.kind) || '', hint: n.seed || null, first: at, last: Math.max(at, seen), saved: n.reaction === 'wow' ? at : 0, wlens: n.wlens || n.lens || lens, seeded: !!n.seeded, pic: n.pic === undefined ? undefined : n.pic, figure: n.figure && n.figure !== 'loading' ? n.figure : null, land: n.land || null, doubts: Array.isArray(n.doubts) ? n.doubts : null, reveals: n.reveals || null };
          const ex = pages[pid];
          if (!ex) pages[pid] = p;
          else { const newer = p.last > ex.last ? p : ex; const older = newer === p ? ex : p; pages[pid] = { ...older, ...newer, first: Math.min(ex.first, p.first), saved: ex.saved || p.saved }; }
          /** @type {string | null} */ const parent = n.parent ? map[String(n.parent)] || null : null; const f = n.from || {};
          /** @type {Step} */ const step = [pid, at, parent, f.bridge ? 'connect' : f.question ? 'question' : f.cont ? 'card' : n.parent ? 'link' : 'start'];
          steps.push(step);
          if (nid === w.current && seen > currentAt) { current = pid; currentAt = seen; }
        } catch { /* one unreadable page never stops the rest */ }
      }
      if (steps.length) trails.push({ id: String(w.id), steps: steps.slice(-MAX_STEPS) });
    } catch { /* nor does one unreadable rabbit hole */ }
  }
  const lastAt = (/** @type {Trail} */ t) => t.steps[t.steps.length - 1][1];
  trails.sort((a, b) => lastAt(b) - lastAt(a));
  return { pages, trails: trails.slice(0, MAX_TRAILS), legacy, current };
}

/* ---------- room in the browser: the texts to drop first ----------
   Page texts take most of the room. Past `keep` of them, the oldest go first, never a saved page
   or one being read; a dropped page keeps its place in the world and is fetched again when opened
   (free while the server still has it). */
/** @param {Record<string, any>} pages @param {{ keep?: number, protect?: string[] }} [o] */
export function textsToDrop(pages, { keep = 200, protect = [] } = {}) {
  const prot = new Set(protect);
  return Object.values(pages).filter(p => p && p.text && !p.saved && !prot.has(p.id)).sort((a, b) => (b.last || 0) - (a.last || 0)).slice(Math.max(0, keep)).map(p => p.id);
}

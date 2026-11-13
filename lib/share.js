/* ================= pages people can share: what a link to Dorkhub shows where it is pasted =================
   A link unfurls as the page it leads to: its title, its deck (one sentence) and a picture of it, in the head
   where link previews look (Open Graph, and X's large card).
   - The pages known before anyone asks (written ahead of time, as lib/seeds/index.json lists them when the site is
     built, and the front page's placeholders) get a head of their own at build time: the build writes each one's
     address a copy of the page saying what it is (public/<word>.html), which the CDN serves to readers and link
     previews alike, so a preview costs nothing.
   - Any other address (a topic typed by a reader, a connecting page, a trail) is told by the address alone: a link
     preview asking for one, and only a link preview (vercel.json matches its User-Agent), gets a head from
     api/share.js, which reads the address and the list of known pages, and nothing else. It never writes.
   The pictures are made ahead of time by scripts/share.mjs, kept in src/static/share/ with their index, and served
   as files. Nothing here is told who shares a link or who opens it. */
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { clip, parseArticle, plain } from '../src/shared/article.js';
import { parseRoute, routeOf, topicKey, trailRouteOf } from '../src/shared/world.js';
import { EARLIER, FRONT } from './front.js';
import { flatIndex } from './seeds.js';

const SEEDS = new URL('./seeds/', import.meta.url);
const IMAGES = new URL('../src/static/share/index.json', import.meta.url);

/** Where the site lives: production says dorkhub.com; a preview says its own address, so its pictures can be
    checked there (previews need a Vercel login, so no preview bot can fetch one anyway).
    @param {Record<string, string | undefined>} [env] */
export function siteOf(env = process.env) {
  if (env.DH_SITE) return env.DH_SITE.replace(/\/+$/, '');
  if (env.VERCEL_ENV === 'production') return 'https://dorkhub.com';
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return 'https://dorkhub.com';
}

/** The front page's own words, and what any address we can't name more closely shows. */
export const GENERIC = {
  title: 'dorkhub: learn about anything',
  description: 'An encyclopedia that writes itself around your curiosity. Start anywhere: every link opens a page on that topic, and everything you read becomes your own map of what you know.',
  image: 'dorkhub.jpg',
  alt: 'Dorkhub: “Learn about anything” above the box where you type a topic.',
};

/** @typedef {{ file: string, from: 'card' | 'picture' | 'type' | 'front', line?: string, kind?: string, alt?: string }} Image */
/** The pictures made so far (scripts/share.mjs keeps the index), by address word. @returns {{ pages: Record<string, Image>, generic?: Image }} */
export function images(at = IMAGES) {
  try { const j = JSON.parse(readFileSync(at, 'utf8')); return { pages: j.pages || {}, generic: j.generic }; } catch { return { pages: {} }; }
}

/** The hand-made line about a topic on the front page or the door list, the one that travels on its picture. */
const HOOKS = new Map([...FRONT, ...EARLIER].map(t => [topicKey(t.t), t.h]));
export const hookOf = (/** @type {string} */ title) => HOOKS.get(topicKey(title)) || '';

/** @typedef {{ key: string, word: string, path: string, title: string, own: string, q: boolean, kind: string, deck: string, line: string, from: 'seed' | 'placeholder' }} Known */
/** An address's word, as the page's own file is named. @param {string} path */
const wordOf = path => decodeURIComponent(path.replace(/^\//, ''));
/**
 * Every page known before anyone asks, with its own words: the pages written ahead of time (whatever the index lists
 * when this runs: the set grows as pages are written), then the front page's topics still waiting for theirs, which
 * open their placeholders. A placeholder's deck is the line under its title, as it shows on the page.
 * @param {{ seeds?: URL }} [o] @returns {Promise<Known[]>}
 */
export async function knownPages({ seeds = SEEDS } = {}) {
  /** @type {any} */ let idx = {}; try { idx = JSON.parse(await readFile(new URL('index.json', seeds), 'utf8')); } catch { /* none written yet */ }
  const flat = flatIndex(idx).pages;
  /** @type {Known[]} */ const out = [];
  /* its address is the topic asked for; its title is the page's own, except that a question keeps its words (the page
     answering it picks a title of its own, but the link reads as the question) */
  /** @param {string} asked @param {Omit<Known, 'word' | 'path' | 'line'>} p */
  const add = (asked, p) => { const path = routeOf({ title: asked, q: p.q }); out.push({ ...p, word: wordOf(path), path, line: hookOf(asked) || clip(p.deck, 140) }); };
  for (const [key, s] of Object.entries(flat)) {
    const text = await readFile(new URL(s.file, seeds), 'utf8').catch(() => ''); if (!text) continue;
    const A = parseArticle(text, false);
    add(s.title, { key, title: s.question ? s.title : A.title || s.title, own: A.title || s.title, q: !!s.question, kind: A.kind || '', deck: plain(A.deck).trim(), from: 'seed' });
  }
  for (const f of FRONT) { const key = topicKey(f.t); if (!flat[key]) add(f.t, { key, title: f.t, own: f.t, q: false, kind: f.k, deck: f.h, from: 'placeholder' }); }
  return out;
}
/** The titles of the known pages, by topic, without reading a page: what a trail's preview needs. @returns {Map<string, string>} */
export function knownTitles(seeds = SEEDS) {
  /** @type {any} */ let idx = {}; try { idx = JSON.parse(readFileSync(new URL('index.json', seeds), 'utf8')); } catch { /* none */ }
  const m = new Map(FRONT.map(f => [topicKey(f.t), f.t]));
  for (const [k, s] of Object.entries(flatIndex(idx).pages)) m.set(k, s.title);
  return m;
}

/* ---------- the head ---------- */
const esc = (/** @type {unknown} */ s) => String(s ?? '').replace(/[&<>"']/g, c => /** @type {Record<string, string>} */ ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** @typedef {{ title: string, doc?: string, description: string, path: string, image: string, alt: string, type?: string, noindex?: boolean }} Meta */
/** The tags a link preview reads, with the page's own title and description. @param {Meta} m @param {string} site */
export function metaTags(m, site) {
  const url = `${site}${m.path}`; const img = /^https?:/.test(m.image) ? m.image : `${site}/share/${m.image}`;
  return [
    `<title>${esc(m.doc || m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}">`,
    ...(m.noindex ? ['<meta name="robots" content="noindex">'] : []),
    '<meta property="og:site_name" content="Dorkhub">',
    `<meta property="og:type" content="${esc(m.type || 'article')}">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(img)}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(m.alt)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
  ].join('\n');
}
const genericImage = () => images().generic?.file || GENERIC.image;
/** The front page. */
export const frontMeta = () => /** @type {Meta} */ ({ title: GENERIC.title, description: GENERIC.description, path: '/', image: genericImage(), alt: GENERIC.alt, type: 'website' });
/** A known page: its title, its deck, its picture (the generic one until its own is made). @param {Known} p */
export function pageMeta(p, pics = images().pages) {
  const im = pics[p.word];
  return /** @type {Meta} */ ({ title: p.title, doc: `${p.title}: dorkhub`, description: clip(p.deck || p.line, 300), path: p.path, image: im ? im.file : genericImage(), alt: im && im.alt ? im.alt : GENERIC.alt, noindex: true });
}

/* ---------- the addresses only a link preview asks the function about ---------- */
/**
 * What a link preview is told about an address that has no file of its own: a topic by the title its address reads
 * as, a connecting page by its pair, a trail by its pages (the first of them with a picture lends it), anything else
 * as the front page. Pure: the address, the known titles and the pictures, nothing else.
 * @param {ReturnType<typeof import('../src/shared/world.js').parseRoute>} r
 * @param {{ titles?: Map<string, string>, pics?: Record<string, Image> }} [o] @returns {Meta | null}
 */
export function addressMeta(r, { titles = knownTitles(), pics = images().pages } = {}) {
  const named = (/** @type {string} */ t) => titles.get(topicKey(t)) || t;
  const word = (/** @type {import('../src/shared/world.js').PageReq} */ req) => wordOf(routeOf(req).split('?')[0]);
  if (r.view === 'page') {
    const req = r.input; const title = req.bridge ? `${named(req.bridge[0])} and ${named(req.bridge[1])}` : named(req.title);
    const im = req.bridge ? null : pics[word(req)];
    return { title, doc: `${title}: dorkhub`, description: GENERIC.description, path: routeOf(req), image: im ? im.file : genericImage(), alt: im && im.alt ? im.alt : GENERIC.alt, noindex: true };
  }
  if (r.view === 'trail') {
    const names = r.steps.map(s => (s.bridge ? `${named(s.bridge[0])} and ${named(s.bridge[1])}` : named(s.title)));
    const first = names[0], last = names[names.length - 1];
    const title = names.length === 1 ? `A trail through ${first}` : `A trail from ${first} to ${last}`;
    const im = r.steps.map(s => (s.bridge ? null : pics[word(s)])).find(Boolean);
    const count = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][names.length] || String(names.length);
    return { title, doc: `${title}: dorkhub`, description: `${names.join(' → ')}: ${count} page${names.length === 1 ? '' : 's'} on Dorkhub, in the order they were read.`, path: trailRouteOf(r.steps), image: im ? im.file : genericImage(), alt: im && im.alt ? im.alt : GENERIC.alt, noindex: true };
  }
  if (r.view === 'world') return { ...frontMeta(), path: '/world', noindex: true };
  return null;
}

/** The head a link preview gets from the function: the tags, and a plain link to the page for anything that reads on.
    @param {Meta} m @param {string} site */
export function previewDoc(m, site) {
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n${metaTags(m, site)}\n</head>\n<body>\n<p><a href="${esc(m.path)}">${esc(m.title)}</a>, on Dorkhub.</p>\n</body>\n</html>\n`;
}

/* ---------- the function: GET /api/share, for link previews only ----------
   vercel.json sends a topic, a connecting page or a trail here only when the request's User-Agent names one of
   PREVIEW_BOTS and the address has no file of its own; everyone else gets the page itself. The answer is the head
   addressMeta makes, from the address alone. Nothing is written or logged, and nothing about the request is kept. */
/** The link-preview fetchers allowed in robots.txt and sent here (WhatsApp's is a bare "WhatsApp/2…", which Signal
    borrows; iMessage's, fetched from the sender's device, carries facebookexternalhit and Twitterbot). */
export const PREVIEW_BOTS = 'Slackbot|Twitterbot|facebookexternalhit|Facebot|Discordbot|LinkedInBot|TelegramBot|^WhatsApp/';
/** @param {Request} request @param {{ env?: Record<string, string | undefined> }} [deps] @returns {Response} */
export function handleShare(request, { env = process.env } = {}) {
  const head = { 'cache-control': 'private, max-age=3600', 'x-robots-tag': 'noindex', 'x-content-type-options': 'nosniff' };
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { allow: 'GET', ...head } });
  const q = new URL(request.url).searchParams; const word = (/** @type {string} */ k) => (q.get(k) || '').replace(/^\/+|\/+$/g, '');
  const path = q.has('trail') ? `/trail/${word('trail')}` : q.has('a') ? `/connect/${word('a')}/${word('b')}` : `/${word('topic')}`;
  const r = /\.|^\/(api|fonts)$/.test(path) || path.length > 2048 ? null : parseRoute(path, `?${['v', 'in', 'q'].filter(k => q.has(k)).map(k => `${k}=${encodeURIComponent(q.get(k) || '')}`).join('&')}`);
  const m = r && (r.view === 'page' || r.view === 'trail' || r.view === 'world') ? addressMeta(r) : null;
  if (!m) return new Response('Not here.\n', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', ...head } });
  return new Response(request.method === 'HEAD' ? null : previewDoc(m, siteOf(env)), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', ...head } });
}

/* ================= GET /api/picture: a page's lead picture, through our own origin =================
   ?t=<title>                      → { src, w, h, alt, desc, credit, license, file } for the topic's Wikipedia
                                     lead image, or 204 when there is no freely licensed one.
   ?f=<a/ab/File.jpg>&w=500[&o=1]  → that image, proxied, so a reader's browser never asks Wikimedia (over 2 MB at
                                     that width, one standard width down).

   No model is involved and nothing is written. Only Commons images (freely licensed) are used, only
   requests from our own page are answered (Sec-Fetch-Site: same-origin; crawlers and other sites get
   a 403 that is never cached), and every answer, misses included, is cached by the CDN, so a repeat
   costs nothing. Titles are never logged. */

const UA = 'Dorkhub/1.0 (https://dorkhub.com; one lead picture per page)';
/* Wikimedia serves thumbnails only at standard widths; 500 is sharp in the margin and light (about 70 KB) */
export const WIDTHS = [330, 500, 960, 1280];   // 960: a page's picture across the reading column; 1280: the front page's photographs, both sharp on a fine screen
const HIT = 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800';
const MISS = 'public, max-age=3600, s-maxage=604800';
const IMAGE = 'public, max-age=31536000, s-maxage=31536000, immutable';
const MAX_BYTES = 2_000_000;
const COMMONS = /^https:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?([0-9a-f]\/[0-9a-f]{2}\/[^/?#]+)/;
const FILE = /^[0-9a-f]\/[0-9a-f]{2}\/[^/?#\\]+\.(jpe?g|png|gif|webp|svg)$/i;
const STOP = new Set(['the', 'a', 'an', 'of', 'and', 'in', 'on', 'at', 'to', 'for', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'can', 'could', 'why', 'how', 'what', 'who', 'when', 'where', 'which', 'it', 'its', 'we', 'you', 'they']);

/** @typedef {{ env?: Record<string, string | undefined>, fetch?: typeof fetch }} Deps */
/** @param {number} status @param {string} cache @param {HeadersInit} [more] */
const empty = (status, cache, more = {}) => new Response(null, { status, headers: { 'cache-control': cache, ...more } });

/* The words that carry a title's meaning, for checking that a search found the same thing. */
/** @param {string} s */
const words = s => s.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
/** @param {string} s */
const stems = s => words(s).map(w => w.replace(/(ies|es|s)$/, ''));
/** @param {string} title */
function candidates(title) {
  const t = title.replace(/[‘’]/g, "'").replace(/\?+\s*$/, '').trim(); const out = [t];
  const bare = t.replace(/^(the|a|an)\s+/i, ''); out.push(bare);
  out.push(bare.replace(/ies$/i, 'y').replace(/(ss|sh|ch|x)es$/i, '$1').replace(/([^s])s$/i, '$1'));
  if (/^(why|how|what|who|when|where|which|is|are|do|does|did|can)\b/i.test(t)) out.push(words(t).join(' '));
  return [...new Set(out.filter(Boolean))];
}

/** @param {typeof fetch} get @param {string} url @param {number} ms */
async function json(get, url, ms = 3500) {
  try { const r = await get(url, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(ms) }); return r.ok ? await r.json() : null; }
  catch { return null; }
}
/** @param {string} html */
const text = html => String(html || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

/* What the picture shows: the caption Wikipedia's editors gave the article's lead picture, or else the first sentence
   of its English Commons description, when it is short and says more than the topic's own name. Anything else (another
   language, a file name, a paragraph about something else) gives no caption rather than a poor one. */
const NOT_EN = /\b(?:de|la|le|les|des|du|et|ou|el|los|las|und|der|die|das|il|della|di|een|het|och|och)\b/i;
const EN = /\b(?:the|of|a|an|in|on|at|with|from|and|by|for|to|its|is|are|was)\b/i;
/** @param {string} t @param {string} topic */
function cleanCaption(t, topic) {
  let s = t.replace(/\[(?:\d+|[a-z])\]/gi, '').replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s+([,.;:!?])/g, '$1').trim();
  /* its first sentence: a full stop before a capitalised word, but not after an initial or "c.", "St." and the like */
  const end = /(?<!\b(?:[A-Z]|c|ca|St|Mt|Dr|Mr|Mrs|No|vs))[.!?](?=\s+[A-Z(])/.exec(s); if (end) s = s.slice(0, end.index + 1);
  s = s.replace(/[.\s]+$/, '');
  /* too long: end it at a clause, preferably before a list or an aside ("…, including …"), never inside brackets */
  if (s.length > 170) {
    const ok = (/** @type {number} */ i) => i > 60 && (s.slice(0, i).match(/\(/g) || []).length === (s.slice(0, i).match(/\)/g) || []).length;
    const cuts = [...s.slice(0, 165).matchAll(/, (\w+)/g)].map(m => ({ i: m.index ?? 0, w: m[1].toLowerCase() })).filter(c => ok(c.i));
    const best = cuts.filter(c => /^(including|with|showing|as|while|where|which|seen|taken|from)$/.test(c.w)).pop() || cuts.pop();
    s = best ? s.slice(0, best.i) : '';
  }
  if (s.length < 12 || /\.(jpe?g|png|gif|tiff?|svg|webp)\b/i.test(s) || /^(file|image|photo|picture):/i.test(s)) return '';
  /* a caption that only repeats the name ("Greenland shark (Somniosus microcephalus)") tells the reader nothing */
  const own = new Set(stems(topic)); const said = stems(s.replace(/\([^)]*\)/g, ' '));
  return said.length < 3 || said.every(w => own.has(w)) ? '' : s;
}
/** @param {string} lead the article's own caption for the picture @param {string} html its Commons description @param {string} topic */
export function captionOf(lead, html, topic) {
  const fromWiki = cleanCaption(text(lead), topic); if (fromWiki) return fromWiki;
  let h = String(html || ''); const en = /<div[^>]*\blang="en"[^>]*>([\s\S]*?)<\/div>/i.exec(h);
  if (en) h = en[1]; else if (/\blang="(?!en)[a-z-]+"/i.test(h)) return '';
  const t = text(h).replace(/^english:\s*/i, '');
  if (!en && NOT_EN.test(t) && !EN.test(t)) return '';
  return cleanCaption(t, topic);
}

/** @param {typeof fetch} get @param {string} title */
export async function lookup(get, title) {
  const tries = candidates(title);
  /** @type {string[]} */ const seen = [];
  for (let i = 0; i <= tries.length; i++) {
    let name = tries[i]; let searched = false;
    if (i === tries.length) {
      const q = words(title).join(' '); if (!q) break;
      const s = await json(get, `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(q)}&limit=1`);
      name = s && s.pages && s.pages[0] && s.pages[0].key; searched = true; if (!name) break;
    }
    if (seen.includes(name)) continue; seen.push(name);
    const sum = await json(get, `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/ /g, '_'))}`);
    if (!sum || sum.type !== 'standard') continue;
    /* a search result must share the title's meaning, not just a word or two */
    if (searched) { const want = stems(title), got = new Set(stems(sum.title || '')); if (want.filter(w => got.has(w)).length < Math.max(1, Math.ceil(want.length / 2))) return null; }
    const img = sum.originalimage; const m = img && COMMONS.exec(img.source || '');
    if (!m || !FILE.test(m[1]) || !(img.width >= 320)) return null;   // the topic was found; it just has no picture we can use
    const file = decodeURIComponent(m[1].split('/').pop() || '');
    const [meta, media] = await Promise.all([
      json(get, `https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=extmetadata&titles=${encodeURIComponent('File:' + file)}`),
      json(get, `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent((sum.title || name).replace(/ /g, '_'))}`),
    ]);
    /* the article's own caption for this picture, if its editors gave it one */
    const same = (/** @type {any} */ it) => it && typeof it.title === 'string' && it.title.replace(/^File:/, '').replace(/_/g, ' ') === file.replace(/_/g, ' ');
    const leadCap = media && Array.isArray(media.items) ? ((media.items.find(same) || {}).caption || {}).text || '' : '';
    const x = meta && meta.query && meta.query.pages && meta.query.pages[0] && meta.query.pages[0].imageinfo && meta.query.pages[0].imageinfo[0] && meta.query.pages[0].imageinfo[0].extmetadata;
    const license = x && x.LicenseShortName && text(x.LicenseShortName.value);
    if (!license || /fair use|non-free/i.test(license)) return null;
    /* Commons often doubles a name, or has none: "Unknown author Unknown author" credits nobody */
    const by = text((x.Artist && x.Artist.value) || (x.Credit && x.Credit.value) || '').replace(/^(.+?)\s+\1$/, '$1').replace(/^(unknown|anonymous)( author)?$/i, '');
    const credit = by.length > 40 ? by.split(/,|;|\s[-–—]\s|\(/)[0].trim().slice(0, 60) : by;
    /* a large original comes at 960 px, to sit sharp across the reading column; a small one as it is */
    const big = img.width > 500; const w = img.width >= 960 ? 960 : big ? 500 : img.width; const h = Math.round(img.height * (w / img.width));
    return { src: `/api/picture?f=${encodeURIComponent(m[1])}&w=${big ? w : 330}${big ? '' : '&o=1'}`, w, h, alt: text(sum.description || sum.title || title).slice(0, 140), desc: captionOf(leadCap, x.ImageDescription && x.ImageDescription.value, sum.title || title), credit, license, file: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}` };
  }
  return null;
}

/** @param {Request} request @param {Deps} [deps] @returns {Promise<Response>} */
export async function handlePicture(request, deps = {}) {
  const env = deps.env ?? process.env; const get = deps.fetch ?? fetch;
  if (request.method !== 'GET' && request.method !== 'HEAD') return empty(405, 'no-store', { allow: 'GET' });
  if (request.headers.get('sec-fetch-site') !== 'same-origin') return empty(403, 'no-store');
  const url = new URL(request.url); const f = url.searchParams.get('f');
  if (f) {
    const w = Number(url.searchParams.get('w')); const original = url.searchParams.get('o') === '1';
    if (!FILE.test(f) || !WIDTHS.includes(w)) return empty(400, 'no-store');
    const name = f.split('/').pop() || '';
    const thumb = (/** @type {number} */ tw) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${f}/${tw}px-${name}${/\.svg$/i.test(name) ? '.png' : ''}`;
    /* a thumbnail over the cap (a big PNG scan can pass 2 MB at 960 px) is tried once more a standard width down:
       the page lays the picture out from the lookup's own width and height, so a narrower image fits the same box */
    const tries = original ? [`https://upload.wikimedia.org/wikipedia/commons/${f}`] : w > 500 ? [thumb(w), thumb(w > 960 ? 960 : 500)] : [thumb(w)];
    try {
      for (const src of tries) {
        const r = await get(src, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(5000) });
        const type = r.headers.get('content-type') || ''; const size = Number(r.headers.get('content-length') || 0);
        if (!r.ok || !/^image\/(jpeg|png|gif|webp|svg\+xml)/.test(type)) return empty(404, MISS);
        if (size > MAX_BYTES) { await r.body?.cancel().catch(() => {}); continue; }
        const body = await r.arrayBuffer(); if (body.byteLength > MAX_BYTES) continue;
        return new Response(body, { status: 200, headers: { 'content-type': type, 'cache-control': IMAGE, 'x-content-type-options': 'nosniff' } });
      }
      return empty(404, MISS);
    } catch { return empty(504, 'no-store'); }
  }
  const title = (url.searchParams.get('t') || '').replace(/\s+/g, ' ').trim();
  if (!title || title.length > 120) return empty(400, 'no-store');
  if (env.DH_PICTURES === 'off') return empty(204, 'no-store');
  const pic = await lookup(get, title);
  if (!pic) return empty(204, MISS);
  return new Response(JSON.stringify(pic), { status: 200, headers: { 'content-type': 'application/json', 'cache-control': HIT } });
}

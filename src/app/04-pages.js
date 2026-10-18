/* ================= model: pages by topic, the one on screen, and how you move between them ================= */
let CUR = '';                    // the page on screen
const ACTIVE = new Map();        // pages being written: id -> AbortController
const PCACHE = new WeakMap();
const REV = new Map();           // smooth reveal: page id -> { node, shown }
const pageOf = id => (id && store.pages[id]) || null;
const curPage = () => pageOf(CUR);
const cleanTitle = t => clip(String(t || '').replace(/\s+/g, ' ').trim(), 160);
/* a page in your world for this request, made the first time it is asked for */
function ensurePage(req, hint = null) {
  const id = pageId(req); let p = store.pages[id];
  if (!p) { const at = Date.now(); p = store.pages[id] = { id, req, title: clip(capFirst(req.bridge ? `${req.bridge[0]} and ${req.bridge[1]}` : req.title), 120), status: 'empty', text: '', deck: '', kind: '', hint: hint || null, first: at, last: at, saved: 0 }; }
  else if (hint && !p.hint) p.hint = hint;
  return p;
}
const displayText = p => { const r = REV.get(p.id); const t = p.text || ''; return r ? t.slice(0, Math.floor(r.shown)) : t; };
const isLive = p => p.status === 'digging' || p.status === 'empty' || REV.has(p.id);
function parsed(p) {
  const t = displayText(p); const live = isLive(p); const c = PCACHE.get(p); const len = (p.text || '').length;
  if (c && c.len === t.length && c.live === live && c.src === len) return c.A;
  const A = parseArticle(t, live); PCACHE.set(p, { len: t.length, live, src: len, A }); return A;
}
/* Everything received so far, not just what has been revealed: hooks and kinds for link cards. */
const FCACHE = new WeakMap();
function full(p) {
  const live = p.status === 'digging' || p.status === 'empty'; const c = FCACHE.get(p); const t = p.text || '';
  if (c && c.len === t.length && c.live === live) return c.A;
  const A = parseArticle(t, live); FCACHE.set(p, { len: t.length, live, A }); return A;
}
/* what a link on one page says about where it goes: its hook and its kind, so the next page arrives in colour */
function hintFor(p, target) {
  if (!p || !p.text) return null; const A = full(p); const k = keyOf(target); const g = A.gloss[k]; const hook = hookOf(A, k);
  const kind = (g && g.kind) || (A.tunnels.find(t => keyOf(t.target) === k) || {}).kind || '';
  return hook || kind ? { gloss: hook, kind } : null;
}
const titleLocked = p => titleIsLocked({ title: p.req.title, q: p.req.q, bridge: p.req.bridge });
const shownTitle = (p, A) => titleLocked(p) ? (A.title && keyOf(A.title) === keyOf(p.req.title) ? A.title : capFirst(p.req.title)) : (A.title || p.title);
/* the topics a finished page links to, kept so Your world can draw them without reading the page again */
function linksFrom(A, p) {
  const out = new Map(); const self = topicKey(p.title); const own = topicKey(p.req.title);
  const add = (name, kind, hook) => { const k = topicKey(name); if (k && k !== self && k !== own && !out.has(k)) out.set(k, [k, clip(name, 80), kind || '', clip(plain(hook || ''), 100)]); };
  /* the topics the page offers to keep exploring first: they are its invitations */
  for (const c of cardsOf(A)) add(c.target, c.kind, c.teaser);
  for (const g of Object.values(A.gloss)) add(g.name, g.kind, g.gloss);
  return [...out.values()].slice(0, 28);
}

/* ================= moving: one topic per screen, at a clean address ================= */
/* a page transition needs frames to run in; a page in a hidden tab just changes */
const canVT = () => typeof document.startViewTransition === 'function' && !reducedMotion() && document.visibilityState === 'visible';
let HERO = false, PLATE = false;
function clearHero() { HERO = PLATE = false; $$('[style*="view-transition-name"]').forEach(el => { el.style.viewTransitionName = ''; }); }
/* the thing you clicked becomes the next title; a front-page card's drawing becomes the page's plate */
function go(url, { src = null, plate = null, replace = false } = {}) {
  const run = () => { if (location.pathname + location.search !== url) { rememberScroll(); history[replace ? 'replaceState' : 'pushState']({ y: 0 }, '', url); } route(); };
  if (!canVT()) { run(); return; }
  if (src && src.isConnected) { src.style.viewTransitionName = 'hero'; HERO = true; }
  if (plate && plate.isConnected) { plate.style.viewTransitionName = 'plate'; PLATE = true; }
  try { const t = document.startViewTransition(run); quiet(t); t.finished.finally(clearHero).catch(() => {}); } catch (e) { clearHero(); run(); }
}
/* a transition that is skipped (a hidden tab, a second click mid-flight) is fine: the page still changes */
const quiet = t => { for (const k of ['ready', 'updateCallbackDone', 'finished']) if (t && t[k]) t[k].catch(() => {}); return t; };
function rememberScroll() { try { history.replaceState({ ...(history.state || {}), y: scrollY }, ''); } catch (e) { /* fine */ } }
/**
 * The one way to move: open a page on `target` (a topic, a question, a phrase you selected), from
 * the page you are on. It joins your trail; whatever you read becomes part of your world.
 * via: start | link | card | question | ask | select | search | world | connect | around | sketch | peek | index | trail
 */
function openTopic(target, { via = 'link', src = null, plate = null, hint = null, lens = null, ctx = '', q = null, bridge = null } = {}) {
  const title = cleanTitle(target); if (!title && !bridge) return;
  const from = via === 'start' ? null : CUR || null;
  const req = { title: bridge ? cleanTitle(target || `${bridge[0]} and ${bridge[1]}`) : title, lens: LENSES[lens] ? lens : store.settings.lens, q: !bridge && (q == null ? asksQuestion(title) : !!q), ctx: bridge ? '' : cleanTitle(ctx), bridge: bridge ? bridge.map(cleanTitle) : null };
  const p = ensurePage(req, hint || hintFor(pageOf(from), title));
  if (p.id === CUR) return;
  addStep(store.trails, p.id, { from, via });
  p.last = Date.now(); OPENED.add(p.id); save();
  go(routeOf(req), { src, plate });
}
/* pages opened in this visit by the reader's own hand: those are written without asking */
const OPENED = new Set();
/* the request for a page, as the server reads it */
const pageInput = p => ({ title: p.req.title, lens: p.req.lens, q: p.req.q, ctx: p.req.ctx, bridge: p.req.bridge });
/* the context the small tools share: which page they run on */
const ctxInput = p => ({ title: p.title });

/* ================= the trail you're on ================= */
const curTrail = () => store.trails[0] || null;
/* the pages of a trail, in the order you first opened them, each once */
function trailPages(t = curTrail()) {
  if (!t) return []; const seen = new Set(); const out = [];
  for (const [pid] of t.steps) { if (seen.has(pid)) continue; seen.add(pid); const p = pageOf(pid); if (p) out.push(p); }
  return out;
}
/* how many topics are in your world: the count beside Your world */
function worldCount() { const s = new Set(); for (const p of Object.values(store.pages)) if (p.status === 'done' || p.status === 'partial') s.add(nodeKeyOf(p)); return s.size; }

/* ================= model ================= */
let W = null;
let NAV_DIR = null;
const ACTIVE = new Map();
const PCACHE = new WeakMap();
const REV = new Map();          // smooth reveal: nodeId -> { node, shown }
function mkNode(w, { title, parent = null, depth = 0, from = null, seed = null, lens = null }) {
  const n = { id: uid(), title: clip(String(title).trim(), 120), keys: [keyOf(title)], parent, depth, from, seed, lens: LENSES[lens] ? lens : null, text: '', status: 'empty', created: Date.now(), deck: '', drift: null };
  w.nodes[n.id] = n; w.order.push(n.id); return n;
}
function newWarren(title, { demo = false } = {}) {
  title = String(title || '').trim(); if (!title) return;
  const w = { id: uid(), created: Date.now(), updated: Date.now(), nodes: {}, order: [], loops: [], root: null, current: null, demo };
  const n = mkNode(w, { title, from: isQuestion(title) ? { question: title } : null });
  w.root = n.id; w.current = n.id;
  store.warrens.unshift(w); if (store.warrens.length > 10) store.warrens.length = 10;
  W = w; save(true); nav(n.id, 'down');
}
const pathTo = n => { const out = []; let x = n; while (x) { out.unshift(x); x = x.parent ? W.nodes[x.parent] : null; } return out; };
const childrenOf = id => W.order.map(x => W.nodes[x]).filter(n => n.parent === id);
const findByKey = k => k ? W.order.map(x => W.nodes[x]).find(n => n.keys.includes(k)) : null;
const displayText = node => { const r = REV.get(node.id); return r ? node.text.slice(0, Math.floor(r.shown)) : node.text; };
const isLive = node => node.status === 'digging' || node.status === 'empty' || REV.has(node.id);
function parsed(node) {
  const t = displayText(node); const live = isLive(node); const c = PCACHE.get(node);
  if (c && c.len === t.length && c.live === live && c.src === node.text.length) return c.A;
  const A = parseArticle(t, live); PCACHE.set(node, { len: t.length, live, src: node.text.length, A }); return A;
}
/* Everything received so far, not just what has been revealed: hooks and kinds for seeds and link cards. */
const FCACHE = new WeakMap();
function full(node) {
  const live = node.status === 'digging' || node.status === 'empty'; const c = FCACHE.get(node);
  if (c && c.len === node.text.length && c.live === live) return c.A;
  const A = parseArticle(node.text, live); FCACHE.set(node, { len: node.text.length, live, A }); return A;
}
function seedFor(parent, target) {
  const A = full(parent); const k = keyOf(target); const g = A.gloss[k]; const hook = hookOf(A, k);
  const kind = (g && g.kind) || (A.tunnels.find(t => keyOf(t.target) === k) || {}).kind || '';
  return hook || kind ? { gloss: hook, kind } : null;
}

/* navigation with page transitions: the thing you clicked becomes the next title */
const canVT = () => typeof document.startViewTransition === 'function' && !reducedMotion();
let HERO = false;
function clearHero() { HERO = false; document.documentElement.classList.remove('vt-up'); $$('[style*="view-transition-name"]').forEach(el => { el.style.viewTransitionName = ''; }); }
function go(hash, { dir = null, src = null } = {}) {
  NAV_DIR = dir;
  const run = () => { if (location.hash !== hash) history.pushState(null, '', hash); route(); };
  if (!canVT()) { run(); return; }
  if (src && src.isConnected) { src.style.viewTransitionName = 'hero'; HERO = true; }
  document.documentElement.classList.toggle('vt-up', dir === 'up');
  try { const t = document.startViewTransition(run); t.finished.finally(clearHero); } catch (e) { clearHero(); run(); }
}
function nav(nid, dir, src) { go(`#/w/${W.id}/${nid}`, { dir, src }); }
function dig(target, ctx = {}, fromId, src) {
  if (!W) return;
  const cur = W.nodes[fromId || W.current]; target = String(target || '').trim().replace(/\s+/g, ' ');
  if (!target || !cur) return;
  W.current = cur.id;
  const k = keyOf(target); const ex = findByKey(k);
  if (ex) {
    if (ex.id === cur.id) return;
    if (ex.parent !== cur.id && cur.parent !== ex.id && !W.loops.some(([a, b]) => a === cur.id && b === ex.id)) W.loops.push([cur.id, ex.id]);
    save(); nav(ex.id, ex.depth > cur.depth ? 'down' : 'up', src); return;
  }
  if (W.order.length >= 90) { toast('This rabbit hole is enormous. Start a new one to keep going.'); return; }
  const n = mkNode(W, { title: target, parent: cur.id, depth: cur.depth + 1, from: ctx, seed: seedFor(cur, target), lens: ctx.lens });
  W.updated = Date.now(); save(); nav(n.id, 'down', src);
}

/* ================= what the writer is told: structured context, never a prompt =================
   The server (lib/prompts.js) turns this into the page prompt. Field limits there are the
   source of truth; these mirror them so requests stay small. */
const titleLocked = node => titleIsLocked(node);
const pathInput = node => pathTo(node).slice(0, -1).map(n => ({ title: n.title, deck: n.deck ? clip(n.deck, 400) : '' }));
function fromInput(node) {
  const f = node.from; if (!f) return null;
  if (f.bridge) { const o = W.nodes[f.bridge]; return { kind: 'bridge', other: o ? o.title : f.bridgeTitle || '' }; }
  if (f.cont) return { kind: 'cont', text: clip(f.text || '', 600) };
  if (f.question) return { kind: 'question', question: clip(f.question, 240) };
  if (f.text) return { kind: 'passage', text: clip(f.text, 600) };
  return null;
}
/* What the page they just came from already covered (its headings and links, in order), so the
   next page builds on it instead of retelling it. */
function seenInput(node) {
  const p = node.parent ? W.nodes[node.parent] : null; if (!p || !p.text) return [];
  const out = []; const keys = new Set(node.keys);
  const A = parsed(p);
  for (const s of [...A.blocks.map(b => b.t === 'h' ? '#' + b.s : b.s), ...A.panels.flatMap(x => x.rows.flat())]) {
    if (s[0] === '#') out.push(clip(plain(s.slice(1)), 80));
    else for (const m of s.matchAll(/\[\[([^\]]+)\]\]/g)) { const t = splitLink(m[1])[1]; const k = keyOf(t); if (!keys.has(k)) { keys.add(k); out.push(clip(t, 80)); } }
  }
  return out.slice(0, 24);
}
/* The panel types the last two pages on the path used, so the writer can vary them. */
const panelsInput = node => [...new Set(pathTo(node).slice(-3, -1).flatMap(n => n.text ? parsed(n).panels.filter(p => !p.v1).map(p => p.type) : []))];
function pageInput(node) {
  const path = pathTo(node); const onPath = new Set(path.map(n => n.id));
  return {
    title: node.title, depth: node.depth, lens: node.lens || store.settings.lens, kind: (node.seed && node.seed.kind) || '', panels: panelsInput(node),
    path: pathInput(node), from: fromInput(node), seen: seenInput(node),
    others: W.order.map(x => W.nodes[x]).filter(n => !onPath.has(n.id) && n.status === 'done').map(n => n.title).slice(-24),
    ratings: path.filter(n => n.reaction).slice(-3).map(n => ({ title: n.title, rating: n.reaction })),
  };
}
/* The context most small tools share: where the reader is, and how they got there. */
const ctxInput = node => ({ title: node.title, path: pathInput(node).map(p => ({ title: p.title })) });

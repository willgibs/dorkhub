/* ================= Your world, as data and physics =================
   The pure half of the graph: which topics and links to draw (within caps, so a thousand pages
   stay quick), and a small force simulation in the spirit of d3-force: springs along links,
   Barnes-Hut repulsion between topics, and a gentle pull to the middle. Velocity Verlet with
   decaying "heat", so a layout settles like a living thing and then stops. No DOM here, so it
   can be tested; the build inlines it into the page after world.js. */
import { topicKey } from './world.js';

/**
 * @typedef {[string, string, string, string?]} Link  topic key, name, kind, hook
 * @typedef {{ key: string, pid: string, title: string, kind: string, read: boolean, saved: number,
 *   first: number, last: number, hook: string, count: number, deg: number, cur: boolean,
 *   x: number, y: number, vx: number, vy: number, fx: number | null, fy: number | null }} GNode
 * @typedef {{ a: number, b: number, move: boolean, unread: boolean, len?: number }} GEdge
 * @typedef {{ nodes: GNode[], edges: GEdge[] }} Graph
 */

/* a small stable hash, for per-topic variety that is the same every time */
/** @param {string} s */
const hashOf = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h; };
/* A page's place in the world: its topic, or for a connecting page, its pair. */
/** @param {any} p */
export const nodeKeyOf = p => (p.req && p.req.bridge && p.req.bridge.length === 2 ? `c:${p.req.bridge.map(topicKey).sort().join('|')}` : topicKey(p.title));
/** @param {any} p */
const isRead = p => !!p && (p.status === 'done' || p.status === 'partial');

/**
 * Topics you have read, the ones they link to that you haven't (faint, an invitation), the links
 * between them and the moves you made. Read topics past `maxRead` keep the most recent; unread ones
 * keep the most linked, and always the current page's own links.
 * @param {Record<string, any>} pages @param {{ steps: [string, number, string | null, string][] }[]} trails
 * @param {{ current?: string, maxRead?: number, maxUnread?: number, perPage?: number, linksOf?: (p: any) => Link[] }} [o]
 * @returns {Graph}
 */
export function buildGraph(pages, trails, { current = '', maxRead = 500, maxUnread = 300, perPage = 8, linksOf = p => p.links || [] } = {}) {
  /** @type {Map<string, GNode>} */ const read = new Map();
  const blank = (/** @type {string} */ key) => ({ key, pid: '', title: '', kind: '', read: false, saved: 0, first: 0, last: 0, hook: '', count: 0, deg: 0, cur: false, x: 0, y: 0, vx: 0, vy: 0, fx: null, fy: null });
  /* one node per topic: a topic read in two voices is one place in your world, opened at its latest page */
  for (const p of Object.values(pages)) {
    if (!isRead(p)) continue; const key = nodeKeyOf(p); if (!key) continue;
    let n = read.get(key); if (!n) { n = blank(key); n.read = true; n.first = p.first || p.last || 0; read.set(key, n); }
    if ((p.last || 0) >= n.last) { n.last = p.last || 0; n.pid = p.id; n.title = p.title; n.kind = p.kind || (p.hint && p.hint.kind) || n.kind; }
    n.first = Math.min(n.first || Infinity, p.first || p.last || 0); n.saved = Math.max(n.saved, p.saved || 0);
    if (p.id === current) n.cur = true;
  }
  let keep = [...read.values()].sort((a, b) => b.last - a.last);
  if (keep.length > maxRead) keep = keep.filter((n, i) => i < maxRead || n.cur || n.saved);
  const kept = new Map(keep.map(n => [n.key, n]));
  /* links between read topics, and the unread topics they point at */
  /** @type {Map<string, GNode & { at: number, mine: boolean, rank: number }>} */ const unread = new Map();
  /** @type {Map<string, { move: boolean }>} */ const pairs = new Map();
  const pairKey = (/** @type {string} */ a, /** @type {string} */ b) => (a < b ? `${a}\n${b}` : `${b}\n${a}`);
  /** @type {Map<string, Set<string>>} */ const via = new Map();   // unread topic -> the read topics that link it
  for (const p of Object.values(pages)) {
    if (!isRead(p)) continue; const from = kept.get(nodeKeyOf(p)); if (!from) continue;
    const mine = p.id === current; let rank = 0;
    for (const [k, name, kind, hook] of linksOf(p)) {
      if (!k || k === from.key) continue;
      if (kept.has(k)) { const pk = pairKey(from.key, k); if (!pairs.has(pk)) pairs.set(pk, { move: false }); continue; }
      if (read.has(k)) continue; /* read, but past the cap: not drawn at all */
      let u = unread.get(k);
      if (!u) { u = { ...blank(k), title: name, kind: kind || '', hook: hook || '', at: 0, mine: false, rank: Infinity }; unread.set(k, u); }
      u.count++; u.at = Math.max(u.at, p.last || 0); u.mine = u.mine || mine; u.rank = Math.min(u.rank, rank++); if (!u.kind && kind) u.kind = kind; if (!u.hook && hook) u.hook = hook;
      let v = via.get(k); if (!v) via.set(k, v = new Set()); v.add(from.key);
    }
  }
  /* each page offers a handful of invitations (the topics it says to keep exploring first); a topic
     several of your pages lead to is a bridge between them, and always shows */
  for (const [k, u] of unread) if (u.count < 2 && u.rank >= perPage && !u.mine) unread.delete(k);
  for (const [k, v] of via) if (unread.has(k)) for (const f of v) { const pk = pairKey(f, k); if (!pairs.has(pk)) pairs.set(pk, { move: false }); }
  /* the moves you made, from page to page, over the links you used */
  /** @type {Map<string, string>} */ const keyOfPid = new Map();
  for (const p of Object.values(pages)) if (isRead(p)) keyOfPid.set(p.id, nodeKeyOf(p));
  for (const t of trails || []) for (const [pid, , from] of t.steps || []) {
    const a = from && keyOfPid.get(from), b = keyOfPid.get(pid);
    if (!a || !b || a === b || !kept.has(a) || !kept.has(b)) continue;
    const pk = pairKey(a, b); const e = pairs.get(pk); if (e) e.move = true; else pairs.set(pk, { move: true });
  }
  const loose = [...unread.values()].sort((a, b) => Number(b.mine) - Number(a.mine) || b.count - a.count || b.at - a.at);
  const chosen = loose.filter((u, i) => i < maxUnread || (u.mine && u.rank < perPage));
  /** @type {GNode[]} */ const nodes = [...keep, ...chosen.map(({ at, mine, rank, ...n }) => n)];
  const index = new Map(nodes.map((n, i) => [n.key, i]));
  /** @type {GEdge[]} */ const edges = [];
  for (const [pk, e] of pairs) {
    const [a, b] = pk.split('\n'); const ia = index.get(a), ib = index.get(b); if (ia == null || ib == null) continue;
    const unreadEdge = !nodes[ia].read || !nodes[ib].read;
    /* an invitation hangs at its own distance, so a page's few unread topics gather loosely rather than in a ring */
    const len = unreadEdge ? 26 + (hashOf(nodes[nodes[ia].read ? ib : ia].key) % 23) : e.move ? 46 : 58;
    edges.push({ a: ia, b: ib, move: e.move, unread: unreadEdge, len });
    nodes[ia].deg++; nodes[ib].deg++;
  }
  return { nodes, edges };
}

/**
 * The neighbourhood of one topic, for the small map beside a page: everything within two links,
 * read topics first, and at most `unread` of the faint ones (the most linked), `max` in all. A topic
 * with no neighbourhood yet gets the most recent read topics around it instead.
 * @param {Graph} g @param {string} center @param {number} [max] @param {number} [unread]
 * @returns {Graph}
 */
export function localGraph(g, center, max = 60, unread = Infinity) {
  const start = g.nodes.findIndex(n => n.key === center);
  /** @type {number[][]} */ const adj = g.nodes.map(() => []);
  for (const e of g.edges) { adj[e.a].push(e.b); adj[e.b].push(e.a); }
  /** @type {Set<number>} */ const pick = new Set();
  if (start >= 0) {
    let ring = [start]; pick.add(start);
    for (let hop = 0; hop < 2 && pick.size < max; hop++) {
      /** @type {number[]} */ const next = [];
      for (const i of ring) for (const j of adj[i]) if (!pick.has(j) && !next.includes(j)) next.push(j);
      next.sort((a, b) => Number(g.nodes[b].read) - Number(g.nodes[a].read) || g.nodes[b].count - g.nodes[a].count || g.nodes[b].last - g.nodes[a].last);
      let faint = [...pick].filter(i => !g.nodes[i].read).length;
      for (const j of next) { if (pick.size >= max) break; if (!g.nodes[j].read && (faint >= unread || (hop === 1 && pick.size > max * .75))) continue; if (!g.nodes[j].read) faint++; pick.add(j); }
      ring = next;
    }
  }
  if (pick.size < 2) {
    const recent = g.nodes.map((n, i) => i).filter(i => g.nodes[i].read && !pick.has(i)).sort((a, b) => g.nodes[b].last - g.nodes[a].last);
    for (const i of recent) { if (pick.size >= Math.min(max, 24)) break; pick.add(i); }
  }
  const order = [...pick]; const at = new Map(order.map((i, j) => [i, j]));
  const nodes = order.map(i => ({ ...g.nodes[i], deg: 0 }));
  /** @type {GEdge[]} */ const edges = [];
  for (const e of g.edges) { const a = at.get(e.a), b = at.get(e.b); if (a == null || b == null) continue; edges.push({ ...e, a, b }); nodes[a].deg++; nodes[b].deg++; }
  return { nodes, edges };
}

/* ---------- the simulation ---------- */
/** @typedef {{ nodes: GNode[], edges: GEdge[], alpha: number, alphaMin: number, alphaDecay: number, alphaTarget: number, decay: number, rnd: () => number, count: number[] }} Sim */

/* a small deterministic random, so the same world settles the same way */
/** @param {number} seed */
const lcg = seed => { let s = seed >>> 0 || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };

/**
 * Places every topic (where it was before, beside a neighbour that has a place, or on a spiral)
 * and returns a simulation ready to run.
 * @param {Graph} g @param {{ pos?: Record<string, [number, number]>, alpha?: number, seed?: number }} [o]
 * @returns {Sim}
 */
export function createSim(g, { pos = {}, alpha = 1, seed = 7 } = {}) {
  const rnd = lcg(seed); const placed = new Set();
  g.nodes.forEach(n => { const p = pos[n.key]; if (p && isFinite(p[0]) && isFinite(p[1])) { n.x = p[0]; n.y = p[1]; placed.add(n); } n.vx = n.vy = 0; n.fx = n.fy = null; });
  /** @type {GNode[][]} */ const adj = g.nodes.map(() => []);
  for (const e of g.edges) { adj[e.a].push(g.nodes[e.b]); adj[e.b].push(g.nodes[e.a]); }
  let spiral = placed.size;
  g.nodes.forEach((n, i) => {
    if (placed.has(n)) return;
    const near = adj[i].find(m => placed.has(m));
    if (near) { const a = rnd() * Math.PI * 2, r = 18 + rnd() * 14; n.x = near.x + Math.cos(a) * r; n.y = near.y + Math.sin(a) * r; }
    else { const a = spiral * 2.399963, r = 22 * Math.sqrt(spiral + .5); n.x = Math.cos(a) * r; n.y = Math.sin(a) * r; spiral++; }
    placed.add(n);
  });
  const count = g.nodes.map(() => 0); for (const e of g.edges) { count[e.a]++; count[e.b]++; }
  return { nodes: g.nodes, edges: g.edges, alpha, alphaMin: .002, alphaDecay: 1 - Math.pow(.002, 1 / 260), alphaTarget: 0, decay: .42, rnd, count };
}
/** @param {Sim} s */
export const isHot = s => s.alpha >= s.alphaMin || s.alphaTarget > 0;

/* Barnes-Hut: far groups of topics push as one body at their centre */
/** @typedef {{ x0: number, y0: number, s: number, kids: (Quad | null)[] | null, pts: GNode[], v: number, cx: number, cy: number }} Quad */
/** @param {number} x0 @param {number} y0 @param {number} s @returns {Quad} */
const quad = (x0, y0, s) => ({ x0, y0, s, kids: null, pts: [], v: 0, cx: 0, cy: 0 });
/** @param {Quad} q @param {GNode} n @param {number} d */
function insert(q, n, d) {
  if (!q.kids) {
    if (!q.pts.length || d > 16) { q.pts.push(n); return; }
    const old = q.pts; q.pts = []; q.kids = [null, null, null, null];
    for (const o of old) child(q, o, d);
  }
  child(q, n, d);
}
/** @param {Quad} q @param {GNode} n @param {number} d */
function child(q, n, d) {
  const h = q.s / 2; const i = (n.x >= q.x0 + h ? 1 : 0) + (n.y >= q.y0 + h ? 2 : 0);
  const kids = /** @type {(Quad | null)[]} */ (q.kids);
  let k = kids[i]; if (!k) k = kids[i] = quad(q.x0 + (i & 1 ? h : 0), q.y0 + (i & 2 ? h : 0), h);
  insert(k, n, d + 1);
}
/** @param {Quad} q @param {(n: GNode) => number} charge */
function mass(q, charge) {
  let v = 0, w = 0, x = 0, y = 0;
  if (q.kids) for (const k of q.kids) { if (!k) continue; mass(k, charge); const c = Math.abs(k.v); v += k.v; w += c; x += c * k.cx; y += c * k.cy; }
  else for (const p of q.pts) { const c = charge(p); v += c; w += Math.abs(c); x += Math.abs(c) * p.x; y += Math.abs(c) * p.y; }
  q.v = v; q.cx = w ? x / w : q.x0 + q.s / 2; q.cy = w ? y / w : q.y0 + q.s / 2;
}
const THETA2 = .81, DMAX2 = 520 * 520;
/** @param {GNode} n @param {Quad} q @param {number} alpha @param {(n: GNode) => number} charge @param {() => number} rnd */
function push(n, q, alpha, charge, rnd) {
  if (!q.v) return;
  let x = q.cx - n.x, y = q.cy - n.y, l = x * x + y * y;
  if (q.kids) {
    if (q.s * q.s / THETA2 < l) { if (l < DMAX2) { if (l < 1) l = Math.sqrt(l) || 1; n.vx += x * q.v * alpha / l; n.vy += y * q.v * alpha / l; } return; }
    for (const k of q.kids) if (k) push(n, k, alpha, charge, rnd);
    return;
  }
  for (const p of q.pts) {
    if (p === n) continue;
    x = p.x - n.x; y = p.y - n.y; l = x * x + y * y; if (l >= DMAX2) continue;
    if (!x && !y) { x = (rnd() - .5) * 1e-3; y = (rnd() - .5) * 1e-3; l = x * x + y * y; }
    if (l < 1) l = Math.sqrt(l);
    const c = charge(p); n.vx += x * c * alpha / l; n.vy += y * c * alpha / l;
  }
}
/* read topics push harder than the faint unread ones, which settle at the edge of what you know */
/** @param {GNode} n */
const chargeOf = n => (n.read ? -70 - Math.min(n.deg, 12) * 6 : -18);

/**
 * Runs the simulation forward. Springs pull linked topics to a comfortable distance (shorter to an
 * unread topic), every topic repels every other, and a gentle pull keeps the world centred.
 * @param {Sim} s @param {number} [steps]
 */
export function tick(s, steps = 1) {
  const { nodes, edges, count } = s;
  for (let t = 0; t < steps; t++) {
    s.alpha += (s.alphaTarget - s.alpha) * s.alphaDecay; const alpha = s.alpha;
    for (const e of edges) {
      const a = nodes[e.a], b = nodes[e.b];
      let x = b.x + b.vx - a.x - a.vx, y = b.y + b.vy - a.y - a.vy;
      if (!x && !y) { x = (s.rnd() - .5) * 1e-3; y = (s.rnd() - .5) * 1e-3; }
      let l = Math.sqrt(x * x + y * y); const want = e.len || (e.unread ? 34 : e.move ? 46 : 58);
      const strength = (e.move ? 1.2 : 1) / Math.min(count[e.a], count[e.b]);
      l = (l - want) / l * alpha * strength; x *= l; y *= l;
      const bias = count[e.a] / (count[e.a] + count[e.b]);
      b.vx -= x * bias; b.vy -= y * bias; a.vx += x * (1 - bias); a.vy += y * (1 - bias);
    }
    if (nodes.length > 1) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const n of nodes) { if (n.x < x0) x0 = n.x; if (n.y < y0) y0 = n.y; if (n.x > x1) x1 = n.x; if (n.y > y1) y1 = n.y; }
      const root = quad(x0, y0, Math.max(x1 - x0, y1 - y0, 1) + 1e-6);
      for (const n of nodes) insert(root, n, 0);
      mass(root, chargeOf);
      for (const n of nodes) push(n, root, alpha, chargeOf, s.rnd);
    }
    for (const n of nodes) { const k = n.read ? .045 : .02; n.vx -= n.x * k * alpha; n.vy -= n.y * k * alpha; }
    for (const n of nodes) {
      if (n.fx != null && n.fy != null) { n.x = n.fx; n.y = n.fy; n.vx = n.vy = 0; continue; }
      n.vx *= 1 - s.decay; n.vy *= 1 - s.decay; n.x += n.vx; n.y += n.vy;
    }
  }
}

/* ---------- the camera ---------- */
/** @param {{ x: number, y: number }[]} nodes */
export function boundsOf(nodes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const n of nodes) { if (n.x < x0) x0 = n.x; if (n.y < y0) y0 = n.y; if (n.x > x1) x1 = n.x; if (n.y > y1) y1 = n.y; }
  return nodes.length ? { x0, y0, x1, y1 } : { x0: 0, y0: 0, x1: 0, y1: 0 };
}
/**
 * The view that shows these topics: its centre and zoom, clamped so one topic isn't absurdly close.
 * @param {{ x: number, y: number }[]} nodes @param {number} w @param {number} h @param {{ pad?: number, max?: number, min?: number }} [o]
 */
export function fitView(nodes, w, h, { pad = 48, max = 2.2, min = .2 } = {}) {
  const b = boundsOf(nodes); const bw = Math.max(1, b.x1 - b.x0), bh = Math.max(1, b.y1 - b.y0);
  const k = Math.max(min, Math.min(max, (w - pad * 2) / bw, (h - pad * 2) / bh));
  return { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, k };
}

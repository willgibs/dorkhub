/* ================= a graph view: one map of topics and the links between them =================
   The same view draws the small map beside a page, the full page at /world and the two maps on the front
   page. The layout is a small force simulation (src/shared/graph.js) that runs only while something is
   moving, then stops: no idle motion. Links trace in the first time a map is seen.
   Several maps live at once, so each keeps everything in one state object (S), made here and handed to the
   parts that work on it: the camera (11-graph-camera.js), the painting (11-graph-paint.js), the pointer
   (11-graph-input.js), the card (11-graph-card.js), Replay (11-graph-replay.js) and the picture
   (11-graph-picture.js). This file holds the data, the loop and the map's life. */
import { boundsOf, createSim, isHot, tick } from '../shared/graph.js';
import { reducedMotion, save, store } from './02-util.js';
import { frameView, flyTo, moveCamera, resize, setFocus } from './11-graph-camera.js';
import { hideTip, listenCard, showTip } from './11-graph-card.js';
import { listenPointer } from './11-graph-input.js';
import { SPREAD, TRACE, draw, themeColors } from './11-graph-paint.js';
import { picture } from './11-graph-picture.js';
import { startReplay, stepReplay, stopReplay } from './11-graph-replay.js';

/**
 * A graph view on a host element. mini: the small map beside a page (no wheel zoom, no tools).
 * still: a map inside a scrolling page (the front page): it never pans, zooms or drags, so a finger
 * scrolls the page over it; a topic is opened by a click, or on a phone by a tap on its card.
 * describe and open replace the card's status line and what opening a topic does; panel, given, takes the
 * card's place entirely (the front page's map shows a pointed-at topic beside the map, not over it).
 * hold: its first trace waits for play() (the front page's map takes its turn among the cards).
 * @param {HTMLElement} host @param {{ mini?: boolean, still?: boolean, hold?: boolean, positions?: Record<string, [number, number]> | Map<string, [number, number]>, describe?: (n: any) => string, open?: (n: any) => void, panel?: (n: any, actions: boolean) => void }} [o]
 */
export function makeGraph(host, { mini = false, still = false, hold = false, positions = null, describe = null, open = null, panel = null } = {}) {
  const cv = document.createElement('canvas'); cv.className = 'gv-canvas'; host.appendChild(cv);
  const tip = document.createElement('div'); tip.className = 'gv-tip'; tip.hidden = true; host.appendChild(tip);
  const S = {
    host, cv, tip, ctx: cv.getContext('2d'), mini, still, describe, open, panel,
    cw: 0, ch: 0, DPR: 1, raf: 0, visible: typeof IntersectionObserver !== 'function', alive: true, held: hold,
    /** @type {{ nodes: any[], edges: any[] }} */ g: { nodes: [], edges: [] }, sim: null, adj: [],
    cam: { x: 0, y: 0, k: 1 }, camTo: null,
    hover: -1, sel: -1, drag: null, focusSet: null, focusKey: '', replay: null,
    /** @type {Set<string>} */ hidden: new Set(),   // kind groups switched off
    born: new Map(),   // node index -> when it appeared (growth moments)
    colors: null, labelOrder: [], userMoved: false, widths: new Map(), lastCenter: '', lastSave: 0,
    seenAt: 0, dashLive: false, /** @type {{ at: number, fromA: boolean }[] | null} */ tD: null, /** @type {number[] | null} */ nD: null,
    pointers: new Map(), pinch: null,
    pos: positions || store.pos,
  };
  themeColors(S);
  listenPointer(S); listenCard(S);
  /* ---------- life ---------- */
  const onResize = () => resize(S);
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(onResize) : null; if (ro) ro.observe(host); else addEventListener('resize', onResize);
  /* the latest of what may be several changes since the last call: a map mounted just before a quick scroll
     gets "hidden" and "shown" together */
  const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(es => { S.visible = es[es.length - 1].isIntersecting; if (S.visible) wake(S); }) : null; if (io) io.observe(cv);
  resize(S);
  return {
    el: cv, setData: (next, o) => setData(S, next, o), frameView: (center, instant) => frameView(S, center, instant), setFocus: (key, fly) => setFocus(S, key, fly), flyTo: (v, instant) => flyTo(S, v, instant),
    picture: o => picture(S, o), startReplay: pids => startReplay(S, pids), stopReplay: () => stopReplay(S), wake: () => wake(S), hideTip: () => hideTip(S),
    get graph() { return S.g; }, get focused() { return S.focusKey; }, get replaying() { return !!S.replay && !S.replay.done; },
    retheme() { themeColors(S); wake(S); },
    setHidden(set) { S.hidden = set; S.hover = -1; wake(S); },
    find(q) { const s = q.trim().toLowerCase(); if (!s) return -1; const i = S.g.nodes.findIndex(n => n.title.toLowerCase().startsWith(s)); return i >= 0 ? i : S.g.nodes.findIndex(n => n.title.toLowerCase().includes(s)); },
    select(i) { S.sel = i; S.hover = -1; if (i >= 0) { const n = S.g.nodes[i]; flyTo(S, { x: n.x, y: n.y, k: Math.max(S.cam.k, 1.4) }); setTimeout(() => { if (S.sel === i) showTip(S, i, true); }, reducedMotion() ? 0 : 680); } else hideTip(S); wake(S); },
    sleep() { if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; },
    /* a map held back (the front page's, waiting its turn among the cards) traces in when asked */
    play() { S.held = false; wake(S); },
    destroy() { S.alive = false; if (S.raf) cancelAnimationFrame(S.raf); if (ro) ro.disconnect(); if (io) io.disconnect(); keepPositions(S); cv.remove(); tip.remove(); },
  };
}
const getPos = (S, k) => (S.pos instanceof Map ? S.pos.get(k) : S.pos[k]);
const setPos = (S, k, v) => { if (S.pos instanceof Map) S.pos.set(k, v); else S.pos[k] = v; };
/* ---------- data ---------- */
function setData(S, next, { center = '', grow = [], fit = true } = {}) {
  const old = new Map(S.g.nodes.map(n => [n.key, n]));
  /** @type {Record<string, [number, number]>} */ const seeds = {};
  for (const n of next.nodes) { const o = old.get(n.key); const p = o ? [o.x, o.y] : getPos(S, n.key); if (p) seeds[n.key] = p; }
  const fresh = next.nodes.filter(n => !seeds[n.key]).length;
  S.sim = createSim(next, { pos: seeds, alpha: !next.nodes.length ? 0 : fresh === next.nodes.length ? 1 : fresh || grow.length ? .32 : 0 });
  const g = S.g = next; const adj = S.adj = g.nodes.map(() => []); for (const e of g.edges) { adj[e.a].push(e.b); adj[e.b].push(e.a); }
  S.hover = -1; S.sel = -1; if (S.focusKey) setFocus(S, S.focusKey, false);
  /* a first layout settles off screen, so the world opens already shaped */
  if (fresh > g.nodes.length / 2) { tick(S.sim, S.still ? 320 : 100); if (S.still && !S.mini) { spreadIslands(S); S.sim.alpha = 0; } }
  if (reducedMotion()) { let n = 0; while (isHot(S.sim) && n++ < 600) tick(S.sim); }
  const now = performance.now(); S.born.clear(); S.tD = S.nD = null;
  if (!reducedMotion()) grow.forEach((k, j) => {
    const i = g.nodes.findIndex(n => n.key === k); if (i < 0) return; S.born.set(i, now + j * 110);
    for (const o of adj[i]) if (!g.nodes[o].read && !old.has(g.nodes[o].key)) S.born.set(o, now + j * 110 + 380 + Math.random() * 300);
  });
  S.labelOrder = g.nodes.map((n, i) => i).sort((a, b) => Number(g.nodes[b].read) - Number(g.nodes[a].read) || Number(!!g.nodes[b].saved) - Number(!!g.nodes[a].saved) || g.nodes[b].deg - g.nodes[a].deg || g.nodes[b].count - g.nodes[a].count);
  S.lastCenter = center;
  if (fit && !S.userMoved) frameView(S, center, !old.size || reducedMotion() || S.cw <= 1);
  wake(S);
}
/* a still map of separate islands (pages that don't link to each other) settles into a round
   clump; spread the islands sideways, each kept whole, until they fill the frame's shape */
function spreadIslands(S) {
  const { g, adj, cw, ch } = S;
  const comp = g.nodes.map(() => -1); let c = 0;
  for (let i = 0; i < g.nodes.length; i++) { if (comp[i] >= 0) continue; const st = [i]; comp[i] = c; while (st.length) { const j = st.pop(); for (const k of adj[j]) if (comp[k] < 0) { comp[k] = c; st.push(k); } } c++; }
  if (c < 3 || !cw || !ch) return;
  const cx = new Array(c).fill(0), cnt = new Array(c).fill(0); g.nodes.forEach((n, i) => { cx[comp[i]] += n.x; cnt[comp[i]]++; });
  const b = boundsOf(g.nodes); const have = (b.x1 - b.x0) / Math.max(1, b.y1 - b.y0);
  const sx = Math.min(2.4, Math.max(1, (cw / ch) / Math.max(.2, have)));
  g.nodes.forEach((n, i) => { n.x += (cx[comp[i]] / cnt[comp[i]]) * (sx - 1); });
}
/* ---------- the loop: runs only while something moves ---------- */
export function wake(S) { if (!S.raf && S.alive) S.raf = requestAnimationFrame(now => frame(S, now)); }
function frame(S, now) {
  S.raf = 0; if (!S.alive) return; let busy = false; const { sim } = S;
  if (sim && isHot(sim) && S.visible && !document.hidden) { tick(sim, 1); busy = true; }
  else if (sim && !isHot(sim) && !S.drag && now - S.lastSave > 1500) { S.lastSave = now; keepPositions(S); }
  if (moveCamera(S, now)) busy = true;
  for (const [i, t0] of S.born) if (now - t0 > 1100) S.born.delete(i);
  if (S.replay) { stepReplay(S, now); busy = true; }
  draw(S, now);
  /* the first trace, a newcomer's ping and a hovered topic's running links all need frames; asked after
     drawing, since the frame that first sees the map is the one that starts its trace */
  if (S.born.size || S.dashLive || (S.seenAt > 0 && now - S.seenAt < SPREAD + TRACE + 240)) busy = true;
  if (busy && S.visible && !document.hidden) wake(S);
}
function keepPositions(S) {
  if (!S.g.nodes.length) return;
  for (const n of S.g.nodes) setPos(S, n.key, [Math.round(n.x * 10) / 10, Math.round(n.y * 10) / 10]);
  if (!(S.pos instanceof Map)) save();
}

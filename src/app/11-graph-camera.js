/* ================= a graph view's camera: where it looks, and how it gets there =================
   The camera is a centre and a zoom (S.cam); a flight (S.camTo) eases it from one view to another, or jumps
   when motion is reduced. These read and change one map's state (S, made by makeGraph in 11-graph.js). */
import { fitView } from '../shared/graph.js';
import { kindOf } from './01-data.js';
import { reducedMotion } from './02-util.js';
import { wake } from './11-graph.js';
import { clamp01, easeOut } from './11-graph-paint.js';

export const kg = n => kindOf(n.kind) || 'concept';
export const radius = (S, n) => (n.read ? 2.6 + 1.05 * Math.sqrt(Math.min(n.deg, 30)) : 2.4) * (S.mini ? .9 : 1) * Math.max(.75, Math.min(1.5, Math.sqrt(S.cam.k)));
export const isShown = (S, i) => !S.hidden.has(kg(S.g.nodes[i]));
export const toScreen = (S, n) => [n.x * S.cam.k + S.cw / 2 - S.cam.x * S.cam.k, n.y * S.cam.k + S.ch / 2 - S.cam.y * S.cam.k];
export const toWorld = (S, sx, sy) => [(sx - S.cw / 2) / S.cam.k + S.cam.x, (sy - S.ch / 2) / S.cam.k + S.cam.y];
export function resize(S) {
  const r = S.host.getBoundingClientRect(); S.DPR = Math.min(2, devicePixelRatio || 1);
  const was = S.cw; S.cw = Math.max(1, Math.round(r.width)); S.ch = Math.max(1, Math.round(r.height));
  S.cv.width = Math.round(S.cw * S.DPR); S.cv.height = Math.round(S.ch * S.DPR); S.cv.style.width = `${S.cw}px`; S.cv.style.height = `${S.ch}px`;
  /* the first real size (a sidebar that just opened): frame the world now that there is room to */
  /* not while a name is landing: the title is on its way to where the map is now */
  if (!S.userMoved && !S.lift && S.g.nodes.length && (was <= 1 || !S.camTo)) frameView(S, S.lastCenter, true);
  wake(S);
}
/* the view: around a topic (the small map) or everything */
export function frameView(S, center = '', instant = false) {
  const { g, adj, mini, still, cw, ch } = S; let ns = g.nodes;
  if (center) { const i = g.nodes.findIndex(n => n.key === center); if (i >= 0 && mini) ns = [g.nodes[i], ...adj[i].map(j => g.nodes[j])]; }
  if (!ns.length) return;
  const v = fitView(ns, cw, ch, { pad: mini ? 26 : cw < 520 ? 22 : still ? 44 : 70, max: mini ? 1.6 : still ? 3 : 1.8, min: .12 });
  flyTo(S, v, instant);
}
/* a flight's own time: the map's recipe, named once here; whatever waits for the camera waits for it to land (afterFlight) */
const FLIGHT_MS = 650;
export function flyTo(S, v, instant) {
  const cam = S.cam;
  if (instant || reducedMotion() || !S.cw) { cam.x = v.x; cam.y = v.y; cam.k = v.k; S.camTo = null; landed(S); wake(S); return; }
  S.camTo = { from: { ...cam }, to: v, t0: performance.now(), dur: FLIGHT_MS }; wake(S);
}
/** fn runs once the camera is where it is going: now when it is still, or when the flight lands. A flight cut short (a
    drag, a wheel) never lands, so what waited for it doesn't happen; each caller checks it is still wanted. */
export function afterFlight(S, fn) { if (!S.camTo) { fn(); return; } (S.onLand = S.onLand || []).push(fn); }
function landed(S) { const fns = S.onLand || []; S.onLand = []; fns.forEach(f => f()); }
/* Focus: a topic and everything within two links of it; the rest fades */
export function setFocus(S, key, fly = true) {
  const { g, adj } = S;
  S.focusKey = key || ''; const i = g.nodes.findIndex(n => n.key === key);
  if (i < 0) { S.focusSet = null; S.focusKey = ''; wake(S); return; }
  const set = new Set([i]); for (const j of adj[i]) { set.add(j); for (const m of adj[j]) set.add(m); } S.focusSet = set;
  if (fly) flyTo(S, fitView([...set].map(j => g.nodes[j]), S.cw, S.ch, { pad: 70, max: 2, min: .12 }));
  wake(S);
}
/* one frame of a flight; true while it is still under way */
export function moveCamera(S, now) {
  const { cam, camTo } = S; if (!camTo) return false;
  const t = clamp01((now - camTo.t0) / camTo.dur); const e = easeOut(t); const f = camTo.from, to = camTo.to;
  cam.x = f.x + (to.x - f.x) * e; cam.y = f.y + (to.y - f.y) * e; cam.k = Math.exp(Math.log(f.k) + (Math.log(to.k) - Math.log(f.k)) * e);
  if (t >= 1) { S.camTo = null; landed(S); } return true;
}

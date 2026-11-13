/* ================= replay: a trail, walked again across your world =================
   A marker drives the trail like a car on a track, the camera following it; reduced motion shows the walk
   finished. Changes one map's state (S, made in 11-graph.js). */
import { fitView, nodeKeyOf } from '../shared/graph.js';
import { reducedMotion } from './02-util.js';
import { pageOf } from './04-pages.js';
import { wake } from './11-graph.js';
import { flyTo, frameView } from './11-graph-camera.js';

export function startReplay(S, pids) {
  const { g } = S;
  const idx = pids.map(pid => { const p = pageOf(pid); return p ? g.nodes.findIndex(n => n.key === nodeKeyOf(p)) : -1; }).filter(i => i >= 0).filter((i, j, a) => j === 0 || a[j - 1] !== i);
  if (!idx.length) return false;
  S.focusSet = null; S.focusKey = '';
  if (reducedMotion()) { S.replay = { idx, step: idx.length, at: idx[idx.length - 1], lit: new Set(idx), edges: new Set(idx.slice(1).map((b, j) => `${idx[j]},${b}`).concat(idx.slice(1).map((b, j) => `${b},${idx[j]}`))), t0: 0, per: 0, done: true }; frameView(S); wake(S); return true; }
  const per = Math.max(320, Math.min(900, 9000 / idx.length));
  S.replay = { idx, step: -1, at: -1, lit: new Set(), edges: new Set(), t0: performance.now(), per, done: false };
  wake(S); return true;
}
export function stepReplay(S, now) {
  const R = S.replay; if (R.done) return;
  const s = Math.floor((now - R.t0) / R.per);
  while (R.step < Math.min(s, R.idx.length - 1)) {
    R.step++; const i = R.idx[R.step]; R.at = i; R.lit.add(i);
    if (R.step > 0) { const a = R.idx[R.step - 1]; R.edges.add(`${a},${i}`); R.edges.add(`${i},${a}`); R.seg = { a, b: i, t0: now }; }
    const n = S.g.nodes[i]; flyTo(S, { x: n.x, y: n.y, k: Math.max(S.cam.k, 1.15) });
  }
  if (s >= R.idx.length + 1) { R.done = true; flyTo(S, fitView([...R.lit].map(i => S.g.nodes[i]), S.cw, S.ch, { pad: 70, max: 1.8, min: .12 })); }
}
export function stopReplay(S) { S.replay = null; wake(S); }

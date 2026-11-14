/* ================= a graph view by keyboard =================
   One tab stop per map. Focused, its corner brackets strengthen, the way an instrument says it is live (no
   glow ring round the canvas). Arrows move a selection from topic to topic by direction (keyStep, in
   src/shared/graph.js), Home goes back to where you are; the selection wears the reticle and shows the card
   pointing would, and each move is announced. Enter opens it, Escape clears it, a second Escape leaves the
   map; on a map that zooms, + and - zoom and 0 fits. Tab always leaves. While a map has focus only these
   keys are its own: every other shortcut works as before. Changes one map's state (S, made in 11-graph.js). */
import { keyStep } from '../shared/graph.js';
import { announce, reducedMotion } from './02-util.js';
import { wake } from './11-graph.js';
import { afterFlight, flyTo, frameView, isShown, toScreen } from './11-graph-camera.js';
import { hideTip, openNode, showTip } from './11-graph-card.js';

const OWN = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'Enter', 'Escape', '+', '=', '-', '0'];
/* what a move says, short: the topic, its kind, read or not, how many links */
function heard(S, i) {
  const n = S.g.nodes[i]; if (S.speak) return S.speak(n);
  const links = S.adj[i].length;
  return `${n.title}, ${n.kind || 'topic'}, ${n.read ? 'read' : 'not read yet'}, ${links} link${links === 1 ? '' : 's'}`;
}
/* the card, once the camera has landed */
function cardFor(S, i, flying) {
  if (!flying) { showTip(S, i, false); return; }
  hideTip(S); afterFlight(S, () => { if (S.kb === i && S.hover < 0) showTip(S, i, false); });
}
function choose(S, i) {
  if (i < 0) return;
  const moved = i !== S.kb; S.kb = i; S.hover = -1;
  /* the camera follows only when the selection would leave the view; a still map never pans */
  let flying = false;
  if (!S.still) {
    const [x, y] = toScreen(S, S.g.nodes[i]), m = Math.min(48, S.cw / 6, S.ch / 6);
    if (x < m || y < m || x > S.cw - m || y > S.ch - m) { const n = S.g.nodes[i]; flyTo(S, { x: n.x, y: n.y, k: S.cam.k }); flying = !reducedMotion(); }
  }
  cardFor(S, i, flying); wake(S);
  if (moved) announce(heard(S, i));
}
export function clearKey(S) { if (S.kb < 0) return; S.kb = -1; if (S.hover < 0) hideTip(S); wake(S); }
function zoom(S, f) {
  const k = Math.max(.12, Math.min(4, S.cam.k * f)); const n = S.kb >= 0 ? S.g.nodes[S.kb] : null;
  S.userMoved = true; flyTo(S, { x: n ? n.x : S.cam.x, y: n ? n.y : S.cam.y, k });
  if (S.kb >= 0) cardFor(S, S.kb, !reducedMotion());
}
export function listenKeys(S) {
  const { cv } = S;
  cv.tabIndex = 0; cv.setAttribute('role', 'application'); cv.setAttribute('aria-roledescription', 'map');
  cv.addEventListener('focus', () => { S.keyFocus = cv.matches(':focus-visible'); wake(S); });
  cv.addEventListener('blur', () => { S.keyFocus = false; clearKey(S); wake(S); });
  cv.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || !OWN.includes(e.key)) return;
    const zooms = !S.mini && !S.still;
    if (['+', '=', '-', '0'].includes(e.key) && !zooms) return;
    e.preventDefault(); e.stopPropagation();
    if (!S.keyFocus) { S.keyFocus = true; wake(S); }
    const { g, cam } = S;
    if (e.key === 'Enter') { if (S.kb >= 0) openNode(S, g.nodes[S.kb]); return; }
    if (e.key === 'Escape') { if (S.kb >= 0) clearKey(S); else cv.blur(); return; }
    if (e.key === '+' || e.key === '=') { zoom(S, 1.4); return; }
    if (e.key === '-') { zoom(S, 1 / 1.4); return; }
    if (e.key === '0') { frameView(S); if (S.kb >= 0) cardFor(S, S.kb, !reducedMotion()); return; }
    const k = cam.k, ox = S.cw / 2 - cam.x * k, oy = S.ch / 2 - cam.y * k;
    /** @type {[number, number][]} */ const P = g.nodes.map(n => [n.x * k + ox, n.y * k + oy]);
    const drawn = i => isShown(S, i) && (!S.focusSet || S.focusSet.has(i));
    choose(S, keyStep(g.nodes, P, S.kb, e.key, drawn));
  });
}

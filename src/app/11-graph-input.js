/* ================= a graph view by pointer: point, click, drag, pinch, wheel =================
   A still map (the front page's) never pans, zooms or drags, so a finger scrolls the page over it. Changes
   one map's state (S, made in 11-graph.js). */
import { wake } from './11-graph.js';
import { flyTo, isShown, radius, setFocus, toScreen, toWorld } from './11-graph-camera.js';
import { hideTip, openNode, showTip } from './11-graph-card.js';

export function hit(S, sx, sy) {
  let best = -1, bd = Infinity;
  for (let i = 0; i < S.g.nodes.length; i++) {
    if (!isShown(S, i)) continue; const [x, y] = toScreen(S, S.g.nodes[i]); const d = Math.hypot(x - sx, y - sy); const r = radius(S, S.g.nodes[i]) + (matchMedia('(pointer: coarse)').matches ? 12 : 6);
    if (d < r && d < bd) { bd = d; best = i; }
  }
  return best;
}
export function listenPointer(S) {
  const { cv, mini, still, cam, pointers } = S;
  const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId); const [sx, sy] = local(e); pointers.set(e.pointerId, [sx, sy]);
    if (pointers.size === 2 && !mini && !still) { const [[x1, y1], [x2, y2]] = [...pointers.values()]; S.pinch = { d: Math.hypot(x2 - x1, y2 - y1), k: cam.k, c: toWorld(S, (x1 + x2) / 2, (y1 + y2) / 2) }; S.drag = null; return; }
    const i = hit(S, sx, sy); S.camTo = null;
    S.drag = i >= 0 ? { node: i, sx, sy, moved: false, shift: e.shiftKey || e.altKey } : still ? { sx, sy, moved: false } : { pan: true, sx, sy, cx: cam.x, cy: cam.y, moved: false };
  });
  cv.addEventListener('pointermove', e => {
    const [sx, sy] = local(e); const { pinch, drag } = S;
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [sx, sy]);
    if (pinch && pointers.size === 2) {
      const [[x1, y1], [x2, y2]] = [...pointers.values()]; const d = Math.hypot(x2 - x1, y2 - y1);
      cam.k = Math.max(.12, Math.min(4, pinch.k * d / Math.max(1, pinch.d))); const [wx, wy] = toWorld(S, (x1 + x2) / 2, (y1 + y2) / 2);
      cam.x += pinch.c[0] - wx; cam.y += pinch.c[1] - wy; S.userMoved = true; wake(S); return;
    }
    if (drag) {
      if (!drag.moved && Math.hypot(sx - drag.sx, sy - drag.sy) > 4) { drag.moved = true; hideTip(S); }
      if (!drag.moved || still) return;
      if (drag.pan) { cam.x = drag.cx - (sx - drag.sx) / cam.k; cam.y = drag.cy - (sy - drag.sy) / cam.k; S.userMoved = true; wake(S); }
      else { const n = S.g.nodes[drag.node]; const [wx, wy] = toWorld(S, sx, sy); n.fx = wx; n.fy = wy; S.sim.alphaTarget = .25; if (S.sim.alpha < .25) S.sim.alpha = .25; wake(S); }
      return;
    }
    if (e.pointerType === 'mouse') { const i = hit(S, sx, sy); if (i !== S.hover) { S.hover = i; cv.style.cursor = i >= 0 ? 'pointer' : still ? 'default' : 'grab'; showTip(S, i, false); wake(S); } }
  });
  const end = e => {
    pointers.delete(e.pointerId); if (S.pinch) { if (pointers.size < 2) S.pinch = null; return; }
    const d = S.drag; S.drag = null; if (!d) return;
    if (d.node != null && !still) { const n = S.g.nodes[d.node]; n.fx = n.fy = null; S.sim.alphaTarget = 0; }
    if (d.moved) { wake(S); return; }
    /* a tap or click on a topic */
    if (d.node != null) {
      const touch = e.pointerType !== 'mouse';
      if (d.shift && !mini && !still) { setFocus(S, S.g.nodes[d.node].key); return; }
      if (touch && !mini && S.sel !== d.node) { S.sel = d.node; showTip(S, d.node, true); wake(S); return; }
      openNode(S, S.g.nodes[d.node]); return;
    }
    if (S.sel >= 0) { S.sel = -1; hideTip(S); wake(S); }
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', () => { if (S.hover >= 0 && !S.drag) { S.hover = -1; hideTip(S); wake(S); } });
  if (!mini && !still) {
    cv.addEventListener('wheel', e => {
      e.preventDefault(); S.camTo = null; const [sx, sy] = local(e); const [wx, wy] = toWorld(S, sx, sy);
      cam.k = Math.max(.12, Math.min(4, cam.k * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0018))));
      const [nx, ny] = toWorld(S, sx, sy); cam.x += wx - nx; cam.y += wy - ny; S.userMoved = true; wake(S);
    }, { passive: false });
    cv.addEventListener('dblclick', e => { const [sx, sy] = local(e); const [wx, wy] = toWorld(S, sx, sy); flyTo(S, { x: wx, y: wy, k: Math.min(4, cam.k * 1.8) }); S.userMoved = true; });
  }
}

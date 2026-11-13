/* ================= a picture of your world, to keep or share: the same drawing, at print size =================
   Its own frame (2400 by 1500) and its own radius for a topic, scaled for print; it borrows the map's grid,
   rings and names. Reads one map's state (S, made in 11-graph.js) and leaves it as it was. */
import { clip } from '../shared/article.js';
import { fitView } from '../shared/graph.js';
import { kg } from './11-graph-camera.js';
import { disc, grid, ring, spaced, tag, unspaced } from './11-graph-paint.js';

export function picture(S, { title = 'My world', sub = '' } = {}) {
  const { g, labelOrder } = S;
  const Wd = 2400, Ht = 1500, u = 2.2; const c = document.createElement('canvas'); c.width = Wd; c.height = Ht; const x = c.getContext('2d');
  const { dark, ink, base, kinds } = S.colors; const keep = S.colors.stage; S.colors.stage = base;
  x.fillStyle = base; x.fillRect(0, 0, Wd, Ht);
  const v = fitView(g.nodes, Wd, Ht - 240, { pad: 150, max: 2.4, min: .05 }); const k = v.k, ox = Wd / 2 - v.x * k, oy = (Ht - 240) / 2 - v.y * k + 50;
  grid(S, x, Wd, Ht, k, ox, oy, 1, u);
  /** @type {[number, number][]} */ const P = g.nodes.map(n => [n.x * k + ox, n.y * k + oy]); const R = n => (n.read ? 2.6 + 1.05 * Math.sqrt(Math.min(n.deg, 30)) : 2.4) * u * 1.25;
  x.lineCap = 'round';
  for (const e of g.edges) { x.globalAlpha = e.unread ? .17 : e.move ? .55 : .3; x.strokeStyle = ink; x.lineWidth = (e.move ? 1.1 : .85) * u; x.beginPath(); x.moveTo(...P[e.a]); x.lineTo(...P[e.b]); x.stroke(); }
  g.nodes.forEach((n, i) => {
    const [px, py] = P[i], r = R(n), hex = kinds[kg(n)]; x.strokeStyle = hex; x.lineWidth = u;
    if (n.read) { x.globalAlpha = 1; x.fillStyle = hex; disc(x, px, py, r); x.globalAlpha = dark ? .55 : .5; ring(x, px, py, r + 2.5 * u); }
    else { x.globalAlpha = 1; x.fillStyle = base; disc(x, px, py, r); x.globalAlpha = dark ? .85 : .75; ring(x, px, py, r); }
  });
  const fs = 22; x.font = `600 ${fs}px Inter, system-ui, sans-serif`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.lineJoin = 'round'; spaced(x);
  const placed = [];
  for (const i of labelOrder) { const n = g.nodes[i]; if (!n.read) continue; const t = clip(n.title, 30).toUpperCase(); tag(S, x, t, x.measureText(t).width, fs, P[i][0], P[i][1], R(n), [[1, -1], [1, 1], [-1, -1], [-1, 1]], placed, u, 1, true, Wd, Ht); }
  unspaced(x); S.colors.stage = keep;
  x.globalAlpha = 1; x.textBaseline = 'alphabetic';
  x.fillStyle = ink; x.font = '700 56px Inter, system-ui, sans-serif'; x.fillText(title, 110, Ht - 120);
  x.fillStyle = dark ? '#A3A7AE' : '#5E636B'; x.font = '500 30px Inter, system-ui, sans-serif'; x.fillText(sub, 110, Ht - 70);
  x.textAlign = 'right'; x.fillStyle = ink; x.font = '900 52px Doto, ui-monospace, monospace'; x.fillText('dorkhub', Wd - 110, Ht - 72);
  return new Promise(res => c.toBlob(res, 'image/png'));
}

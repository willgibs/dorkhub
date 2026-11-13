/* ================= a graph view, painted =================
   Drawn like an instrument, not a light show: hairlines on a faint grid. A topic you've read is a solid dot
   in its kind's colour with a ring set off it, sized by how connected it is; the topics they link to that you
   haven't read are fine hollow circles, invitations. Names sit in small capitals off a short leader line.
   Colour is only ever a topic's kind. Everything here reads one map's state (S, made by makeGraph in
   11-graph.js) and draws it; nothing here keeps state of its own. */
import { clip } from '../shared/article.js';
import { KIND_HEX } from './01-data.js';
import { isDark, reducedMotion } from './02-util.js';
import { isShown, kg, radius } from './11-graph-camera.js';
export const easeOut = t => 1 - Math.pow(1 - t, 3);
const easePop = t => { const c1 = 1.70158 * 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const clamp01 = v => Math.max(0, Math.min(1, v));
export const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/* Math.PI * 2, as a literal: a module works nothing out when it loads */
const TAU = 6.283185307179586;
export const TRACE = 420, SPREAD = 520;   // a link traces in over TRACE ms; the farthest starts SPREAD ms after the nearest

export function themeColors(S) {
  const cs = getComputedStyle(document.documentElement); const dark = isDark();
  const ink = cs.getPropertyValue('--ink').trim() || (dark ? '#ECECEE' : '#18181B'), base = cs.getPropertyValue('--base').trim() || (dark ? '#050506' : '#FCFCFB');
  /* what the canvas sits on, so a hollow circle can hide the hairline behind it */
  let stage = getComputedStyle(S.host).backgroundColor; if (!stage || /^(transparent|rgba\(0, 0, 0, 0\))$/.test(stage)) stage = base;
  S.colors = { dark, ink, base, stage, kinds: dark ? KIND_HEX.dark : KIND_HEX.light };
}
/* the first time the map is seen, each link traces out from its end nearer the middle, nearest first */
function planTrace(S, P) {
  const { cw, ch } = S;
  const far = Math.max(1, ...P.map(([x, y]) => Math.hypot(x - cw / 2, y - ch / 2)));
  S.nD = P.map(([x, y]) => Math.hypot(x - cw / 2, y - ch / 2) / far * SPREAD);
  S.tD = S.g.edges.map(e => ({ at: Math.min(S.nD[e.a], S.nD[e.b]), fromA: S.nD[e.a] <= S.nD[e.b] }));
}
/* a faint grid that moves with the map, crosses where its lines meet, and brackets at the corners: longer
   and at full strength while the map has the keyboard, the way an instrument says it is live */
export function grid(S, c, W, H, k, ox, oy, hair, u, live = false) {
  const { dark, ink } = S.colors; let sp = 64 * k; while (sp < 40 * u) sp *= 2; while (sp > 150 * u) sp /= 2;
  const x0 = ((ox % sp) + sp) % sp, y0 = ((oy % sp) + sp) % sp;
  c.strokeStyle = ink; c.lineWidth = hair; c.globalAlpha = dark ? .05 : .06; c.beginPath();
  for (let x = x0; x < W; x += sp) { c.moveTo(x, 0); c.lineTo(x, H); }
  for (let y = y0; y < H; y += sp) { c.moveTo(0, y); c.lineTo(W, y); }
  c.stroke(); c.globalAlpha = dark ? .2 : .22; c.beginPath(); const a = 2.5 * u;
  for (let x = x0; x < W; x += sp) for (let y = y0; y < H; y += sp) { c.moveTo(x - a, y); c.lineTo(x + a, y); c.moveTo(x, y - a); c.lineTo(x, y + a); }
  c.stroke(); const m = 9 * u, l = (live ? 18 : 12) * u; c.globalAlpha = live ? 1 : dark ? .38 : .34; c.lineWidth = (live ? 1.5 : 1) * u; c.beginPath();
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { c.moveTo(x, y + sy * l); c.lineTo(x, y); c.lineTo(x + sx * l, y); }
  c.stroke();
}
export const ring = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); };
export const disc = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
/* where you are: a ring with four ticks, like a sight */
function reticle(c, x, y, r, u) { ring(c, x, y, r); c.beginPath(); for (let q = 0; q < 4; q++) { const ax = Math.cos(q * TAU / 4), ay = Math.sin(q * TAU / 4); c.moveTo(x + ax * (r + 2 * u), y + ay * (r + 2 * u)); c.lineTo(x + ax * (r + 5.5 * u), y + ay * (r + 5.5 * u)); } c.stroke(); }
/* a name in small capitals off a short leader line: up and right first, then the other corners */
export function tag(S, c, text, w, fs, cx, cy, r, dirs, placed, u, fa, strong, W, H, col = S.colors.ink, reach = 1) {
  const { ink, stage } = S.colors; const lead = 6 * u * reach, tick = 5 * u, pad = 3 * u;
  for (const [dx, dy] of dirs) {
    const sx = cx + dx * (r + 1.5 * u) * .7071, sy = cy + dy * (r + 1.5 * u) * .7071;
    const mx = sx + dx * lead, my = sy + dy * lead, ex = mx + dx * tick, tx = dx > 0 ? ex + pad : ex - pad - w;
    const box = [Math.min(tx, cx) - 2 * u, my - fs * .7 - 2 * u, Math.max(tx + w, cx) + 2 * u, my + fs * .7 + 2 * u];
    if (box[0] < 4 * u || box[2] > W - 4 * u || box[1] < 2 * u || box[3] > H - 2 * u || placed.some(b => b[0] < box[2] && box[0] < b[2] && b[1] < box[3] && box[1] < b[3])) continue;
    placed.push(box);
    c.globalAlpha = fa * .45; c.strokeStyle = ink; c.lineWidth = .9 * u; c.beginPath(); c.moveTo(sx, sy); c.lineTo(mx, my); c.lineTo(ex, my); c.stroke();
    c.globalAlpha = fa; c.lineWidth = 3 * u; c.strokeStyle = stage; c.strokeText(text, tx, my);
    c.globalAlpha = fa * (strong ? .95 : .68); c.fillStyle = col; c.fillText(text, tx, my);
    return true;
  }
  return false;
}
export const spaced = c => { if ('letterSpacing' in c) /** @type {any} */ (c).letterSpacing = '0.07em'; };
export const unspaced = c => { if ('letterSpacing' in c) /** @type {any} */ (c).letterSpacing = '0px'; };
export function draw(S, now) {
  const { ctx, cw, ch, DPR, g, cam, adj, born, replay, hover, sel, kb, focusSet, focusKey, mini, still, widths, labelOrder } = S;
  if (!cw) return; const { dark, ink, stage, kinds } = S.colors;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, cw, ch);
  const N = g.nodes; const k = cam.k, ox = cw / 2 - cam.x * k, oy = ch / 2 - cam.y * k;
  const P = N.map(n => [n.x * k + ox, n.y * k + oy]);
  grid(S, ctx, cw, ch, k, ox, oy, 1 / DPR, 1, S.keyFocus);
  if (!S.seenAt) { if (!S.visible || !N.length || S.held) return; S.seenAt = reducedMotion() ? -1e9 : now; if (S.seenAt > 0) planTrace(S, P); }
  const since = now - S.seenAt; const tD = S.tD, nD = S.nD;
  const hi = hover >= 0 ? hover : sel >= 0 ? sel : kb; const nb = hi >= 0 ? new Set([hi, ...adj[hi]]) : null;
  const trailSet = replay ? replay.lit : null;
  const dimOf = i => (focusSet && !focusSet.has(i) ? .1 : 1) * (nb && !nb.has(i) ? .15 : 1) * (trailSet && !trailSet.has(i) ? .3 : 1);
  const bornA = i => { const t0 = born.get(i); return t0 == null ? 1 : clamp01((now - t0) / 500); };
  const bornS = i => { const t0 = born.get(i); if (t0 == null) return 1; const t = clamp01((now - t0) / 700); return N[i].read ? Math.max(0, easePop(t)) : t; };
  const tickIn = i => (nD ? clamp01((since - nD[i]) / 220) : 1);
  const seg = replay && !replay.done && replay.seg ? replay.seg : null; const segQ = seg ? easeInOut(clamp01((now - seg.t0) / (replay.per * .75))) : 1;
  /* links: hairlines; the moves you made a little stronger, with a chevron the way you went */
  ctx.lineCap = 'round'; S.dashLive = false;
  g.edges.forEach((e, j) => {
    if (!isShown(S, e.a) || !isShown(S, e.b)) return;
    let p = 1, fromA = true; const ba = born.get(e.a), bb = born.get(e.b);
    if (ba != null || bb != null) { p = clamp01((now - Math.max(ba ?? 0, bb ?? 0) - 150) / 500); fromA = ba != null && (bb == null || ba >= bb); }
    else if (tD && tD[j]) { p = clamp01((since - tD[j].at) / TRACE); fromA = tD[j].fromA; }
    if (p <= 0) return;
    const lit = nb && (e.a === hi || e.b === hi); const trail = trailSet && replay.edges.has(`${e.a},${e.b}`);
    let al = e.unread ? (dark ? .17 : .14) : e.move ? (dark ? .55 : .48) : (dark ? .3 : .26), col = ink, w = e.move ? 1.1 : e.unread ? .7 : .85;
    if (lit) { al = dark ? .5 : .44; col = kinds[kg(N[e.a === hi ? e.b : e.a])]; w = 1; } else al *= Math.min(dimOf(e.a), dimOf(e.b));
    if (trail) { al = .95; col = kinds[kg(N[e.b])]; w = 1.6; }
    al *= Math.min(bornA(e.a), bornA(e.b)); if (al < .01) return;
    let [x1, y1] = P[fromA ? e.a : e.b], [x2, y2] = P[fromA ? e.b : e.a];
    /* the segment Replay is driving draws only as far as its marker */
    if (trail && seg && ((seg.a === e.a && seg.b === e.b) || (seg.a === e.b && seg.b === e.a))) { [x1, y1] = P[seg.a]; [x2, y2] = P[seg.b]; p = segQ; }
    ctx.globalAlpha = al; ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p); ctx.stroke();
    if (p < 1) return;
    /* a pointed-at topic's links run, a dash flowing out from it, only while it is pointed at */
    if (lit && !reducedMotion()) {
      const [hx, hy] = P[hi], [fx, fy] = P[e.a === hi ? e.b : e.a];
      ctx.globalAlpha = dark ? .95 : .85; ctx.lineWidth = 1.3; ctx.setLineDash([2.5, 7.5]); ctx.lineDashOffset = -now / 26;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(fx, fy); ctx.stroke(); ctx.setLineDash([]); S.dashLive = true;
    }
    if (e.move && e.from != null && !lit && !trail) {
      const [sx, sy] = P[e.from], [tx, ty] = P[e.from === e.a ? e.b : e.a]; const L = Math.hypot(tx - sx, ty - sy); if (L < 28) return;
      const ux = (tx - sx) / L, uy = (ty - sy) / L, mx = (sx + tx) / 2, my = (sy + ty) / 2;
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mx - ux * 2.5 - uy * 3, my - uy * 2.5 + ux * 3); ctx.lineTo(mx + ux * 1.5, my + uy * 1.5); ctx.lineTo(mx - ux * 2.5 + uy * 3, my - uy * 2.5 - ux * 3); ctx.stroke();
    }
  });
  /* the topics: a solid dot ringed if you've read it, a fine hollow circle if it is an invitation */
  for (let i = 0; i < N.length; i++) {
    const n = N[i]; if (!isShown(S, i)) continue; const [x, y] = P[i]; const r = radius(S, n) * bornS(i);
    if (x < -30 || y < -30 || x > cw + 30 || y > ch + 30 || r <= 0) continue;
    const hex = kinds[kg(n)]; const al = dimOf(i) * bornA(i) * tickIn(i); if (al < .01) continue;
    ctx.lineWidth = 1; ctx.strokeStyle = hex;
    if (n.read) {
      ctx.globalAlpha = al; ctx.fillStyle = hex; disc(ctx, x, y, r);
      ctx.globalAlpha = al * (dark ? .55 : .5); ring(ctx, x, y, r + 2.5);
      if (n.saved) { ctx.globalAlpha = al * .85; ring(ctx, x, y, r + 5.5); }
    } else { ctx.globalAlpha = al; ctx.fillStyle = stage; disc(ctx, x, y, r); ctx.globalAlpha = al * (dark ? .85 : .75); ring(ctx, x, y, r); }
    if (n.cur || (replay && replay.at === i && !seg)) { ctx.globalAlpha = .9 * al; ctx.strokeStyle = ink; reticle(ctx, x, y, r + 6, 1); }
    if (i === sel) { ctx.globalAlpha = .9; ctx.strokeStyle = hex; ctx.lineWidth = 1.5; ring(ctx, x, y, r + 8.5); }
    /* the keyboard's selection wears the sight too, in its kind's colour, outside where-you-are's */
    if (i === kb) { ctx.globalAlpha = 1; ctx.strokeStyle = hex; ctx.lineWidth = 1.5; reticle(ctx, x, y, r + (n.cur ? 13 : 6), 1); }
    /* a newcomer pings once, like a radar return */
    const t0 = born.get(i); if (t0 != null && now > t0) { const t = clamp01((now - t0) / 900); ctx.globalAlpha = (1 - t) * .8; ctx.strokeStyle = hex; ctx.lineWidth = 1; ring(ctx, x, y, r + 3 + easeOut(t) * 24); }
  }
  /* Replay drives a marker along the trail, like a car on a track */
  if (seg) {
    const [ax, ay] = P[seg.a], [bx, by] = P[seg.b]; const mx = ax + (bx - ax) * segQ, my = ay + (by - ay) * segQ;
    ctx.globalAlpha = 1; ctx.fillStyle = ink; disc(ctx, mx, my, 3.2); ctx.strokeStyle = kinds[kg(N[seg.b])]; ctx.lineWidth = 1.5; ring(ctx, mx, my, 6.5);
  }
  /* names: the busiest and nearest first, never on top of one another, fading in as you zoom */
  const fs = mini || cw < 520 ? 10 : 10.5;
  ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; spaced(ctx);
  const placed = []; const order = []; const fi = focusKey ? N.findIndex(n => n.key === focusKey) : -1;
  for (const i of [hi, sel, kb, fi, ...N.map((n, i) => (n.cur ? i : -1)), ...(nb ? [...nb] : []), ...(replay ? [replay.at] : [])]) if (i >= 0 && !order.includes(i)) order.push(i);
  /* names still in view claim their space before the faded ones */
  for (const i of labelOrder) if (!order.includes(i) && dimOf(i) > .5) order.push(i);
  for (const i of labelOrder) if (!order.includes(i)) order.push(i);
  /* a small screen names fewer topics until you zoom in */
  const small = cw < 520; const readFade = mini ? 1 : clamp01((k - (small ? .75 : .45)) / .35), loneFade = clamp01((k - (mini ? 1.6 : small ? 1.6 : 1.25)) / .4);
  /* a pointed-at topic's threads say why, tagged at their middles in the colour of where they lead: after
     the names of the topic and its neighbours, before the faded names, which make room for them */
  let threadsDue = !!nb && g.edges.some(e => e.label);
  const threadTags = () => {
    threadsDue = false; unspaced(ctx); const tf = fs + .5; ctx.font = `500 ${tf}px Inter, system-ui, sans-serif`;
    for (const e of g.edges) {
      if (!e.label || (e.a !== hi && e.b !== hi)) continue;
      const o = e.a === hi ? e.b : e.a, [x1, y1] = P[hi], [x2, y2] = P[o], mx = (x1 + x2) / 2, my = (y1 + y2) / 2, col = kinds[kg(N[o])];
      const wk = `t${tf}|${e.label}`; let w = widths.get(wk); if (w == null) { w = ctx.measureText(e.label).width; widths.set(wk, w); }
      for (const reach of [1, 2.4, 3.8]) if (tag(S, ctx, e.label, w, tf, mx, my, 2.5, [[1, -1], [-1, -1], [1, 1], [-1, 1]], placed, 1, 1, true, cw, ch, col, reach)) { ctx.globalAlpha = 1; ctx.fillStyle = col; disc(ctx, mx, my, 2.5); break; }
    }
    ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`; spaced(ctx);
  };
  let drawn = 0;
  for (const i of order) {
    const n = N[i]; if (!isShown(S, i)) continue; const special = i === hi || i === sel || i === kb || i === fi || n.cur || (nb && nb.has(i)) || (replay && replay.at === i);
    if (threadsDue && !special) threadTags();
    let fa = special ? 1 : n.read ? (still ? .9 : mini ? (n.deg >= 2 ? .85 : 0) : Math.max(readFade, n.deg >= (small ? 12 : 6) ? .9 : 0)) : loneFade * .8;
    fa *= (special ? 1 : dimOf(i)) * bornA(i) * tickIn(i); if (fa < .05) continue;
    const [cx, cy] = P[i], r = radius(S, n) * bornS(i); if (cx < -100 || cy < -20 || cx > cw + 100 || cy > ch + 20) continue;
    const text = clip(n.title || n.key, mini ? 22 : 30).toUpperCase(); const wk = `${fs}|${text}`; let w = widths.get(wk); if (w == null) { w = ctx.measureText(text).width; widths.set(wk, w); }
    const dirs = n.read || special ? [[1, -1], [1, 1], [-1, -1], [-1, 1]] : [[1, -1], [-1, -1]];
    if (tag(S, ctx, text, w, fs, cx, cy, r, dirs, placed, 1, fa, n.read || special, cw, ch) && ++drawn > (mini ? 40 : 260)) break;
  }
  unspaced(ctx);
  if (threadsDue) { threadTags(); unspaced(ctx); }
  /* how close you are, in the corner, on the full map */
  if (!mini && !still) { ctx.globalAlpha = dark ? .5 : .55; ctx.fillStyle = ink; ctx.font = '600 10px Inter, system-ui, sans-serif'; spaced(ctx); ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillText(`ZOOM ${k.toFixed(2)}×`, cw - 16, ch - 14); unspaced(ctx); ctx.textAlign = 'left'; }
  ctx.globalAlpha = 1;
}

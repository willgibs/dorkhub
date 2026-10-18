/* ================= Your world: the graph of everything you've read =================
   Drawn like an instrument, not a light show: hairlines on a faint grid. A topic you've read is a
   solid dot in its kind's colour with a ring set off it, sized by how connected it is; the topics they
   link to that you haven't read are fine hollow circles, invitations. Names sit in small capitals off a
   short leader line. Colour is only ever a topic's kind. The layout is a small force simulation
   (src/shared/graph.js) that runs only while something is moving, then stops: no idle motion. Links
   trace in the first time a map is seen. The same view draws the small map beside a page, the full
   page at /world and the map on the front page. */
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easePop = t => { const c1 = 1.70158 * 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const clamp01 = v => Math.max(0, Math.min(1, v));
const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const TAU = Math.PI * 2;

/**
 * A graph view on a host element. mini: the small map beside a page (no wheel zoom, no tools).
 * still: a map inside a scrolling page (the front page): it never pans, zooms or drags, so a finger
 * scrolls the page over it; a topic is opened by a click, or on a phone by a tap on its card.
 * describe and open replace the card's status line and what opening a topic does; panel, given, takes the
 * card's place entirely (the front page's map shows a pointed-at topic beside the map, not over it).
 * hold: its first trace waits for play() (the front page's map takes its turn among the cards).
 * @param {HTMLElement} host @param {{ mini?: boolean, still?: boolean, hold?: boolean, positions?: Record<string, [number, number]> | Map<string, [number, number]>, describe?: (n: any) => string, open?: (n: any) => void, panel?: (n: any, actions: boolean) => void }} [o]
 */
function makeGraph(host, { mini = false, still = false, hold = false, positions = null, describe = null, open = null, panel = null } = {}) {
  const cv = document.createElement('canvas'); cv.className = 'gv-canvas'; host.appendChild(cv);
  const tip = document.createElement('div'); tip.className = 'gv-tip'; tip.hidden = true; host.appendChild(tip);
  const ctx = cv.getContext('2d');
  let cw = 0, ch = 0, DPR = 1, raf = 0, visible = typeof IntersectionObserver !== 'function', alive = true, held = hold;
  /** @type {{ nodes: any[], edges: any[] }} */ let g = { nodes: [], edges: [] }; let sim = null; let adj = [];
  const cam = { x: 0, y: 0, k: 1 }; let camTo = null;
  let hover = -1, sel = -1, drag = null, focusSet = null, focusKey = '', replay = null;
  /** @type {Set<string>} */ let hidden = new Set();   // kind groups switched off
  const born = new Map();   // node index -> when it appeared (growth moments)
  let colors = null, labelOrder = [], userMoved = false;
  const widths = new Map();
  const pos = positions || store.pos;
  const getPos = k => (pos instanceof Map ? pos.get(k) : pos[k]);
  const setPos = (k, v) => { if (pos instanceof Map) pos.set(k, v); else pos[k] = v; };
  function themeColors() {
    const cs = getComputedStyle(document.documentElement); const dark = isDark();
    const ink = cs.getPropertyValue('--ink').trim() || (dark ? '#ECECEE' : '#18181B'), base = cs.getPropertyValue('--base').trim() || (dark ? '#050506' : '#FCFCFB');
    /* what the canvas sits on, so a hollow circle can hide the hairline behind it */
    let stage = getComputedStyle(host).backgroundColor; if (!stage || /^(transparent|rgba\(0, 0, 0, 0\))$/.test(stage)) stage = base;
    colors = { dark, ink, base, stage, kinds: dark ? KIND_HEX.dark : KIND_HEX.light };
  }
  themeColors();
  const kg = n => kindOf(n.kind) || 'concept';
  const radius = n => (n.read ? 2.6 + 1.05 * Math.sqrt(Math.min(n.deg, 30)) : 2.4) * (mini ? .9 : 1) * Math.max(.75, Math.min(1.5, Math.sqrt(cam.k)));
  const isShown = i => !hidden.has(kg(g.nodes[i]));
  const toScreen = n => [n.x * cam.k + cw / 2 - cam.x * cam.k, n.y * cam.k + ch / 2 - cam.y * cam.k];
  const toWorld = (sx, sy) => [(sx - cw / 2) / cam.k + cam.x, (sy - ch / 2) / cam.k + cam.y];
  let lastCenter = '';
  function resize() {
    const r = host.getBoundingClientRect(); DPR = Math.min(2, devicePixelRatio || 1);
    const was = cw; cw = Math.max(1, Math.round(r.width)); ch = Math.max(1, Math.round(r.height));
    cv.width = Math.round(cw * DPR); cv.height = Math.round(ch * DPR); cv.style.width = `${cw}px`; cv.style.height = `${ch}px`;
    /* the first real size (a sidebar that just opened): frame the world now that there is room to */
    if (!userMoved && g.nodes.length && (was <= 1 || !camTo)) frameView(lastCenter, true);
    wake();
  }
  /* ---------- data ---------- */
  function setData(next, { center = '', grow = [], fit = true } = {}) {
    const old = new Map(g.nodes.map(n => [n.key, n]));
    const seeds = {};
    for (const n of next.nodes) { const o = old.get(n.key); const p = o ? [o.x, o.y] : getPos(n.key); if (p) seeds[n.key] = p; }
    const fresh = next.nodes.filter(n => !seeds[n.key]).length;
    sim = createSim(next, { pos: seeds, alpha: !next.nodes.length ? 0 : fresh === next.nodes.length ? 1 : fresh || grow.length ? .32 : 0 });
    g = next; adj = g.nodes.map(() => []); for (const e of g.edges) { adj[e.a].push(e.b); adj[e.b].push(e.a); }
    hover = -1; sel = -1; if (focusKey) setFocus(focusKey, false);
    /* a first layout settles off screen, so the world opens already shaped */
    if (fresh > g.nodes.length / 2) { tick(sim, still ? 320 : 100); if (still && !mini) { spreadIslands(); sim.alpha = 0; } }
    if (reducedMotion()) { let n = 0; while (isHot(sim) && n++ < 600) tick(sim); }
    const now = performance.now(); born.clear(); tD = nD = null;
    if (!reducedMotion()) grow.forEach((k, j) => {
      const i = g.nodes.findIndex(n => n.key === k); if (i < 0) return; born.set(i, now + j * 110);
      for (const o of adj[i]) if (!g.nodes[o].read && !old.has(g.nodes[o].key)) born.set(o, now + j * 110 + 380 + Math.random() * 300);
    });
    labelOrder = g.nodes.map((n, i) => i).sort((a, b) => Number(g.nodes[b].read) - Number(g.nodes[a].read) || Number(!!g.nodes[b].saved) - Number(!!g.nodes[a].saved) || g.nodes[b].deg - g.nodes[a].deg || g.nodes[b].count - g.nodes[a].count);
    lastCenter = center;
    if (fit && !userMoved) frameView(center, !old.size || reducedMotion() || cw <= 1);
    wake();
  }
  /* a still map of separate islands (pages that don't link to each other) settles into a round
     clump; spread the islands sideways, each kept whole, until they fill the frame's shape */
  function spreadIslands() {
    const comp = g.nodes.map(() => -1); let c = 0;
    for (let i = 0; i < g.nodes.length; i++) { if (comp[i] >= 0) continue; const st = [i]; comp[i] = c; while (st.length) { const j = st.pop(); for (const k of adj[j]) if (comp[k] < 0) { comp[k] = c; st.push(k); } } c++; }
    if (c < 3 || !cw || !ch) return;
    const cx = new Array(c).fill(0), cnt = new Array(c).fill(0); g.nodes.forEach((n, i) => { cx[comp[i]] += n.x; cnt[comp[i]]++; });
    const b = boundsOf(g.nodes); const have = (b.x1 - b.x0) / Math.max(1, b.y1 - b.y0);
    const sx = Math.min(2.4, Math.max(1, (cw / ch) / Math.max(.2, have)));
    g.nodes.forEach((n, i) => { n.x += (cx[comp[i]] / cnt[comp[i]]) * (sx - 1); });
  }
  /* the view: around a topic (the small map) or everything */
  function frameView(center = '', instant = false) {
    let ns = g.nodes;
    if (center) { const i = g.nodes.findIndex(n => n.key === center); if (i >= 0 && mini) ns = [g.nodes[i], ...adj[i].map(j => g.nodes[j])]; }
    if (!ns.length) return;
    const v = fitView(ns, cw, ch, { pad: mini ? 26 : cw < 520 ? 22 : still ? 44 : 70, max: mini ? 1.6 : still ? 3 : 1.8, min: .12 });
    flyTo(v, instant);
  }
  function flyTo(v, instant) {
    if (instant || reducedMotion() || !cw) { cam.x = v.x; cam.y = v.y; cam.k = v.k; camTo = null; wake(); return; }
    camTo = { from: { ...cam }, to: v, t0: performance.now(), dur: 650 }; wake();
  }
  function setFocus(key, fly = true) {
    focusKey = key || ''; const i = g.nodes.findIndex(n => n.key === key);
    if (i < 0) { focusSet = null; focusKey = ''; wake(); return; }
    focusSet = new Set([i]); for (const j of adj[i]) { focusSet.add(j); for (const m of adj[j]) focusSet.add(m); }
    if (fly) flyTo(fitView([...focusSet].map(j => g.nodes[j]), cw, ch, { pad: 70, max: 2, min: .12 }));
    wake();
  }
  /* ---------- the loop: runs only while something moves ---------- */
  function wake() { if (!raf && alive) raf = requestAnimationFrame(frame); }
  let lastSave = 0;
  function frame(now) {
    raf = 0; if (!alive) return; let busy = false;
    if (sim && isHot(sim) && visible && !document.hidden) { tick(sim, 1); busy = true; }
    else if (sim && !isHot(sim) && !drag && now - lastSave > 1500) { lastSave = now; keepPositions(); }
    if (camTo) {
      const t = clamp01((now - camTo.t0) / camTo.dur); const e = easeOut(t); const f = camTo.from, to = camTo.to;
      cam.x = f.x + (to.x - f.x) * e; cam.y = f.y + (to.y - f.y) * e; cam.k = Math.exp(Math.log(f.k) + (Math.log(to.k) - Math.log(f.k)) * e);
      if (t >= 1) camTo = null; busy = true;
    }
    for (const [i, t0] of born) if (now - t0 > 1100) born.delete(i);
    if (replay) { stepReplay(now); busy = true; }
    draw(now);
    /* the first trace, a newcomer's ping and a hovered topic's running links all need frames; asked after
       drawing, since the frame that first sees the map is the one that starts its trace */
    if (born.size || dashLive || (seenAt > 0 && now - seenAt < SPREAD + TRACE + 240)) busy = true;
    if (busy && visible && !document.hidden) wake();
  }
  function keepPositions() {
    if (!g.nodes.length) return;
    for (const n of g.nodes) setPos(n.key, [Math.round(n.x * 10) / 10, Math.round(n.y * 10) / 10]);
    if (!(pos instanceof Map)) save();
  }
  /* ---------- drawing ---------- */
  const TRACE = 420, SPREAD = 520;   // a link traces in over TRACE ms; the farthest starts SPREAD ms after the nearest
  let seenAt = 0, dashLive = false;  /** @type {{ at: number, fromA: boolean }[] | null} */ let tD = null; /** @type {number[] | null} */ let nD = null;
  /* the first time the map is seen, each link traces out from its end nearer the middle, nearest first */
  function planTrace(P) {
    const far = Math.max(1, ...P.map(([x, y]) => Math.hypot(x - cw / 2, y - ch / 2)));
    nD = P.map(([x, y]) => Math.hypot(x - cw / 2, y - ch / 2) / far * SPREAD);
    tD = g.edges.map(e => ({ at: Math.min(nD[e.a], nD[e.b]), fromA: nD[e.a] <= nD[e.b] }));
  }
  /* a faint grid that moves with the map, crosses where its lines meet, and brackets at the corners */
  function grid(c, W, H, k, ox, oy, hair, u) {
    const { dark, ink } = colors; let sp = 64 * k; while (sp < 40 * u) sp *= 2; while (sp > 150 * u) sp /= 2;
    const x0 = ((ox % sp) + sp) % sp, y0 = ((oy % sp) + sp) % sp;
    c.strokeStyle = ink; c.lineWidth = hair; c.globalAlpha = dark ? .05 : .06; c.beginPath();
    for (let x = x0; x < W; x += sp) { c.moveTo(x, 0); c.lineTo(x, H); }
    for (let y = y0; y < H; y += sp) { c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke(); c.globalAlpha = dark ? .2 : .22; c.beginPath(); const a = 2.5 * u;
    for (let x = x0; x < W; x += sp) for (let y = y0; y < H; y += sp) { c.moveTo(x - a, y); c.lineTo(x + a, y); c.moveTo(x, y - a); c.lineTo(x, y + a); }
    c.stroke(); const m = 9 * u, l = 12 * u; c.globalAlpha = dark ? .38 : .34; c.lineWidth = u; c.beginPath();
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { c.moveTo(x, y + sy * l); c.lineTo(x, y); c.lineTo(x + sx * l, y); }
    c.stroke();
  }
  const ring = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); };
  const disc = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  /* where you are: a ring with four ticks, like a sight */
  function reticle(c, x, y, r, u) { ring(c, x, y, r); c.beginPath(); for (let q = 0; q < 4; q++) { const ax = Math.cos(q * TAU / 4), ay = Math.sin(q * TAU / 4); c.moveTo(x + ax * (r + 2 * u), y + ay * (r + 2 * u)); c.lineTo(x + ax * (r + 5.5 * u), y + ay * (r + 5.5 * u)); } c.stroke(); }
  /* a name in small capitals off a short leader line: up and right first, then the other corners */
  function tag(c, text, w, fs, cx, cy, r, dirs, placed, u, fa, strong, W, H, col = colors.ink, reach = 1) {
    const { ink, stage } = colors; const lead = 6 * u * reach, tick = 5 * u, pad = 3 * u;
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
  const spaced = c => { if ('letterSpacing' in c) /** @type {any} */ (c).letterSpacing = '0.07em'; };
  const unspaced = c => { if ('letterSpacing' in c) /** @type {any} */ (c).letterSpacing = '0px'; };
  function draw(now) {
    if (!cw) return; const { dark, ink, stage, kinds } = colors;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, cw, ch);
    const N = g.nodes; const k = cam.k, ox = cw / 2 - cam.x * k, oy = ch / 2 - cam.y * k;
    const P = N.map(n => [n.x * k + ox, n.y * k + oy]);
    grid(ctx, cw, ch, k, ox, oy, 1 / DPR, 1);
    if (!seenAt) { if (!visible || !N.length || held) return; seenAt = reducedMotion() ? -1e9 : now; if (seenAt > 0) planTrace(P); }
    const since = now - seenAt;
    const hi = hover >= 0 ? hover : sel; const nb = hi >= 0 ? new Set([hi, ...adj[hi]]) : null;
    const trailSet = replay ? replay.lit : null;
    const dimOf = i => (focusSet && !focusSet.has(i) ? .1 : 1) * (nb && !nb.has(i) ? .15 : 1) * (trailSet && !trailSet.has(i) ? .3 : 1);
    const bornA = i => { const t0 = born.get(i); return t0 == null ? 1 : clamp01((now - t0) / 500); };
    const bornS = i => { const t0 = born.get(i); if (t0 == null) return 1; const t = clamp01((now - t0) / 700); return N[i].read ? Math.max(0, easePop(t)) : t; };
    const tickIn = i => (nD ? clamp01((since - nD[i]) / 220) : 1);
    const seg = replay && !replay.done && replay.seg ? replay.seg : null; const segQ = seg ? easeInOut(clamp01((now - seg.t0) / (replay.per * .75))) : 1;
    /* links: hairlines; the moves you made a little stronger, with a chevron the way you went */
    ctx.lineCap = 'round'; dashLive = false;
    g.edges.forEach((e, j) => {
      if (!isShown(e.a) || !isShown(e.b)) return;
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
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(fx, fy); ctx.stroke(); ctx.setLineDash([]); dashLive = true;
      }
      if (e.move && e.from != null && !lit && !trail) {
        const [sx, sy] = P[e.from], [tx, ty] = P[e.from === e.a ? e.b : e.a]; const L = Math.hypot(tx - sx, ty - sy); if (L < 28) return;
        const ux = (tx - sx) / L, uy = (ty - sy) / L, mx = (sx + tx) / 2, my = (sy + ty) / 2;
        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mx - ux * 2.5 - uy * 3, my - uy * 2.5 + ux * 3); ctx.lineTo(mx + ux * 1.5, my + uy * 1.5); ctx.lineTo(mx - ux * 2.5 + uy * 3, my - uy * 2.5 - ux * 3); ctx.stroke();
      }
    });
    /* the topics: a solid dot ringed if you've read it, a fine hollow circle if it is an invitation */
    for (let i = 0; i < N.length; i++) {
      const n = N[i]; if (!isShown(i)) continue; const [x, y] = P[i]; const r = radius(n) * bornS(i);
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
    for (const i of [hi, sel, fi, ...N.map((n, i) => (n.cur ? i : -1)), ...(nb ? [...nb] : []), ...(replay ? [replay.at] : [])]) if (i >= 0 && !order.includes(i)) order.push(i);
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
        for (const reach of [1, 2.4, 3.8]) if (tag(ctx, e.label, w, tf, mx, my, 2.5, [[1, -1], [-1, -1], [1, 1], [-1, 1]], placed, 1, 1, true, cw, ch, col, reach)) { ctx.globalAlpha = 1; ctx.fillStyle = col; disc(ctx, mx, my, 2.5); break; }
      }
      ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`; spaced(ctx);
    };
    let drawn = 0;
    for (const i of order) {
      const n = N[i]; if (!isShown(i)) continue; const special = i === hi || i === sel || i === fi || n.cur || (nb && nb.has(i)) || (replay && replay.at === i);
      if (threadsDue && !special) threadTags();
      let fa = special ? 1 : n.read ? (still ? .9 : mini ? (n.deg >= 2 ? .85 : 0) : Math.max(readFade, n.deg >= (small ? 12 : 6) ? .9 : 0)) : loneFade * .8;
      fa *= (special ? 1 : dimOf(i)) * bornA(i) * tickIn(i); if (fa < .05) continue;
      const [cx, cy] = P[i], r = radius(n) * bornS(i); if (cx < -100 || cy < -20 || cx > cw + 100 || cy > ch + 20) continue;
      const text = clip(n.title || n.key, mini ? 22 : 30).toUpperCase(); const wk = `${fs}|${text}`; let w = widths.get(wk); if (w == null) { w = ctx.measureText(text).width; widths.set(wk, w); }
      const dirs = n.read || special ? [[1, -1], [1, 1], [-1, -1], [-1, 1]] : [[1, -1], [-1, -1]];
      if (tag(ctx, text, w, fs, cx, cy, r, dirs, placed, 1, fa, n.read || special, cw, ch) && ++drawn > (mini ? 40 : 260)) break;
    }
    unspaced(ctx);
    if (threadsDue) { threadTags(); unspaced(ctx); }
    /* how close you are, in the corner, on the full map */
    if (!mini && !still) { ctx.globalAlpha = dark ? .5 : .55; ctx.fillStyle = ink; ctx.font = '600 10px Inter, system-ui, sans-serif'; spaced(ctx); ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillText(`ZOOM ${k.toFixed(2)}×`, cw - 16, ch - 14); unspaced(ctx); ctx.textAlign = 'left'; }
    ctx.globalAlpha = 1;
  }
  /* ---------- pointing ---------- */
  function hit(sx, sy) {
    let best = -1, bd = Infinity;
    for (let i = 0; i < g.nodes.length; i++) {
      if (!isShown(i)) continue; const [x, y] = toScreen(g.nodes[i]); const d = Math.hypot(x - sx, y - sy); const r = radius(g.nodes[i]) + (matchMedia('(pointer: coarse)').matches ? 12 : 6);
      if (d < r && d < bd) { bd = d; best = i; }
    }
    return best;
  }
  const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const pointers = new Map(); let pinch = null;
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId); const [sx, sy] = local(e); pointers.set(e.pointerId, [sx, sy]);
    if (pointers.size === 2 && !mini && !still) { const [[x1, y1], [x2, y2]] = [...pointers.values()]; pinch = { d: Math.hypot(x2 - x1, y2 - y1), k: cam.k, c: toWorld((x1 + x2) / 2, (y1 + y2) / 2) }; drag = null; return; }
    const i = hit(sx, sy); camTo = null;
    drag = i >= 0 ? { node: i, sx, sy, moved: false, shift: e.shiftKey || e.altKey } : still ? { sx, sy, moved: false } : { pan: true, sx, sy, cx: cam.x, cy: cam.y, moved: false };
  });
  cv.addEventListener('pointermove', e => {
    const [sx, sy] = local(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [sx, sy]);
    if (pinch && pointers.size === 2) {
      const [[x1, y1], [x2, y2]] = [...pointers.values()]; const d = Math.hypot(x2 - x1, y2 - y1);
      cam.k = Math.max(.12, Math.min(4, pinch.k * d / Math.max(1, pinch.d))); const [wx, wy] = toWorld((x1 + x2) / 2, (y1 + y2) / 2);
      cam.x += pinch.c[0] - wx; cam.y += pinch.c[1] - wy; userMoved = true; wake(); return;
    }
    if (drag) {
      if (!drag.moved && Math.hypot(sx - drag.sx, sy - drag.sy) > 4) { drag.moved = true; hideTip(); }
      if (!drag.moved || still) return;
      if (drag.pan) { cam.x = drag.cx - (sx - drag.sx) / cam.k; cam.y = drag.cy - (sy - drag.sy) / cam.k; userMoved = true; wake(); }
      else { const n = g.nodes[drag.node]; const [wx, wy] = toWorld(sx, sy); n.fx = wx; n.fy = wy; sim.alphaTarget = .25; if (sim.alpha < .25) sim.alpha = .25; wake(); }
      return;
    }
    if (e.pointerType === 'mouse') { const i = hit(sx, sy); if (i !== hover) { hover = i; cv.style.cursor = i >= 0 ? 'pointer' : still ? 'default' : 'grab'; showTip(i, false); wake(); } }
  });
  const end = e => {
    pointers.delete(e.pointerId); if (pinch) { if (pointers.size < 2) pinch = null; return; }
    const d = drag; drag = null; if (!d) return;
    if (d.node != null && !still) { const n = g.nodes[d.node]; n.fx = n.fy = null; sim.alphaTarget = 0; }
    if (d.moved) { wake(); return; }
    /* a tap or click on a topic */
    if (d.node != null) {
      const touch = e.pointerType !== 'mouse';
      if (d.shift && !mini && !still) { setFocus(g.nodes[d.node].key); return; }
      if (touch && !mini && sel !== d.node) { sel = d.node; showTip(d.node, true); wake(); return; }
      openNode(g.nodes[d.node]); return;
    }
    if (sel >= 0) { sel = -1; hideTip(); wake(); }
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', () => { if (hover >= 0 && !drag) { hover = -1; hideTip(); wake(); } });
  if (!mini && !still) {
    cv.addEventListener('wheel', e => {
      e.preventDefault(); camTo = null; const [sx, sy] = local(e); const [wx, wy] = toWorld(sx, sy);
      cam.k = Math.max(.12, Math.min(4, cam.k * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0018))));
      const [nx, ny] = toWorld(sx, sy); cam.x += wx - nx; cam.y += wy - ny; userMoved = true; wake();
    }, { passive: false });
    cv.addEventListener('dblclick', e => { const [sx, sy] = local(e); const [wx, wy] = toWorld(sx, sy); flyTo({ x: wx, y: wy, k: Math.min(4, cam.k * 1.8) }); userMoved = true; });
  }
  /* the card beside a topic: what it is, when you read it, what it connects to */
  function showTip(i, actions) {
    if (i < 0) { hideTip(); return; }
    if (panel) { panel(g.nodes[i], actions); return; }
    const n = g.nodes[i]; const [x, y] = toScreen(n); const near = adj[i].map(j => g.nodes[j]).filter(m => m.read).map(m => m.title);
    const lead = n.read && pageOf(n.pid)?.deck ? plain(pageOf(n.pid).deck) : n.hook || '';
    const status = describe ? describe(n) : n.read ? `Read ${relTime(n.last)}${n.saved ? ' · saved' : ''}` : n.count === 1 ? 'On one of your pages' : `On ${n.count} of your pages`;
    const links = near.length ? `${n.read ? 'Links to' : 'Linked from'} ${near.slice(0, 2).map(t => `<b>${esc(clip(t, 26))}</b>`).join(' and ')}${near.length > 2 ? ` and ${near.length - 2} more` : ''}` : '';
    tip.innerHTML = `<p class="gt-k"><span class="kind"${kattr(n.kind)}>${esc(n.kind || 'topic')}</span><span>${esc(status)}</span></p><p class="gt-t">${esc(n.title)}</p>${lead ? `<p class="gt-h">${esc(clip(lead, 140))}</p>` : ''}${links ? `<p class="gt-l">${links}</p>` : ''}${actions ? `<div class="gt-a"><button class="btn glow" type="button" data-gv="open">${n.read && !open ? 'Go there' : 'Open page'}</button>${mini || still ? '' : '<button class="btn ghost" type="button" data-gv="focus">Focus</button>'}</div>` : ''}`;
    tip.dataset.kind = kg(n); tip.hidden = false; tip.classList.toggle('act', !!actions);
    const tw = tip.offsetWidth, th = tip.offsetHeight; const r = radius(n);
    let left = x - tw / 2, top = y + r + 12; if (top + th > ch - 8) top = y - r - 12 - th;
    tip.style.left = `${Math.max(8, Math.min(cw - tw - 8, left))}px`; tip.style.top = `${Math.max(8, top)}px`;
  }
  function hideTip() { tip.hidden = true; }
  tip.addEventListener('click', e => { const b = e.target.closest('[data-gv]'); if (!b || sel < 0) return; const n = g.nodes[sel]; if (b.dataset.gv === 'open') openNode(n); else { setFocus(n.key); hideTip(); } });
  function openNode(n) {
    hideTip(); if (open) { open(n); return; }
    if (n.read && n.pid) { const p = pageOf(n.pid); if (p) { if (p.id !== CUR) { addStep(store.trails, p.id, { from: CUR || null, via: 'world' }); p.last = Date.now(); save(); } go(routeOf(p.req)); return; } }
    openTopic(n.title, { via: 'world', hint: n.kind || n.hook ? { gloss: n.hook, kind: n.kind } : null });
  }
  /* ---------- replay: a trail, walked again across your world ---------- */
  function startReplay(pids) {
    const idx = pids.map(pid => { const p = pageOf(pid); return p ? g.nodes.findIndex(n => n.key === nodeKeyOf(p)) : -1; }).filter(i => i >= 0).filter((i, j, a) => j === 0 || a[j - 1] !== i);
    if (!idx.length) return false;
    focusSet = null; focusKey = '';
    if (reducedMotion()) { replay = { idx, step: idx.length, at: idx[idx.length - 1], lit: new Set(idx), edges: new Set(idx.slice(1).map((b, j) => `${idx[j]},${b}`).concat(idx.slice(1).map((b, j) => `${b},${idx[j]}`))), t0: 0, per: 0, done: true }; frameView(); wake(); return true; }
    const per = Math.max(320, Math.min(900, 9000 / idx.length));
    replay = { idx, step: -1, at: -1, lit: new Set(), edges: new Set(), t0: performance.now(), per, done: false };
    wake(); return true;
  }
  function stepReplay(now) {
    const R = replay; if (R.done) return;
    const s = Math.floor((now - R.t0) / R.per);
    while (R.step < Math.min(s, R.idx.length - 1)) {
      R.step++; const i = R.idx[R.step]; R.at = i; R.lit.add(i);
      if (R.step > 0) { const a = R.idx[R.step - 1]; R.edges.add(`${a},${i}`); R.edges.add(`${i},${a}`); R.seg = { a, b: i, t0: now }; }
      const n = g.nodes[i]; flyTo({ x: n.x, y: n.y, k: Math.max(cam.k, 1.15) });
    }
    if (s >= R.idx.length + 1) { R.done = true; flyTo(fitView([...R.lit].map(i => g.nodes[i]), cw, ch, { pad: 70, max: 1.8, min: .12 })); }
  }
  function stopReplay() { replay = null; wake(); }
  /* ---------- a picture of your world, to keep or share: the same drawing, at print size ---------- */
  function picture({ title = 'My world', sub = '' } = {}) {
    const Wd = 2400, Ht = 1500, u = 2.2; const c = document.createElement('canvas'); c.width = Wd; c.height = Ht; const x = c.getContext('2d');
    const { dark, ink, base, kinds } = colors; const keep = colors.stage; colors.stage = base;
    x.fillStyle = base; x.fillRect(0, 0, Wd, Ht);
    const v = fitView(g.nodes, Wd, Ht - 240, { pad: 150, max: 2.4, min: .05 }); const k = v.k, ox = Wd / 2 - v.x * k, oy = (Ht - 240) / 2 - v.y * k + 50;
    grid(x, Wd, Ht, k, ox, oy, 1, u);
    const P = g.nodes.map(n => [n.x * k + ox, n.y * k + oy]); const R = n => (n.read ? 2.6 + 1.05 * Math.sqrt(Math.min(n.deg, 30)) : 2.4) * u * 1.25;
    x.lineCap = 'round';
    for (const e of g.edges) { x.globalAlpha = e.unread ? .17 : e.move ? .55 : .3; x.strokeStyle = ink; x.lineWidth = (e.move ? 1.1 : .85) * u; x.beginPath(); x.moveTo(...P[e.a]); x.lineTo(...P[e.b]); x.stroke(); }
    g.nodes.forEach((n, i) => {
      const [px, py] = P[i], r = R(n), hex = kinds[kg(n)]; x.strokeStyle = hex; x.lineWidth = u;
      if (n.read) { x.globalAlpha = 1; x.fillStyle = hex; disc(x, px, py, r); x.globalAlpha = dark ? .55 : .5; ring(x, px, py, r + 2.5 * u); }
      else { x.globalAlpha = 1; x.fillStyle = base; disc(x, px, py, r); x.globalAlpha = dark ? .85 : .75; ring(x, px, py, r); }
    });
    const fs = 22; x.font = `600 ${fs}px Inter, system-ui, sans-serif`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.lineJoin = 'round'; spaced(x);
    const placed = [];
    for (const i of labelOrder) { const n = g.nodes[i]; if (!n.read) continue; const t = clip(n.title, 30).toUpperCase(); tag(x, t, x.measureText(t).width, fs, P[i][0], P[i][1], R(n), [[1, -1], [1, 1], [-1, -1], [-1, 1]], placed, u, 1, true, Wd, Ht); }
    unspaced(x); colors.stage = keep;
    x.globalAlpha = 1; x.textBaseline = 'alphabetic';
    x.fillStyle = ink; x.font = '700 56px Inter, system-ui, sans-serif'; x.fillText(title, 110, Ht - 120);
    x.fillStyle = dark ? '#A3A7AE' : '#5E636B'; x.font = '500 30px Inter, system-ui, sans-serif'; x.fillText(sub, 110, Ht - 70);
    x.textAlign = 'right'; x.fillStyle = ink; x.font = '900 52px Doto, ui-monospace, monospace'; x.fillText('dorkhub', Wd - 110, Ht - 72);
    return new Promise(res => c.toBlob(res, 'image/png'));
  }
  /* ---------- life ---------- */
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null; if (ro) ro.observe(host); else addEventListener('resize', resize);
  /* the latest of what may be several changes since the last call: a map mounted just before a quick scroll
     gets "hidden" and "shown" together */
  const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; if (visible) wake(); }) : null; if (io) io.observe(cv);
  resize();
  return {
    el: cv, setData, frameView, setFocus, flyTo, picture, startReplay, stopReplay, wake, hideTip,
    get graph() { return g; }, get focused() { return focusKey; }, get replaying() { return !!replay && !replay.done; },
    retheme() { themeColors(); wake(); },
    setHidden(set) { hidden = set; hover = -1; wake(); },
    find(q) { const s = q.trim().toLowerCase(); if (!s) return -1; const i = g.nodes.findIndex(n => n.title.toLowerCase().startsWith(s)); return i >= 0 ? i : g.nodes.findIndex(n => n.title.toLowerCase().includes(s)); },
    select(i) { sel = i; hover = -1; if (i >= 0) { const n = g.nodes[i]; flyTo({ x: n.x, y: n.y, k: Math.max(cam.k, 1.4) }); setTimeout(() => { if (sel === i) showTip(i, true); }, reducedMotion() ? 0 : 680); } else hideTip(); wake(); },
    sleep() { if (raf) cancelAnimationFrame(raf); raf = 0; },
    /* a map held back (the front page's, waiting its turn among the cards) traces in when asked */
    play() { held = false; wake(); },
    destroy() { alive = false; if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); keepPositions(); cv.remove(); tip.remove(); },
  };
}

/* ================= the graph data: your world, now ================= */
function worldGraph() { return buildGraph(store.pages, store.trails, { current: CUR, maxRead: 500, maxUnread: 300 }); }
/* how many topics are one click away: everything your pages link to that you haven't read */
function oneClickAway() { const W = worldIndex(); let n = 0; for (const k of W.back.keys()) if (!W.read.has(k)) n++; return n; }

/* ================= the small map beside a page ================= */
let MINI = null; const MINI_POS = new Map();
function sleepMini() { if (MINI) MINI.sleep(); }
function renderMini(grow = []) {
  const pane = $('#worldPane'); if (!pane) return;
  if (!pane.dataset.built) { pane.innerHTML = `<div class="mini"><div class="mini-stage" id="miniStage"></div><p class="mini-stats" id="miniStats"></p><a class="mini-open" href="/world" data-world="1">Open Your world ${ic('right')}</a></div>`; pane.dataset.built = '1'; MINI = null; }
  const p = curPage(); const full = worldGraph();
  const center = p && (p.status === 'done' || p.status === 'partial') ? nodeKeyOf(p) : '';
  const start = center || (full.nodes.find(n => n.read) || {}).key || '';
  const local = start ? localGraph(full, start, 48, 12) : { nodes: [], edges: [] };
  if (!MINI) MINI = makeGraph($('#miniStage'), { mini: true, positions: MINI_POS });
  MINI.setData(local, { center, grow });
  const n = worldCount(); $('#sideStats').textContent = n ? `${n} topic${n === 1 ? '' : 's'} in your world` : 'Your world starts with this page';
  $('#miniStats').innerHTML = n ? `<b>${n}</b> read · <b>${oneClickAway()}</b> one click away` : 'Every page you finish joins your world.';
}
/* a page finished: it springs into the map beside it, if that map is open; otherwise only the count moves */
function worldGrew(p) {
  if (VIEW !== 'page' || sideClosed() || SIDE !== 'world' || !MINI) return;
  renderMini([nodeKeyOf(p)]);
}

/* ================= the full page: /world ================= */
let WORLD = null, WHIDE = new Set();
function worldPageHTML() {
  const full = worldGraph(); const read = full.nodes.filter(n => n.read);
  if (!read.length) return `<section class="wpage empty"><div class="wp-empty"><span class="wp-glyph">${ic('world')}</span><h1>Your world starts with your first page</h1><p>Every page you read becomes a point of light here, joined to everything it links to. Start anywhere.</p><div class="wp-doors">${DOORS.slice(0, 4).map(d => doorHTML(d, false)).join('')}</div></div></section>`;
  const saved = Object.values(store.pages).filter(p => p.saved && (p.status === 'done' || p.status === 'partial')).sort((a, b) => b.saved - a.saved);
  const kinds = {}; for (const n of read) { const k = kindOf(n.kind) || 'concept'; kinds[k] = (kinds[k] || 0) + 1; }
  const kindList = Object.keys(KIND_LABEL).filter(k => kinds[k]);
  const most = [...read].sort((a, b) => b.deg - a.deg)[0];
  const trails = store.trails.filter(t => trailPages(t).length);
  const longest = trails.reduce((m, t) => Math.max(m, trailPages(t).length), 0);
  const since = Math.min(...read.map(n => n.first || Date.now()));
  return `<section class="wpage">
  <header class="wp-head"><h1>Your world</h1><p class="wp-sum"><span><b>${read.length}</b> topic${read.length === 1 ? '' : 's'} read</span><span><b>${oneClickAway()}</b> one click away</span><span><b>${saved.length}</b> saved</span></p></header>
  <div class="wp-stage" id="wpStage" role="img" aria-label="A map of the ${read.length} topics you have read and the topics they link to. The lists below hold the same topics.">
    <div class="wp-bar">
      <label class="wp-find"><span class="sr">Find a topic in your world</span>${ic('search')}<input id="wpFind" type="search" placeholder="Find a topic" autocomplete="off"></label>
      <div class="wp-kinds" role="group" aria-label="Show kinds">${kindList.map(k => `<button type="button" data-wkind="${k}" data-kind="${k}" aria-pressed="${!WHIDE.has(k)}"${tipAttrs(`${KIND_LABEL[k]}: ${kinds[k]}`)}><i></i></button>`).join('')}</div>
      <div class="wp-acts"><button class="tool ib" type="button" data-wact="fit"${tipAttrs('Fit everything')}>${ic('fit')}</button><button class="tool ib" type="button" data-wact="focus"${tipAttrs('Focus: within two links')}>${ic('focus')}</button><button class="tool ib" type="button" data-wact="replay"${tipAttrs('Replay your latest trail')}>${ic('trail')}</button><button class="tool ib" type="button" data-wact="image"${tipAttrs('Download a picture of your world')}>${ic('image')}</button></div>
    </div>
    <p class="wp-hint">${matchMedia('(hover: hover)').matches ? 'Drag to move, scroll to zoom, click a topic to open it. Shift-click to focus.' : 'Drag to move, pinch to zoom, tap a topic for more.'}</p>
  </div>
  <div class="wp-grid">
    <section class="wp-card"><h2>What you read</h2><div class="wp-bars" role="img" aria-label="${kindList.map(k => `${kinds[k]} ${KIND_LABEL[k].toLowerCase()}`).join(', ')}">${kindList.map(k => `<i data-kind="${k}" style="flex:${kinds[k]}"></i>`).join('')}</div><ul class="wp-legend">${kindList.map(k => `<li data-kind="${k}"><i></i>${KIND_LABEL[k]}<b>${kinds[k]}</b></li>`).join('')}</ul></section>
    <section class="wp-card"><h2>So far</h2><dl class="wp-facts">${most && most.deg ? `<div><dt>Most connected</dt><dd><a href="${esc(routeOf(pageOf(most.pid)?.req || { title: most.title }))}" data-goto="${esc(most.pid)}">${esc(most.title)}</a>, linked to ${most.deg} topic${most.deg === 1 ? '' : 's'}</dd></div>` : ''}<div><dt>Longest trail</dt><dd>${longest} topic${longest === 1 ? '' : 's'} in one sitting</dd></div><div><dt>Since</dt><dd>${esc(new Date(since).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }))}</dd></div></dl></section>
    <section class="wp-card"><h2>Saved</h2>${saved.length ? `<ul class="wp-list">${saved.slice(0, 12).map(p => `<li><a href="${esc(routeOf(p.req))}" data-goto="${esc(p.id)}"${kattr(p.kind)}><i></i><b>${esc(p.title)}</b><span>${esc(relTime(p.saved))}</span></a></li>`).join('')}</ul>` : `<p class="wp-none">Press the star on any page to keep it here.</p>`}</section>
    <section class="wp-card"><h2>Trails</h2><ul class="wp-list">${trails.slice(0, 8).map(t => { const ps = trailPages(t); return `<li><button type="button" data-replay="${esc(t.id)}"${tipAttrs('Replay this trail')}><i class="pl">${ic('play')}</i><b>${esc(clip(ps[0].title, 26))} → ${esc(clip(ps[ps.length - 1].title, 26))}</b><span>${ps.length} topic${ps.length === 1 ? '' : 's'}, ${esc(relTime(t.steps[t.steps.length - 1][1]))}</span></button></li>`; }).join('')}</ul></section>
  </div>
</section>`;
}
function showWorld() {
  const seen = store.settings.worldSeen || 0;
  $('#view').innerHTML = worldPageHTML(); document.title = 'Your world: dorkhub';
  const stage = $('#wpStage'); if (!stage) { WORLD = null; return; }
  WORLD = makeGraph(stage, { positions: store.pos });
  WORLD.setHidden(WHIDE);
  /* what grew since you last looked springs in, newest last */
  const full = worldGraph(); const grown = seen ? full.nodes.filter(n => n.read && n.first > seen).sort((a, b) => a.first - b.first).slice(-12).map(n => n.key) : [];
  WORLD.setData(full, { grow: grown });
  store.settings.worldSeen = Date.now(); save();
  const t = new URLSearchParams(location.search).get('trail'); const tr = t && store.trails.find(x => x.id === t);
  if (tr) setTimeout(() => { if (WORLD) WORLD.startReplay(tr.steps.map(s => s[0])); }, reducedMotion() ? 0 : 500);
}
document.addEventListener('click', e => {
  if (!WORLD) return;
  const k = e.target.closest('[data-wkind]');
  if (k) { const kind = k.dataset.wkind; if (WHIDE.has(kind)) WHIDE.delete(kind); else WHIDE.add(kind); k.setAttribute('aria-pressed', String(!WHIDE.has(kind))); WORLD.setHidden(WHIDE); return; }
  const a = e.target.closest('[data-wact]'); if (a) {
    const w = a.dataset.wact;
    if (w === 'fit') { WORLD.setFocus(''); WORLD.stopReplay(); WORLD.frameView(); }
    else if (w === 'focus') { const p = pageOf(store.current); const key = WORLD.focused ? '' : p ? nodeKeyOf(p) : ''; WORLD.setFocus(key); if (!key) WORLD.frameView(); a.setAttribute('aria-pressed', String(!!key)); }
    else if (w === 'replay') { const t = store.trails.find(x => trailPages(x).length > 1) || store.trails[0]; if (!t || !WORLD.startReplay(t.steps.map(s => s[0]))) toast('Read a few pages, then replay the trail you took.'); }
    else if (w === 'image') { const n = worldCount(); WORLD.picture({ title: 'My world', sub: `${n} topic${n === 1 ? '' : 's'} read on Dorkhub · ${new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}` }).then(b => { if (b) saveFile('my-dorkhub-world.png', b); }); }
    return;
  }
  const r = e.target.closest('[data-replay]'); if (r) { const t = store.trails.find(x => x.id === r.dataset.replay); if (t) { $('#wpStage')?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }); WORLD.startReplay(t.steps.map(s => s[0])); } }
});
document.addEventListener('keydown', e => {
  if (e.target.id !== 'wpFind' || !WORLD) return;
  if (e.key === 'Enter') { e.preventDefault(); const i = WORLD.find(e.target.value); if (i >= 0) WORLD.select(i); else toast('That topic isn’t in your world yet.'); }
  else if (e.key === 'Escape') { e.target.value = ''; WORLD.select(-1); }
});
function leaveWorld() { if (WORLD) { WORLD.destroy(); WORLD = null; } }

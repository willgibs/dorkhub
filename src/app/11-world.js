/* ================= Your world: the graph of everything you've read =================
   Every topic you've read is a lit dot in the colour of its kind, sized by how connected it is; the
   topics they link to that you haven't read sit faintly at the edges, as invitations. Links are
   hairlines; the moves you made are a little stronger. The layout is a small force simulation
   (src/shared/graph.js) that runs only while something is moving, then stops: no idle motion.
   The same view draws the small map beside a page and the full page at /world. */
const hexRGB = h => { const n = parseInt(String(h).replace('#', ''), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const SPRITES = new Map();
/* a soft glow for each colour, drawn once and stamped under every dot of that colour */
function glowSprite(hex, dark) {
  const id = `${hex}|${dark}`; let s = SPRITES.get(id); if (s) return s;
  s = document.createElement('canvas'); const R = 64; s.width = s.height = R * 2; const c = s.getContext('2d');
  const [r, g, b] = hexRGB(hex); const gr = c.createRadialGradient(R, R, 0, R, R, R);
  gr.addColorStop(0, `rgba(${r},${g},${b},${dark ? .5 : .26})`); gr.addColorStop(.32, `rgba(${r},${g},${b},${dark ? .2 : .1})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  c.fillStyle = gr; c.fillRect(0, 0, R * 2, R * 2); SPRITES.set(id, s); return s;
}
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easePop = t => { const c1 = 1.70158 * 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const clamp01 = v => Math.max(0, Math.min(1, v));

/**
 * A graph view on a host element. mini: the small map beside a page (no wheel zoom, no tools).
 * still: a map inside a scrolling page (the front page): it never pans, zooms or drags, so a finger
 * scrolls the page over it; a topic is opened by a click, or on a phone by a tap on its card.
 * describe and open replace the card's status line and what opening a topic does.
 * @param {HTMLElement} host @param {{ mini?: boolean, still?: boolean, positions?: Record<string, [number, number]> | Map<string, [number, number]>, describe?: (n: any) => string, open?: (n: any) => void }} [o]
 */
function makeGraph(host, { mini = false, still = false, positions = null, describe = null, open = null } = {}) {
  const cv = document.createElement('canvas'); cv.className = 'gv-canvas'; host.appendChild(cv);
  const tip = document.createElement('div'); tip.className = 'gv-tip'; tip.hidden = true; host.appendChild(tip);
  const ctx = cv.getContext('2d');
  let cw = 0, ch = 0, DPR = 1, raf = 0, visible = true, alive = true;
  /** @type {{ nodes: any[], edges: any[] }} */ let g = { nodes: [], edges: [] }; let sim = null; let adj = [];
  const cam = { x: 0, y: 0, k: 1 }; let camTo = null;
  let hover = -1, sel = -1, drag = null, focusSet = null, focusKey = '', replay = null;
  /** @type {Set<string>} */ let hidden = new Set();   // kind groups switched off
  const born = new Map();   // node index -> when it appeared (growth moments)
  const pulses = [];        // lights travelling along new links: { a, b, t0 }
  let colors = null, labelOrder = [], userMoved = false;
  const widths = new Map();
  const pos = positions || store.pos;
  const getPos = k => (pos instanceof Map ? pos.get(k) : pos[k]);
  const setPos = (k, v) => { if (pos instanceof Map) pos.set(k, v); else pos[k] = v; };
  function themeColors() {
    const cs = getComputedStyle(document.documentElement); const dark = isDark();
    colors = { dark, ink: cs.getPropertyValue('--ink').trim() || (dark ? '#ECECEE' : '#18181B'), base: cs.getPropertyValue('--base').trim() || (dark ? '#0B0C0E' : '#FCFCFB'), kinds: dark ? KIND_HEX.dark : KIND_HEX.light };
  }
  themeColors();
  const kg = n => kindOf(n.kind) || 'concept';
  const radius = n => (n.read ? 2.8 + 1.7 * Math.sqrt(Math.min(n.deg, 30)) : 2.1) * (mini ? .9 : 1) * Math.max(.7, Math.min(1.7, Math.sqrt(cam.k)));
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
    const now = performance.now(); born.clear(); pulses.length = 0;
    if (!reducedMotion()) grow.forEach((k, j) => {
      const i = g.nodes.findIndex(n => n.key === k); if (i < 0) return; born.set(i, now + j * 110);
      for (const o of adj[i]) { if (g.nodes[o].read) pulses.push({ a: i, b: o, t0: now + j * 110 + 260 }); else if (!old.has(g.nodes[o].key)) born.set(o, now + j * 110 + 380 + Math.random() * 300); }
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
    for (let j = pulses.length - 1; j >= 0; j--) if (now - pulses[j].t0 > 1200) pulses.splice(j, 1);
    if (born.size || pulses.length) busy = true;
    if (replay) { stepReplay(now); busy = true; }
    draw(now);
    if (busy && visible && !document.hidden) wake();
  }
  function keepPositions() {
    if (!g.nodes.length) return;
    for (const n of g.nodes) setPos(n.key, [Math.round(n.x * 10) / 10, Math.round(n.y * 10) / 10]);
    if (!(pos instanceof Map)) save();
  }
  /* ---------- drawing ---------- */
  function draw(now) {
    if (!cw) return; const { dark, ink, base, kinds } = colors;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, cw, ch);
    const N = g.nodes; const k = cam.k, ox = cw / 2 - cam.x * k, oy = ch / 2 - cam.y * k;
    const hi = hover >= 0 ? hover : sel; const nb = hi >= 0 ? new Set([hi, ...adj[hi]]) : null;
    const trailSet = replay ? replay.lit : null;
    const dimOf = i => (focusSet && !focusSet.has(i) ? .1 : 1) * (nb && !nb.has(i) ? .28 : 1) * (trailSet && !trailSet.has(i) ? .3 : 1);
    const bornA = i => { const t0 = born.get(i); return t0 == null ? 1 : clamp01((now - t0) / 500); };
    const bornS = i => { const t0 = born.get(i); if (t0 == null) return 1; const t = clamp01((now - t0) / 700); return N[i].read ? Math.max(0, easePop(t)) : t; };
    /* links */
    ctx.lineCap = 'round';
    for (const e of g.edges) {
      if (!isShown(e.a) || !isShown(e.b)) continue;
      const a = N[e.a], b = N[e.b]; let al = e.unread ? (dark ? .1 : .08) : e.move ? (dark ? .36 : .3) : (dark ? .18 : .15); let col = ink, w = e.move ? 1.2 : .85;
      if (nb && (e.a === hi || e.b === hi)) { al = .75; col = kinds[kg(N[hi])]; w = 1.4; }
      else al *= Math.min(dimOf(e.a), dimOf(e.b));
      if (trailSet && replay.edges.has(`${e.a},${e.b}`)) { al = .9; col = kinds[kg(N[e.b])]; w = 1.8; }
      al *= Math.min(bornA(e.a), bornA(e.b)); if (al < .01) continue;
      ctx.globalAlpha = al; ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(a.x * k + ox, a.y * k + oy); ctx.lineTo(b.x * k + ox, b.y * k + oy); ctx.stroke();
    }
    /* glows under the topics you've read: light adds up in the dark */
    ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
    for (let i = 0; i < N.length; i++) {
      const n = N[i]; if (!n.read || !isShown(i)) continue;
      const x = n.x * k + ox, y = n.y * k + oy; const r = radius(n) * bornS(i); if (x < -60 || y < -60 || x > cw + 60 || y > ch + 60 || r <= 0) continue;
      const s = r * (i === hi || (replay && replay.at === i) ? 9 : 6.5); ctx.globalAlpha = dimOf(i) * bornA(i);
      ctx.drawImage(glowSprite(kinds[kg(n)], dark), x - s / 2, y - s / 2, s, s);
    }
    ctx.globalCompositeOperation = 'source-over';
    /* lights running along the links a new topic brought */
    for (const pl of pulses) {
      const t = (now - pl.t0) / 900; if (t < 0 || t > 1) continue; const a = N[pl.a], b = N[pl.b];
      const x = (a.x + (b.x - a.x) * easeOut(t)) * k + ox, y = (a.y + (b.y - a.y) * easeOut(t)) * k + oy;
      ctx.globalAlpha = Math.sin(t * Math.PI); const s = 22; ctx.drawImage(glowSprite(kinds[kg(a)], true), x - s / 2, y - s / 2, s, s);
    }
    /* the topics */
    for (let i = 0; i < N.length; i++) {
      const n = N[i]; if (!isShown(i)) continue; const x = n.x * k + ox, y = n.y * k + oy; const r = radius(n) * bornS(i);
      if (x < -20 || y < -20 || x > cw + 20 || y > ch + 20 || r <= 0) continue;
      const hex = kinds[kg(n)]; const al = dimOf(i) * bornA(i);
      ctx.globalAlpha = al;
      if (n.read) {
        ctx.fillStyle = hex; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        /* a lit centre, so a dot reads as a point of light */
        ctx.globalAlpha = al * (dark ? .55 : .35); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - r * .22, y - r * .22, r * .42, 0, Math.PI * 2); ctx.fill();
        if (n.saved) { ctx.globalAlpha = al * .7; ctx.strokeStyle = hex; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r + 3.5, 0, Math.PI * 2); ctx.stroke(); }
      } else {
        const [rr, gg, bb] = hexRGB(hex); ctx.fillStyle = `rgba(${rr},${gg},${bb},${dark ? .3 : .22})`; ctx.strokeStyle = `rgba(${rr},${gg},${bb},${dark ? .7 : .55})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      if (n.cur || (replay && replay.at === i)) { ctx.globalAlpha = .9 * bornA(i); ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2); ctx.stroke(); }
      if (i === sel) { ctx.globalAlpha = .85; ctx.strokeStyle = hex; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 6.5, 0, Math.PI * 2); ctx.stroke(); }
    }
    /* names: the busiest and nearest first, never on top of one another, fading in as you zoom */
    ctx.font = `600 ${mini || cw < 520 ? 11 : 12}px Inter, system-ui, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
    const placed = []; const order = [];
    for (const i of [hi, sel, ...N.map((n, i) => (n.cur ? i : -1)), ...(nb ? [...nb] : []), ...(replay ? [replay.at] : [])]) if (i >= 0 && !order.includes(i)) order.push(i);
    for (const i of labelOrder) if (!order.includes(i)) order.push(i);
    /* a small screen names fewer topics until you zoom in */
    const small = cw < 520; const readFade = mini ? 1 : clamp01((k - (small ? .75 : .45)) / .35), loneFade = clamp01((k - (mini ? 1.6 : small ? 1.6 : 1.25)) / .4);
    let drawn = 0;
    for (const i of order) {
      const n = N[i]; if (!isShown(i)) continue; const special = i === hi || i === sel || n.cur || (nb && nb.has(i)) || (replay && replay.at === i);
      let fa = special ? 1 : n.read ? (still ? .9 : mini ? (n.deg >= 2 ? .85 : 0) : Math.max(readFade, n.deg >= (small ? 12 : 6) ? .9 : 0)) : loneFade * .8;
      fa *= (special ? 1 : dimOf(i)) * bornA(i); if (fa < .05) continue;
      const cx = n.x * k + ox, cy = n.y * k + oy, r = radius(n) * bornS(i); if (cx < -80 || cy < -20 || cx > cw + 80 || cy > ch + 20) continue;
      const text = clip(n.title || n.key, mini ? 22 : 30); let w = widths.get(text); if (w == null) { w = ctx.measureText(text).width; widths.set(text, w); }
      /* below the dot first; a topic you've read tries above, right and left before its name gives way */
      const spots = [[cx - w / 2, cy + r + 4], ...(n.read || special ? [[cx - w / 2, cy - r - 17], [cx + r + 6, cy - 7], [cx - r - 6 - w, cy - 7]] : [])];
      let at = null;
      for (const [tx, ty] of spots) { const box = [tx - 3, ty - 2, tx + w + 3, ty + 15]; if (!placed.some(b => b[0] < box[2] && box[0] < b[2] && b[1] < box[3] && box[1] < b[3])) { at = [tx, ty]; placed.push(box); break; } }
      if (!at) continue; const [x, y] = at;
      ctx.globalAlpha = fa; ctx.lineWidth = 3.5; ctx.strokeStyle = base; ctx.strokeText(text, x, y); ctx.fillStyle = ink; ctx.globalAlpha = fa * (n.read || special ? 1 : .75); ctx.fillText(text, x, y);
      if (++drawn > (mini ? 40 : 260)) break;
    }
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
    const n = g.nodes[i]; const [x, y] = toScreen(n); const near = adj[i].map(j => g.nodes[j]).filter(m => m.read).map(m => m.title);
    const lead = n.read && pageOf(n.pid)?.deck ? plain(pageOf(n.pid).deck) : n.hook || '';
    const status = describe ? describe(n) : n.read ? `Read ${relTime(n.last)}${n.saved ? ' · saved' : ''}` : n.count === 1 ? 'On one of your pages' : `On ${n.count} of your pages`;
    const links = near.length ? `${n.read ? 'Links to' : 'Linked from'} ${near.slice(0, 2).map(t => `<b>${esc(clip(t, 26))}</b>`).join(' and ')}${near.length > 2 ? ` and ${near.length - 2} more` : ''}` : '';
    tip.innerHTML = `<p class="gt-k"><span class="kind"${kattr(n.kind)}>${esc(n.kind || 'topic')}</span><span>${esc(status)}</span></p><p class="gt-t">${esc(n.title)}</p>${lead ? `<p class="gt-h">${esc(clip(lead, 140))}</p>` : ''}${links ? `<p class="gt-l">${links}</p>` : ''}${actions ? `<div class="gt-a"><button class="btn glow" type="button" data-gv="open">${n.read && !open ? 'Go there' : 'Open page'}</button>${mini || still ? '' : '<button class="btn ghost" type="button" data-gv="focus">Focus</button>'}</div>` : ''}`;
    tip.hidden = false; tip.classList.toggle('act', !!actions);
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
      if (R.step > 0) { const a = R.idx[R.step - 1]; R.edges.add(`${a},${i}`); R.edges.add(`${i},${a}`); pulses.push({ a, b: i, t0: now }); }
      const n = g.nodes[i]; flyTo({ x: n.x, y: n.y, k: Math.max(cam.k, 1.15) });
    }
    if (s >= R.idx.length + 1) { R.done = true; flyTo(fitView([...R.lit].map(i => g.nodes[i]), cw, ch, { pad: 70, max: 1.8, min: .12 })); }
  }
  function stopReplay() { replay = null; wake(); }
  /* ---------- a picture of your world, to keep or share ---------- */
  function picture({ title = 'My world', sub = '' } = {}) {
    const Wd = 2400, Ht = 1500; const c = document.createElement('canvas'); c.width = Wd; c.height = Ht; const x = c.getContext('2d');
    const { dark, ink, base, kinds } = colors;
    x.fillStyle = base; x.fillRect(0, 0, Wd, Ht);
    const v = fitView(g.nodes, Wd, Ht - 220, { pad: 120, max: 2.4, min: .05 }); const k = v.k, ox = Wd / 2 - v.x * k, oy = (Ht - 220) / 2 - v.y * k + 40;
    x.lineCap = 'round';
    for (const e of g.edges) { const a = g.nodes[e.a], b = g.nodes[e.b]; x.globalAlpha = e.unread ? .1 : e.move ? .4 : .2; x.strokeStyle = ink; x.lineWidth = e.move ? 2.2 : 1.4; x.beginPath(); x.moveTo(a.x * k + ox, a.y * k + oy); x.lineTo(b.x * k + ox, b.y * k + oy); x.stroke(); }
    x.globalCompositeOperation = dark ? 'lighter' : 'source-over';
    for (const n of g.nodes) if (n.read) { const r = (3.4 + 2.1 * Math.sqrt(Math.min(n.deg, 30))) * 1.6; const s = r * 7; x.globalAlpha = 1; x.drawImage(glowSprite(kinds[kg(n)], dark), n.x * k + ox - s / 2, n.y * k + oy - s / 2, s, s); }
    x.globalCompositeOperation = 'source-over';
    for (const n of g.nodes) {
      const hex = kinds[kg(n)]; const px = n.x * k + ox, py = n.y * k + oy;
      if (n.read) { const r = (3.4 + 2.1 * Math.sqrt(Math.min(n.deg, 30))) * 1.6; x.globalAlpha = 1; x.fillStyle = hex; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill(); x.globalAlpha = dark ? .55 : .35; x.fillStyle = '#fff'; x.beginPath(); x.arc(px - r * .22, py - r * .22, r * .42, 0, Math.PI * 2); x.fill(); }
      else { const [rr, gg, bb] = hexRGB(hex); x.globalAlpha = 1; x.fillStyle = `rgba(${rr},${gg},${bb},.25)`; x.strokeStyle = `rgba(${rr},${gg},${bb},.6)`; x.lineWidth = 1.6; x.beginPath(); x.arc(px, py, 3.4, 0, Math.PI * 2); x.fill(); x.stroke(); }
    }
    x.font = '600 22px Inter, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'top'; x.lineJoin = 'round';
    const placed = [];
    for (const i of labelOrder) {
      const n = g.nodes[i]; if (!n.read) continue; const r = (3.4 + 2.1 * Math.sqrt(Math.min(n.deg, 30))) * 1.6;
      const px = n.x * k + ox, py = n.y * k + oy + r + 8; const t = clip(n.title, 30); const w = x.measureText(t).width; const box = [px - w / 2 - 4, py - 2, px + w / 2 + 4, py + 26];
      if (placed.some(b => b[0] < box[2] && box[0] < b[2] && b[1] < box[3] && box[1] < b[3])) continue; placed.push(box);
      x.globalAlpha = 1; x.lineWidth = 6; x.strokeStyle = base; x.strokeText(t, px, py); x.fillStyle = ink; x.fillText(t, px, py);
    }
    x.globalAlpha = 1; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    x.fillStyle = ink; x.font = '700 56px Inter, system-ui, sans-serif'; x.fillText(title, 110, Ht - 120);
    x.fillStyle = dark ? '#A3A7AE' : '#5E636B'; x.font = '500 30px Inter, system-ui, sans-serif'; x.fillText(sub, 110, Ht - 70);
    x.textAlign = 'right'; x.fillStyle = ink; x.font = '900 52px Doto, ui-monospace, monospace'; x.fillText('dorkhub', Wd - 110, Ht - 72);
    return new Promise(res => c.toBlob(res, 'image/png'));
  }
  /* ---------- life ---------- */
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null; if (ro) ro.observe(host); else addEventListener('resize', resize);
  const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }) : null; if (io) io.observe(cv);
  resize();
  return {
    el: cv, setData, frameView, setFocus, flyTo, picture, startReplay, stopReplay, wake, hideTip,
    get graph() { return g; }, get focused() { return focusKey; }, get replaying() { return !!replay && !replay.done; },
    retheme() { themeColors(); wake(); },
    setHidden(set) { hidden = set; hover = -1; wake(); },
    find(q) { const s = q.trim().toLowerCase(); if (!s) return -1; const i = g.nodes.findIndex(n => n.title.toLowerCase().startsWith(s)); return i >= 0 ? i : g.nodes.findIndex(n => n.title.toLowerCase().includes(s)); },
    select(i) { sel = i; hover = -1; if (i >= 0) { const n = g.nodes[i]; flyTo({ x: n.x, y: n.y, k: Math.max(cam.k, 1.4) }); setTimeout(() => { if (sel === i) showTip(i, true); }, reducedMotion() ? 0 : 680); } else hideTip(); wake(); },
    sleep() { if (raf) cancelAnimationFrame(raf); raf = 0; },
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
  if (VIEW !== 'page' || railMode() || SIDE !== 'world' || !MINI) return;
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

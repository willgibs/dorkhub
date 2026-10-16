/* ================= the front page's moving drawings: geometry shared by the build and the page =================
   lib/front.js draws each card's finished state with these; the page (src/app/13-landing.js) moves the same
   drawing, so what moves and what rests never disagree. Small on purpose: the page carries it. */

/** A Miura-folded sheet (Miura's fold, as on the Space Flyer Unit's solar array): m × n parallelograms with sides a
    and b at angle gam, folded to angle th (0 flat, π/2 folded flat). After Schenk & Guest (2013): one degree of
    freedom, every face stays flat. Vertex (i, j) of the folded sheet is at
    x = i·S, y = j·L + (i odd ? V : 0), z = (j odd ? H : 0).
    @param {number} m @param {number} n @param {number} th @returns {number[][]} the vertices, (n + 1) per column */
export function miura(m, n, th, a = 1, b = 1, gam = Math.PI / 3) {
  const c = Math.cos(th), s = Math.sin(th), t = Math.tan(gam), k = Math.sqrt(1 + c * c * t * t);
  const H = a * s * Math.sin(gam), S = b * c * t / k, L = a * Math.sqrt(1 - s * s * Math.sin(gam) ** 2), V = b / k;
  /** @type {number[][]} */ const p = [];
  for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) p.push([i * S, j * L + (i % 2 ? V : 0), j % 2 ? H : 0]);
  return p;
}

/** A camera in front of a point (on the −y side), turned by an azimuth and raised by an elevation (radians), at a
    distance (a mild perspective), onto a picture of scale k centred at (ox, oy); z is up. Returns the projection and
    the depth of a point (bigger is nearer).
    @param {{ at: number[], az: number, el: number, dist: number, k: number, ox: number, oy: number }} o */
export function camera({ at, az, el, dist, k, ox, oy }) {
  const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
  /** @param {number[]} q @returns {[number, number, number]} */
  const look = q => { const x = q[0] - at[0], y = q[1] - at[1], z = q[2] - at[2]; const u = x * ca - y * sa, w = x * sa + y * ca; return [u, w * se + z * ce, z * se - w * ce]; };
  return {
    /** @param {number[]} q @returns {[number, number]} */
    to: q => { const [u, v, d] = look(q), f = dist / (dist - d); return [ox + u * k * f, oy - v * k * f]; },
    /** @param {number[]} q */
    depth: q => look(q)[2],
  };
}

/** How dark a face is under a light from L (unit vector, z up): 0 lit full on, up to `deep` turned well away (the light
    wraps a little, as it does round paper, so faces turned away still differ). @param {number[][]} f the face's corners
    @param {number[]} L */
export function shade(f, L, deep = .5) {
  const [a, b, c] = f, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const len = Math.hypot(n[0], n[1], n[2]) || 1; n = n.map(q => q / len); if (n[2] < 0) n = n.map(q => -q);
  return deep * Math.min(1, Math.max(0, 1 - (n[0] * L[0] + n[1] * L[1] + n[2] * L[2] + .6) / 1.6));
}

/** The Origami card's sheet: its size, the angles it rests at, arrives from and opens to, its light, and a camera for
    a wide card and for a phone's. */
export const FOLD = { m: 20, n: 7, gam: Math.PI / 3, rest: 62 * Math.PI / 180, shut: 86 * Math.PI / 180, open: 38 * Math.PI / 180, light: [.7, -.45, .35], cams: { w: { W: 745, H: 350, az: -.62, el: .6, k: 40, oy: 196 }, n: { W: 360, H: 344, az: -.7, el: .66, k: 23, oy: 196 } } };
/** The sheet folded to th, seen by one of FOLD's cameras: its faces from back to front (a path, which of the four ways
    it faces, 0 to 3, and how dark it is), and the shadow it casts. @param {number} th @param {'w' | 'n'} v */
export function foldView(th, v) {
  const F = FOLD, C = F.cams[v], p = miura(F.m, F.n, th, 1, 1, F.gam), at = (/** @type {number} */ i, /** @type {number} */ j) => p[i * (F.n + 1) + j];
  const mid = [(at(F.m, 0)[0]) / 2, (at(0, F.n)[1] + at(1, F.n)[1]) / 4, 0];
  const L = Math.hypot(...F.light), light = F.light.map(q => q / L);
  const cam = camera({ at: mid, az: C.az, el: C.el, dist: 40, k: C.k, ox: C.W / 2, oy: C.oy });
  const r = (/** @type {number} */ q) => Math.round(q * 10) / 10;
  /** @type {{ d: string, o: number, s: number, z: number }[]} */ const faces = [];
  for (let i = 0; i < F.m; i++) for (let j = 0; j < F.n; j++) {
    const q = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)];
    faces.push({ d: `M${q.map(c => cam.to(c).map(r).join(' ')).join('L')}Z`, o: (i % 2) * 2 + (j % 2), s: shade(q, light), z: q.reduce((t, c) => t + cam.depth(c), 0) });
  }
  faces.sort((x, y) => x.z - y.z);
  /* the shadow: the sheet's outline cast down and away from the light onto the table under it */
  const drop = (/** @type {number[]} */ c) => cam.to([c[0] - light[0] / light[2] * (c[2] + .35), c[1] - light[1] / light[2] * (c[2] + .35), -.35]).map(r).join(' ');
  const rim = [...Array.from({ length: F.m + 1 }, (_, i) => at(i, 0)), ...Array.from({ length: F.n + 1 }, (_, j) => at(F.m, j)), ...Array.from({ length: F.m + 1 }, (_, i) => at(F.m - i, F.n)), ...Array.from({ length: F.n + 1 }, (_, j) => at(0, F.n - j))];
  return { faces, shadow: `M${rim.map(drop).join('L')}Z` };
}

/** the convex hull of points in the picture (Andrew's monotone chain) @param {number[][]} pts @returns {number[][]} */
export function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cross = (/** @type {number[]} */ o, /** @type {number[]} */ a, /** @type {number[]} */ b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  /** @type {number[][]} */ const lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

/** The Venus flytrap card's trap, seen from above and in front: two lobes hinged on a midrib, each opened phi from
    upright (about 38° open, 3° shut). Each lobe is cupped, edged with long teeth that lean inward, and carries three
    trigger hairs and a bead of nectar along its rim. Returns, back lobe first, each lobe's face (which side shows, and
    a line across it for its colour to follow), rim, teeth, hairs and nectar, the stalk, and where the hairs' tips are.
    @param {number} phi @param {{ W: number, H: number, k: number, ox: number, oy: number, az: number, el: number }} C */
export function trapView(phi, C) {
  const cam = camera({ at: [0, 0, .35], az: C.az, el: C.el, dist: 30, k: C.k, ox: C.ox, oy: C.oy });
  const r = (/** @type {number} */ q) => Math.round(q * 10) / 10, P = (/** @type {number[]} */ q) => cam.to(q).map(r).join(' ');
  const LH = 1.32, WL = 1.02, CUP = .3;
  /** the rim's distance from the midrib along the lobe, u from −1 (the stalk's end) to 1 (the tip) */
  const rim = (/** @type {number} */ u) => Math.pow(Math.max(0, 1 - u * u), .62) * (1 - .12 * u);
  /** one lobe: s = 1 leans back (away from you), −1 toward you */
  const lobe = (/** @type {number} */ s) => {
    const a = s * phi, w = [0, Math.sin(a), Math.cos(a)], n = [0, s * Math.cos(a), -s * Math.sin(a)];
    /** a point on the lobe: along the midrib u, out toward the rim v (0 to 1), cupped outward */
    const at = (/** @type {number} */ u, /** @type {number} */ v, out = 0) => { const vv = v * rim(u) * WL, c = CUP * v * (1 - v * .6) * (1 - u * u) + out; return [u * LH + w[0] * vv + n[0] * c, w[1] * vv + n[1] * c, w[2] * vv + n[2] * c]; };
    const us = Array.from({ length: 33 }, (_, i) => -1 + i / 16);
    const edge = us.map(u => at(u, 1));
    /* which side faces you: the inside (red) or the outside (green) */
    const mid = at(0, .5), toCam = cam.depth([mid[0] + n[0], mid[1] + n[1], mid[2] + n[2]]) - cam.depth(mid);
    /* once the rims meet (shut, the lobes within a few degrees of upright) the inside is closed away */
    const inside = toCam < 0 && phi > 12 * Math.PI / 180;
    const face = `M${P(at(-1, 0))}${edge.map(q => `L${P(q)}`).join('')}L${P(at(1, 0))}Z`;
    /* its outside: the outline of the whole cupped lobe as you see it, so a bulge shows past the rim */
    const shell = `M${hull(us.flatMap(u => [0, .25, .5, .75, 1].map(v => cam.to(at(u, v))))).map(q => q.map(r).join(' ')).join('L')}Z`;
    /* the teeth: from the rim, carrying the lobe on outward, curving a little in toward the other lobe, fanning
       toward the ends, longest mid-lobe */
    let teeth = '';
    for (let i = 0; i <= 17; i++) { const u = -.92 + 1.84 * i / 17, b = at(u, 1), len = .3 + .32 * (1 - u * u), d = [w[0] * .97 - n[0] * .25 + u * .2, w[1] * .97 - n[1] * .25, w[2] * .97 - n[2] * .25], m = [b[0] + d[0] * len * .5, b[1] + w[1] * len * .55, b[2] + w[2] * len * .55], e = [b[0] + d[0] * len, b[1] + d[1] * len, b[2] + d[2] * len]; teeth += `M${P(b)}Q${P(m)} ${P(e)}`; }
    /* three trigger hairs on the inside, standing toward the other lobe */
    const hairs = [[-.42, .42], [.02, .5], [.44, .4]].map(([u, v]) => { const b = at(u, v), t = [b[0] - n[0] * .16, b[1] - n[1] * .16, b[2] - n[2] * .16]; return { d: `M${P(b)}L${P(t)}`, tip: cam.to(t).map(r) }; });
    /* nectar, beaded just inside the rim */
    const nectar = Array.from({ length: 9 }, (_, i) => cam.to(at(-.75 + 1.5 * i / 8, .9, -.01)).map(r));
    /* a line across the lobe for its colour to follow: from the midrib to the rim's middle */
    const across = [...cam.to(at(0, 0)), ...cam.to(at(0, 1))].map(r);
    return { face, shell, inside, rim: `M${edge.map(P).join('L')}`, teeth, hairs, nectar, across, z: cam.depth(mid) };
  };
  const lobes = [lobe(1), lobe(-1)].sort((p, q) => p.z - q.z);
  /* the stalk: a neck from the hinge's end, widening into the flat leaf that runs off the card */
  const st = [[-LH - .04, 0, 0], [-LH - .32, -.22, -.05], [-LH - .78, -.6, -.1], [-LH - 1.35, -1.1, -.14], [-LH - 2.1, -1.75, -.18]];
  const half = [.035, .07, .2, .33, .42];
  const wing = (/** @type {number} */ side) => st.map((q, i) => [q[0] - side * half[i] * .63, q[1] + side * half[i] * .78, q[2]]);
  const stalk = `M${wing(1).map(P).join('L')}L${wing(-1).reverse().map(P).join('L')}Z`, vein = `M${st.map(P).join('L')}`;
  return { lobes, stalk, vein, hinge: `M${P([-LH, 0, 0])}L${P([LH, 0, 0])}` };
}
/** The flytrap card's camera and its trap's two openings: waiting open, and snapped shut. */
export const TRAP = { W: 365, H: 350, k: 82, ox: 206, oy: 176, az: -.3, el: 1.36, open: 44 * Math.PI / 180, shut: 3 * Math.PI / 180 };

/** The Magnets card: a bar magnet in a 365 × 350 picture, its poles as two charges just inside its ends, and the iron
    filings round it, placed the same way every time. Each filing: where it lies, how long and heavy it is, and the
    small scatter it keeps where the field is weak. */
export const BAR = { W: 365, H: 350, cx: 182.5, cy: 196, len: 128, h: 32, q: 54 };
/** the field at (x, y) from the bar, and from a pole at the pointer if there is one (p: [x, y, strength])
    @param {number} x @param {number} y @param {number[] | null} p @returns {[number, number]} */
export function barField(x, y, p = null) {
  let bx = 0, by = 0;
  for (const [qx, s] of [[BAR.cx + BAR.q, 1], [BAR.cx - BAR.q, -1]]) { const dx = x - qx, dy = y - BAR.cy, r3 = Math.pow(dx * dx + dy * dy + 40, 1.5); bx += s * dx / r3; by += s * dy / r3; }
  if (p && p[2]) { const dx = x - p[0], dy = y - p[1], r3 = Math.pow(dx * dx + dy * dy + 60, 1.5); bx -= p[2] * dx / r3; by -= p[2] * dy / r3; }
  return [bx, by];
}
/** The filings, as iron settles: in chains along the field's lines, traced out from each pole, a few loose ones between,
    thinning away from the bar. @returns {{ x: number, y: number, len: number, w: number, a: number, jit: number }[]} */
export function filings() {
  let seed = 23; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  /** @type {{ x: number, y: number, len: number, w: number, a: number, jit: number }[]} */ const out = [];
  const clear = (/** @type {number} */ x, /** @type {number} */ y) => (Math.abs(x - BAR.cx) < BAR.len / 2 + 4 && Math.abs(y - BAR.cy) < BAR.h / 2 + 4) || (x < 176 && y < 70) || (x > BAR.W - 46 && y < 46);
  const strength = (/** @type {number} */ x, /** @type {number} */ y) => { const [bx, by] = barField(x, y); return Math.hypot(bx, by) * 2500; };
  const add = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ len) => { if (clear(x, y)) return; const b = strength(x, y); out.push({ x, y, len, w: rnd() < .2 ? 1.5 : 1.1, a: b > 1.2 ? 2 : b > .35 ? 1 : 0, jit: (rnd() - .5) * 1.2 / (1 + b * 4) }); };
  /* chains: a line traced from each pole, iron laid along it in short pieces with gaps */
  for (const [px, dir] of [[BAR.cx + BAR.q, 1], [BAR.cx - BAR.q, -1]]) {
    for (let i = 0; i < 46; i++) {
      /* from a ring round the pole, wherever it is clear of the bar */
      const t = (i + rnd() * .6) / 46 * 2 * Math.PI; let x = px + Math.cos(t) * 26, y = BAR.cy + Math.sin(t) * 26;
      if (Math.abs(x - BAR.cx) < BAR.len / 2 + 3 && Math.abs(y - BAR.cy) < BAR.h / 2 + 3) continue;
      let gap = rnd() * 4, run = 0, travelled = 0;
      for (let n = 0; n < 900; n++) {
        const [bx, by] = barField(x, y), m = Math.hypot(bx, by) || 1, sx = dir * bx / m * 1.5, sy = dir * by / m * 1.5;
        const [cx2, cy2] = barField(x + sx / 2, y + sy / 2), m2 = Math.hypot(cx2, cy2) || 1;
        x += dir * cx2 / m2 * 1.5; y += dir * cy2 / m2 * 1.5; travelled += 1.5;
        if (x < -10 || y < -10 || x > BAR.W + 10 || y > BAR.H + 10 || (Math.abs(x - BAR.cx) < BAR.len / 2 && Math.abs(y - BAR.cy) < BAR.h / 2)) break;
        /* far out the lines spread apart, so the chain thins: pieces get rarer with distance */
        run += 1.5; if (run < gap) continue;
        const len = 3.4 + rnd() * 3.4, far = Math.hypot(x - BAR.cx, (y - BAR.cy) * 1.3);
        if (rnd() < Math.min(.8, far / 460)) { gap = run + len + 2 + rnd() * 4; continue; }
        add(x + (rnd() - .5) * 1.6, y + (rnd() - .5) * 1.6, len); gap = run + len + 1.8 + rnd() * 3.6;
      }
    }
  }
  /* and some lying loose between the chains */
  for (let i = 0; i < 260; i++) { const x = rnd() * BAR.W, y = rnd() * BAR.H; if (rnd() < .55 + .45 * Math.min(1, Math.pow(strength(x, y), .7))) add(x, y, 2.8 + rnd() * 3); }
  return out;
}

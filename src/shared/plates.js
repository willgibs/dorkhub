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

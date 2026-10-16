/* ================= Black holes: the disk, as Luminet first drew it =================
   A black hole with a thin disk of gas around it, seen from 10° above the disk, as Jean-Pierre Luminet first
   computed and drew one in 1979 (Astronomy & Astrophysics 75, 228): dots of ink, closer together where the disk
   shines brighter. Here every dot is placed the same way, by tracing light back from the picture to where it left
   the disk, around a hole of mass M (Schwarzschild; units of M throughout):
   - a ray's path bends by u'' = 3u² − u (u = 1/r), integrated once for each impact parameter b;
   - it meets the disk's plane where its own plane of travel crosses it: first in front of the hole, or over it for
     the far side (the primary image), then again after swinging round (the secondary image, a thin ring hugging
     the shadow);
   - the disk shines by Page & Thorne's flux (nothing inside 6M, where orbits stop being stable), dimmed or boosted
     by (1 + z)⁴ for its gravity and its motion, so the side coming toward you is brighter.
   The brightness becomes dots by error diffusion, the way Luminet's hand followed his numbers. Build time only. */

const EL = 10 * Math.PI / 180;   // the observer's height above the disk's plane
const R_IN = 6, R_OUT = 200;     // the disk, from the innermost stable orbit out past the picture's edges
const SHADOW = 3 * Math.sqrt(3); // rays closer than this fall in
const SQ3 = Math.sqrt(3), SQ6 = Math.sqrt(6);
/** Page & Thorne's flux from a thin disk round a Schwarzschild hole (M = 1), up to a constant @param {number} r */
const flux = r => (r <= R_IN ? 0 : (Math.sqrt(r) - SQ6 + (SQ3 / 3) * Math.log(((Math.sqrt(r) + SQ3) * (SQ6 - SQ3)) / ((Math.sqrt(r) - SQ3) * (SQ6 + SQ3)))) / ((r - 3) * r ** 2.5));

/* ---------- rays, traced once per impact parameter ---------- */
const DPHI = .002, NPHI = Math.ceil(3 * Math.PI / DPHI) + 2;
const B0 = 1, DB = .02, NB = Math.ceil((60 - B0) / DB) + 1;
/** u(φ) along a ray that reached the observer with impact parameter b, traced back from φ = 0; NaN once it has
    fallen in (r ≤ 2) or got away again @param {number} b */
function ray(b) {
  const u = new Float32Array(NPHI).fill(NaN); let y = 0, v = 1 / b; u[0] = 0;
  const f = (/** @type {number} */ q) => 3 * q * q - q, h = DPHI;
  for (let i = 1; i < NPHI; i++) {
    const k1y = v, k1v = f(y), k2y = v + h / 2 * k1v, k2v = f(y + h / 2 * k1y), k3y = v + h / 2 * k2v, k3v = f(y + h / 2 * k2y), k4y = v + h * k3v, k4v = f(y + h * k3y);
    y += h / 6 * (k1y + 2 * k2y + 2 * k3y + k4y); v += h / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
    if (y >= .5 || y <= 0) break;
    u[i] = y;
  }
  return u;
}
/** @type {Float32Array[] | null} */ let RAYS = null;
const rays = () => (RAYS = RAYS || Array.from({ length: NB }, (_, j) => ray(B0 + j * DB)));
/** u at angle φ for impact parameter b, between the traced rays; NaN where either has fallen in or got away
    @param {number} b @param {number} phi */
function uAt(b, phi) {
  const R = rays(), jf = (b - B0) / DB, j = Math.floor(jf), i = phi / DPHI, ii = Math.floor(i);
  if (j < 0 || j >= NB - 1 || ii < 0 || ii >= NPHI - 1) return NaN;
  const t = jf - j, s = i - ii, a = R[j], c = R[j + 1];
  return (1 - t) * ((1 - s) * a[ii] + s * a[ii + 1]) + t * ((1 - s) * c[ii] + s * c[ii + 1]);
}

/** What the picture shows at (x, y), in units of M with y up: where the ray came from (the disk at radius r, the
    shadow, or the sky), which image it is, and the disk's brightness there @param {number} x @param {number} y
    @returns {{ at: 'disk', r: number, img: number, f: number } | { at: 'shadow' | 'sky' }} */
export function trace(x, y) {
  const b = Math.hypot(x, y) || 1e-6;
  /* the ray's plane holds the line of sight and the point; it crosses the disk's plane at φ0, then every π */
  const phi0 = Math.atan2(y * Math.cos(EL) / b, Math.sin(EL)) + Math.PI / 2;
  for (let k = 0; k < 2; k++) {
    const u = uAt(b, phi0 + k * Math.PI);
    if (!(u > 0)) return { at: b < SHADOW + .05 ? 'shadow' : 'sky' };
    const r = 1 / u;
    if (r >= R_IN && r <= R_OUT) {
      /* its light shifted by the hole's gravity and the gas's orbit (Ω = r^-3/2); this ray's angular momentum about
         the disk's axis is −x cos EL, so gas on the left (x < 0) is coming toward you */
      const z1 = (1 + x * Math.cos(EL) * r ** -1.5) / Math.sqrt(1 - 3 / r);
      return { at: 'disk', r, img: k, f: flux(r) / z1 ** 4 };
    }
  }
  return { at: 'sky' };
}

/** the picture's point at disk radius r along the direction α in the picture, primary image (k = 0), found by
    bisection on b; null if that radius isn't seen there @param {number} r @param {number} a */
function onDisk(r, a) {
  const at = (/** @type {number} */ b) => { const x = b * Math.cos(a), y = b * Math.sin(a), phi0 = Math.atan2(y * Math.cos(EL) / b, Math.sin(EL)) + Math.PI / 2, u = uAt(b, phi0); return u > 0 ? 1 / u : Infinity; };
  /* in front of the hole a ray can cross the disk before it would have fallen in; over it, only past the shadow */
  let lo = B0 + DB, hi = 58; if (!(at(lo) < r)) lo = SHADOW + .02; if (at(lo) > r || at(hi) < r) return null;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (at(m) < r) lo = m; else hi = m; }
  return [lo * Math.cos(a), lo * Math.sin(a)];
}

/** the picture's point at disk radius r along α in the secondary image (k = 1): light that went round the hole,
    a thin ring hugging the shadow @param {number} r @param {number} a */
function underDisk(r, a) {
  const at = (/** @type {number} */ b) => { const y = b * Math.sin(a), phi0 = Math.atan2(y * Math.cos(EL) / b, Math.sin(EL)) + Math.PI / 2, u0 = uAt(b, phi0), u = uAt(b, phi0 + Math.PI); return u0 > 0 && 1 / u0 >= R_IN && 1 / u0 <= R_OUT ? NaN : u > 0 ? 1 / u : NaN; };
  /* just past the shadow the ray winds round and lands close in; a little further out, further out on the disk,
     until it gets away before crossing again: walk out from the shadow to the first ray that lands at r or beyond */
  let lo = NaN;
  for (let b = SHADOW + .002; b < SHADOW + 4; b += .004) {
    const v = at(b);
    if (v < r) { lo = b; continue; }
    if (!(v >= r) || Number.isNaN(lo)) return null;
    let hi = b; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (at(m) < r) lo = m; else hi = m; }
    return [hi * Math.cos(a), hi * Math.sin(a)];
  }
  return null;
}

/** a seeded generator, so the drawing only changes when its code does @param {number} seed */
const rng = seed => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

/** The plate: SVG markup in a viewBox of W × H (half-pixel units: twice the card's size in CSS pixels), the hole at
    (cx, cy), `px` pixels (viewBox units) to one M. Returns the parts the card composes.
    @param {{ W: number, H: number, cx: number, cy: number, px: number, pitch?: number, gamma?: number, hot?: number, floor?: number, seed?: number }} o */
export function luminet({ W, H, cx, cy, px, pitch = 4.4, gamma = 1.25, hot = .45, floor = .02, seed = 7 }) {
  const r = rng(seed);
  /* the brightness at each cell of a grid at the dots' pitch, turned 29° so its rows never line up with the
     picture's, and the disk radius each cell's light came from */
  const th = 29 * Math.PI / 180, co = Math.cos(th), si = Math.sin(th), half = Math.hypot(W, H) / 2;
  const nx = Math.ceil(2 * half / pitch), ny = nx;
  /** the picture's point at a cell's (u, v) @param {number} u @param {number} v @returns {[number, number]} */
  const at = (u, v) => { const a = u * pitch - half, b = v * pitch - half; return [W / 2 + a * co - b * si, H / 2 + a * si + b * co]; };
  const val = new Float32Array(nx * ny), rad = new Float32Array(nx * ny), img = new Uint8Array(nx * ny);
  let max = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const [X0, Y0] = at(i + .5, j + .5); if (X0 < -pitch || Y0 < -pitch || X0 > W + pitch || Y0 > H + pitch) continue;
    /* average a few samples per cell, so thin features keep their weight */
    let s = 0, rr = 0, n = 0, k1 = 0;
    for (const [ox, oy] of [[.25, .25], [.75, .25], [.25, .75], [.75, .75]]) {
      const [X, Y] = at(i + ox, j + oy), t = trace((X - cx) / px, (cy - Y) / px);
      if (t.at === 'disk') { s += t.f; rr += t.r; n++; if (t.img) k1++; }
    }
    const c = j * nx + i; val[c] = s / 4; rad[c] = n ? rr / n : 0; img[c] = k1 > n / 2 ? 1 : 0; if (val[c] > max) max = val[c];
  }
  /* how dense the ink is: brightness against a share of the brightest (so the hottest part saturates), on a gentle
     curve, and nothing where the disk has all but faded */
  const ref = max * hot;
  const tone = (/** @type {number} */ v) => { const d = Math.min(1, (v / ref) ** gamma); return d < floor ? 0 : d; };
  /* error diffusion (serpentine Floyd–Steinberg) of that density to dots, each nudged off its cell */
  /** @type {[number, number, number, number][]} */ const dots = [];
  const e = Float32Array.from(val, tone), dens = Float32Array.from(e);
  for (let j = 0; j < ny; j++) {
    const ltr = j % 2 === 0;
    for (let q = 0; q < nx; q++) {
      const i = ltr ? q : nx - 1 - q, c = j * nx + i, old = e[c], on = old >= .5 ? 1 : 0, err = old - on, d = ltr ? 1 : -1;
      if (on && val[c] > 0) { const [X, Y] = at(i + .5 + (r() - .5) * .8, j + .5 + (r() - .5) * .8); if (X >= 0 && Y >= 0 && X <= W && Y <= H) dots.push([X, Y, img[c] ? 0 : rad[c], dens[c]]); }
      if (i + d >= 0 && i + d < nx) e[c + d] += err * 7 / 16;
      if (j + 1 < ny) { if (i - d >= 0 && i - d < nx) e[c + nx - d] += err * 3 / 16; e[c + nx] += err * 5 / 16; if (i + d >= 0 && i + d < nx) e[c + nx + d] += err / 16; }
    }
  }
  /** is the disk drawn at the picture's (X, Y)? @param {number} X @param {number} Y */
  const inked = (X, Y) => { const a = (X - W / 2) * co + (Y - H / 2) * si + half, b = -(X - W / 2) * si + (Y - H / 2) * co + half, i = Math.floor(a / pitch), j = Math.floor(b / pitch); return i >= 0 && j >= 0 && i < nx && j < ny && dens[j * nx + i] > 0; };
  /* the curves of equal radius on the disk (primary image), Luminet's other plate: 6, 10, 16 and 26 M */
  const iso = [6, 10, 16, 26].map(R => {
    /** @type {[number, number, number][]} */ const p = [];
    for (let a = 0; a <= 360; a += 2) { const q = onDisk(R, a * Math.PI / 180); if (q) p.push([cx + q[0] * px, cy - q[1] * px, a]); }
    return p;
  });
  /* the secondary image's inner edge, drawn as the thin bright ring it is; in front of the hole the near side
     hides it */
  /** @type {[number, number][][]} */ const ring = [[]];
  for (let a = 0; a <= 360; a += 1.5) {
    const q = underDisk(R_IN, a * Math.PI / 180), cur = ring[ring.length - 1];
    if (!q) { if (cur.length) ring.push([]); continue; }
    const X = cx + q[0] * px, Y = cy - q[1] * px, t = trace((X - cx) / px, (cy - Y) / px);
    if (t.at === 'disk' && !t.img) { if (cur.length) ring.push([]); continue; }
    cur.push([X, Y]);
  }
  /* stars far behind, each seen where the hole's lensing puts it (a point lens, its ring at 9 M), the faint second
     image too; none in the shadow, nor where the disk is drawn (beyond that it has faded to nothing), nor behind the
     card's title */
  /** @type {[number, number, number][]} */ const stars = [];
  const TE = 9;
  for (let n = 0; n < 6000 && stars.length < 170; n++) {
    const bx = (r() - .5) * W / px * 1.2, by = (r() - .5) * H / px * 1.2, B = Math.hypot(bx, by) || 1, m = r();
    for (const sgn of [1, -1]) {
      const T = (B + sgn * Math.sqrt(B * B + 4 * TE * TE)) / 2, X = cx + bx / B * T * px, Y = cy - by / B * T * px;
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      if (trace((X - cx) / px, (cy - Y) / px).at === 'shadow' || inked(X, Y) || (X < 560 && Y < 260)) continue;
      stars.push([X, Y, sgn > 0 ? m : m * .35]);
    }
  }
  return { dots, iso, ring: ring.filter(p => p.length > 2), stars, shadow: SHADOW * px };
}

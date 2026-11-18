// Pompeii's card, drawn from OpenStreetMap's survey of the ruins: the town inside its walls, every wall the survey maps
// in ink, and the part never dug left as ash. Writes lib/plates/pompeii.js, which the build reads (the build itself never
// fetches anything). Run it again only to take a newer survey:
//   node scripts/plates/pompeii.mjs            fetch the survey from the Overpass API (one request, a generic User-Agent)
//   node scripts/plates/pompeii.mjs <file>     draw from a survey saved before (Overpass JSON, `out geom`)
// Map data © OpenStreetMap contributors, under the Open Database Licence: the card credits it, and /licenses.txt.
//
// What is dug is what the survey shows dug: within 16 m of a surveyed wall, inside a surveyed building, insula or garden
// numbered as one, or on a paved ancient street; the rest of the circuit is still buried (about 30% by the survey;
// Wikipedia: two-thirds of the city has been excavated). Each dug quarter comes out of the ash in the order it was dug
// (Wikipedia, Pompeii; Amphitheatre of Pompeii; Scavi archeologici di Pompei):
//   1748 to 1799   the amphitheatre (first dug in 1748) and the theatre quarter, regio VIII (the Temple of Isis, 1764–66)
//   1800 to 1862   regiones VI and VII: the French joined the north and south digs; the Faun, 1830; the Tragic Poet, 1824
//   1863 to 1910   Fiorelli's regiones and insulae: regio IX (the Centenary, 1879), and V and IV along the Via di Nola
//   1911 to 1961   regiones I, II and III, along the Via dell'Abbondanza and south of it to the wall (Maiuri, the 1950s)
//   since 2018     the rest of regio V, dug again under the Great Pompeii Project
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const out = fileURLToPath(new URL('../../lib/plates/pompeii.js', import.meta.url));
const BBOX = '40.7440,14.4760,40.7575,14.4990';
const Q = `[out:json][timeout:90];(way["barrier"](${BBOX});way["historic"](${BBOX});way["highway"](${BBOX});way["name"~"Insula|\\\\("](${BBOX});relation["historic"](${BBOX}););out geom;`;
async function survey() {
  if (process.argv[2]) return JSON.parse(readFileSync(process.argv[2], 'utf8'));
  for (const url of ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter']) {
    const r = await fetch(url, { method: 'POST', headers: { 'user-agent': 'map-sketch/1.0', 'content-type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(Q)}` }).catch(() => null);
    if (r && r.ok) return r.json();
    console.error(`${url}: ${r ? r.status : 'unreachable'}`);
  }
  throw new Error('the survey could not be fetched: try again later, or pass a saved one');
}
const j = /** @type {{ elements: any[] }} */ (await survey());

/* ---------- the survey, in metres on the ground (x east, y south) ---------- */
const lat0 = 40.7505, kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 110570;
/** @param {{ lat: number, lon: number }} g @returns {[number, number]} */
const M = g => [g.lon * kx, -g.lat * ky];
const ways = j.elements.filter(e => e.type === 'way' && e.geometry);
const circuit = ways.find(w => w.tags?.historic === 'citywalls' && w.geometry.length > 50);
if (!circuit) throw new Error('no city wall in the survey');
const ring = circuit.geometry.map(M);
/** @param {number[]} p @param {number[][]} poly */
const inside = ([x, y], poly) => { let c = false; for (let i = 0, k = poly.length - 1; i < poly.length; k = i++) { const [xi, yi] = poly[i], [xk, yk] = poly[k]; if ((yi > y) !== (yk > y) && x < (xk - xi) * (y - yi) / (yk - yi) + xi) c = !c; } return c; };
/** @param {any} w */ const mid = w => M(w.geometry[Math.floor(w.geometry.length / 2)]);
/** @param {any} w */ const closed = w => w.geometry.length > 3 && w.geometry[0].lat === w.geometry.at(-1).lat && w.geometry[0].lon === w.geometry.at(-1).lon;
const REG = /^(Regio [IVX]+|Scavi archeologici di Pompei)$/, NUMBERED = /Insula|\([IVX]+\.\d+/;
const town = (/** @type {any} */ w) => inside(mid(w), ring);
const walls = ways.filter(w => w.tags?.barrier === 'wall' && town(w)).map(w => w.geometry.map(M));
const builtWays = ways.filter(w => closed(w) && town(w) && !REG.test(w.tags?.name || '') && (w.tags?.historic || w.tags?.highway === 'pedestrian' || NUMBERED.test(w.tags?.name || '')));
const built = builtWays.map(w => w.geometry.map(M));
const rels = j.elements.filter(e => e.type === 'relation' && e.tags?.historic && !REG.test(e.tags?.name || ''));
const relRings = rels.flatMap(r => (r.members || []).filter((/** @type {any} */ m) => m.geometry && m.geometry.length > 3).map((/** @type {any} */ m) => ({ outer: m.role === 'outer', name: r.tags.name || '', pts: m.geometry.map(M) }))).filter(m => inside(m.pts[Math.floor(m.pts.length / 2)], ring));
const paved = ways.filter(w => w.tags?.highway === 'pedestrian' && !closed(w) && town(w)).map(w => w.geometry.map(M));
const regiones = ways.filter(w => /^Regio [IVX]+$/.test(w.tags?.name || '')).map(w => ({ name: w.tags.name.slice(6), pts: w.geometry.map(M) }));
const nola = ways.filter(w => w.tags?.highway === 'pedestrian' && /^Via (di )?Nola$/.test(w.tags?.name || '')).map(w => w.geometry.map(M));
const amph = relRings.find(m => m.outer && /Anfiteatro/i.test(m.name));
const forum = builtWays.find(w => /^Foro di Pompei/.test(w.tags?.name || ''));
if (regiones.length < 9 || !amph || !forum || !nola.length) throw new Error('the survey lacks a regio, the amphitheatre, the forum or the Via di Nola');

/* ---------- dug or buried, on a 5 m grid over the circuit ---------- */
const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]);
const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
const C = 5, nx = Math.ceil((x1 - x0) / C), ny = Math.ceil((y1 - y0) / C);
const OUT = 0, BURIED = 1, DUG = 2;
const grid = new Uint8Array(nx * ny);
const cx = (/** @type {number} */ a) => x0 + (a + .5) * C, cy = (/** @type {number} */ b) => y0 + (b + .5) * C;
for (let b = 0; b < ny; b++) for (let a = 0; a < nx; a++) if (inside([cx(a), cy(b)], ring)) grid[b * nx + a] = BURIED;
/** @param {number} x @param {number} y @param {number} r */
const dig = (x, y, r) => { for (let b = Math.max(0, Math.floor((y - r - y0) / C)); b <= Math.min(ny - 1, Math.floor((y + r - y0) / C)); b++) for (let a = Math.max(0, Math.floor((x - r - x0) / C)); a <= Math.min(nx - 1, Math.floor((x + r - x0) / C)); a++) if (grid[b * nx + a] && (cx(a) - x) ** 2 + (cy(b) - y) ** 2 <= r * r) grid[b * nx + a] = DUG; };
/** @param {number[][][]} lines @param {number} r */
const digAlong = (lines, r) => { for (const w of lines) for (let k = 1; k < w.length; k++) { const [ax, ay] = w[k - 1], [bx, by] = w[k], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 3)); for (let t = 0; t <= n; t++) dig(ax + (bx - ax) * t / n, ay + (by - ay) * t / n, r); } };
digAlong(walls, 16); digAlong(paved, 11);
for (const p of [...built, ...relRings.filter(m => m.outer).map(m => m.pts)]) {
  const px = p.map(q => q[0]), py = p.map(q => q[1]);
  for (let b = Math.max(0, Math.floor((Math.min(...py) - y0) / C)); b <= Math.min(ny - 1, Math.floor((Math.max(...py) - y0) / C)); b++) for (let a = Math.max(0, Math.floor((Math.min(...px) - x0) / C)); a <= Math.min(nx - 1, Math.floor((Math.max(...px) - x0) / C)); a++) if (grid[b * nx + a] && inside([cx(a), cy(b)], p)) grid[b * nx + a] = DUG;
}

/* ---------- when each dug cell came out of the ash ---------- */
const ERA = /** @type {Record<string, number>} */ ({ VIII: 0, VI: 1, VII: 1, IX: 2, IV: 2, V: 2, I: 3, II: 3, III: 3 });
/** distance from a point to the Via di Nola @param {number} x @param {number} y */
const fromNola = (x, y) => Math.min(...nola.flatMap(w => w.slice(1).map((q, k) => { const [ax, ay] = w[k], [bx, by] = q, L = (bx - ax) ** 2 + (by - ay) ** 2, t = L ? Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / L)) : 0; return Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)); })));
/** @param {number} x @param {number} y */
function eraAt(x, y) {
  if (inside([x, y], amph.pts)) return 0;
  const r = regiones.find(g => inside([x, y], g.pts)); if (!r) return 1;
  if (r.name === 'V' && fromNola(x, y) > 45) return 4;
  return ERA[r.name] ?? 1;
}
const era = new Int8Array(nx * ny).fill(-1);
for (let b = 0; b < ny; b++) for (let a = 0; a < nx; a++) if (grid[b * nx + a] === DUG) era[b * nx + a] = eraAt(cx(a), cy(b));

/* ---------- to the card: 365 × 350, in half-pixel units, the town under the title ---------- */
const U = 2, W = 365 * U, H = 350 * U, side = 12 * U, top = 92 * U, bottom = 26 * U;
const s = Math.min((W - 2 * side) / (x1 - x0), (H - top - bottom) / (y1 - y0));
const ox = (W - (x1 - x0) * s) / 2, oy = top + (H - top - bottom - (y1 - y0) * s) / 2;
/** @param {number[]} p @returns {[number, number]} */
const P = ([x, y]) => [ox + (x - x0) * s, oy + (y - y0) * s];
/** Douglas-Peucker, a closed ring cut at its farthest point first @param {number[][]} pts @param {number} tol @returns {number[][]} */
function simplify(pts, tol) {
  const dp = (/** @type {number[][]} */ q) => { if (q.length < 3) return q; const [ax, ay] = q[0], [bx, by] = q.at(-1) || q[0], L = Math.hypot(bx - ax, by - ay) || 1; let best = 0, at = 0; for (let i = 1; i < q.length - 1; i++) { const d = Math.abs((bx - ax) * (ay - q[i][1]) - (ax - q[i][0]) * (by - ay)) / L; if (d > best) { best = d; at = i; } } return best > tol ? [...dp(q.slice(0, at + 1)).slice(0, -1), ...dp(q.slice(at))] : [q[0], q.at(-1) || q[0]]; };
  const a = pts[0], b = pts.at(-1) || a;
  if (pts.length < 4 || Math.hypot(a[0] - b[0], a[1] - b[1]) > 1e-6) return dp(pts);
  let far = 1, fd = 0; pts.forEach((p, i) => { const d = Math.hypot(p[0] - a[0], p[1] - a[1]); if (d > fd) { fd = d; far = i; } });
  return [...dp(pts.slice(0, far + 1)).slice(0, -1), ...dp(pts.slice(far))];
}
const length = (/** @type {number[][]} */ pts) => pts.reduce((t, p, i) => (i ? t + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
/** relative path data: numbers in whole units, a minus sign standing for the space before it
    @param {number[][][]} strokes @param {boolean} [closeEach] */
function pathOf(strokes, closeEach = false) {
  let d = '', cur = [0, 0];
  const n = (/** @type {number} */ v, /** @type {boolean} */ lead) => (lead || v < 0 ? '' : ' ') + v;
  const left = new Set(strokes.map((_, i) => i));
  while (left.size) {
    let bi = -1, bd = Infinity, rev = false;
    for (const i of left) { const st = strokes[i]; for (const [p, r] of /** @type {[number[], boolean][]} */ ([[st[0], false], [st.at(-1) || st[0], true]])) { const dd = Math.abs(p[0] - cur[0]) + Math.abs(p[1] - cur[1]); if (dd < bd) { bd = dd; bi = i; rev = r && !closeEach; } } }
    left.delete(bi); const c = rev ? strokes[bi].slice().reverse() : strokes[bi];
    /* every move is relative, the first from the origin, so the pairs after it are relative lines too */
    d += `m${n(c[0][0] - cur[0], true)}${n(c[0][1] - cur[1])}`;
    for (let k = 1; k < c.length; k++) d += `${n(c[k][0] - c[k - 1][0])}${n(c[k][1] - c[k - 1][1])}`;
    if (closeEach) d += 'z';
    cur = closeEach ? c[0] : c.at(-1) || c[0];
  }
  return d;
}
/** lines walked as few strokes as their corners allow, on whole units @param {number[][][]} lines */
function strokesOf(lines) {
  /** @type {Map<string, number>} */ const id = new Map(); /** @type {number[][]} */ const pts = []; /** @type {number[][]} */ const adj = []; /** @type {number[][]} */ const edges = [];
  const node = (/** @type {number[]} */ p) => { const k = `${p[0]},${p[1]}`; let i = id.get(k); if (i === undefined) { i = pts.length; id.set(k, i); pts.push(p); adj.push([]); } return i; };
  const seen = new Set();
  for (const l of lines) { const q = l.map(p => [Math.round(p[0]), Math.round(p[1])]); for (let k = 1; k < q.length; k++) { const a = node(q[k - 1]), b = node(q[k]); if (a === b) continue; const e = a < b ? `${a}-${b}` : `${b}-${a}`; if (seen.has(e)) continue; seen.add(e); adj[a].push(edges.length); adj[b].push(edges.length); edges.push([a, b]); } }
  const used = new Uint8Array(edges.length), deg = (/** @type {number} */ v) => adj[v].filter(e => !used[e]).length;
  const walk = (/** @type {number} */ v) => { const path = [v]; for (;;) { const e = adj[v].find(x => !used[x]); if (e === undefined) break; used[e] = 1; v = edges[e][0] === v ? edges[e][1] : edges[e][0]; path.push(v); } return path.map(i => pts[i]); };
  /** @type {number[][][]} */ const out = [];
  for (let pass = 0; pass < 2; pass++) for (let v = 0; v < pts.length; v++) while (deg(v) && (pass || deg(v) % 2)) out.push(walk(v));
  return out;
}

/* the lines: walls and the outlines of what the survey maps as built, simplified to what the card can show, an
   outline's stretch dropped where a wall already runs; each line goes with the quarter its middle lies in */
const MIN = 2 * U, TOL = .45 * U;
const wallLines = walls.map(w => simplify(w.map(P), TOL)).filter(w => length(w) >= MIN);
const cellOf = (/** @type {number[]} */ q) => { const x = x0 + (q[0] - ox) / s, y = y0 + (q[1] - oy) / s; return [Math.floor((x - x0) / C), Math.floor((y - y0) / C)]; };
/* where the walls run, on a grid of whole units, so an outline along them adds nothing */
const covered = new Set();
for (const w of wallLines) for (let k = 1; k < w.length; k++) { const [ax, ay] = w[k - 1], [bx, by] = w[k], n = Math.ceil(Math.hypot(bx - ax, by - ay)); for (let t = 0; t <= n; t++) covered.add(`${Math.round(ax + (bx - ax) * t / n)},${Math.round(ay + (by - ay) * t / n)}`); }
const near = (/** @type {number} */ x, /** @type {number} */ y) => { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (covered.has(`${Math.round(x) + dx},${Math.round(y) + dy}`)) return true; return false; };
/** @type {number[][][]} */ const outlineLines = [];
for (const p of [...built, ...relRings.map(m => m.pts)]) {
  const q = simplify(p.map(P), TOL); if (length(q) < MIN) continue;
  /* keep the runs not already drawn by a wall */
  let run = [q[0]];
  for (let k = 1; k < q.length; k++) {
    const [ax, ay] = q[k - 1], [bx, by] = q[k], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 2)); let drawn = 0;
    for (let t = 0; t <= n; t++) if (near(ax + (bx - ax) * t / n, ay + (by - ay) * t / n)) drawn++;
    if (drawn / (n + 1) > .8) { if (run.length > 1) outlineLines.push(run); run = [q[k]]; } else run.push(q[k]);
  }
  if (run.length > 1) outlineLines.push(run);
}
const lines = [...wallLines, ...outlineLines];
/** @type {number[][][][]} */ const byEra = [[], [], [], [], []];
for (const l of lines) {
  const m = l[Math.floor(l.length / 2)], [a, b] = cellOf(m); let e = era[Math.max(0, Math.min(ny - 1, b)) * nx + Math.max(0, Math.min(nx - 1, a))];
  if (e < 0) { const [x, y] = [x0 + (m[0] - ox) / s, y0 + (m[1] - oy) / s]; e = eraAt(x, y); }
  byEra[e].push(l);
}
const walled = byEra.map(ls => pathOf(strokesOf(ls)));

/* ---------- the ash: each quarter's dug ground, and the ground never dug ----------
   Every cell has a label: outside, never dug, or the quarter it was dug in. Each run of cell edges between two labels is
   simplified once, so neighbouring regions share exactly the same edge and no seam shows between them as the ash clears. */
const kind = new Int8Array(nx * ny);
for (let k = 0; k < nx * ny; k++) kind[k] = grid[k] === OUT ? -1 : grid[k] === BURIED ? 5 : era[k];
const lab = (/** @type {number} */ a, /** @type {number} */ b) => (a < 0 || b < 0 || a >= nx || b >= ny ? -1 : kind[b * nx + a]);
const vkey = (/** @type {number} */ a, /** @type {number} */ b) => b * (nx + 1) + a;
const vpt = (/** @type {number} */ v) => P([x0 + (v % (nx + 1)) * C, y0 + Math.floor(v / (nx + 1)) * C]);
/* the boundary: edges between grid vertices, each with the pair of labels it parts */
/** @type {Map<number, { to: number, pair: string, id: number }[]>} */ const inc = new Map();
let edgeCount = 0;
const edge = (/** @type {number} */ u, /** @type {number} */ v, /** @type {number} */ l1, /** @type {number} */ l2) => { if (l1 === l2) return; const pair = l1 < l2 ? `${l1}|${l2}` : `${l2}|${l1}`, id = edgeCount++; (inc.get(u) || inc.set(u, []).get(u) || []).push({ to: v, pair, id }); (inc.get(v) || inc.set(v, []).get(v) || []).push({ to: u, pair, id }); };
for (let b = 0; b <= ny; b++) for (let a = 0; a <= nx; a++) {
  if (a < nx) edge(vkey(a, b), vkey(a + 1, b), lab(a, b - 1), lab(a, b));
  if (b < ny) edge(vkey(a, b), vkey(a, b + 1), lab(a - 1, b), lab(a, b));
}
const junction = (/** @type {number} */ v) => { const e = inc.get(v) || []; return e.length !== 2 || e[0].pair !== e[1].pair; };
/** which of a run's points Douglas-Peucker keeps, its ends always @param {number[][]} q @param {number} tol @returns {number[]} */
const keep = (q, tol) => { if (q.length < 3) return q.map((_, i) => i); const [ax, ay] = q[0], [bx, by] = q.at(-1) || q[0], L = Math.hypot(bx - ax, by - ay); let best = 0, at = 0; for (let i = 1; i < q.length - 1; i++) { const d = L ? Math.abs((bx - ax) * (ay - q[i][1]) - (ax - q[i][0]) * (by - ay)) / L : Math.hypot(q[i][0] - ax, q[i][1] - ay); if (d > best) { best = d; at = i; } } return best > tol ? [...keep(q.slice(0, at + 1), tol).slice(0, -1), ...keep(q.slice(at), tol).map(i => i + at)] : [0, q.length - 1]; };
/* the ash's edges bound only its dots, so they may stray up to 1.5 px from the cells' */
const ASH_TOL = 1.5 * U, kept = new Set(), walked = new Set();
/** walk a run from v along an edge until a junction, or back to where it began @param {number} v @param {{ to: number, id: number }} e */
const run = (v, e) => { const vs = [v]; for (;;) { walked.add(e.id); v = e.to; vs.push(v); if (junction(v) || v === vs[0]) return vs; const nx2 = (inc.get(v) || []).find(x => !walked.has(x.id)); if (!nx2) return vs; e = nx2; } };
const runs = [];
for (const [v, es] of inc) if (junction(v)) for (const e of es) if (!walked.has(e.id)) runs.push(run(v, e));
for (const [v, es] of inc) for (const e of es) if (!walked.has(e.id)) { const r = run(v, e); kept.add(r[0]); runs.push(r); }
for (const r of runs) {
  /* a run that closes on itself keeps its start and its farthest point, and each half is simplified */
  const q = r.map(vpt);
  if (r[0] === r.at(-1) && r.length > 3) { let far = 1, fd = 0; q.forEach((p, i) => { const d = Math.hypot(p[0] - q[0][0], p[1] - q[0][1]); if (d > fd) { fd = d; far = i; } }); for (const i of keep(q.slice(0, far + 1), ASH_TOL)) kept.add(r[i]); for (const i of keep(q.slice(far), ASH_TOL)) kept.add(r[i + far]); }
  else for (const i of keep(q, ASH_TOL)) kept.add(r[i]);
}
/** the loops round the cells a test picks, along the cells' edges, through the kept vertices only @param {(k: number) => boolean} on */
function regionOf(on) {
  /** @type {Map<number, number[]>} */ const from = new Map();
  const add = (/** @type {number} */ u, /** @type {number} */ v) => { (from.get(u) || from.set(u, []).get(u) || []).push(v); };
  const at = (/** @type {number} */ a, /** @type {number} */ b) => a >= 0 && b >= 0 && a < nx && b < ny && on(b * nx + a);
  for (let b = 0; b < ny; b++) for (let a = 0; a < nx; a++) {
    if (!at(a, b)) continue;
    /* each edge runs with the region on its left */
    if (!at(a, b - 1)) add(vkey(a + 1, b), vkey(a, b));
    if (!at(a, b + 1)) add(vkey(a, b + 1), vkey(a + 1, b + 1));
    if (!at(a - 1, b)) add(vkey(a, b), vkey(a, b + 1));
    if (!at(a + 1, b)) add(vkey(a + 1, b + 1), vkey(a + 1, b));
  }
  /** @type {number[][][]} */ const loops = [];
  for (const [v0, list] of from) while (list.length) {
    const loop = [v0]; let cur = /** @type {number} */ (list.pop());
    while (cur !== v0) { loop.push(cur); const nx2 = from.get(cur); if (!nx2 || !nx2.length) break; cur = /** @type {number} */ (nx2.pop()); }
    const pts = loop.filter(v => kept.has(v)).map(v => vpt(v).map(Math.round)).filter((p, i, all) => !i || p[0] !== all[i - 1][0] || p[1] !== all[i - 1][1]);
    if (pts.length > 2 && length([...pts, pts[0]]) > 12 * U) loops.push(pts);
  }
  return pathOf(loops, true);
}
const ash = [0, 1, 2, 3, 4].map(e => regionOf(k => era[k] === e));
const buried = regionOf(k => grid[k] === BURIED);
let tin = 0, tb = 0; for (const g of grid) { if (g) tin++; if (g === BURIED) tb++; }

/* the grain the ash is drawn in: a tile of dots on a jittered lattice, 9 m apart as the mock had them */
let seed = 7; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const step = Math.round(9 * s * 10) / 10, tile = Math.round(step * 6);
let grain = '';
for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 6; gx++) grain += `M${Math.round((gx + .5 + (rnd() - .5) * .8) * tile / 6 * 10) / 10} ${Math.round((gy + .5 + (rnd() - .5) * .8) * tile / 6 * 10) / 10}h0`;

/* where to name the buried part: the buried cell farthest from anything that isn't buried, weighted to stay wide */
const dist = new Float32Array(nx * ny).fill(1e9);
for (let k = 0; k < nx * ny; k++) if (grid[k] !== BURIED) dist[k] = 0;
for (let pass = 0; pass < 2; pass++) for (let b0 = 0; b0 < ny; b0++) for (let a0 = 0; a0 < nx; a0++) {
  const b = pass ? ny - 1 - b0 : b0, a = pass ? nx - 1 - a0 : a0, k = b * nx + a; if (!dist[k]) continue;
  for (const [da, db, w] of [[-1, 0, 1], [0, -1, 1], [-1, -1, 1.414], [1, -1, 1.414]].map(([p, q, w]) => (pass ? [-p, -q, w] : [p, q, w]))) { const A = a + da, B = b + db, v = A < 0 || B < 0 || A >= nx || B >= ny ? 0 : dist[B * nx + A]; if (v + w < dist[k]) dist[k] = v + w; }
}
let lb = [0, 0], lbest = -1;
for (let b = 0; b < ny; b++) for (let a = 0; a < nx; a++) { const k = b * nx + a; if (grid[k] !== BURIED) continue; const l = Math.min(dist[k], dist[b * nx + Math.max(0, a - 10)], dist[b * nx + Math.min(nx - 1, a + 10)]); if (l > lbest) { lbest = l; lb = [a, b]; } }
const label = P([cx(lb[0]), cy(lb[1])]).map(Math.round);

/* what pointing reads: the forum and the amphitheatre by their own outlines */
const hull = (/** @type {number[][]} */ p) => pathOf([simplify(p.map(P), U).slice(0, -1).map(q => [Math.round(q[0]), Math.round(q[1])])], true);
const plan = {
  W, H, ring: pathOf([simplify(ring.map(P), .3 * U).slice(0, -1).map(q => [Math.round(q[0]), Math.round(q[1])])], true),
  walled, ash, buried, grain, tile, label, metres: Math.round(200 * s), forum: hull(forum.geometry.map(M)), amph: hull(amph.pts),
  still: Math.round(tb / tin * 100) / 100,
};
const kb = (/** @type {string} */ t) => `${(t.length / 1024).toFixed(1)} KB`;
console.log(`town ${(tin * C * C / 1e4).toFixed(1)} ha, buried ${(100 * tb / tin).toFixed(0)}%; lines ${walled.map(kb).join(' + ')}; ash ${kb(ash.join('') + buried)}; all ${kb(JSON.stringify(plan))}`);

writeFileSync(out, `/* ================= Pompeii: the town inside its walls, from the survey of its ruins =================
   Written by scripts/plates/pompeii.mjs from OpenStreetMap's survey (map data © OpenStreetMap contributors, under the
   Open Database Licence), on the card's frame in half-pixel units: the circuit of the walls; every surveyed wall and
   the outline of every surveyed building, as path data in the order their quarters were dug (1748 to 1799, 1800 to
   1862, 1863 to 1910, 1911 to 1961, since 2018); the ground each of those quarters covers, and the ground never dug,
   for the ash; the grain the ash is drawn in; where the buried part is named; 200 m on the card; the forum and the
   amphitheatre; and the share of the circuit still buried. Remake it with that script, never by hand. */
/** @type {{ W: number, H: number, ring: string, walled: string[], ash: string[], buried: string, grain: string, tile: number, label: number[], metres: number, forum: string, amph: string, still: number }} */
export const PLAN = ${JSON.stringify(plan)};
`);
console.log(`wrote ${out}`);

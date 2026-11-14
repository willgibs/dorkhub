/* ================= lamps: the dot face made physical =================
   Dorkhub's mark is a board of round lamps on a regular grid (docs/vision.md, Lamps). A lamp is unlit, a faint dot;
   lit, it is ink, or a kind's colour when what it reads out has a kind. The wordmark is ink at rest and its colour is
   earned: a lamp keeps a kind's colour only for a page this reader has read, and every other lamp holds a kind it shows
   only while colour passes through it (arriving, under the pointer, called out by the key). Where many kinds show at
   once they are scattered: no bands, no blend from one hue into the next, no red-to-violet order, which is what keeps
   the spectrum ours and not a flag's. A board rests: its lamps move once when something changes and then hold still,
   and while they hold still nothing is asked of the browser. */
import { KIND_HEX } from './01-data.js';
import { isDark, reducedMotion } from './02-util.js';
/* "dorkhub" as the dot face sets it: seven letters, each five lamps wide and one apart, on seven rows */
const MARK = [
  '....#.............#.....#...........#....',
  '....#.............#.....#...........#....',
  '.##.#..###..#.##..#...#.#.##..#...#.#.##.',
  '#..##.#...#.##..#.#..#..##..#.#...#.##..#',
  '#...#.#...#.#.....###...#...#.#...#.#...#',
  '#..##.#...#.#.....#..#..#...#.#..##.##..#',
  '.##.#..###..#.....#...#.#...#..##.#.#.##.',
];
/* a lit lamp's width in steps of the grid, an unlit one's size beside it, and the room kept around the grid for a lamp
   that swells; then the board's tempos, each named once: a lamp comes on in LIGHT ms, the last one starts SWEEP ms
   after the first; the word holds its colours HOLD ms once it is all on, then the lamps not owned cool to ink in FADE
   ms, the last starting STAGGER ms after the first; a lamp warms to the pointer in WARM ms and cools behind it in COOL;
   a kind is called out (and the rest hushed) in HUSH */
const LAMP = .86, DIM = .35, EDGE = 4, LIGHT = 320, SWEEP = 640, HOLD = 900, FADE = 800, STAGGER = 320, WARM = 45, COOL = 420, HUSH = 90, TAU = 6.283185307179586;
/* the order kinds are dealt and named in: neighbours on the colour wheel never stand together */
export const DEAL = ['concept', 'person', 'mechanism', 'thing', 'phenomenon', 'event', 'place', 'mystery'];
const BOARDS = new Set();
/* the wordmark lights across once a visit */
let LIT = false;
/* a lamp's place in the scatter: a lattice on the plastic number, which keeps a lamp's neighbours far from it in the
   order, so kinds dealt along it never bunch into a band */
const scatter = (c, r) => (c * .7548776662 + r * .569840291) % 1;
/* kinds dealt to lamps along the scatter by largest remainder of their weights ({ kind: weight }); with `one`, every
   kind named gets a lamp first */
const deal = (lamps, w, one) => {
  const ks = DEAL.filter(k => w[k] > 0), sum = ks.reduce((s, k) => s + w[k], 0), b = one && lamps.length >= ks.length ? 1 : 0;
  const q = ks.map(k => w[k] / sum * (lamps.length - b * ks.length)), n = q.map(x => b + Math.floor(x));
  q.map((x, i) => [x % 1, i]).sort((a, z) => z[0] - a[0]).slice(0, lamps.length - n.reduce((s, x) => s + x, 0)).forEach(([, i]) => n[i]++);
  let j = 0; ks.forEach((k, i) => { for (const e = j + n[i]; j < e; j++) lamps[j].k = k; });
};
/** @param {string} s a colour as '#rrggbb' or 'rgb(r, g, b)' */
const rgb = s => (s[0] === '#' ? [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)) : (s.match(/[\d.]+/g) || ['0', '0', '0']).slice(0, 3).map(Number));
const ease = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
/** The wordmark in lamps, in `host`, which gives it its width, its shape and its ink. `read` counts the pages this
    reader has read by kind ({ kind: pages }): each page owns a lamp in its kind, and the other lit lamps are ink, holding
    the eight kinds in equal shares for colour to pass through. `allKinds` gives every lit lamp a kind at rest instead
    (in the proportions of `read`, or equal shares). `arrive` lights the word across in colour when it is first seen,
    once a visit, and then cools what is not owned back to ink.
    @param {HTMLElement} host @param {{ read?: Record<string, number> | null, allKinds?: boolean, arrive?: boolean }} [o] */
export function lampBoard(host, { read = null, allKinds = false, arrive = false } = {}) {
  const cv = document.createElement('canvas'); cv.className = 'lamps'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv);
  const ctx = cv.getContext('2d'), cols = MARK[0].length, rows = MARK.length, end = SWEEP + 140 + LIGHT + HOLD;
  /* every place on the grid is a lamp: is it one of the word's, its kind, is that kind its own at rest, when it comes on
     and when it starts to cool, and how lit (a), how warmed by the pointer (h), how hushed while another kind is called
     out (m) and how much of its colour it holds (w) it is now */
  /** @type {{ c: number, r: number, on: boolean, k: string, own: boolean, at: number, cool: number, a: number, h: number, m: number, w: number }[]} */
  const L = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) L.push({ c, r, on: MARK[r][c] === '#', k: '', own: false, at: c / cols * SWEEP + scatter(c, r) * 140, cool: end + (c / cols * .7 + scatter(c, r) * .3) * STAGGER, a: 0, h: 0, m: 0, w: 0 });
  const lit = L.filter(l => l.on).sort((a, b) => scatter(a.c, a.r) - scatter(b.c, b.r));
  const EVEN = Object.fromEntries(DEAL.map(k => [k, 1])), counts = read || {}, T =DEAL.reduce((s, k) => s + (counts[k] > 0 ? counts[k] : 0), 0), mine = T > 0;
  /* a lamp for each page read, in its kind; read past the lamps, or every lamp a kind, they are shared by weight */
  if (allKinds || T >= lit.length) { deal(lit, mine ? counts : EVEN, true); for (const l of lit) l.own = true; }
  else { deal(lit.slice(0, T), counts, false); deal(lit.slice(T), EVEN, false); for (const l of lit.slice(0, T)) l.own = true; }
  let W = 0, H = 0, p = 0, raf = 0, t0 = 0, last = 0, tnow = 0, only = '', lighting = false, glow = false, io = null; /** @type {number[] | null} */ let ptr = null;
  /* a lamp answers a kind called out if it is that kind's and its own, or, nothing read yet, if it holds that kind */
  const answers = l => !!only && l.k === only && (l.own || !mine);
  const want = l => (l.own || answers(l) ? 1 : 0);
  const fit = () => { const r = host.getBoundingClientRect(), d = Math.min(3, devicePixelRatio || 1); W = r.width + 2 * EDGE; H = r.height + 2 * EDGE; p = r.width / (cols - 1 + LAMP); cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0); };
  const xy = l => [EDGE + (l.c + LAMP / 2) * p, EDGE + (l.r + LAMP / 2) * p];
  /* the colour the arrival lends a lamp: all of it until the word has held, then less as the lamp cools */
  const lent = l => (glow ? 1 - ease((tnow - t0 - l.cool) / FADE) : 0);
  const paint = () => {
    const ink = getComputedStyle(cv).color, dark = isDark(), hex = dark ? KIND_HEX.dark : KIND_HEX.light, R = LAMP * p / 2, faint = dark ? .17 : .12, I = rgb(ink);
    const dot = (x, y, r, col, al) => { if (al < .004) return; ctx.globalAlpha = al; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
    ctx.clearRect(0, 0, W, H);
    for (const l of L) {
      const [x, y] = xy(l);
      /* an unlit lamp the pointer crosses lights in ink, as far as it is warmed */
      if (!l.on) { dot(x, y, R * (DIM + (1 - DIM) * l.h), ink, faint + l.h * .7); continue; }
      /* coming on, a lamp swells a little past its size and settles; it is ink, turned to its kind's colour as far as
         colour passes through it (the pointer's warmth turns it three times as fast, so a lamp half warmed is not mud);
         hushed, it is a ghost of itself in ink */
      const s = l.a < 1 ? 1 + 2.4 * (l.a - 1) ** 3 + 1.4 * (l.a - 1) ** 2 : 1, r = R * (DIM + (1 - DIM) * s) * (1 + .1 * l.h);
      const t = Math.min(1, Math.max(l.w, l.h * 3, lent(l))), K = t > 0 ? rgb(hex[l.k]) : I, col = t > 0 ? `rgb(${I.map((v, i) => Math.round(v + (K[i] - v) * t)).join()})` : ink;
      dot(x, y, R * DIM, ink, faint * (1 - l.a));
      dot(x, y, r, col, l.a * (1 - l.m));
      dot(x, y, r, ink, l.a * l.m * faint * 1.5);
    }
    ctx.globalAlpha = 1;
  };
  /* the board at rest, drawn once: what reduced motion shows, and a board that has already arrived */
  const still = () => { glow = false; for (const l of L) { l.a = l.on ? 1 : 0; l.h = 0; l.m = only && !answers(l) ? 1 : 0; l.w = want(l); } paint(); };
  const step = now => {
    raf = 0; const dt = Math.min(64, now - (last || now)); last = now; tnow = now; let live = false;
    /* the word starts to light on the first frame after it is seen, every lamp in colour, and cools once it has held */
    if (lighting) { t0 = now; glow = true; lighting = false; }
    if (glow) { if (now - t0 < end + STAGGER + FADE) live = true; else glow = false; }
    for (const l of L) {
      if (l.on && l.a < 1 && t0) { l.a = Math.min(1, Math.max(0, (now - t0 - l.at) / LIGHT)); live = true; }
      const [x, y] = xy(l), to = ptr ? Math.max(0, 1 - Math.hypot(x - ptr[0], y - ptr[1]) / (p * 3)) ** 1.5 : 0, mu = only && !answers(l) ? 1 : 0, wu = want(l);
      l.h += (to - l.h) * (1 - Math.exp(-dt / (to > l.h ? WARM : COOL))); l.m += (mu - l.m) * (1 - Math.exp(-dt / HUSH)); l.w += (wu - l.w) * (1 - Math.exp(-dt / HUSH));
      if (Math.abs(to - l.h) < .01) l.h = to; else live = true;
      if (Math.abs(mu - l.m) < .01) l.m = mu; else live = true;
      if (Math.abs(wu - l.w) < .01) l.w = wu; else live = true;
    }
    paint(); if (live) raf = requestAnimationFrame(step); else last = 0;
  };
  /* a frame is asked for only while a lamp has somewhere to go */
  const wake = () => { if (!raf) raf = requestAnimationFrame(step); };
  fit();
  if (arrive && !LIT && !reducedMotion() && typeof IntersectionObserver === 'function') {
    for (const l of L) l.w = want(l);
    paint(); io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; io.disconnect(); io = null; LIT = lighting = true; wake(); }, { threshold: .5 }); io.observe(host);
  } else still();
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { fit(); paint(); }) : null; if (ro) ro.observe(host);
  /* the pointer warms the lamps near it, and they cool behind it; a finger warms the ones it lands on */
  const point = e => { if (reducedMotion()) return; const r = cv.getBoundingClientRect(); ptr = [e.clientX - r.left, e.clientY - r.top]; wake(); };
  const leave = e => { if ((e.type === 'pointerleave' || e.pointerType !== 'mouse') && ptr) { ptr = null; wake(); } };
  cv.addEventListener('pointermove', point); cv.addEventListener('pointerdown', point);
  for (const t of ['pointerleave', 'pointerup', 'pointercancel']) cv.addEventListener(t, leave);
  const board = {
    paint,
    /** only this kind's lamps show their colour ('' gives every lamp its own back) @param {string} k */
    only(k) { only = k || ''; if (reducedMotion()) still(); else wake(); },
    destroy() { cancelAnimationFrame(raf); if (io) io.disconnect(); if (ro) ro.disconnect(); BOARDS.delete(board); cv.remove(); },
  };
  BOARDS.add(board); return board;
}
/* the theme changed: every board on screen is drawn again in its colours */
export function rethemeLamps() { for (const b of BOARDS) b.paint(); }

/* What this module does when the page starts. main.js runs these in order, after every module has loaded.
   The stylesheet is told the board's shape (--wordmark-ar, the grid from its first lamp's edge to its last's), so a board's
   place is kept before it is drawn, and is handed the mark as a picture (--wordmark): the same lamps, the unlit ones faint,
   for a rule to paint through (a mask) wherever the mark stands small and still, in whatever colour the rule gives it. */
export function init() {
  const cols = MARK[0].length, rows = MARK.length, o = .5 - LAMP / 2, box = `${cols - 1 + LAMP} ${rows - 1 + LAMP}`;
  const lit = MARK.map((row, r) => [...row].map((ch, c) => (ch === '#' ? `M${c + .5} ${r + .5}h0` : '')).join('')).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${o} ${o} ${box}"><g fill="none" stroke="#000" stroke-linecap="round"><path stroke-width="${LAMP * DIM}" opacity=".14" stroke-dasharray="0 1" d="${MARK.map((_, r) => `M.5 ${r + .5}h${cols - 1}`).join('')}"/><path stroke-width="${LAMP}" d="${lit}"/></g></svg>`;
  const s = document.documentElement.style; s.setProperty('--wordmark-ar', box.replace(' ', '/')); s.setProperty('--wordmark', `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
}

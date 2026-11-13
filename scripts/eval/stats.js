// Small, dependency-free statistics for the eval summary: seeded bootstrap intervals and an exact sign test.

/* A seeded generator (mulberry32), so a summary is the same every time it is computed from the same results. */
/** @param {number} seed */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** @param {string} s */
export const hashOf = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };

/** @param {number[]} xs */
export const mean = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

/**
 * The mean with a 95% percentile bootstrap interval. Values that are null or not finite are left out.
 * @param {(number | null | undefined)[]} values @param {{ n?: number, seed?: number }} [o]
 * @returns {{ mean: number | null, lo: number | null, hi: number | null, n: number }}
 */
export function bootstrap(values, { n = 2000, seed = 1 } = {}) {
  const xs = /** @type {number[]} */ (values.filter(v => typeof v === 'number' && Number.isFinite(v)));
  if (!xs.length) return { mean: null, lo: null, hi: null, n: 0 };
  const m = mean(xs); if (xs.length === 1) return { mean: m, lo: m, hi: m, n: 1 };
  const r = rng(seed); const means = new Float64Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < xs.length; j++) s += xs[Math.floor(r() * xs.length)]; means[i] = s / xs.length; }
  means.sort();
  return { mean: m, lo: means[Math.floor(0.025 * (n - 1))], hi: means[Math.ceil(0.975 * (n - 1))], n: xs.length };
}

/* log of n choose k, for exact binomial tails without overflow */
/** @param {number} n @param {number} k */
const logChoose = (n, k) => { let s = 0; for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i); return s; };

/**
 * Two-sided exact sign test: ties are dropped, and the p value is the chance of a split at least this
 * lopsided if neither side were really better.
 * @param {number} wins @param {number} losses
 */
export function signTest(wins, losses) {
  const n = wins + losses; if (!n) return 1;
  const k = Math.min(wins, losses); let tail = 0;
  for (let i = 0; i <= k; i++) tail += Math.exp(logChoose(n, i) - n * Math.LN2);
  return Math.min(1, 2 * tail);
}

/** @param {number} p @param {number} [alpha] */
export const verdict = (p, alpha = 0.05) => (p < alpha ? 'significant' : 'not significant');

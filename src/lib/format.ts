/**
 * Display formatters shared across surfaces. One implementation each — four
 * byte-identical copies of `formatCount` had drifted into cards, the stats
 * row, the hero and the OG image, which is exactly how "★ 52.9k" on a card
 * ends up reading "★ 53k" on the page it links to.
 */

/**
 * 1200 → "1.2k", 52_900 → "53k". Matches the locked reference's "★ 1.2k":
 * one decimal below 10k, none above (a four-character ceiling keeps metadata
 * rows from reflowing).
 */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`;
}

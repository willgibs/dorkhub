/* ================= the front page's feed: pages written ahead of time, as cards =================
   Everything a card shows comes from the page itself (its deck, its first big number, its myth and
   the truth, its open questions, its six topics to keep exploring), so the feed can never promise
   what the page doesn't say. `node scripts/seeds.mjs feed` adds each page's lead picture (the same
   one the page shows) and writes src/static/feed.json; a test checks that file against the pages. */
import { cardsOf, clip, parseArticle, plain } from '../src/shared/article.js';

/**
 * @typedef {{ t: string, h: string, k: string }} Door
 * @typedef {{ t: string, k: string, h: string, d: string, q: string[], fig?: [string, string], myth?: [string, string], cards: [string, string, string][], pic?: { src: string, w: number, h: number, alt: string, credit: string, license: string } }} FeedTopic
 */

/** The doors as the front page lists them (src/app/13-landing.js): title, hook and kind. @param {string} landing @returns {Door[]} */
export const doorsOf = landing => [...landing.matchAll(/\{ t: '([^']+)', h: '([^']+)', k: '([a-z]+)' \}/g)].map(m => ({ t: m[1], h: m[2], k: m[3] }));

/** One page's card, without its picture. @param {Door} door @param {string} text @returns {FeedTopic} */
export function feedEntry(door, text) {
  const A = parseArticle(text, false);
  /** @param {string} type */
  const panel = type => A.panels.find((/** @type {any} */ p) => p.type === type);
  const fig = panel('figures')?.rows?.[0];
  const myth = panel('myth');
  /** @param {RegExp} re @returns {string} */
  const row = re => plain(myth?.rows?.find((/** @type {string[]} */ r) => re.test(r[0]))?.[1] || '');
  const said = row(/^myth/i), truth = row(/^(actually|fact|truth|in fact)/i);
  return {
    t: door.t, k: A.kind || door.k, h: door.h, d: plain(A.deck), q: A.questions.map(plain),
    ...(fig && fig[0] && fig[1] ? { fig: /** @type {[string, string]} */ ([plain(fig[0]), plain(fig[1])]) } : {}),
    ...(said && truth ? { myth: /** @type {[string, string]} */ ([said, truth]) } : {}),
    cards: cardsOf(A).map(c => /** @type {[string, string, string]} */ ([c.target, c.kind || '', clip(plain(c.teaser || ''), 100)])),
  };
}

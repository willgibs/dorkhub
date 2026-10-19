/* ================= placeholders: the front page's topics, until their pages are written =================
   Will's call (2026-10-15): the front page made by hand ships before its 32 pages are written, so a topic
   whose page isn't written yet opens a placeholder, free and instant like any page written ahead of time.
   It has a real page's shape (an opening, sections, two notes, two panels, six cards, three questions),
   so everything around a page can be built and tried on it, and it claims nothing lib/front.js hasn't
   checked: the topic's hook, its card's, and its threads, each with a source. Every link follows a thread
   to another of the front page's topics, so a reader goes from page to page without spending anything.
   Once a topic's page is written (lib/seeds), that is served instead, and nothing else changes. */
import { CARDS, FRONT, THREADS } from './front.js';
import { KIND_SHAPE } from './prompts.js';
import { topicKey } from '../src/shared/world.js';

/** @typedef {import('./front.js').FrontTopic} FrontTopic */
const BY_KEY = new Map(FRONT.map(t => [topicKey(t.t), t]));
const BY_TITLE = new Map(FRONT.map(t => [t.t, t]));

/* how a topic reads mid-sentence */
/** @type {Record<string, string>} */
const SAID = { 'Northern lights': 'the northern lights', 'Terracotta Army': 'the Terracotta Army', 'Mona Lisa': 'the Mona Lisa', 'Enigma machine': 'the Enigma machine' };
const PROPER = new Set(['Stonehenge', 'Atlantis', 'Pompeii', 'Rubik’s Cube', 'Apollo 11', 'Antarctica', 'DNA', 'Venus flytraps']);
const said = (/** @type {string} */ t) => SAID[t] || (PROPER.has(t) ? t : t[0].toLowerCase() + t.slice(1));
const link = (/** @type {string} */ t) => { const s = said(t); return s === t ? `[[${t}]]` : `[[${s}|${t}]]`; };
/** "a and b", "a, b and c" @param {string[]} a */
const list = a => a.length < 3 ? a.join(' and ') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
const topic = (/** @type {string} */ t) => /** @type {FrontTopic} */ (BY_TITLE.get(t));
/** @param {string} t */
const threadsOf = t => THREADS.filter(x => x.a === t || x.b === t).map(x => ({ t: x.a === t ? x.b : x.a, l: x.l }));
/* a source named the way a reader would recognise it: a Wikipedia article by its title, anything else by its site */
/** @param {string} url */
export function sourceLabel(url) {
  try {
    const u = new URL(url); const w = /^(?:\w+\.)?wikipedia\.org$/.test(u.hostname) && /^\/wiki\/(.+)$/.exec(u.pathname);
    return w ? `Wikipedia: ${decodeURIComponent(w[1]).replace(/_/g, ' ')}` : u.hostname.replace(/^www\./, '');
  } catch { return ''; }
}

/** The placeholder for one of the front page's topics, in the page format, or null for any other title.
    @param {string} title */
export function placeholderText(title) {
  const T = BY_KEY.get(topicKey(title)); if (!T) return null;
  /* the threads from here, then one thread further (by way of which), then the rest of the map, nearest first */
  const near = threadsOf(T.t); const seen = new Set([T.t, ...near.map(n => n.t)]);
  /** @type {{ t: string, via: string, l: string }[]} */ const further = [];
  for (const n of near) for (const m of threadsOf(n.t)) if (!seen.has(m.t) && further.length < 4) { seen.add(m.t); further.push({ t: m.t, via: n.t, l: m.l }); }
  const linked = [...near.map(n => n.t), ...further.map(f => f.t)];
  const next = [...linked];
  for (let ring = linked; next.length < 6 && ring.length;) { const out = []; for (const r of ring) for (const m of threadsOf(r)) if (!seen.has(m.t)) { seen.add(m.t); out.push(m.t); } next.push(...out); ring = out; }
  for (const f of FRONT) if (next.length < 6 && !seen.has(f.t)) { seen.add(f.t); next.push(f.t); }
  const cards = next.slice(0, 6);

  const name = said(T.t); const kind = T.k; const card = CARDS.find(c => c.t === T.t); const promise = card && card.hook && card.hook !== T.h ? card.hook : '';
  const shape = (/** @type {Record<string, string>} */ (KIND_SHAPE)[kind] || KIND_SHAPE.concept).replace(/^build the page around/, 'be built around');
  const L = [`# ${T.t} :: ${kind}`, `> ${T.h}`, '+++', ...linked.map(t => `[[${t}]] :: ${topic(t).k}`), '---'];
  L.push(`This page on ${name} is a placeholder. Its real page hasn’t been written yet: it will be written once for every reader, by the same writer as every page on Dorkhub, then take this one’s place at the same address. Until then this one stands in for it, shaped like a real page, so that everything around a page can be built and tried. Its links are real, though. They follow the thread${near.length === 1 ? '' : 's'} from ${name} to ${list(near.map(n => link(n.t)))}, and each one opens another page written ahead of time, free.`);
  L.push(`^ The only claims here are the line under the title${promise ? ', its card’s promise' : ''} and the threads, and each was checked against a source before it went on the front page.`, '');
  L.push('::: facts', 'Page :: A placeholder for now', `Kind :: ${kind[0].toUpperCase() + kind.slice(1)}`, `Threads :: ${near.length}`, `Next pages :: ${cards.length}, all free to open`, ':::', '');
  L.push('## What it will cover', `When it’s written, the page will ${shape}, going past the overview to the specifics, mechanisms and numbers most introductions skip. It starts ${promise ? `where its card on the front page does: ${promise}` : 'from the line under its title.'} And it follows each of its threads far enough to show why it leads where it does.`, '');
  L.push('::: steps', 'Written :: Once, for every reader, in the default voice', 'Checked :: Every number, date, name and attribution, against sources', 'Placed :: Here, at this address, instead of this placeholder', ':::', '');
  L.push('## The threads from here', `From ${name}, ${near.length === 1 ? 'one thread runs' : 'the threads run'} to ${list(near.map(n => `${link(n.t)} (${n.l})`))}. ${near.length === 1 ? 'It is a page of its own, drawn' : 'Each is a page of its own, and each is drawn'} on the map of threads on the front page.`);
  L.push(`^ The front page draws ${THREADS.length} threads between its ${FRONT.length} topics, and every topic on it opens free.`, '');
  if (further.length) L.push('## One thread further', `Past ${near.length === 1 ? 'it' : 'those'} ${further.length === 1 ? 'is' : 'are'} ${list(further.map(f => `${link(f.t)} by way of ${said(f.via)} (${f.l})`))}.`, '');
  L.push('===', ...cards.map(t => `- [[${t}]] :: ${topic(t).h} :: ${topic(t).k}`));
  L.push('???', ...[...linked, ...cards].filter((t, i, a) => a.indexOf(t) === i).slice(0, 3).map(t => `What ties ${name} to ${said(t)}?`));
  L.push('&&&', ...linked.map(t => `[[${t}]] :: ${topic(t).h}`));
  /* what its claims were checked against: the line under its title, its card and its threads */
  const sources = [...new Set([T.src, ...(card ? card.src : []), ...THREADS.filter(x => x.a === T.t || x.b === T.t).map(x => x.src)].filter(Boolean))];
  L.push('@@@', ...sources.map(u => `- ${sourceLabel(u)} :: ${u}`));
  return L.join('\n') + '\n';
}

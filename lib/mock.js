/* ================= the mock writer: local development, tests and previews =================
   A stand-in language model that streams believable, correctly formatted output for
   every task, so the whole interface can be exercised without a key or any spend.
   It is only reachable when DH_MOCK=1 outside production (see lib/ai.js).

   A page someone has recorded from a real writer (lib/recorded.js) is replayed at a writer's
   pace: a pause before the first word, then a few words at a time. Any other page is a
   synthetic stand-in. Pace: "writer" (the default), "quick" (no pause, short bursts; the
   browser test) or "fast" (no waiting at all; unit tests).

   Failure drills, by putting a marker in a page title or using a key containing "bad":
   [fail-early] fails before any text, [fail-mid] fails halfway, [cut] stops at the
   length limit, [slow] streams slowly, [garbled] answers a JSON task with prose. */

import { APICallError } from 'ai';
import { capFirst, isQuestion, keyOf } from '../src/shared/article.js';

const TOPICS = [
  ['Grid cells', 'Neurons that tile the space around you into hexagons', 'mechanism'],
  ['Bomb pulse', 'Cold War tests left a timestamp in every living cell', 'phenomenon'],
  ['Premelting', 'Ice wears a liquid skin far below its melting point', 'phenomenon'],
  ['Whale falls', 'One carcass feeds a deep-sea city for fifty years', 'phenomenon'],
  ['Cuneiform', 'Wedges pressed in clay that kept accounts for 3,000 years', 'work'],
  ['Fresnel lens', 'A lighthouse lens folded into rings of glass', 'technique'],
  ['Tulip breaking virus', 'The aphid-borne disease behind the priciest flowers', 'creature'],
  ['Antikythera mechanism', 'A Greek bronze computer that predicted eclipses', 'thing'],
  ['Kessler syndrome', 'A cascade of collisions that could close orbit', 'phenomenon'],
  ['Regelation', 'Ice that melts under pressure and refreezes behind', 'mechanism'],
  ['Endosymbiosis', 'The ancient merger that put bacteria inside your cells', 'concept'],
  ['Singing sand dunes', 'Desert dunes that boom like low organ notes', 'mystery'],
  ['Mycorrhizal networks', 'Fungal threads that trade sugar between trees', 'thing'],
  ['The longitude problem', 'Why ships needed a clock that ignored the sea', 'event'],
  ['Ball lightning', 'Glowing spheres that drift through rooms, then vanish', 'mystery'],
  ['Stradivarius varnish', 'Was the secret in the wood, the finish or the myth?', 'mystery'],
];

/** @param {string} s */
const hashOf = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
/** @param {string} title @param {number} n */
function topicsFor(title, n) {
  const k = title.toLowerCase(); const start = hashOf(k) % TOPICS.length;
  /** @type {string[][]} */
  const out = [];
  for (let i = 0; out.length < n && i < TOPICS.length; i++) { const t = TOPICS[(start + i * 5) % TOPICS.length]; if (!k.includes(t[0].toLowerCase()) && !out.includes(t)) out.push(t); }
  return out;
}

/** @param {any} p */
function page(p) {
  const locked = !(p.from && (p.from.kind === 'question' || p.from.kind === 'bridge')) && !(p.depth === 0 && isQuestion(p.title));
  const title = locked ? capFirst(p.title) : p.from && p.from.kind === 'bridge' ? `What joins ${p.path.at(-1)?.title || 'these pages'} and ${p.from.other}` : `The answer to ${p.title.replace(/\?\s*$/, '')}`;
  const parent = p.path.at(-1)?.title; const T = topicsFor(p.title, 12); const L = (/** @type {number} */ i) => `[[${T[i][0]}]]`;
  return `# ${title}
> A stand-in page from the local mock writer, shaped exactly like a real one so the interface can be tested for free.
~ ${parent ? `You came here from ${parent}, and this line is where a real page connects back to that exact moment.` : 'A fine first page: the mock writer opens a dozen doors so every part of the page has something to show.'}
@ drift ${p.depth ? Math.min(95, p.depth * 13) : 0}
: Written by = the local mock writer
: Level = ${p.depth}
: Cost = nothing at all
%%%
1404 :: The first dated moment on this mock timeline
1859 :: A second moment, centuries later
1969 :: A third, to draw a proper line
+++
${T.slice(0, 10).map(t => `[[${t[0]}]] :: ${t[1]} :: ${t[2]}`).join('\n')}
---
This opening paragraph stands in for the real thing. It links ${L(0)} and ${L(1)} so link colours, hover cards and peeks all have something to work with, and it runs long enough to wrap across several lines on a phone.
^ A margin note sits beside the paragraph it belongs to.${parent ? ` It can call back to [[${parent}]].` : ''}

## Where the mock begins
The second paragraph links ${L(2)} and ${L(3)}, then keeps going for a while so the reveal animation has a few lines to glide through before the next heading appears.

A third paragraph mentions ${L(4)} in passing, the way a real page threads its plan through the body.
^ Another aside, under thirty words, about ${T[4][0].toLowerCase()}.

## A section in the middle
Here ${L(5)} and ${L(6)} meet. Real pages use this space for the mechanism, the numbers and the surprising turn.

## Where it goes next
Finally ${L(7)}, ${L(8)} and ${L(9)} close the page and set up the branches below.
===
- [[${T[10][0]}]] :: ${T[10][1]} :: deeper :: ${T[10][2]}
- [[${T[11][0]}]] :: ${T[11][1]} :: sideways :: ${T[11][2]}
- [[${T[0][0]}]] :: ${T[0][1]} :: wild :: ${T[0][2]}
- [[${T[2][0]}]] :: ${T[2][1]} :: deeper :: ${T[2][2]}
- [[${T[5][0]}]] :: ${T[5][1]} :: sideways :: ${T[5][2]}
>>>
[[${T[10][0]}]] :: The natural next page in the mock rabbit hole
???
What would a real page say here?
How does the mock pick its links?
Why do rabbit holes feel so good?
`;
}

/** @type {Record<string, (c: any) => string>} */
const SMALL = {
  peek: c => `${c.target} is shown here by the mock writer: a short peek that stays on the page. It links [[${topicsFor(c.target, 2)[0][0]}]] and [[${topicsFor(c.target, 2)[1][0]}]] so the peek has places to go.`,
  unfold: c => `The mock writer's take on this paragraph (${c.mode}): it would add a mechanism, a number or a caveat here, and link [[${topicsFor(c.paragraph, 1)[0][0]}]].`,
  thread: c => `You started at ${c.steps[0].title} and, one link at a time, ended up at ${c.steps.at(-1).title}. Each leap felt natural because each page picked up the thread of the last.\nThread: the mock writer's hidden idea`,
  recap: c => `# Recap: a mock rabbit hole\nYou read ${c.pages.length} pages, from ${c.pages[0].title} to ${c.pages.at(-1).title}.\n## Five things you now know\n- One\n- Two\n- Three\n- Four\n- Five\n## The strangest connection\nThe mock writer cannot know, but a real one would.\n## Where to dig next\n- ${c.untaken[0] || 'Somewhere new'}\n- Somewhere sideways\n- Somewhere wild`,
  doubt: () => JSON.stringify([{ quote: 'stands in for the real thing', note: 'A mock claim worth checking.', rating: 'check' }, { quote: 'link colours, hover cards and peeks', note: 'Solid: it really does.', rating: 'solid' }]),
  around: c => JSON.stringify(topicsFor(c.title, 8).map((t, i) => ({ name: t[0], relation: t[1].toLowerCase(), kind: t[2] === 'concept' ? 'idea' : 'thing', bearing: ['history', 'science', 'people', 'culture', 'mechanism', 'elsewhere'][i % 6], distance: (i % 3) + 1 }))),
  sketch: c => JSON.stringify({ shape: 'chain', title: `How ${c.title} works`, caption: 'A mock diagram in four steps.', nodes: ['Start', 'Middle', 'Turn', 'End'].map(label => ({ label, note: 'a mock step' })), links: ['leads to', 'turns into', 'ends at'] }),
  quiz: c => JSON.stringify(Array.from({ length: 5 }, (_, i) => ({ q: `Mock question ${i + 1}: which page was this?`, options: ['This one', 'Another', 'Neither', 'Both'], answer: i % 4, why: 'Because the mock says so.', chamber: c.pages[i % c.pages.length].title }))),
  check: () => 'OK',
};

/** @param {string} title */
const fail = title => new APICallError({ message: `mock failure (${title})`, url: 'mock://write', requestBodyValues: {}, statusCode: 529, isRetryable: false });

/** @param {any} input @returns {Promise<string | null>} */
async function recordedPage(input) {
  const { RECORDED } = await import('./recorded.js');
  const k = keyOf(input?.title); const r = RECORDED.find(p => keyOf(p.title) === k);
  return r ? r.text : null;
}

/** @typedef {'writer' | 'quick' | 'fast'} Pace */
/**
 * @param {{ task: string, input: any, key?: string, pace?: Pace }} o
 * @returns {import('@ai-sdk/provider').LanguageModelV4}
 */
export function mockModel({ task, input, key = '', pace = 'writer' }) {
  const marker = String(input?.title || '');
  return {
    specificationVersion: 'v4', provider: 'dorkhub-mock', modelId: 'mock', supportedUrls: {},
    async doGenerate() { throw new Error('the mock only streams'); },
    async doStream({ abortSignal }) {
      if (/bad/.test(key)) throw new APICallError({ message: 'invalid api key', url: 'mock://write', requestBodyValues: {}, statusCode: 401, isRetryable: false });
      if (marker.includes('[fail-early]')) throw fail(marker);
      const recorded = task === 'page' && !/\[(fail|cut|slow|garbled)/.test(marker) ? await recordedPage(input) : null;
      const text = marker.includes('[garbled]') ? 'Sorry, I could not put that into JSON, but here is a long friendly paragraph instead.' : recorded || (task === 'page' ? page(input) : (SMALL[task] || (() => 'OK'))(input));
      const writerLike = !!recorded && pace === 'writer';
      const cut = marker.includes('[cut]') ? Math.floor(text.length / 3) : text.length;
      const failAt = marker.includes('[fail-mid]') ? Math.floor(text.length / 2) : -1;
      const pause = marker.includes('[slow]') ? 60 : pace === 'fast' ? 0 : 9;
      const usage = { inputTokens: { total: 900, noCache: 900, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: Math.ceil(cut / 4), text: Math.ceil(cut / 4), reasoning: 0 } };
      let i = 0; let begun = false;
      /** @type {ReadableStream<import('@ai-sdk/provider').LanguageModelV4StreamPart>} */
      const stream = new ReadableStream({
        async pull(c) {
          if (abortSignal?.aborted) { c.error(new DOMException('aborted', 'AbortError')); return; }
          if (!begun) { begun = true; if (writerLike) await new Promise(r => setTimeout(r, 700)); c.enqueue({ type: 'stream-start', warnings: [] }); c.enqueue({ type: 'text-start', id: 't' }); return; }
          if (failAt >= 0 && i >= failAt) { c.enqueue({ type: 'error', error: fail(marker) }); c.close(); return; }
          if (i >= cut) {
            c.enqueue({ type: 'text-end', id: 't' });
            c.enqueue({ type: 'finish', usage, finishReason: cut < text.length ? { unified: 'length', raw: 'max_tokens' } : { unified: 'stop', raw: 'end_turn' } });
            c.close(); return;
          }
          /* a real writer sends a few words every few dozen milliseconds: about 450 characters a second */
          if (writerLike) await new Promise(r => setTimeout(r, 38 + ((i * 13) % 31)));
          else if (pause) await new Promise(r => setTimeout(r, pause));
          const n = writerLike ? 12 + ((i * 7) % 17) : 6 + ((i * 7) % 9); c.enqueue({ type: 'text-delta', id: 't', delta: text.slice(i, Math.min(cut, i + n)) }); i += n;
        },
      });
      return { stream };
    },
  };
}

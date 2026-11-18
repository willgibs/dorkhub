// The split writer: a page written in four calls and streamed, in reading order, as one page's text (lib/prompts.js
// "the split writer"). The head (title, kind, deck, key facts) and the plan (the topics the page links) are written at
// once, and each head line goes out as soon as it is whole. Then the body streams as the writer writes it, given both.
// Then the ways on come as the page's own end lines, written from that body, each out as soon as it is whole. What it
// returns is what lib/write.js reads from streamText: a stream of text, how the writing finished, and what it used
// across the four calls.
import { streamText } from 'ai';
import { cachedPrompt } from './ai.js';
import { HEAD_STOP, PLAN_STOP, bodyOf, bodyParts, frameOfLines, headParts, headSoFar, moreTail, pageLinker, planOfLines, planParts, tailSoFar, waysOfLines, waysParts } from './prompts.js';

/* what the head, the plan and the ways on may write: a head is about 120 tokens, a plan about 200 and the ways on about
   400 (the caps stop a writer that runs on into a body, or past the end) */
const HEAD_TOKENS = 400;
const PLAN_TOKENS = 600;
const WAYS_TOKENS = 1500;
/* a line the body shouldn't open with (a title, the deck or a fence on top), and one that could still become one */
const LEAD = /^\s*(#\s|>|```)/;
const MAYBE_LEAD = /^\s*(#?|>|`{1,3})$/;

/**
 * @param {{ model: import('ai').LanguageModel, input: import('./prompts.js').PageInput, maxTokens: number,
 *   providerOptions?: any, abortSignal?: AbortSignal, onError?: (e: { error: unknown }) => void }} o
 * @returns {{ textStream: AsyncIterable<string>, finishReason: Promise<string>, totalUsage: Promise<import('ai').LanguageModelUsage> }}
 */
export function splitPage({ model, input, maxTokens, providerOptions, abortSignal, onError }) {
  const usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, inputTokenDetails: { noCacheTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }, outputTokenDetails: { textTokens: 0, reasoningTokens: 0 } };
  /** @param {any} u */
  const add = u => {
    if (!u) return;
    usage.inputTokens += u.inputTokens || 0; usage.outputTokens += u.outputTokens || 0; usage.totalTokens += u.totalTokens || 0;
    usage.inputTokenDetails.cacheReadTokens += u.inputTokenDetails?.cacheReadTokens || 0;
    usage.inputTokenDetails.cacheWriteTokens += u.inputTokenDetails?.cacheWriteTokens || 0;
    usage.inputTokenDetails.noCacheTokens += u.inputTokenDetails?.noCacheTokens || 0;
  };
  /** @type {(r: string) => void} */ let finish = () => {};
  const finishReason = new Promise(r => { finish = r; });
  /** @type {(u: any) => void} */ let settle = () => {};
  const totalUsage = new Promise(r => { settle = r; });
  /** the first failure of any call, handed on as streamText would hand it on @type {unknown} */ let failed = null;
  /** @param {{ fixed: string, request: string }} parts @param {number} max @param {string[]} [stop] */
  const call = (parts, max, stop) => streamText({
    model, prompt: cachedPrompt(parts), maxOutputTokens: max, abortSignal, maxRetries: 1,
    ...(stop ? { stopSequences: stop } : {}),
    ...(providerOptions ? { providerOptions } : {}),
    onError: ({ error }) => { failed = failed || error; },
  });
  const check = () => { if (failed) throw failed; };

  async function* text() {
    let reason = 'error';
    try {
      /* the head and the plan at once, so the body waits for the later of the two rather than both in turn: the head a
         line at a time as each is whole, the plan whole, both in the page's own lines however the writer slipped */
      const hr = call(headParts(input), HEAD_TOKENS, HEAD_STOP);
      const pr = call(planParts(input), PLAN_TOKENS, PLAN_STOP);
      const plan = (async () => { let t = ''; for await (const d of pr.textStream) t += d; return t; })().catch(e => { failed = failed || e; return ''; });
      let lines = '', shown = '';
      /** @param {string} head */
      const show = head => { if (head.length <= shown.length || !head.startsWith(shown)) return ''; const s = head.slice(shown.length); shown = head; return s; };
      for await (const d of hr.textStream) {
        lines += d; if (!d.includes('\n')) continue;
        const s = show(headSoFar(input, frameOfLines(lines, false), false)); if (s) yield s;
      }
      check();
      /* the head is done: its last fact goes out now, the topics once the plan is done */
      const top = /** @type {import('./prompts.js').Frame} */ (frameOfLines(lines, true));
      const facts = show(headSoFar(input, { ...top, links: /** @type {any} */ ([null]) }, false)); if (facts) yield facts;
      const planned = await plan;
      check(); add(await hr.totalUsage); add(await pr.totalUsage);
      const frame = { ...top, links: planOfLines(planned) };
      const head = headSoFar(input, frame, true);
      yield head.startsWith(shown) ? head.slice(shown.length) : '---\n';

      /* the body, as it is written, each planned topic linked at its first mention if the writer left it plain */
      const br = call(bodyParts(input, frame), maxTokens);
      const linker = pageLinker(input, frame);
      /* the body as a reader has it, linked, for the ways on */
      let body = '', held = '', opening = true;
      /** @param {string} s */
      const pass = s => { const out = linker.push(s); body += out; return out; };
      for await (const d of br.textStream) {
        if (!opening) { const out = pass(d); if (out) yield out; continue; }
        held += d;
        for (;;) {
          const nl = held.indexOf('\n'); const line = nl >= 0 ? held.slice(0, nl) : held;
          if (nl >= 0 && (LEAD.test(line) || !line.trim())) { held = held.slice(nl + 1); continue; }
          if (nl < 0 && (LEAD.test(line) || MAYBE_LEAD.test(line))) break;
          opening = false; if (held) { const out = pass(held); if (out) yield out; } held = ''; break;
        }
      }
      if (opening && held && !LEAD.test(held)) { const out = pass(held); if (out) yield out; }
      const rest = linker.end(); body += rest; if (rest) yield rest;
      check(); reason = await br.finishReason; add(await br.totalUsage);
      if (reason !== 'stop') return;

      /* the ways on: the end, a line at a time as each is whole, in the page's own lines however the writer slipped */
      reason = 'error';
      const wr = call(waysParts(input, frame, bodyOf(body)), WAYS_TOKENS);
      let ends = '', tail = '';
      for await (const d of wr.textStream) {
        ends += d; if (!d.includes('\n')) continue;
        const s = moreTail(tail, tailSoFar(waysOfLines(ends, false), false), false); if (s) { yield s; tail += s; }
      }
      check(); add(await wr.totalUsage);
      const last = moreTail(tail, tailSoFar(waysOfLines(ends, true), true), true); if (last) yield last;
      reason = 'stop';
    } catch (error) {
      onError?.({ error }); reason = 'error';
    } finally {
      finish(reason); settle(usage);
    }
  }
  return { textStream: text(), finishReason, totalUsage };
}

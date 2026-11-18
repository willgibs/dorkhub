// The split writer: a page written in three calls and streamed, in reading order, as one page's text (lib/prompts.js
// "the split writer"). The frame comes first as structured output, and each line of the page's head goes out as soon
// as its field is whole. Then the body streams as the writer writes it, given the frame. Then the ways on come as
// structured output, written from that body, and each line goes out once whole. What it returns is what lib/write.js
// reads from streamText: a stream of text, how the writing finished, and what it used across the three calls.
import { Output, jsonSchema, streamText } from 'ai';
import { cachedPrompt } from './ai.js';
import { FRAME_SCHEMA, WAYS_SCHEMA, bodyOf, bodyParts, frameParts, headSoFar, mentionLinker, plannedNames, tailSoFar, waysParts } from './prompts.js';

/* what the two structured calls may write: a frame is about 300 tokens, the ways on about 600 */
const FRAME_TOKENS = 1500;
const WAYS_TOKENS = 2500;
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
  /** @param {{ fixed: string, request: string }} parts @param {number} max @param {object} [schema] */
  const call = (parts, max, schema) => streamText({
    model, prompt: cachedPrompt(parts), maxOutputTokens: max, abortSignal, maxRetries: 1,
    ...(providerOptions ? { providerOptions } : {}),
    ...(schema ? { output: Output.object({ schema: jsonSchema(/** @type {any} */ (schema)) }) } : {}),
    onError: ({ error }) => { failed = failed || error; },
  });
  const check = () => { if (failed) throw failed; };

  async function* text() {
    let reason = 'error';
    try {
      /* the frame: the head, line by line */
      const fr = call(frameParts(input), FRAME_TOKENS, FRAME_SCHEMA);
      let shown = '';
      for await (const part of fr.partialOutputStream) {
        const head = headSoFar(input, /** @type {any} */ (part), false);
        if (head.length > shown.length) { yield head.slice(shown.length); shown = head; }
      }
      check(); const frame = /** @type {import('./prompts.js').Frame} */ (await fr.output); add(await fr.totalUsage);
      const head = headSoFar(input, frame, true);
      if (head.length > shown.length) yield head.slice(shown.length);

      /* the body, as it is written, each planned topic linked at its first mention if the writer left it plain */
      const br = call(bodyParts(input, frame), maxTokens);
      const linker = mentionLinker(plannedNames(input, frame));
      let body = '', held = '', opening = true;
      for await (const d of br.textStream) {
        body += d;
        if (!opening) { const out = linker.push(d); if (out) yield out; continue; }
        held += d;
        for (;;) {
          const nl = held.indexOf('\n'); const line = nl >= 0 ? held.slice(0, nl) : held;
          if (nl >= 0 && (LEAD.test(line) || !line.trim())) { held = held.slice(nl + 1); continue; }
          if (nl < 0 && (LEAD.test(line) || MAYBE_LEAD.test(line))) break;
          opening = false; if (held) { const out = linker.push(held); if (out) yield out; } held = ''; break;
        }
      }
      if (opening && held && !LEAD.test(held)) { const out = linker.push(held); if (out) yield out; }
      const rest = linker.end(); if (rest) yield rest;
      check(); reason = await br.finishReason; add(await br.totalUsage);
      if (reason !== 'stop') return;

      /* the ways on: the end, line by line */
      reason = 'error';
      const wr = call(waysParts(input, frame, bodyOf(body)), WAYS_TOKENS, WAYS_SCHEMA);
      let tail = '';
      for await (const part of wr.partialOutputStream) {
        const t = tailSoFar(/** @type {any} */ (part), false);
        if (t.length > tail.length) { yield t.slice(tail.length); tail = t; }
      }
      check(); const ways = /** @type {import('./prompts.js').Ways} */ (await wr.output); add(await wr.totalUsage);
      const end = tailSoFar(ways, true);
      if (end.length > tail.length) yield end.slice(tail.length);
      reason = 'stop';
    } catch (error) {
      onError?.({ error }); reason = 'error';
    } finally {
      finish(reason); settle(usage);
    }
  }
  return { textStream: text(), finishReason, totalUsage };
}

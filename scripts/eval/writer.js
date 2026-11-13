// One streamed model call, timed the way a reader feels it: the first character, the first character of the
// body (after the link plan's "---"), and the end. The same code serves the mock and a live model.
import { generateText, streamText } from 'ai';

/** @typedef {{ input: number, output: number, cacheRead: number, reasoning: number }} Usage */
/** @param {any} u @returns {Usage} */
const usageOf = u => ({ input: u?.inputTokens ?? 0, output: u?.outputTokens ?? 0, cacheRead: u?.inputTokenDetails?.cacheReadTokens ?? 0, reasoning: u?.outputTokenDetails?.reasoningTokens ?? 0 });

/* where the body begins: the first character after a line "---" */
/** @param {string} text */
export const bodyAt = text => { const m = /(^|\n)-{3,}[ \t]*\n/.exec(text); return m ? m.index + m[0].length : -1; };

/**
 * @param {{ model: import('ai').LanguageModel, system: string | null, prompt: string, maxTokens: number, now?: () => number }} o
 * @returns {Promise<{ text: string, ms: { first: number | null, firstBody: number | null, total: number }, usage: Usage, finish: string, error: string | null }>}
 */
export async function streamPage({ model, system, prompt, maxTokens, now = () => performance.now() }) {
  const t0 = now(); let text = ''; /** @type {number | null} */ let first = null; /** @type {number | null} */ let firstBody = null;
  /** @type {string | null} */ let error = null; let finish = '';
  const r = streamText({ model, ...(system ? { instructions: system } : {}), prompt, maxOutputTokens: maxTokens, maxRetries: 0 });
  for await (const part of r.fullStream) {
    if (part.type === 'text-delta' && part.text) {
      if (first == null) first = now() - t0;
      text += part.text;
      if (firstBody == null) { const b = bodyAt(text); if (b >= 0 && text.length > b) firstBody = now() - t0; }
    } else if (part.type === 'error') error = String(/** @type {any} */ (part.error)?.message || part.error);
    else if (part.type === 'finish') finish = String(/** @type {any} */ (part).finishReason ?? '');
  }
  const total = now() - t0;
  let usage = usageOf(null); try { usage = usageOf(await r.totalUsage); } catch { /* an errored stream has no usage */ }
  return { text, ms: { first, firstBody, total }, usage, finish, error };
}

/* A judge's call: one answer, no streaming needed. */
/** @param {{ model: import('ai').LanguageModel, prompt: string, maxTokens: number }} o */
export async function askJudge({ model, prompt, maxTokens }) {
  const r = await generateText({ model, prompt, maxOutputTokens: maxTokens, maxRetries: 1 });
  return { text: r.text, usage: usageOf(r.totalUsage ?? r.usage) };
}

/* What a writer is asked to think (lib/ai.js `writerSettings`), checked on the request the SDK really sends: to
   Anthropic with a reader's key, and to the gateway. No model is called: a fake fetch reads the request and refuses it. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGateway, streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { writerSettings } from '../lib/ai.js';
import { MODELS, directId } from '../src/shared/models.js';
import { TASKS } from '../lib/prompts.js';

/* send one call the way lib/write.js does, and return the body that left */
const sent = async (/** @type {(fetch: typeof globalThis.fetch) => import('ai').LanguageModel} */ make, /** @type {string} */ id) => {
  /** @type {any} */ let body = null;
  const fetch = /** @type {any} */ (async (/** @type {any} */ _url, /** @type {any} */ init) => { body = JSON.parse(init.body); return new Response(JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'a test' } }), { status: 400, headers: { 'content-type': 'application/json' } }); });
  const tuned = writerSettings(id);
  const r = streamText({ model: make(fetch), prompt: 'A page.', maxOutputTokens: TASKS.page.maxTokens + tuned.room, maxRetries: 0, ...(tuned.options ? { providerOptions: tuned.options } : {}), onError: () => {} });
  try { for await (const _ of r.textStream) { /* nothing comes */ } } catch { /* the refusal */ }
  return body;
};

test('every model a reader can pick has a say on thinking, and the rest are called as they were', () => {
  for (const m of MODELS.filter(m => m.vetted)) assert.ok(writerSettings(m.id).options, `${m.id} would think as long as it likes`);
  assert.deepEqual(writerSettings('openai/gpt-6-luna'), { options: null, room: 0 });
  assert.deepEqual(writerSettings('anthropic/claude-haiku-5.5'), { options: { anthropic: { thinking: { type: 'disabled' } } }, room: 0 });
  /* a writer that cannot stop thinking gets room for it beyond the page's own limit; one that can gets none */
  assert.ok(writerSettings('anthropic/claude-opus-5.5').room >= 4000);
  assert.equal(writerSettings('anthropic/claude-sonnet-5.5').room, 0);
});

test('with a reader\'s key, Anthropic is told: Haiku does not think, Sonnet only between tools, Opus as little as it can', async () => {
  const direct = (/** @type {string} */ id) => (/** @type {typeof globalThis.fetch} */ fetch) => createAnthropic({ apiKey: 'sk-ant-test', fetch })(directId(id));
  const haiku = await sent(direct('anthropic/claude-haiku-5.5'), 'anthropic/claude-haiku-5.5');
  assert.deepEqual(haiku.thinking, { type: 'disabled' });
  assert.equal(haiku.max_tokens, TASKS.page.maxTokens, 'the page\'s limit is all for the page');
  const sonnet = await sent(direct('anthropic/claude-sonnet-5.5'), 'anthropic/claude-sonnet-5.5');
  assert.deepEqual(sonnet.thinking, { type: 'between_tools' });
  const opus = await sent(direct('anthropic/claude-opus-5.5'), 'anthropic/claude-opus-5.5');
  assert.equal(opus.output_config?.effort, 'low');
  assert.equal(opus.thinking, undefined, 'Opus 5.5 refuses a request that turns thinking off');
  assert.equal(opus.max_tokens, TASKS.page.maxTokens + writerSettings('anthropic/claude-opus-5.5').room);
});

test('through the gateway, the same settings travel with the request', async () => {
  const via = (/** @type {string} */ id) => (/** @type {typeof globalThis.fetch} */ fetch) => createGateway({ apiKey: 'vck_test', fetch })(id);
  const haiku = await sent(via('anthropic/claude-haiku-5.5'), 'anthropic/claude-haiku-5.5');
  assert.ok(haiku, 'a request left');
  assert.match(JSON.stringify(haiku), /"anthropic":\{"thinking":\{"type":"disabled"\}\}/);
  const opus = await sent(via('anthropic/claude-opus-5.5'), 'anthropic/claude-opus-5.5');
  assert.match(JSON.stringify(opus), /"anthropic":\{"effort":"low"\}/);
});

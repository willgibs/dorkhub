/* A batch of pages written ahead of time (scripts/seeds/batch.js) asks for each page exactly as production asks for a
   live one: the same model, output limit, thinking and words, with the brief the front page gives its own topics.
   No model is called: production's request is read off a stand-in for the network, the batch's off its builder. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { cachedPrompt, writerSettings } from '../lib/ai.js';
import { TASKS, composePage, pageInput, pageParts, pagePrompt } from '../lib/prompts.js';
import { MODELS, TRIAL_MODEL, directId } from '../src/shared/models.js';
import { batchCost, readResult, scorecard, seedProblems, seedRequest } from '../scripts/seeds/batch.js';

const repo = fileURLToPath(new URL('..', import.meta.url));

/* the body lib/write.js sends for a live page on this model (a reader's own Anthropic key, or Dorkhub's) */
const live = async (/** @type {string} */ id, /** @type {string} */ title) => {
  /** @type {any} */ let body = null;
  const fetch = /** @type {any} */ (async (/** @type {any} */ _url, /** @type {any} */ init) => { body = JSON.parse(init.body); return new Response(JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'a test' } }), { status: 400, headers: { 'content-type': 'application/json' } }); });
  const tuned = writerSettings(id);
  const r = streamText({ model: createAnthropic({ apiKey: 'sk-ant-test', fetch })(directId(id)), prompt: cachedPrompt(pageParts(pageInput({ title, lens: 'encyclopedic' }))), maxOutputTokens: TASKS.page.maxTokens + tuned.room, maxRetries: 0, ...(tuned.options ? { providerOptions: tuned.options } : {}), onError: () => {} });
  try { for await (const _ of r.textStream) { /* nothing comes */ } } catch { /* the refusal */ }
  return body;
};
const text = (/** @type {any} */ params) => params.messages[0].content.map((/** @type {any} */ b) => b.text).join('');

test('a batch asks for a page as production does: the same model, limit, thinking and words, for every vetted writer', async () => {
  for (const m of MODELS.filter(m => m.vetted)) {
    const sent = await live(m.id, 'Tardigrades');
    const { params } = seedRequest('p00', 'Tardigrades', m.id);
    assert.equal(params.model, sent.model, m.id);
    assert.equal(params.max_tokens, sent.max_tokens, `${m.id}: the same output limit, room to think included`);
    assert.deepEqual(params.thinking, sent.thinking, `${m.id}: thinking`);
    assert.deepEqual(params.output_config, sent.output_config, `${m.id}: effort`);
    assert.equal(text(params), text(sent), `${m.id}: the words`);
  }
});

test('what every page shares is cached for the hour a batch may take; the rest is this page', () => {
  const { params } = seedRequest('p00', 'Tardigrades', TRIAL_MODEL);
  const [shared, own] = params.messages[0].content;
  assert.deepEqual(shared.cache_control, { type: 'ephemeral', ttl: '1h' });
  assert.equal(/** @type {any} */ (own).cache_control, undefined);
  assert.equal(shared.text, pageParts(pageInput({ title: 'Tardigrades' })).fixed, 'the same instructions live pages share');
  assert.equal(params.model, directId(TRIAL_MODEL));
});

test('a front-page topic is sent with its brief, exactly as `seeds.mjs brief` prints it; any other page with its prompt', () => {
  for (const title of ['Black holes', 'Venus flytraps']) {
    const brief = execFileSync(process.execPath, ['scripts/seeds.mjs', 'brief', title], { cwd: repo, encoding: 'utf8' });
    assert.equal(text(seedRequest('p00', title, TRIAL_MODEL).params), brief, title);
    assert.match(brief, /This page opens from Dorkhub's front page/);
  }
  for (const title of ['Tardigrades', 'Why is ice slippery?']) assert.equal(text(seedRequest('p00', title, TRIAL_MODEL).params), pagePrompt(pageInput({ title, lens: 'encyclopedic' })), title);
  assert.match(text(seedRequest('p00', 'Why is ice slippery?', TRIAL_MODEL).params), /The reader asked: "Why is ice slippery\?"/, 'a question is asked as one');
});

test('a try changes one thing from production\'s call: how it thinks, where the words go, or the words', () => {
  const prod = seedRequest('p00', 'Black holes', TRIAL_MODEL).params;
  const think = seedRequest('p00', 'Black holes', TRIAL_MODEL, 'haiku-think').params;
  assert.deepEqual([think.model, think.thinking, think.output_config, think.max_tokens], [prod.model, undefined, { effort: 'low' }, TASKS.page.maxTokens + 8000], 'thinking a little, with room for it');
  assert.equal(text(think), text(prod));
  const split = seedRequest('p00', 'Black holes', TRIAL_MODEL, 'haiku-split').params;
  assert.deepEqual(split.system?.[0].cache_control, { type: 'ephemeral', ttl: '1h' });
  assert.equal(`${split.system?.[0].text}\n\n${split.messages[0].content}`, text(prod), 'the fixed part as instructions, the request as the message');
  assert.equal(split.system?.[0].text, composePage(pageInput({ title: 'Black holes' }), 'split').system, "the eval's split variant");
  assert.deepEqual(split.thinking, prod.thinking);
  /* the lean try changes the words only, and asks as a live page is asked: one message, no front-page brief */
  const lean = seedRequest('p00', 'Black holes', TRIAL_MODEL, 'haiku-lean').params; const L = composePage(pageInput({ title: 'Black holes' }), 'lean');
  assert.equal(text(lean), `${L.system}\n\n${L.prompt}`, "the eval's lean words");
  assert.deepEqual([lean.model, lean.thinking, lean.max_tokens, lean.system, lean.messages[0].content[0].cache_control], [prod.model, prod.thinking, prod.max_tokens, undefined, { type: 'ephemeral', ttl: '1h' }]);
  const sonnet = seedRequest('p00', 'Black holes', TRIAL_MODEL, 'sonnet').params;
  assert.deepEqual([sonnet.model, sonnet.thinking], ['claude-sonnet-5-5', { type: 'between_tools' }]);
  assert.throws(() => seedRequest('p00', 'Black holes', TRIAL_MODEL, 'nope'), /unknown arm/);
});

test('an arm\'s scorecard: kept, passing, stopped early, thinking and cost', () => {
  const page = readFileSync(new URL('../lib/seeds/black-holes/index.txt', import.meta.url), 'utf8');
  const usage = { input_tokens: 100, output_tokens: Math.round(page.length / 2.77) + 400 };
  const s = scorecard(TRIAL_MODEL, [{ title: 'Black holes', text: page, usage }, { title: 'Black holes', text: page.slice(0, 900), usage }, { title: 'Black holes', text: null, usage: null }]);
  assert.deepEqual([s.pages, s.written, s.keptByProduction, s.passSeedsChecks, s.stoppedBeforeQuestions], [3, 2, 1, 1, 1]);
  assert.ok(s.thinkingTokens > 0 && s.waitSeconds > 0 && s.dollars > 0);
});

test('a result is a page only when the writer stopped on its own', () => {
  const ok = { custom_id: 'p00', result: { type: 'succeeded', message: { stop_reason: 'end_turn', content: [{ type: 'text', text: '# A page' }], usage: { input_tokens: 1, output_tokens: 2 } } } };
  assert.deepEqual(readResult(ok), { text: '# A page', why: null, usage: { input_tokens: 1, output_tokens: 2 } });
  assert.equal(readResult({ result: { ...ok.result, message: { ...ok.result.message, stop_reason: 'max_tokens' } } }).why, 'stopped at max_tokens');
  assert.equal(readResult({ result: { type: 'errored', error: { type: 'error', error: { type: 'overloaded_error' } } } }).why, 'errored (overloaded_error)');
  assert.equal(readResult({ result: { type: 'expired' } }).text, null);
});

test('only a page that passes the checks a page written ahead of time must is kept', () => {
  const page = readFileSync(new URL('../lib/seeds/black-holes/index.txt', import.meta.url), 'utf8');
  assert.deepEqual(seedProblems('Black holes', page), [], 'the page there now passes');
  assert.ok(seedProblems('Black holes', page.slice(0, Math.floor(page.length / 3))).includes('not a whole page'), 'a cut-off page does not');
  const kind = /^# .+ :: (\S+)/.exec(page)?.[1];
  assert.match(seedProblems('Black holes', page.replace(`:: ${kind}`, kind === 'person' ? ':: place' : ':: person')).join(), /not the front page's/, 'nor one in another kind than its card');
});

test('what a batch costs: half the model\'s price, cache writes at twice the input price and reads at a tenth', () => {
  /* Haiku 5.5: $0.10 in and $0.50 out per million tokens; a batch pays half */
  const d = batchCost(TRIAL_MODEL, [{ input_tokens: 100, cache_creation_input_tokens: 2000, cache_read_input_tokens: 0, output_tokens: 1700 }, { input_tokens: 100, cache_creation_input_tokens: 0, cache_read_input_tokens: 2000, output_tokens: 1700 }, null]);
  assert.ok(Math.abs(d - (100 * 0.1 + 2000 * 0.1 * 2 + 1700 * 0.5 + 100 * 0.1 + 2000 * 0.01 + 1700 * 0.5) / 2e6) < 1e-12, String(d));
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { articleUrl, clipText, referenceNotes } from '../lib/grounding.js';

const LEAD = 'The Lewis gun is a First World War-era light machine gun. Designed privately in the United States, it was developed and mass-produced in the United Kingdom. It was widely used by British and British Empire troops during the war.';
/** @param {any} body @param {{ status?: number, delay?: number, calls?: string[] }} [o] @returns {typeof fetch} */
const fakeFetch = (body, { status = 200, delay = 0, calls = [] } = {}) => /** @type {any} */ (async (/** @type {string} */ url, /** @type {any} */ init) => {
  calls.push(url);
  if (delay) await new Promise((r, no) => { const t = setTimeout(r, delay); init?.signal?.addEventListener('abort', () => { clearTimeout(t); no(new Error('aborted')); }); });
  return { ok: status < 400, status, json: async () => body };
});
const page = (/** @type {Record<string, unknown>} */ p) => ({ query: { pages: [{ title: 'Lewis gun', extract: LEAD, ...p }] } });

test('notes are the lead as plain text, with the article title and address for credit', async () => {
  const calls = /** @type {string[]} */ ([]);
  const n = await referenceNotes('lewis gun', { fetch: fakeFetch(page({}), { calls }) });
  assert.ok(n);
  assert.equal(n.title, 'Lewis gun'); assert.equal(n.url, 'https://en.wikipedia.org/wiki/Lewis_gun');
  assert.equal(n.text, LEAD); assert.equal(n.tokens, Math.ceil(LEAD.length / 4));
  assert.equal(calls.length, 1);
  const u = new URL(calls[0]);
  assert.equal(u.hostname, 'en.wikipedia.org'); assert.equal(u.searchParams.get('titles'), 'lewis gun');
  assert.equal(u.searchParams.get('exintro'), '1'); assert.equal(u.searchParams.get('explaintext'), '1'); assert.equal(u.searchParams.get('redirects'), '1');
  const whole = /** @type {string[]} */ ([]);
  await referenceNotes('Lewis gun', { fetch: fakeFetch(page({}), { calls: whole }), intro: false });
  assert.equal(new URL(whole[0]).searchParams.get('exintro'), null, 'a fact check reads the whole article');
});

test('notes are clipped to about 500 tokens, at a sentence', async () => {
  const long = Array.from({ length: 200 }, (_, i) => `Sentence number ${i} says something about the gun.`).join(' ');
  const n = await referenceNotes('Lewis gun', { fetch: fakeFetch(page({ extract: long })) });
  assert.ok(n && n.text.length <= 2000 && n.text.length > 1500); assert.ok(n.text.endsWith('.'));
  assert.ok(n.tokens <= 500);
  assert.equal(clipText('one two three', 7), 'one…');
});

test('no notes, never an error: failure, timeout, disambiguation, missing, a question', async () => {
  const none = async (/** @type {string} */ t, /** @type {any} */ o) => assert.equal(await referenceNotes(t, o), null, JSON.stringify(t));
  await none('Lewis gun', { fetch: fakeFetch(page({}), { status: 500 }) });
  await none('Lewis gun', { fetch: /** @type {any} */ (async () => { throw new Error('offline'); }) });
  await none('Lewis gun', { fetch: fakeFetch({ nonsense: true }) });
  await none('Mercury', { fetch: fakeFetch(page({ title: 'Mercury', pageprops: { disambiguation: '' } })) });
  await none('Mercury', { fetch: fakeFetch(page({ title: 'Mercury', extract: 'Mercury commonly refers to:\nMercury may refer to: a planet, an element or a god, among many other things listed here.' })) });
  await none('Nothing here', { fetch: fakeFetch(page({ missing: true })) });
  await none('Lewis gun', { fetch: fakeFetch(page({ extract: 'Too short.' })) });
  const calls = /** @type {string[]} */ ([]);
  await none('Why is ice slippery?', { fetch: fakeFetch(page({}), { calls }) });
  await none('how do magnets work', { fetch: fakeFetch(page({}), { calls }) });
  await none('', { fetch: fakeFetch(page({}), { calls }) });
  assert.equal(calls.length, 0, 'a question never asks Wikipedia');
  const t0 = Date.now();
  await none('Lewis gun', { fetch: fakeFetch(page({}), { delay: 5000 }), timeoutMs: 50 });
  assert.ok(Date.now() - t0 < 1000, 'gives up at the timeout');
  /* a fetch that ignores the abort signal still loses the race */
  const t1 = Date.now();
  await none('Lewis gun', { fetch: /** @type {any} */ (() => new Promise(r => setTimeout(() => r({ ok: true, json: async () => page({}) }), 400))), timeoutMs: 30 });
  assert.ok(Date.now() - t1 < 300);
});

test('article addresses keep their punctuation readable', () => {
  assert.equal(articleUrl('Mercury (planet)'), 'https://en.wikipedia.org/wiki/Mercury_(planet)');
  assert.equal(articleUrl('Rubik’s Cube'), 'https://en.wikipedia.org/wiki/Rubik%E2%80%99s_Cube');
});

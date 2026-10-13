/* ================= POST /api/write: every word Dorkhub writes comes through here =================
   Request:  { task, input, fresh? } as JSON, plus x-dh-provider / x-dh-model / x-dh-key
             headers when the reader brings their own key.
   Response: the text, streamed as plain UTF-8 as it is written. Failures before the first
             word come back as an HTTP error with { error: code }. A failure or cut-off after
             words have flowed is appended as one trailer: "\u0000" + JSON ({ error } or
             { truncated: true }). The x-dh-trial header reports what is left of the trial.

   Order of work: validate → choose the writer → (trial) read what's left → answer from
   cache if this exact request was answered before (free) → (trial) reserve one unit →
   write → hand the unit back if not a single word came out. Only answers that finished
   cleanly and look right are cached, keyed by a hash of model + prompt. */

import { streamText } from 'ai';
import { getCache, waitUntil } from '@vercel/functions';
import { createHash } from 'node:crypto';
import { BadInput, PROMPT_VERSION, TASKS } from './prompts.js';
import { Refusal, STATUS, chooseWriter, classify } from './ai.js';
import { cacheCounters, redisConfig, redisCounters } from './counters.js';
import { TRIAL_COOKIE, clientIp, deviceCookie, newDeviceId, peek, readCookie, refund, reserve, trialConfig, trialHeader, trialScopes, validDeviceId } from './trial.js';

const MAX_BODY = 64 * 1024;
const TEXT_TTL = 14 * 86400;

/** @typedef {import('./trial.js').Store} Store */
/** @typedef {import('./counters.js').Counters} Counters */
/** @typedef {keyof typeof STATUS} Code */
/** @typedef {{ env?: Record<string, string | undefined>, store?: Store, counters?: Counters, textCache?: boolean, log?: (line: Record<string, unknown>) => void }} Deps */

/* ---------- shared per instance: the Runtime Cache (memory when it isn't there) and the counters ---------- */
/** @type {Store | null} */ let shared = null;
/** @type {Counters | null} */ let sharedCounters = null;
const runtimeCacheReady = () => {
  const ctx = /** @type {any} */ (globalThis)[Symbol.for('@vercel/request-context')]?.get?.();
  return !!(ctx?.cache || (process.env.RUNTIME_CACHE_ENDPOINT && process.env.RUNTIME_CACHE_HEADERS));
};
function sharedStore() {
  if (!shared) shared = getCache({ namespace: 'dh', keyHashFunction: k => k });
  return shared;
}
/** @param {Record<string, string | undefined>} env @param {Store} store */
function sharedCountersFor(env, store) {
  if (!sharedCounters) {
    const redis = redisConfig(env);
    sharedCounters = redis ? redisCounters(redis) : cacheCounters(store);
    console.log(JSON.stringify({ evt: 'store', counters: sharedCounters.name, runtimeCache: runtimeCacheReady() }));
  }
  return sharedCounters;
}

/* waitUntil, bound to this request now. With cancellation on, a disconnect can end the
   function at any moment, and an abort listener may not run inside the request's context. */
function deferrer() {
  const ctx = /** @type {any} */ (globalThis)[Symbol.for('@vercel/request-context')]?.get?.();
  /** @param {Promise<unknown>} p */
  return p => { const q = p.catch(() => {}); if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(q); else waitUntil(q); };
}

/** @param {string} s */
const sha = s => createHash('sha256').update(s).digest('hex');
const BASE = { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };

/** @param {Code} code @param {Headers} [headers] */
function fail(code, headers = new Headers()) {
  headers.set('content-type', 'application/json'); headers.set('cache-control', 'no-store');
  if (code === 'method') headers.set('allow', 'POST');
  return new Response(JSON.stringify({ error: code }), { status: STATUS[code], headers });
}

/* Only pages served from the same host may call the API. Browsers always send Origin on POST. */
/** @param {Request} request */
function sameOrigin(request) {
  const origin = request.headers.get('origin'); if (!origin) return true;
  try {
    const host = new URL(origin).host;
    return host === new URL(request.url).host || host === request.headers.get('x-forwarded-host');
  } catch { return false; }
}

/** @param {string} s */
const clean = s => s.replace(/\u0000/g, '');

/** @param {Request} request @param {Deps} [deps] @returns {Promise<Response>} */
export async function handleWrite(request, deps = {}) {
  const env = deps.env ?? process.env;
  const store = deps.store ?? sharedStore();
  const textCache = deps.textCache ?? runtimeCacheReady();
  const log = deps.log ?? (line => console.log(JSON.stringify(line)));
  const defer = deferrer();

  if (request.method !== 'POST') return fail('method');
  if (!sameOrigin(request)) return fail('forbidden');
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY) return fail('too_large');

  /** @type {any} */ let body;
  try { const raw = await request.text(); if (raw.length > MAX_BODY) return fail('too_large'); body = JSON.parse(raw); }
  catch { return fail('bad_request'); }
  const taskName = body && typeof body.task === 'string' && Object.hasOwn(TASKS, body.task) ? body.task : null;
  if (!taskName) return fail('bad_request');
  const task = TASKS[taskName];

  let input;
  try { input = task.input(body.input); }
  catch (e) { if (e instanceof BadInput) return fail('bad_request'); throw e; }

  let writer;
  try { writer = await chooseWriter({ request, env, task, taskName, input }); }
  catch (e) { if (e instanceof Refusal) return fail(/** @type {Code} */ (e.code)); throw e; }
  const byok = !!writer.byok;
  const headers = new Headers(BASE);

  /* ---------- the trial: is anything left? (nothing is spent yet) ---------- */
  /** @type {null | { cfg: ReturnType<typeof trialConfig>, scopes: ReturnType<typeof trialScopes>, counters: Counters, left: Record<'pages' | 'extras', number> }} */
  let trial = null;
  const kind = task.spends === 'page' ? 'pages' : task.spends === 'extra' ? 'extras' : null;
  if (!byok) {
    const cfg = trialConfig(env);
    if (cfg.off) return fail('trial_paused');
    const cookie = readCookie(request, TRIAL_COOKIE);
    const deviceId = validDeviceId(cookie) ? cookie : newDeviceId();
    if (deviceId !== cookie) headers.append('set-cookie', deviceCookie(deviceId, new URL(request.url).protocol === 'https:'));
    const scopes = trialScopes({ deviceId, ip: clientIp(request), salt: env.DH_SALT || env.VERCEL_PROJECT_ID || 'dorkhub' });
    const counters = deps.counters ?? sharedCountersFor(env, store);
    const left = await peek(counters, scopes, cfg);
    trial = { cfg, scopes, counters, left };
    headers.set('x-dh-trial', trialHeader(left));
    if (kind && left[kind] <= 0) return fail(kind === 'pages' ? 'trial_over' : 'tools_over', headers);
  }

  /* ---------- answered before? free, and instant ---------- */
  const prompt = task.prompt(input);
  const cacheKey = task.cacheable && textCache ? `text:${sha(JSON.stringify([PROMPT_VERSION, writer.id, taskName, prompt]))}` : null;
  if (cacheKey && !body.fresh) {
    let hit = null; try { hit = await store.get(cacheKey); } catch { /* a miss is fine */ }
    if (typeof hit === 'string' && hit) {
      headers.set('x-dh-cache', 'hit');
      log({ evt: 'write', task: taskName, model: writer.id, byok: writer.byok, cached: true });
      return new Response(hit, { status: 200, headers });
    }
  }

  /* ---------- the trial: take one unit before a single token is bought ---------- */
  if (trial && kind) {
    let r;
    try { r = await reserve(trial.counters, trial.scopes, kind, trial.cfg); }
    catch (e) { console.error(JSON.stringify({ evt: 'trial-reserve', message: String(/** @type {any} */ (e)?.message || e) })); return fail('trial_paused', headers); }
    if (!r.ok) { headers.set('x-dh-trial', trialHeader({ ...trial.left, [kind]: 0 })); return fail(kind === 'pages' ? 'trial_over' : 'tools_over', headers); }
    headers.set('x-dh-trial', trialHeader({ ...trial.left, [kind]: r.left }));
  }
  /* The unit comes back only when nothing was bought: the reader left before the writer
     started, or the writer failed before a word. A reader who hangs up after the writer
     starts is charged, or dropping requests would be a free way to spend Dorkhub's tokens. */
  const giveBack = () => { if (trial && kind) defer(refund(trial.counters, trial.scopes, kind)); };
  if (request.signal?.aborted) { giveBack(); return new Response(null, { status: 499 }); }

  /* ---------- write ---------- */
  const t0 = Date.now();
  const ac = new AbortController();
  request.signal?.addEventListener('abort', () => ac.abort(), { once: true });
  /** @type {unknown} */ let failure = null;
  const result = streamText({
    model: writer.model, prompt, maxOutputTokens: task.maxTokens, abortSignal: ac.signal, maxRetries: 1,
    onError: ({ error }) => { failure = failure || error; },
  });
  const words = result.textStream[Symbol.asyncIterator]();
  /** @type {IteratorResult<string>} */ let first;
  try { first = await words.next(); } catch (e) { failure = failure || e; first = { done: true, value: undefined }; }

  /* How it ended: 'ok' only for a clean stop that nobody aborted. */
  /** @returns {Promise<{ code: Code | 'cancelled' | null, truncated: boolean }>} */
  const ending = async () => {
    let reason = null; try { reason = await result.finishReason; } catch { /* aborted or failed */ }
    if (ac.signal.aborted) return { code: 'cancelled', truncated: false };
    if (failure) return { code: classify(failure, byok), truncated: false };
    if (reason === 'stop') return { code: null, truncated: false };
    if (reason === 'length') return { code: null, truncated: true };
    if (reason === 'content-filter') return { code: 'refused', truncated: false };
    return { code: 'upstream_error', truncated: false };
  };
  /** @param {string} end @param {Record<string, unknown>} [extra] */
  const report = async (end, extra = {}) => {
    let usage = null; try { usage = await result.totalUsage; } catch { /* no usage on failure */ }
    log({ evt: 'write', task: taskName, model: writer.id, byok: writer.byok, ms: Date.now() - t0, in: usage?.inputTokens ?? null, out: usage?.outputTokens ?? null, end, ...extra });
  };

  if (first.done) {
    const { code } = await ending();
    const final = code || 'upstream_error';
    if (final !== 'cancelled') giveBack();
    if (final === 'trial_paused') console.error(JSON.stringify({ evt: 'trial-credentials', message: String(/** @type {any} */ (failure)?.message || '').slice(0, 300) }));
    defer(report(final));
    if (final === 'cancelled') return new Response(null, { status: 499 });
    if (trial && kind) headers.set('x-dh-trial', trialHeader(trial.left));
    return fail(final, headers);
  }

  const enc = new TextEncoder();
  let text = clean(first.value);
  let reported = false;
  /** @param {string} end @param {Record<string, unknown>} [extra] */
  const finish = (end, extra) => { if (!reported) { reported = true; defer(report(end, extra)); } };
  const stream = new ReadableStream({
    start(c) { c.enqueue(enc.encode(text)); },
    async pull(c) {
      try {
        const next = await words.next();
        if (!next.done) { const v = clean(next.value); text += v; if (v) c.enqueue(enc.encode(v)); return; }
      } catch (e) { failure = failure || e; }
      const { code, truncated } = await ending();
      if (code === 'cancelled') { try { c.close(); } catch { /* the reader is gone */ } finish('cancelled'); return; }
      const tail = code ? { error: code } : truncated ? { truncated: true } : null;
      try { if (tail) c.enqueue(enc.encode(`\u0000${JSON.stringify(tail)}`)); c.close(); } catch { /* the reader is gone */ }
      const usable = !tail && (task.usable ? task.usable(text) : true);
      if (cacheKey && usable) defer(store.set(cacheKey, text, { ttl: TEXT_TTL, name: `text-${taskName}` }));
      finish(code || 'ok', { truncated, cached: !!(cacheKey && usable) });
    },
    cancel() { ac.abort(); words.return?.(); finish('cancelled'); },
  });
  return new Response(stream, { status: 200, headers });
}

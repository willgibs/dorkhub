/* ================= POST /api/write: every word Dorkhub writes comes through here =================
   Request:  { task, input, fresh?, cachedOnly? } as JSON, plus x-dh-provider / x-dh-model /
             x-dh-key headers when the reader brings their own key.
   Response: the text, streamed as plain UTF-8 as it is written. Failures before the first
             word come back as an HTTP error with { error: code }. A failure or cut-off after
             words have flowed is appended as one trailer: "\u0000" + JSON ({ error } or
             { truncated: true }). The x-dh-trial header reports what is left of the trial.

   Order of work: validate → choose the writer → a page written ahead of time, or this exact
   request answered before (both free, even when the trial is over or paused) → cachedOnly
   stops here with 204 → (trial) read what's left → (trial) reserve one unit → write → hand
   the unit back if not a single word came out. Pages are written for their topic, so a page's
   cache key is what makes it that page (pageId: topic, voice, question, sense, pair), the model
   and the prompt version; every other answer is keyed by its prompt. Only answers that finished
   cleanly and look right are cached. A fresh request is a private rewrite: it never reads the
   cache and is never written to it, so one reader can't replace everyone's page. The key
   carries the deployment, so preview and mock answers never reach production.

   Where answers are kept is lib/library.js. While an answer is being written on this instance,
   a second request for the same key reads along with the first (lib/flight.js) instead of
   writing it again: free, with no x-dh-cache header. */

import { streamText } from 'ai';
import { getCache, waitUntil } from '@vercel/functions';
import { BadInput, PROMPT_VERSION, TASKS } from './prompts.js';
import { pageId } from '../src/shared/world.js';
import { Refusal, STATUS, chooseWriter, classify, pauseCause } from './ai.js';
import { cacheCounters, redisConfig, redisCounters } from './counters.js';
import { Flight, claim, flightsOf } from './flight.js';
import { openLibrary, redisLayer } from './library.js';
import { sha } from './sha.js';
import { TRIAL_COOKIE, clientIp, deviceCookie, newDeviceId, peek, readCookie, refund, reserve, trialConfig, trialHeader, trialScopes, validDeviceId } from './trial.js';

const MAX_BODY = 64 * 1024;

/** @typedef {import('./trial.js').Store} Store */
/** @typedef {import('./counters.js').Counters} Counters */
/** @typedef {import('./library.js').Layer} Layer */
/** @typedef {keyof typeof STATUS} Code */
/** @typedef {(line: Record<string, unknown>) => void} Log */
/** @typedef {{ env?: Record<string, string | undefined>, store?: Store, counters?: Counters, textCache?: boolean, durable?: Layer | null, promptVersion?: string, log?: Log, seeds?: URL }} Deps */

/* ---------- shared per instance: the Runtime Cache (memory when it isn't there) and the counters ---------- */
/** @type {Store | null} */ let shared = null;
/** @type {Counters | null} */ let sharedCounters = null;
/** This request's Vercel context, when there is one. @returns {any} */
const requestContext = () => /** @type {any} */ (globalThis)[Symbol.for('@vercel/request-context')]?.get?.();
const runtimeCacheReady = () => !!(requestContext()?.cache || (process.env.RUNTIME_CACHE_ENDPOINT && process.env.RUNTIME_CACHE_HEADERS));
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

/* The durable library is switched on by itself (DH_LIBRARY=redis), not by Redis being there: connecting
   Redis for the trial's counters must not start keeping every page. */
/** @type {Layer | null | undefined} */ let sharedDurable;
/** @param {Record<string, string | undefined>} env */
function sharedDurableFor(env) {
  if (sharedDurable === undefined) {
    const redis = env.DH_LIBRARY === 'redis' ? redisConfig(env) : null;
    sharedDurable = redis ? redisLayer(redis) : null;
    if (env.DH_LIBRARY) console.log(JSON.stringify({ evt: 'store', library: sharedDurable ? sharedDurable.name : 'off' }));
  }
  return sharedDurable;
}

/** An error as the logs may hold it: its name and a short message, never content. @param {unknown} e */
export const errorText = e => { const x = /** @type {any} */ (e); return `${x?.name || 'Error'}: ${String(x?.message ?? x).slice(0, 80)}`; };

/* waitUntil, bound to this request now. With cancellation on, a disconnect can end the
   function at any moment, and an abort listener may not run inside the request's context.
   A job that fails is logged by what it was: { evt: 'deferred', what, error }. */
/** @param {Log} log */
function deferrer(log) {
  const ctx = requestContext();
  /** @param {Promise<unknown>} p @param {string} what */
  return (p, what) => {
    const q = p.catch(e => { try { log({ evt: 'deferred', what, error: errorText(e) }); } catch { /* a log line never fails the job */ } });
    if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(q); else waitUntil(q);
  };
}

/* Production's answers and everyone else's (previews, the mock writer, a laptop) never mix. */
/** @param {Record<string, string | undefined>} env */
export const textNs = env => (env.VERCEL_ENV === 'production' ? 'text' : `text-${env.VERCEL_ENV || 'local'}`);
const BASE = { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };

/** @param {Code} code @param {Headers} [headers] */
function fail(code, headers = new Headers()) {
  headers.set('content-type', 'application/json'); headers.set('cache-control', 'no-store');
  if (code === 'method') headers.set('allow', 'POST');
  return new Response(JSON.stringify({ error: code }), { status: STATUS[code], headers });
}
const gone = () => new Response(null, { status: 499 });

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

/** Resolves when the request is aborted (never, without a signal). @param {AbortSignal | undefined} signal @returns {Promise<'gone'>} */
const abortOf = signal => new Promise(r => { if (!signal) return; if (signal.aborted) r('gone'); else signal.addEventListener('abort', () => r('gone'), { once: true }); });

/** @param {Request} request @param {Deps} [deps] @returns {Promise<Response>} */
export async function handleWrite(request, deps = {}) {
  const env = deps.env ?? process.env;
  const store = deps.store ?? sharedStore();
  const textCache = deps.textCache ?? runtimeCacheReady();
  const log = deps.log ?? (line => console.log(JSON.stringify(line)));
  const defer = deferrer(log);

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

  const fresh = !!body.fresh;
  const cachedOnly = body.cachedOnly === true;
  if (cachedOnly && taskName !== 'page') return fail('bad_request');

  const version = deps.promptVersion ?? PROMPT_VERSION;
  const library = openLibrary({ store, textCache, durable: deps.durable !== undefined ? deps.durable : sharedDurableFor(env), seeds: deps.seeds, warn: (what, e) => log({ evt: 'library', what, error: errorText(e) }) });

  /* ---------- written ahead of time: free, instant, checked, and there even while the trial is paused ----------
     Served in the default voice to every reader, keys included: they are our best pages. One of the
     front page's topics not written yet is its placeholder, and says so (x-dh-cache: placeholder). */
  if (taskName === 'page' && !fresh) {
    const seed = await library.seed(input);
    if (seed) { headers.set('x-dh-cache', seed.placeholder ? 'placeholder' : 'seed'); log({ evt: 'write', task: taskName, seed: true, ...(seed.placeholder ? { placeholder: true } : {}), ...(cachedOnly ? { cachedOnly } : {}) }); return new Response(seed.text, { status: 200, headers }); }
  }

  /* ---------- answered before? free and instant, for anyone, before any trial check ---------- */
  const prompt = task.prompt(input);
  const cacheKey = task.cacheable && library.keeps(taskName) ? `${textNs(env)}:${sha(JSON.stringify([version, writer.id, taskName, taskName === 'page' ? pageId(input) : prompt]))}` : null;
  /* where a finished page lives for good: its own key, whatever prompt wrote it (lib/library.js) */
  const at = { deepKey: taskName === 'page' ? `${textNs(env)}:page:${sha(JSON.stringify([writer.id, pageId(input)]))}` : null, version };
  if (cacheKey && !fresh) {
    const hit = await library.read(cacheKey, taskName, at);
    if (hit) {
      if (hit.refill) defer(hit.refill, 'cache-refill');
      headers.set('x-dh-cache', 'hit');
      log({ evt: 'write', task: taskName, model: writer.id, byok: writer.byok, cached: true, ...(hit.from === 'durable' ? { durable: true } : {}), ...(cachedOnly ? { cachedOnly } : {}) });
      return new Response(hit.text, { status: 200, headers });
    }
  }
  /* a prefetch only ever reads: nothing is written, reserved or remembered about the reader */
  if (cachedOnly) { log({ evt: 'write', task: taskName, cachedOnly, cached: false }); return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } }); }

  /* ---------- the trial: what is left (looking spends nothing) ---------- */
  const kind = task.spends === 'page' ? 'pages' : task.spends === 'extra' ? 'extras' : null;
  /** @param {ReturnType<typeof trialConfig>} cfg */
  const readTrial = async cfg => {
    const cookie = readCookie(request, TRIAL_COOKIE);
    const deviceId = validDeviceId(cookie) ? cookie : newDeviceId();
    if (deviceId !== cookie) headers.append('set-cookie', deviceCookie(deviceId, new URL(request.url).protocol === 'https:'));
    const scopes = trialScopes({ deviceId, ip: clientIp(request), salt: env.DH_SALT || env.VERCEL_PROJECT_ID || 'dorkhub' });
    const counters = deps.counters ?? sharedCountersFor(env, store);
    const left = await peek(counters, scopes, cfg);
    headers.set('x-dh-trial', trialHeader(left));
    return { cfg, scopes, counters, left };
  };
  /** The trial is paused; the log says why (off, counters, gateway_auth, no_credit). @param {string} why */
  const paused = why => { log({ evt: 'write', task: taskName, model: writer.id, byok: writer.byok, end: 'trial_paused', why }); return fail('trial_paused', headers); };

  /* ---------- the same answer being written right now, on this instance? read along, free ----------
     The first request to miss claims the write; one asking for the same key meanwhile takes a seat
     on it. If that write ends before its first word, the seat is given up and this request goes on
     as if it had never been there. A rewrite never joins and is never joined. */
  /** @type {Flight | null} */ let claimed = null;
  const map = cacheKey && !fresh ? flightsOf(store) : null;
  if (map && cacheKey) {
    for (;;) {
      const other = map.get(cacheKey);
      if (!other || !other.joinable) { claimed = claim(map, cacheKey); break; }
      const seat = other.seat();
      const outcome = await Promise.race([seat.ready.then(ok => (ok ? 'ready' : 'failed')), abortOf(request.signal)]);
      if (outcome === 'gone') { seat.leave(); return gone(); }
      if (outcome === 'failed') { seat.leave(); continue; }
      request.signal?.addEventListener('abort', () => seat.leave(), { once: true });
      defer(other.finished, 'write');
      if (!byok) { const cfg = trialConfig(env); if (!cfg.off) await readTrial(cfg); }
      log({ evt: 'write', task: taskName, model: writer.id, byok: writer.byok, joined: true });
      return new Response(seat.stream(), { status: 200, headers });
    }
  }
  const flight = claimed ?? new Flight();
  const mine = flight.seat();

  /* ---------- the trial: is anything left, then take one unit before a single token is bought ---------- */
  /** @returns {Promise<{ refused: Response | null, trial: Awaited<ReturnType<typeof readTrial>> | null }>} */
  const admit = async () => {
    if (byok) return { refused: null, trial: null };
    const cfg = trialConfig(env);
    if (cfg.off) return { refused: paused('off'), trial: null };
    const trial = await readTrial(cfg);
    if (kind && trial.left[kind] <= 0) return { refused: fail(kind === 'pages' ? 'trial_over' : 'tools_over', headers), trial };
    if (!kind) return { refused: null, trial };
    let r;
    try { r = await reserve(trial.counters, trial.scopes, kind, trial.cfg); }
    catch (e) { console.error(JSON.stringify({ evt: 'trial-reserve', message: String(/** @type {any} */ (e)?.message || e) })); return { refused: paused('counters'), trial }; }
    if (!r.ok) { headers.set('x-dh-trial', trialHeader({ ...trial.left, [kind]: 0 })); return { refused: fail(kind === 'pages' ? 'trial_over' : 'tools_over', headers), trial }; }
    headers.set('x-dh-trial', trialHeader({ ...trial.left, [kind]: r.left }));
    return { refused: null, trial };
  };
  let admitted;
  try { admitted = await admit(); } catch (e) { flight.abandon(); throw e; }
  const { refused, trial } = admitted;
  if (refused) { flight.abandon(); return refused; }

  /* The unit comes back only when nothing was bought: the reader left before the writer
     started, or the writer failed before a word. A reader who hangs up after the writer
     starts is charged, or dropping requests would be a free way to spend Dorkhub's tokens. */
  const giveBack = () => { if (trial && kind) defer(refund(trial.counters, trial.scopes, kind), 'refund'); };
  if (request.signal?.aborted) { giveBack(); flight.abandon(); return gone(); }

  /* ---------- write ---------- */
  const t0 = Date.now();
  request.signal?.addEventListener('abort', () => mine.leave(), { once: true });
  /** @type {unknown} */ let failure = null;
  const result = streamText({
    model: writer.model, prompt, maxOutputTokens: task.maxTokens, abortSignal: flight.signal, maxRetries: 1,
    onError: ({ error }) => { failure = failure || error; },
  });
  async function* words() { for await (const v of result.textStream) yield clean(v); }

  /* How it ended: 'ok' only for a clean stop that nobody aborted. */
  /** @returns {Promise<{ code: Code | 'cancelled' | null, truncated: boolean }>} */
  const ending = async () => {
    let reason = null; try { reason = await result.finishReason; } catch { /* aborted or failed */ }
    if (flight.signal.aborted) return { code: 'cancelled', truncated: false };
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
  /** @param {string} end @param {Record<string, unknown>} [extra] */
  const reported = (end, extra) => { const p = report(end, extra); defer(p, 'usage-report'); return p; };
  /** @param {Code | 'cancelled' | null} code */
  const whyOf = code => (code === 'trial_paused' ? { why: pauseCause(failure) || 'gateway_auth' } : {});

  /** how a write that never got a word out ended @type {{ code: Code | 'cancelled' }} */
  const early = { code: 'upstream_error' };
  defer(flight.run(words(), async (started, error) => {
    failure = failure || error;
    const { code, truncated } = await ending();
    if (!started) { early.code = code || 'upstream_error'; return { tail: null, after: reported(early.code, whyOf(early.code)) }; }
    if (code === 'cancelled') return { tail: null, after: reported('cancelled') };
    const tail = code ? { error: code } : truncated ? { truncated: true } : null;
    const usable = !tail && (task.usable ? task.usable(flight.text) : true);
    const keep = !!(cacheKey && usable && !fresh);
    const jobs = keep && cacheKey ? library.keep(cacheKey, flight.text, { task: taskName, model: writer.id }, at) : [];
    for (const [what, job] of jobs) defer(job, what);
    return { tail, after: Promise.allSettled([reported(code || 'ok', { truncated, cached: keep, ...whyOf(code) }), ...jobs.map(j => j[1])]) };
  }), 'write');

  if (!(await mine.ready)) {
    const final = early.code;
    if (final !== 'cancelled') giveBack();
    if (final === 'trial_paused') console.error(JSON.stringify({ evt: 'trial-credentials', message: String(/** @type {any} */ (failure)?.message || '').slice(0, 300) }));
    mine.leave();
    if (final === 'cancelled') return gone();
    if (trial && kind) headers.set('x-dh-trial', trialHeader(trial.left));
    return fail(final, headers);
  }
  return new Response(mine.stream(), { status: 200, headers });
}

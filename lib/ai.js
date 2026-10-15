/* ================= who writes: the trial's model, or the reader's own key =================
   Trial requests go through Dorkhub's AI Gateway, authenticated by the deployment's OIDC
   token, so no secret lives in the project. Requests carrying a reader's key go straight
   to that provider with that key (or through the reader's own AI Gateway key). They never
   touch Dorkhub's gateway, so a failing key can never fall back to Dorkhub's credits. */

import { createGateway, gateway } from 'ai';
import { PROVIDERS, TRIAL_MODEL, directId, findModel, modelsFor } from '../src/shared/models.js';
import { mockModel } from './mock.js';

/** @typedef {import('ai').LanguageModel} LanguageModel */
/** @typedef {keyof typeof PROVIDERS} ProviderId */
/** @typedef {{ model: LanguageModel, id: string, byok: ProviderId | null }} Writer */

export class Refusal extends Error {
  /** @param {string} code */
  constructor(code) { super(code); this.name = 'Refusal'; this.code = code; }
}

/* HTTP status for each error code the browser understands. */
export const STATUS = /** @type {const} */ ({
  bad_request: 400, model_unavailable: 400, bad_key: 401, trial_over: 402, tools_over: 402, forbidden: 403, method: 405,
  too_large: 413, refused: 422, rate_limited: 429, key_limit: 429, upstream_error: 502, trial_paused: 503,
});

/**
 * @param {{ request: Request, env: Record<string, string | undefined>, task: { quick?: boolean, byokOnly?: boolean }, taskName: string, input: unknown }} o
 * @returns {Promise<Writer>}
 */
export async function chooseWriter({ request, env, task, taskName, input }) {
  const h = request.headers;
  const provider = h.get('x-dh-provider') || ''; const wanted = h.get('x-dh-model') || ''; const key = h.get('x-dh-key') || '';
  const mock = mockAllowed(env, request);
  /** @type {import('./mock.js').Pace} */
  const pace = env.DH_MOCK_FAST === '1' ? 'fast' : env.DH_MOCK_PACE === 'quick' ? 'quick' : 'writer';
  const replay = env.DH_MOCK_REPLAY !== 'off';   // off: synthetic pages only (every panel type, by title)

  if (provider || wanted || key) {
    if (!(provider in PROVIDERS) || !PROVIDERS[/** @type {ProviderId} */ (provider)].enabled) throw new Refusal('bad_request');
    const p = /** @type {ProviderId} */ (provider);
    if (!/^[\x21-\x7e]{8,400}$/.test(key)) throw new Refusal('bad_key');
    const allowed = modelsFor(p);
    const chosen = allowed.find(m => m.id === wanted);
    if (!chosen) throw new Refusal('model_unavailable');
    /* Quick tools use the provider's fast model, like the free pages do. */
    const quick = task.quick ? allowed.find(m => m.id === PROVIDERS[p].quick) : null;
    const id = (quick || chosen).id;
    if (mock) return { model: mockModel({ task: taskName, input, key, pace, replay }), id, byok: p };
    return { model: await keyedModel(p, key, id), id, byok: p };
  }

  if (task.byokOnly) throw new Refusal('bad_request');
  const id = env.DH_TRIAL_MODEL || TRIAL_MODEL;
  if (mock) return { model: mockModel({ task: taskName, input, pace, replay }), id, byok: null };
  return { model: gateway(id), id, byok: null };
}

/* The mock writer answers only on a developer's machine or a preview deployment, never in
   production, even if DH_MOCK were set there by mistake or VERCEL_ENV were missing. */
/** @param {Record<string, string | undefined>} env @param {Request} request */
export function mockAllowed(env, request) {
  if (env.DH_MOCK !== '1') return false;
  if (env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'development') return true;
  if (env.VERCEL_ENV || env.VERCEL) return false;
  let host = ''; try { host = new URL(request.url).hostname; } catch { return false; }
  /* this machine, or another device on the same local network (testing on a phone) */
  return /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-z0-9-]+\.local|\[f[cd][0-9a-f]{2}:[0-9a-f:]*\])$/i.test(host);
}

/** @param {ProviderId} provider @param {string} apiKey @param {string} id @returns {Promise<LanguageModel>} */
async function keyedModel(provider, apiKey, id) {
  if (!findModel(id)) throw new Refusal('model_unavailable');
  switch (provider) {
    case 'gateway': return createGateway({ apiKey })(id);
    case 'anthropic': { const { createAnthropic } = await import('@ai-sdk/anthropic'); return createAnthropic({ apiKey })(directId(id)); }
    case 'openai': { const { createOpenAI } = await import('@ai-sdk/openai'); return createOpenAI({ apiKey })(directId(id)); }
    case 'google': { const { createGoogleGenerativeAI } = await import('@ai-sdk/google'); return createGoogleGenerativeAI({ apiKey })(directId(id)); }
    default: throw new Refusal('bad_request');
  }
}

/**
 * Turn a provider or gateway error into one of our codes. A reader's key failing is their
 * key's problem (bad_key, key_limit); Dorkhub's own credentials failing pauses the trial.
 * @param {unknown} error @param {boolean} byok @returns {keyof typeof STATUS | 'cancelled'}
 */
export function classify(error, byok) {
  const e = /** @type {any} */ (error);
  if (!e) return 'upstream_error';
  if (e.name === 'AbortError' || e.name === 'ResponseAborted' || e.code === 'ABORT_ERR') return 'cancelled';
  const status = [e.statusCode, e.status, e.cause && e.cause.statusCode].find(s => typeof s === 'number') || 0;
  const msg = String(e.message || '').toLowerCase();
  if (status === 401 || status === 403 || /authentication|api key|unauthori[sz]ed|x-api-key/.test(msg)) return byok ? 'bad_key' : 'trial_paused';
  if (status === 402 || /credit|budget|insufficient|billing|payment/.test(msg)) return byok ? 'key_limit' : 'trial_paused';
  if (status === 429 || /rate limit|too many requests/.test(msg)) return byok ? 'key_limit' : 'rate_limited';
  if (status === 404 || e.name === 'GatewayModelNotFoundError' || /model.{0,20}not found|no such model/.test(msg)) return 'model_unavailable';
  if (status === 400 && /context|too long|too many tokens|maximum.{0,20}tokens|prompt is too long/.test(msg)) return 'too_large';
  return 'upstream_error';
}

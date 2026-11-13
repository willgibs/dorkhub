/* ================= the library: where written pages and answers are kept =================
   Three layers, read in order:
   - seeds:   pages written ahead of time (lib/seeds.js), read-only.
   - cache:   the Runtime Cache, for every cacheable answer, 14 days.
   - durable: optional, for finished pages only: Redis (Upstash's REST API) when DH_LIBRARY=redis
              and its credentials are set, or an in-memory layer in tests. With none configured,
              the library is exactly the cache it always was.
   The cache is keyed by the caller's cache key, which carries the prompt's version: a new prompt
   simply misses. A durable page would pile up that way, one copy per prompt forever, so it is kept
   under the page's own key (no version) with the version written beside the text. A page from an
   older prompt is not served (a page written ahead of time is what any page is now), and the page
   the new prompt writes takes its place. Both keys carry the deployment's namespace (textNs in
   lib/write.js), so preview and local pages never mix with production's.
   A private rewrite (fresh) never comes here at all: the caller neither reads nor keeps it. */

import { seedOf } from './seeds.js';

export const TEXT_TTL = 14 * 86400;

/** @typedef {import('./trial.js').Store} Store */
/** @typedef {{ task: string, model: string }} Meta */
/** Where a page lives in the durable layer, and the prompt version it must have been written with. @typedef {{ deepKey: string | null, version: string }} Deep */
/**
 * A layer that keeps text by key. get: the text, or null when there is none. set: keep it.
 * @typedef {{ name: string, get(key: string): Promise<string | null>, set(key: string, text: string, meta: Meta): Promise<void> }} Layer
 */

/** The Runtime Cache as a layer. @param {Store} store @param {number} [ttl] @returns {Layer} */
export function cacheLayer(store, ttl = TEXT_TTL) {
  return {
    name: 'cache',
    async get(key) { const v = await store.get(key); return typeof v === 'string' && v ? v : null; },
    async set(key, text, meta) { await store.set(key, text, { ttl, name: `text-${meta.task}` }); },
  };
}

/** A durable layer held in memory: for tests, and the shape a real one takes. @returns {Layer & { m: Map<string, { text: string, meta: Meta }> }} */
export function memoryLayer() {
  /** @type {Map<string, { text: string, meta: Meta }>} */ const m = new Map();
  return {
    name: 'memory', m,
    async get(key) { return m.get(key)?.text || null; },
    async set(key, text, meta) { m.set(key, { text, meta: { ...meta } }); },
  };
}

/** Redis as a layer, over Upstash's REST API (the same calls lib/counters.js makes). A page is a plain string value with no expiry.
 * @param {{ url: string, token: string }} cfg @param {typeof fetch} [fetchFn] @returns {Layer} */
export function redisLayer({ url, token }, fetchFn = fetch) {
  /** @param {unknown[]} command */
  const call = async command => {
    const res = await fetchFn(`${url}/pipeline`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify([command]), signal: AbortSignal.timeout(1500) });
    if (!res.ok) throw new Error(`redis ${res.status}`);
    const [out] = /** @type {{ result?: unknown, error?: string }[]} */ (await res.json());
    if (!out || out.error) throw new Error(`redis: ${out ? out.error : 'no answer'}`);
    return out.result;
  };
  return {
    name: 'redis',
    async get(key) { const v = await call(['GET', key]); return typeof v === 'string' && v ? v : null; },
    async set(key, text) { await call(['SET', key, text]); },
  };
}

/* A durable page is stored with the prompt version it was written under on its first line. */
const STAMP = 'dh1 ';
/** @param {string} version @param {string} text */
export const stamped = (version, text) => `${STAMP}${version}\n${text}`;
/** The page, if it was written under this version. @param {string | null} v @param {string} version */
export function unstamped(v, version) {
  if (!v || !v.startsWith(STAMP)) return null;
  const nl = v.indexOf('\n'); if (nl < 0 || v.slice(STAMP.length, nl) !== version) return null;
  return v.slice(nl + 1) || null;
}

/**
 * @param {{ store: Store, textCache: boolean, durable?: Layer | null, seeds?: URL, warn?: (what: string, error: unknown) => void }} o
 */
export function openLibrary({ store, textCache, durable = null, seeds, warn = () => {} }) {
  const cache = textCache ? cacheLayer(store) : null;
  /** only finished pages go to the durable layer; every other answer stays cache-only */
  const deep = (/** @type {string} */ task) => !!durable && task === 'page';
  return {
    /** A page written ahead of time. @param {import('./prompts.js').PageInput} input */
    seed: (/** @type {import('./prompts.js').PageInput} */ input) => seedOf(input, seeds),
    /** Whether anything can keep this task's answers. @param {string} task */
    keeps: (/** @type {string} */ task) => !!cache || deep(task),
    /**
     * The kept answer, cache first, then the durable layer. A durable hit comes with `refill`,
     * the job putting it back in the cache, for the caller to defer.
     * @param {string} key @param {string} task @param {Deep} [at]
     * @returns {Promise<{ text: string, from: 'cache' | 'durable', refill: Promise<void> | null } | null>}
     */
    async read(key, task, at) {
      if (cache) { try { const text = await cache.get(key); if (text) return { text, from: 'cache', refill: null }; } catch { /* a miss is fine */ } }
      if (durable && deep(task) && at && at.deepKey) {
        let text = null; try { text = unstamped(await durable.get(at.deepKey), at.version); } catch (e) { warn('durable-read', e); }
        if (text) return { text, from: 'durable', refill: cache ? cache.set(key, text, { task, model: '' }) : null };
      }
      return null;
    },
    /**
     * Keep a finished, usable answer: the cache, and for a page the durable layer too.
     * @param {string} key @param {string} text @param {Meta} meta @param {Deep} [at] @returns {[string, Promise<void>][]} each job, named
     */
    keep(key, text, meta, at) {
      /** @type {[string, Promise<void>][]} */ const jobs = [];
      if (cache) jobs.push(['cache-write', cache.set(key, text, meta)]);
      if (durable && deep(meta.task) && at && at.deepKey) jobs.push(['durable-write', durable.set(at.deepKey, stamped(at.version, text), meta)]);
      return jobs;
    },
  };
}

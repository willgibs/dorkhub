/* ================= the library: where written pages and answers are kept =================
   Three layers, read in order:
   - seeds:   pages written ahead of time (lib/seeds.js), read-only.
   - cache:   the Runtime Cache, for every cacheable answer, 14 days.
   - durable: optional, for finished pages only. This file defines its contract and an in-memory
              implementation for tests; no real storage service is chosen or called here. With
              none configured, the library is exactly the cache it always was.
   Every layer is keyed by the caller's cache key, which already carries the deployment's
   namespace (textNs in lib/write.js), so preview and local answers never mix with production's.
   A private rewrite (fresh) never comes here at all: the caller neither reads nor keeps it. */

import { seedOf } from './seeds.js';

export const TEXT_TTL = 14 * 86400;

/** @typedef {import('./trial.js').Store} Store */
/** @typedef {{ task: string, model: string }} Meta */
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
     * @param {string} key @param {string} task
     * @returns {Promise<{ text: string, from: 'cache' | 'durable', refill: Promise<void> | null } | null>}
     */
    async read(key, task) {
      if (cache) { try { const text = await cache.get(key); if (text) return { text, from: 'cache', refill: null }; } catch { /* a miss is fine */ } }
      if (durable && deep(task)) {
        let text = null; try { text = await durable.get(key); } catch (e) { warn('durable-read', e); }
        if (text) return { text, from: 'durable', refill: cache ? cache.set(key, text, { task, model: '' }) : null };
      }
      return null;
    },
    /**
     * Keep a finished, usable answer: the cache, and for a page the durable layer too.
     * @param {string} key @param {string} text @param {Meta} meta @returns {[string, Promise<void>][]} each job, named
     */
    keep(key, text, meta) {
      /** @type {[string, Promise<void>][]} */ const jobs = [];
      if (cache) jobs.push(['cache-write', cache.set(key, text, meta)]);
      if (durable && deep(meta.task)) jobs.push(['durable-write', durable.set(key, text, meta)]);
      return jobs;
    },
  };
}

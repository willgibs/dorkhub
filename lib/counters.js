/* ================= counters: where the free trial keeps count =================
   Two backends behind one small interface.

   Redis (Upstash, via the Vercel Marketplace) when its REST credentials are present:
   INCR is atomic, so the trial caps hold exactly under any amount of concurrency.

   Otherwise Vercel Runtime Cache, which only offers get and set. Updates are serialized
   per key inside each function instance, and every instance remembers the highest count
   it has seen, so the only possible drift is between instances. The Firewall rate limit
   on /api/write bounds that. Add Redis before sharing the link widely. */

/** @typedef {{ name: string, get(keys: string[]): Promise<number[]>, incr(keys: string[], ttl: number): Promise<number[]>, decr(keys: string[]): Promise<void> }} Counters */
/** @typedef {import('./trial.js').Store} Store */

/** @param {Record<string, string | undefined>} env @returns {{ url: string, token: string } | null} */
export function redisConfig(env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL; const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

/* One atomic step each: count up and make sure the key always expires; count down, never below zero. */
const INCR_TTL = "local n = redis.call('INCR', KEYS[1]) if redis.call('TTL', KEYS[1]) < 0 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end return n";
const DECR_SAFE = "local v = tonumber(redis.call('GET', KEYS[1]) or '0') if v > 0 then return redis.call('DECR', KEYS[1]) end return 0";

/** @param {{ url: string, token: string }} cfg @param {typeof fetch} [fetchFn] @returns {Counters} */
export function redisCounters({ url, token }, fetchFn = fetch) {
  /** @param {unknown[][]} commands */
  const pipeline = async commands => {
    const res = await fetchFn(`${url}/pipeline`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(commands), signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`redis ${res.status}`);
    const out = /** @type {{ result?: unknown, error?: string }[]} */ (await res.json());
    const bad = out.find(r => r.error); if (bad) throw new Error(`redis: ${bad.error}`);
    return out.map(r => r.result);
  };
  return {
    name: 'redis',
    async get(keys) { const [values] = await pipeline([['MGET', ...keys]]); return /** @type {unknown[]} */ (values).map(v => Number(v) || 0); },
    async incr(keys, ttl) { return (await pipeline(keys.map(k => ['EVAL', INCR_TTL, '1', k, String(ttl)]))).map(n => Number(n) || 0); },
    async decr(keys) { await pipeline(keys.map(k => ['EVAL', DECR_SAFE, '1', k])); },
  };
}

/** @param {Store} store @returns {Counters} */
export function cacheCounters(store) {
  /** @type {Map<string, Promise<unknown>>} */ const locks = new Map();
  /** @type {Map<string, { n: number, exp: number }>} */ const memo = new Map();
  /** @template T @param {string} key @param {() => Promise<T>} fn @returns {Promise<T>} */
  const locked = (key, fn) => {
    const run = (locks.get(key) || Promise.resolve()).then(fn, fn);
    const tail = run.catch(() => {}); locks.set(key, tail);
    tail.then(() => { if (locks.get(key) === tail) locks.delete(key); });
    return run;
  };
  /** @param {string} key @param {number} now */
  const read = async (key, now) => {
    let v = null; try { v = /** @type {{ n?: unknown, exp?: unknown } | null} */ (await store.get(key)); } catch { /* treat as unknown */ }
    const stored = v && typeof v.n === 'number' && typeof v.exp === 'number' && v.exp > now ? { n: v.n, exp: v.exp } : null;
    const seen = memo.get(key); const known = seen && seen.exp > now ? seen : null;
    if (stored && known) return stored.n >= known.n ? stored : known;
    return stored || known;
  };
  /** @param {string} key @param {{ n: number, exp: number }} c @param {number} now */
  const write = async (key, c, now) => {
    memo.set(key, c); if (memo.size > 50000) memo.delete(/** @type {string} */ (memo.keys().next().value));
    await store.set(key, c, { ttl: Math.max(60, Math.ceil((c.exp - now) / 1000)), name: 'trial' });
  };
  return {
    name: 'runtime-cache',
    async get(keys) { const now = Date.now(); return Promise.all(keys.map(async k => (await read(k, now))?.n ?? 0)); },
    async incr(keys, ttl) {
      return Promise.all(keys.map(k => locked(k, async () => {
        const now = Date.now(); const c = (await read(k, now)) || { n: 0, exp: now + ttl * 1000 };
        const next = { n: c.n + 1, exp: c.exp }; await write(k, next, now); return next.n;
      })));
    },
    async decr(keys) {
      await Promise.all(keys.map(k => locked(k, async () => {
        const now = Date.now(); const c = await read(k, now); if (c && c.n > 0) await write(k, { n: c.n - 1, exp: c.exp }, now);
      })));
    },
  };
}

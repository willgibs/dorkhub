// Test helpers: a Map-backed stand-in for the Runtime Cache, and request builders.
import { cacheCounters } from '../lib/counters.js';
import { handleWrite } from '../lib/write.js';

export function memoryStore() {
  const m = new Map();
  return {
    m,
    async get(/** @type {string} */ k) { const e = m.get(k); return e ? JSON.parse(e) : null; },
    async set(/** @type {string} */ k, /** @type {unknown} */ v) { m.set(k, JSON.stringify(v)); },
  };
}

export const KEY = { 'x-dh-provider': 'anthropic', 'x-dh-model': 'anthropic/claude-sonnet-5.5', 'x-dh-key': 'sk-ant-test-000000000000' };

/** A client with its own cookie jar, talking to handleWrite in-process. */
export function client({ env = {}, store = memoryStore(), counters = undefined, ip = '203.0.113.7', textCache = true } = {}) {
  let cookie = '';
  const logs = [];
  const deps = { env: { DH_MOCK: '1', DH_MOCK_FAST: '1', VERCEL_ENV: 'development', ...env }, store, counters: counters ?? cacheCounters(store), textCache, log: (/** @type {any} */ l) => logs.push(l) };
  return {
    store, logs, counters: deps.counters,
    /** @param {unknown} body @param {Record<string, string>} [headers] @param {{ method?: string, raw?: string, signal?: AbortSignal, ip?: string, fresh?: boolean }} [o] */
    async call(body, headers = {}, o = {}) {
      const req = new Request('https://dorkhub.test/api/write', {
        method: o.method || 'POST', signal: o.signal,
        headers: { 'content-type': 'application/json', origin: 'https://dorkhub.test', 'x-real-ip': o.ip || ip, ...(cookie ? { cookie } : {}), ...headers },
        body: o.method === 'GET' ? undefined : o.raw ?? JSON.stringify(body),
      });
      const res = await handleWrite(req, deps);
      const set = res.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
      const text = await res.text();
      const z = text.indexOf('\u0000');
      return { status: res.status, headers: res.headers, text: z < 0 ? text : text.slice(0, z), tail: z < 0 ? null : JSON.parse(text.slice(z + 1)), json: () => JSON.parse(text) };
    },
  };
}

/** @param {string} title @param {Record<string, unknown>} [extra] */
export const pageBody = (title, extra = {}) => ({ task: 'page', input: { title, depth: 0, lens: 'encyclopedic', path: [], from: null, others: [], ratings: [], ...extra } });

/** A tiny Upstash REST stand-in: MGET and the two EVAL scripts, with real expiry, to test the atomic path. */
export function fakeUpstash(now = () => Date.now()) {
  /** @type {Map<string, { n: number, exp: number | null }>} */ const db = new Map();
  const live = (/** @type {string} */ k) => { const e = db.get(k); if (e && e.exp != null && e.exp <= now()) { db.delete(k); return undefined; } return e; };
  /** @type {typeof fetch} */
  const fetchFn = async (_url, init) => {
    const cmds = JSON.parse(String(init?.body));
    const out = cmds.map((/** @type {any[]} */ [op, ...a]) => {
      if (op === 'MGET') return { result: a.map(k => { const e = live(k); return e ? String(e.n) : null; }) };
      if (op === 'EVAL' && /INCR/.test(a[0])) { const k = a[2]; const e = live(k) || { n: 0, exp: null }; e.n++; if (e.exp == null) e.exp = now() + Number(a[3]) * 1000; db.set(k, e); return { result: e.n }; }
      if (op === 'EVAL' && /DECR/.test(a[0])) { const e = live(a[2]); if (e && e.n > 0) e.n--; return { result: e ? e.n : 0 }; }
      return { error: `ERR unknown command ${op}` };
    });
    return new Response(JSON.stringify(out), { status: 200 });
  };
  return { db, fetchFn };
}

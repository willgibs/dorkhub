/* ================= the free trial: a few pages, no account =================
   Visitors without a key get a handful of pages (and a larger allowance of the quick
   tools: peeks, sketches, quizzes) written on Dorkhub's own AI Gateway budget.

   Each allowance is guarded by counters at widening scopes:
   - device:  a random HttpOnly cookie that identifies nothing about the person
   - network: a salted hash of the IPv4 address or IPv6 /64 (never the address itself),
              so clearing cookies or opening a private window buys a few pages, not endless
   - wide:    IPv6 only, the /48 around it, so a tunnelled /48 can't mint 65,536 networks
   Network caps are generous because schools, offices and mobile carriers share addresses.

   A request reserves its unit before anything is written and gets it back if nothing
   was. Reservations are atomic with Redis (see counters.js). The hard ceiling on spend
   is the AI Gateway budget, not this file. */

import { createHash, randomBytes } from 'node:crypto';

export const TRIAL_COOKIE = 'dh_id';
const DAY = 86400;
const WIDE_FACTOR = 5;

/** @typedef {{ get(key: string): Promise<unknown>, set(key: string, value: unknown, options?: { ttl?: number, name?: string }): Promise<void> }} Store */
/** @typedef {import('./counters.js').Counters} Counters */
/** @typedef {{ off: boolean, pages: number, extras: number, ipFactor: number, windowDays: number }} TrialConfig */
/** @typedef {'pages' | 'extras'} Kind */
/** @typedef {{ key: (kind: Kind) => string, cap: (cfg: TrialConfig, kind: Kind) => number }} Scope */

/** @param {Record<string, string | undefined>} env @returns {TrialConfig} */
export function trialConfig(env) {
  /** @param {string | undefined} v @param {number} d @param {number} lo @param {number} hi */
  const n = (v, d, lo, hi) => { const x = Number.parseInt(v ?? '', 10); return Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : d; };
  return {
    off: env.DH_TRIAL_OFF === '1',
    pages: n(env.DH_TRIAL_PAGES, 6, 0, 1000),
    extras: n(env.DH_TRIAL_EXTRAS, 30, 0, 10000),
    ipFactor: n(env.DH_TRIAL_IP_FACTOR, 20, 1, 10000),
    windowDays: n(env.DH_TRIAL_WINDOW_DAYS, 30, 1, 365),
  };
}

/** @param {string} s */
const sha = s => createHash('sha256').update(s).digest('hex');

export const newDeviceId = () => randomBytes(16).toString('base64url');
/** @param {unknown} id @returns {id is string} */
export const validDeviceId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(id);

/** @param {Request} request @param {string} name */
export function readCookie(request, name) {
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const i = part.indexOf('='); if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

/** @param {string} id @param {boolean} secure */
export const deviceCookie = (id, secure) => `${TRIAL_COOKIE}=${id}; Path=/api; Max-Age=${365 * DAY}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;

/** @param {Request} request */
export function clientIp(request) {
  const h = request.headers;
  return (h.get('x-real-ip') || (h.get('x-forwarded-for') || '').split(',')[0] || '').trim();
}

/* The network an address belongs to: IPv4 as is; IPv6 as its /64 (net) and /48 (wide). */
/** @param {string} ip @returns {{ net: string, wide: string | null }} */
export function networksOf(ip) {
  const a = String(ip || '').trim().toLowerCase();
  if (!a) return { net: 'unknown', wide: null };
  if (/^::ffff:\d+\.\d+\.\d+\.\d+$/.test(a)) return { net: a.slice(7), wide: null };
  if (!a.includes(':')) return { net: a, wide: null };
  const [head = '', tail = ''] = a.split('%')[0].split('::');
  const h = head ? head.split(':') : []; const t = tail ? tail.split(':') : [];
  const groups = (a.includes('::') ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t] : h).map(g => g.replace(/^0+(?=.)/, ''));
  return { net: `${groups.slice(0, 4).join(':')}::/64`, wide: `${groups.slice(0, 3).join(':')}::/48` };
}

/** @param {{ deviceId: string, ip: string, salt: string }} who @returns {Scope[]} */
export function trialScopes({ deviceId, ip, salt }) {
  const { net, wide } = networksOf(ip);
  /** @type {Scope[]} */
  const scopes = [
    { key: k => `trial:dev:${k}:${sha(`dev|${deviceId}`)}`, cap: (c, k) => c[k] },
    { key: k => `trial:net:${k}:${sha(`net|${salt}|${net}`)}`, cap: (c, k) => c[k] * c.ipFactor },
  ];
  if (wide) scopes.push({ key: k => `trial:wide:${k}:${sha(`wide|${salt}|${wide}`)}`, cap: (c, k) => c[k] * c.ipFactor * WIDE_FACTOR });
  return scopes;
}

/** @param {number[]} counts @param {Scope[]} scopes @param {TrialConfig} cfg @param {Kind} kind */
const leftOf = (counts, scopes, cfg, kind) => Math.max(0, Math.min(...scopes.map((s, i) => s.cap(cfg, kind) - counts[i])));

/**
 * What is left of each allowance: the tightest of the device, network and wide caps.
 * @param {Counters} counters @param {Scope[]} scopes @param {TrialConfig} cfg @returns {Promise<Record<Kind, number>>}
 */
export async function peek(counters, scopes, cfg) {
  const keys = [...scopes.map(s => s.key('pages')), ...scopes.map(s => s.key('extras'))];
  let counts = keys.map(() => 0); try { counts = await counters.get(keys); } catch (e) { console.error(JSON.stringify({ evt: 'trial-read', message: String(/** @type {any} */ (e)?.message || e) })); }
  return { pages: leftOf(counts.slice(0, scopes.length), scopes, cfg, 'pages'), extras: leftOf(counts.slice(scopes.length), scopes, cfg, 'extras') };
}

/**
 * Take one unit before writing. Every scope is incremented; if any went past its cap the
 * whole reservation is handed back, so concurrent requests can never overshoot together.
 * @param {Counters} counters @param {Scope[]} scopes @param {Kind} kind @param {TrialConfig} cfg
 * @returns {Promise<{ ok: boolean, left: number }>}
 */
export async function reserve(counters, scopes, kind, cfg) {
  const keys = scopes.map(s => s.key(kind));
  const counts = await counters.incr(keys, cfg.windowDays * DAY);
  if (scopes.some((s, i) => counts[i] > s.cap(cfg, kind))) {
    await counters.decr(keys).catch(() => {});
    return { ok: false, left: 0 };
  }
  return { ok: true, left: leftOf(counts, scopes, cfg, kind) };
}

/** Give a unit back when nothing was written after all. @param {Counters} counters @param {Scope[]} scopes @param {Kind} kind */
export const refund = (counters, scopes, kind) => counters.decr(scopes.map(s => s.key(kind)));

/** @param {Record<Kind, number>} left */
export const trialHeader = left => `pages=${left.pages}; extras=${left.extras}`;

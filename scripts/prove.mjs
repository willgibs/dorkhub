// Proves a deployment of dorkhub.com works end to end: the "prove production" checklist in one run.
//
//   node scripts/prove.mjs <baseUrl> [--spend --yes] [--ratelimit] [--json]
//
// Free checks always run (page, CSP hash, static files, a page written ahead of time, prefetch,
// bad requests). --spend --yes adds the checks that write two live pages with the caller's free
// trial (real tokens on production). --ratelimit sends free prefetches until the firewall answers
// 429. No dependencies beyond Node. Exit code 1 if anything failed.
import { createHash, randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

/** @typedef {{ status: 'ok' | 'FAIL' | 'skip' | 'manual', name: string, detail: string, paused?: boolean }} Result */

const rand = () => randomBytes(4).toString('hex');

/**
 * @param {string} baseUrl
 * @param {{ spend?: boolean, yes?: boolean, ratelimit?: boolean, minChunks?: number, minSpreadMs?: number, timeoutMs?: number, maxPrefetches?: number }} [options]
 * @returns {Promise<{ ok: boolean, results: Result[], summary: string }>}
 */
export async function prove(baseUrl, options = {}) {
  const { spend = false, yes = false, ratelimit = false, minChunks = 3, minSpreadMs = 150, timeoutMs = 120000, maxPrefetches = 60 } = options;
  const base = baseUrl.replace(/\/+$/, '');
  const origin = new URL(base).origin;
  /** @type {Result[]} */ const results = [];
  const add = (/** @type {Result['status']} */ status, /** @type {string} */ name, /** @type {string} */ detail = '', /** @type {Partial<Result>} */ extra = {}) => { results.push({ status, name, detail, ...extra }); };
  /** Runs one check: it returns a detail string to pass, or throws to fail. */
  const check = async (/** @type {string} */ name, /** @type {() => Promise<string | void>} */ fn) => {
    try { add('ok', name, (await fn()) || ''); } catch (e) { add('FAIL', name, String(/** @type {any} */ (e)?.message || e)); }
  };
  const need = (/** @type {unknown} */ cond, /** @type {string} */ msg) => { if (!cond) throw new Error(msg); };

  const get = (/** @type {string} */ path, /** @type {RequestInit} */ init = {}) => fetch(base + path, { redirect: 'manual', signal: AbortSignal.timeout(timeoutMs), ...init });
  const api = (/** @type {unknown} */ body, /** @type {Record<string, string>} */ headers = {}, /** @type {RequestInit} */ init = {}) => fetch(`${base}/api/write`, {
    method: 'POST', signal: AbortSignal.timeout(timeoutMs), redirect: 'manual', body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', origin, ...headers }, ...init,
  });
  const page = (/** @type {string} */ title) => ({ task: 'page', input: { title } });
  const pagesLeft = (/** @type {string | null} */ h) => { const m = /pages=(\d+)/.exec(h || ''); return m ? Number(m[1]) : null; };

  /* ---------------- free checks ---------------- */
  await check('page: GET / is 200 with a CSP that matches the inline script', async () => {
    const res = await get('/');
    need(res.status === 200, `status ${res.status}`);
    const html = await res.text();
    const csp = /<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*content="([^"]*)"/i.exec(html)?.[1];
    need(csp, 'no Content-Security-Policy meta tag');
    const allowed = [.../** @type {string} */ (csp).match(/script-src[^;]*/)?.[0].matchAll(/'sha256-([^']+)'/g) ?? []].map(m => m[1]);
    need(allowed.length, "no script-src 'sha256-…' in the policy");
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m => !/\ssrc\s*=/i.test(m[1]) && !/type\s*=\s*["'](?!module|text\/javascript)/i.test(m[1]));
    need(scripts.length, 'no inline script found');
    for (const s of scripts) {
      const h = createHash('sha256').update(s[2]).digest('base64');
      need(allowed.includes(h), `inline script hash sha256-${h.slice(0, 12)}… is not in the policy`);
    }
    return `${scripts.length} inline script, hash matches, ${(html.length / 1024).toFixed(0)} KB`;
  });
  for (const path of ['/front.json', '/front.css']) {
    await check(`static: GET ${path} is 200`, async () => { const res = await get(path); const n = (await res.arrayBuffer()).byteLength; need(res.status === 200, `status ${res.status}`); need(n > 0, 'empty'); return `${n} bytes`; });
  }
  await check('static: an unknown file (/nope.txt) is 404', async () => { const res = await get(`/nope-${rand()}.txt`); await res.arrayBuffer(); need(res.status === 404, `status ${res.status}`); });
  await check('static: /robots.txt allows only /', async () => {
    const res = await get('/robots.txt'); const text = await res.text();
    need(res.status === 200, `status ${res.status}`);
    const rules = text.split('\n').map(l => l.trim()).filter(l => /^(allow|disallow):/i.test(l)).map(l => l.replace(/\s+/g, ' ').toLowerCase());
    need(rules.includes('allow: /$') && rules.includes('disallow: /'), `rules were: ${rules.join(' | ') || 'none'}`);
    need(rules.filter(l => l.startsWith('allow:')).length === 1, `more than / is allowed: ${rules.join(' | ')}`);
    return rules.join(', ');
  });
  await check('seed: a page written ahead of time (Black holes) is free and instant', async () => {
    const t0 = Date.now();
    const res = await api(page('Black holes')); const text = await res.text(); const ms = Date.now() - t0;
    need(res.status === 200, `status ${res.status}`);
    need(res.headers.get('x-dh-cache') === 'seed', `x-dh-cache was ${res.headers.get('x-dh-cache')}`);
    need(text.startsWith('# '), 'body does not start with "# "');
    return `${text.length} chars in ${ms} ms`;
  });
  await check('prefetch: a topic nobody wrote answers 204 and sets no cookie', async () => {
    const res = await api({ ...page(`Prove ${rand()} ${rand()}`), cachedOnly: true }); await res.arrayBuffer();
    need(res.status === 204, `status ${res.status}`);
    need(!res.headers.get('set-cookie'), 'a cookie was set');
  });
  await check('errors: an unknown task is 400 bad_request', async () => {
    const res = await api({ task: `nope-${rand()}`, input: {} }); const j = await res.json().catch(() => null);
    need(res.status === 400, `status ${res.status}`); need(j?.error === 'bad_request', `error was ${JSON.stringify(j)}`);
  });
  await check('errors: GET /api/write is 405', async () => { const res = await get('/api/write', { headers: { origin } }); await res.arrayBuffer(); need(res.status === 405, `status ${res.status}`); });

  /* ---------------- spending checks ---------------- */
  if (!spend) add('skip', 'spend: live writing', 'run with --spend --yes (writes two pages from the free trial)');
  else if (!yes) add('skip', 'spend: live writing', 'would write 2 fresh pages with the free trial (real tokens on production); add --yes to run');
  else await spending();

  async function spending() {
    const pausedMsg = 'live writing is paused: no credits or the trial is off';
    const topic = `Prove ${rand()} ${rand()}`;
    /** @type {string} */ let cookie = '';
    /** @type {string} */ let text = '';
    /** @type {number | null} */ let after1 = null;
    let stopped = false;
    const skipRest = (/** @type {string} */ why) => {
      for (const n of ['spend: trial counts down by exactly one page', 'spend: the same request again is a cache hit', 'spend: stop writing']) add('skip', n, why);
    };

    /* 1. a live page streams */
    try {
      const t0 = Date.now();
      const res = await api(page(topic));
      if (res.status === 503 || res.status === 402) {
        const j = await res.json().catch(() => null);
        add('FAIL', 'spend: a live page streams', `${pausedMsg} (HTTP ${res.status}${j?.error ? ` ${j.error}` : ''})`, { paused: true });
        skipRest('live writing is paused'); return;
      }
      need(res.status === 200, `status ${res.status}`);
      cookie = (res.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
      need(cookie, 'no device cookie came back');
      after1 = pagesLeft(res.headers.get('x-dh-trial'));
      need(after1 !== null, `no x-dh-trial pages in the response (${res.headers.get('x-dh-trial')})`);
      const reader = /** @type {ReadableStreamDefaultReader<Uint8Array>} */ (res.body?.getReader());
      const dec = new TextDecoder();
      let chunks = 0; let first = 0; let last = 0;
      for (;;) { const { done, value } = await reader.read(); if (done) break; if (!value?.length) continue; chunks++; last = Date.now(); if (!first) first = last; text += dec.decode(value, { stream: true }); }
      const ttfb = first - t0; const spread = last - first;
      const detail = `first byte ${ttfb} ms, ${chunks} chunks over ${spread} ms, ${text.length} chars`;
      need(text.startsWith('# '), `body does not start with "# " (${detail})`);
      need(!text.includes('\u0000'), `the page ended with an error trailer (${detail})`);
      need(chunks >= minChunks && spread >= minSpreadMs, `looks buffered, not streamed: ${detail}`);
      add('ok', 'spend: a live page streams', detail);
    } catch (e) { add('FAIL', 'spend: a live page streams', String(/** @type {any} */ (e)?.message || e)); skipRest('the live page failed'); return; }

    /* 2. the same request again is a cache hit, free */
    await check('spend: the same request again is a cache hit', async () => {
      const t0 = Date.now();
      const res = await api(page(topic), { cookie }); const again = await res.text(); const ms = Date.now() - t0;
      need(res.status === 200, `status ${res.status}`);
      need(res.headers.get('x-dh-cache') === 'hit', `x-dh-cache was ${res.headers.get('x-dh-cache')}`);
      const left = pagesLeft(res.headers.get('x-dh-trial'));
      need(left === null || left === after1, `trial pages moved from ${after1} to ${left}`);
      need(again === text, 'the repeat is not the same text');
      return `${ms} ms, trial pages ${left ?? 'untouched'} (was ${after1})`;
    });

    /* 3. stop: a second fresh topic, cancelled after the first chunk */
    /** @type {number | null} */ let after2 = null;
    try {
      const ac = new AbortController();
      const res = await api(page(`Prove ${rand()} ${rand()}`), { cookie }, { signal: ac.signal });
      if (res.status === 503 || res.status === 402) {
        const j = await res.json().catch(() => null);
        add('FAIL', 'spend: trial counts down by exactly one page', `${pausedMsg} (HTTP ${res.status}${j?.error ? ` ${j.error}` : ''})`, { paused: true });
        add('skip', 'spend: stop writing', 'live writing is paused'); stopped = true;
      } else {
        need(res.status === 200, `status ${res.status}`);
        after2 = pagesLeft(res.headers.get('x-dh-trial'));
        const reader = /** @type {ReadableStreamDefaultReader<Uint8Array>} */ (res.body?.getReader());
        const { value } = await reader.read();
        need(value?.length, 'no first chunk to cancel after');
        ac.abort();
        await reader.read().catch(() => null);
      }
    } catch (e) {
      if (!stopped) { add('FAIL', 'spend: trial counts down by exactly one page', String(/** @type {any} */ (e)?.message || e)); add('skip', 'spend: stop writing', 'the second page failed'); stopped = true; }
    }
    if (stopped) return;
    if (after2 !== null && after1 !== null && after2 === after1 - 1) add('ok', 'spend: trial counts down by exactly one page', `pages left ${after1 + 1} -> ${after1} -> ${after2} (one per fresh page)`);
    else add('FAIL', 'spend: trial counts down by exactly one page', `pages left was ${after1} after the first page and ${after2} after the second; expected a drop of one`);
    add('manual', 'spend: stop writing', 'request cancelled after the first chunk; check the function log for `end: cancelled` and fewer output tokens');
  }

  /* ---------------- rate limit ---------------- */
  if (ratelimit) {
    console.error(`warning: --ratelimit sends up to ${maxPrefetches} prefetches; this address is limited for about a minute afterwards`);
    await check('ratelimit: the firewall answers 429 (rule is 40 a minute)', async () => {
      let sent = 0;
      for (; sent < maxPrefetches;) {
        sent++;
        const res = await api({ ...page(`Prove ${rand()} ${rand()}`), cachedOnly: true }); await res.arrayBuffer();
        if (res.status === 429) return `429 on request ${sent}${res.headers.get('retry-after') ? `, retry-after ${res.headers.get('retry-after')} s` : ''}`;
        need(res.status === 204, `request ${sent} answered ${res.status}`);
      }
      throw new Error(`no 429 after ${sent} requests`);
    });
  } else add('skip', 'ratelimit: the firewall answers 429', 'run with --ratelimit (limits this address for a minute)');

  const count = (/** @type {Result['status']} */ s) => results.filter(r => r.status === s).length;
  const summary = `${count('ok')} ok, ${count('FAIL')} FAIL, ${count('manual')} manual, ${count('skip')} skip: ${base}`;
  return { ok: count('FAIL') === 0, results, summary };
}

/* ---------------- command line ---------------- */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter(a => a.startsWith('--')));
  const url = args.find(a => !a.startsWith('--'));
  if (!url || !/^https?:\/\//.test(url)) { console.error('usage: node scripts/prove.mjs <baseUrl> [--spend --yes] [--ratelimit] [--json]'); process.exit(2); }
  const json = flags.has('--json');
  const out = await prove(url, { spend: flags.has('--spend'), yes: flags.has('--yes'), ratelimit: flags.has('--ratelimit') });
  if (json) console.log(JSON.stringify(out, null, 2));
  else {
    for (const r of out.results) console.log(`${r.status.padEnd(6)} ${r.name}${r.detail ? `  ${r.detail}` : ''}`);
    console.log(`\n${out.ok ? 'PASS' : 'FAIL'}  ${out.summary}`);
  }
  process.exit(out.ok ? 0 : 1);
}

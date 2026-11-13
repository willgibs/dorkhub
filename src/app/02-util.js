/* ================= utilities ================= */
import { TRIAL_PAGES } from 'dorkhub:build';
import { looseJSON } from '../shared/article.js';
import { PROVIDERS, modelsFor } from '../shared/models.js';
import { migrateHoles, textsToDrop } from '../shared/world.js';
import { KIND_HEX, LENSES, kindOf } from './01-data.js';
import { CUR } from './04-pages.js';
import { renderKeyBtn } from './15-keys.js';
/** @param {string} s @param {any} [r] */
export const $ = (s, r = document) => r.querySelector(s);
/** @param {string} s @param {any} [r] */
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export function relTime(ts) { const m = (Date.now() - ts) / 6e4; if (m < 1) return 'just now'; if (m < 60) return `${Math.round(m)} min ago`; const h = m / 60; if (h < 24) return `${Math.round(h)}h ago`; const d = h / 24; if (d < 2) return 'yesterday'; if (d < 30) return `${Math.round(d)} days ago`; return `${Math.round(d / 30)} months ago`; }
export const isDark = () => { const t = document.documentElement.dataset.theme; if (t) return t === 'dark'; return matchMedia('(prefers-color-scheme: dark)').matches; };
export const kindHex = k => (isDark() ? KIND_HEX.dark : KIND_HEX.light)[kindOf(k) || 'concept'];
export function announce(msg) { const el = $('#srLive'); if (!el) return; el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 60); }
export function toast(msg, ms = 3200) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').appendChild(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 360); }, ms); }

/* ================= storage: your world, kept in this browser =================
   Pages by id (pageId: topic, voice, question, sense, pair), the trails you took between them, where
   each topic sits in Your world, and settings. A browser that read Dorkhub before this moves its
   rabbit holes in once (migrateHoles); the old store is left in place for one release. */
const KEY = 'dorkhub:world:v1', OLD_KEY = 'dorkhub:holes:v1';
export let store;
let saveTimer = 0;
/* Saving drops the oldest page texts first when the browser runs out of room: never a saved page or
   the one being read. A dropped page stays in Your world and is fetched again when it's opened. */
export function save(now) {
  clearTimeout(saveTimer);
  const doSave = () => {
    const protect = [CUR, store.current].filter(Boolean);
    for (const id of textsToDrop(store.pages, { keep: 200, protect })) store.pages[id].text = null;
    for (let keep = 160; keep >= 0; keep -= 40) {
      try { localStorage.setItem(KEY, JSON.stringify(store)); return; }
      catch (e) { for (const id of textsToDrop(store.pages, { keep, protect })) store.pages[id].text = null; }
    }
  };
  if (now) doSave(); else saveTimer = setTimeout(doSave, 400);
}

/* ================= writing: the server writes, this page streams it in =================
   Every page and tool calls one endpoint, /api/write, with a task name and structured input.
   Without a key, writing spends the free trial; with one, the reader's own key (kept in this
   browser only) rides along in headers. See lib/write.js for the protocol. */
const AUTH = 'dorkhub:auth:v1';
export let auth;
export function saveAuth() { try { localStorage.setItem(AUTH, JSON.stringify(auth)); } catch (e) { /* private mode: keys last for this visit */ } }
export const pagesLeft = () => (auth.trial ? auth.trial.pages : TRIAL_PAGES);
export const writeError = (code, text = '') => Object.assign(new Error(code), { code, text });
function noteTrial(res) {
  const m = /pages=(\d+);\s*extras=(\d+)/.exec(res.headers.get('x-dh-trial') || ''); if (!m) return;
  auth.trial = { pages: +m[1], extras: +m[2], of: TRIAL_PAGES, at: Date.now() }; saveAuth(); renderKeyBtn();
}
/* Resolves { text, truncated, seeded, none }: none means a cachedOnly ask found nothing written yet, and
   seeded is true for a page written ahead of time ('placeholder' for one of the front page's topics not
   written yet). Rejects with { code, text } where text is whatever arrived first. */
/** @param {string} task @param {any} input @param {{ signal?: AbortSignal, onText?: (o: { text: string }) => void, fresh?: boolean, cachedOnly?: boolean, key?: any }} [opts] */
export async function write(task, input, { signal, onText, fresh = false, cachedOnly = false, key = auth.byok } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (key) { headers['x-dh-provider'] = key.provider; headers['x-dh-model'] = key.model; headers['x-dh-key'] = key.key; }
  let res;
  try { res = await fetch('/api/write', { method: 'POST', headers, body: JSON.stringify({ task, input, fresh, ...(cachedOnly ? { cachedOnly: true } : {}) }), signal, credentials: 'same-origin' }); }
  catch (e) { throw writeError(signal && signal.aborted ? 'cancelled' : navigator.onLine === false ? 'offline' : 'dropped'); }
  noteTrial(res);
  if (res.status === 204) return { text: '', truncated: false, seeded: false, none: true };
  if (!res.ok || !res.body) { let code = ''; try { code = (await res.json()).error || ''; } catch (e) { /* not ours: the firewall or the platform */ } throw writeError(code || { 413: 'too_large', 429: 'rate_limited', 503: 'trial_paused' }[res.status] || 'upstream_error'); }
  const reader = res.body.getReader(); const dec = new TextDecoder(); let raw = '', text = '';
  const split = () => { const z = raw.indexOf('\u0000'); text = z < 0 ? raw : raw.slice(0, z); return z; };
  try {
    for (;;) { const { value, done } = await reader.read(); if (done) break; raw += dec.decode(value, { stream: true }); split(); if (onText) onText({ text }); }
  } catch (e) { throw writeError(signal && signal.aborted ? 'cancelled' : 'dropped', text); }
  raw += dec.decode(); const z = split();
  let tail = {}; if (z >= 0) { try { tail = JSON.parse(raw.slice(z + 1)); } catch (e) { /* ignore a garbled trailer */ } }
  if (tail.error) throw writeError(tail.error, text);
  const from = res.headers.get('x-dh-cache');
  return { text, truncated: !!tail.truncated, seeded: from === 'placeholder' ? 'placeholder' : from === 'seed', none: false };
}
export async function writeJSON(task, input, opts) { const { text } = await write(task, input, opts); const v = looseJSON(text); if (v == null) throw writeError('bad_output'); return v; }
export function errText(code) {
  switch (code) {
    case 'trial_over': return 'You’ve read your free pages on this device. Add your own key to keep going.';
    case 'tools_over': return 'You’ve used this device’s free quick tools. Your free pages still work, and your own key unlocks everything.';
    case 'trial_paused': return 'Free pages are paused for a moment. Try again later, or add your own key.';
    case 'bad_key': return 'Your API key was turned down. Check it in Keys.';
    case 'key_limit': return 'Your key has hit its rate or spending limit with its provider. Try again soon.';
    case 'model_unavailable': return 'That model isn’t available to your key right now. Pick another in Keys.';
    case 'rate_limited': return 'Lots of readers at once. Give it a minute, then try again.';
    case 'too_large': return 'That was too much to write about in one go. Try something shorter.';
    case 'refused': return 'The writer declined this page. Try a different link.';
    case 'offline': return 'You seem to be offline. Reconnect, then try again.';
    case 'bad_output': return 'That came back garbled. Try again.';
    default: return 'The connection dropped partway through. Try again.';
  }
}
/* the theme follows the device unless the reader picked one */
export function applyTheme() { const t = store.settings.theme; if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }

/* What this module does when the page starts. main.js runs these in order, after every module has loaded. */
export function init() {
store = (() => {
  const base = { v: 1, pages: {}, trails: [], pos: {}, legacy: {}, current: '', settings: { lens: 'encyclopedic', side: 'rail' } };
  const settings = s => {
    if (!s || typeof s !== 'object') return;
    if (s.side === 'open' || s.side === 'rail') base.settings.side = s.side;
    if (s.tipped) base.settings.tipped = true;
    if (s.theme === 'light' || s.theme === 'dark') base.settings.theme = s.theme;
    if (LENSES[s.lens]) base.settings.lens = s.lens;
  };
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (j && j.v === 1) {
      settings(j.settings);
      if (j.pages && typeof j.pages === 'object') base.pages = j.pages;
      if (Array.isArray(j.trails)) base.trails = j.trails.filter(t => t && t.id && Array.isArray(t.steps));
      if (j.pos && typeof j.pos === 'object') base.pos = j.pos;
      if (j.legacy && typeof j.legacy === 'object') base.legacy = j.legacy;
      if (typeof j.current === 'string') base.current = j.current;
    } else {
      const old = JSON.parse(localStorage.getItem(OLD_KEY) || localStorage.getItem('warren:v1') || 'null');
      if (old) { settings(old.settings); const m = migrateHoles(old, base.settings.lens); base.pages = m.pages; base.trails = m.trails; base.legacy = m.legacy; base.current = m.current; base.moved = true; }
    }
  } catch (e) { /* start fresh */ }
  for (const [id, p] of Object.entries(base.pages)) {
    if (!p || !p.req || typeof p.title !== 'string') { delete base.pages[id]; continue; }
    p.id = id; if (p.status === 'digging') p.status = p.text ? 'partial' : 'empty';
  }
  return base;
})();
auth = (() => {
  const a = { byok: null, trial: null };
  try {
    const j = JSON.parse(localStorage.getItem(AUTH) || 'null') || {};
    const k = j.byok; if (k && PROVIDERS[k.provider] && PROVIDERS[k.provider].enabled && typeof k.key === 'string' && modelsFor(k.provider).some(m => m.id === k.model)) a.byok = { provider: k.provider, model: k.model, key: k.key };
    /* a count saved under different trial settings, or over a month ago, is stale */
    const t = j.trial; if (t && typeof t.pages === 'number' && t.of === TRIAL_PAGES && typeof t.at === 'number' && Date.now() - t.at < 30 * 864e5) a.trial = { pages: t.pages, extras: t.extras | 0, of: t.of, at: t.at };
  } catch (e) { /* start fresh */ }
  return a;
})();
applyTheme();
}

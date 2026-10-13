/* ================= the article format, shared by the browser and the server =================
   Pages stream in a line-prefixed plain-text format (see lib/prompts/page.ts). This
   module is the single source of truth for reading it. It is an ES module for the
   server and tests; the build strips the `export` keywords and inlines it into the
   page script, so it must stay dependency-free and browser-safe. */

/** @param {unknown} t */
export const keyOf = t => String(t || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019']/g, '').replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();
/** @param {unknown} s @param {number} n @returns {string} */
export const clip = (s, n) => { const t = String(s || ''); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };
/** @param {string} s */
export const capFirst = s => s ? s[0].toUpperCase() + s.slice(1) : s;
/** @param {string} t */
export const isQuestion = t => /\?\s*$|^(why|how|what|who|when|where|is|are|do|does|did|can|could|should|would)\b/i.test(t);
/** @param {string} inner @returns {[string, string]} */
export const splitLink = inner => { const i = inner.indexOf('|'); return i < 0 ? [inner.trim(), inner.trim()] : [inner.slice(0, i).trim(), inner.slice(i + 1).trim()]; };
/** @param {unknown} s */
export const plain = s => String(s || '').replace(/\[\[([^\]]+)\]\]/g, (_, i) => splitLink(i)[0]).replace(/\*\*?([^*]+)\*\*?/g, '$1');

/** @type {Record<string, string>} */
export const MARKS = { '===': 'tunnels', '+++': 'gloss', '^^^': 'notes', '???': 'questions', '>>>': 'next', '%%%': 'time' };
export const KINDS = ['concept', 'phenomenon', 'mechanism', 'mystery', 'technique', 'thing', 'place', 'event', 'era', 'person', 'creature', 'work', 'idea'];
export const DIRS = ['deeper', 'sideways', 'wild'];
const PRE_BODY = new Set(['time', 'gloss']);

/* A clicked topic stays the topic. Only questions and connecting pages choose their own title. */
/** @param {{ title: string, depth: number, from?: { question?: string, bridge?: string, kind?: string } | null }} page */
export function titleIsLocked({ title, depth, from }) {
  if (from && (from.question || from.bridge || from.kind === 'question' || from.kind === 'bridge')) return false;
  return !(depth === 0 && isQuestion(title));
}

/* For answers that should be JSON: tolerate code fences and stray prose around the value. */
/** @param {unknown} text @returns {any} */
export function looseJSON(text) {
  const t = String(text || '').replace(/^\s*```[a-z]*\s*/i, '').replace(/```\s*$/, '');
  const a = t.search(/[[{]/); if (a < 0) return null;
  const b = t.lastIndexOf(t[a] === '[' ? ']' : '}'); if (b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

/** @param {unknown} t */
export function yearOf(t) {
  const s = String(t).toLowerCase().replace(/,/g, ''); const m = /(\d+(?:\.\d+)?)\s*(billion|million|thousand)?/.exec(s); if (!m) return null;
  let n = parseFloat(m[1]); const big = m[2]; if (big === 'billion') n *= 1e9; else if (big === 'million') n *= 1e6; else if (big === 'thousand') n *= 1e3;
  if (big || /years? ago|\bya\b|\bmya\b/.test(s)) return new Date().getFullYear() - n;
  if (/\bbce?\b|\bb\.c/.test(s)) return -n;
  return n;
}

/**
 * @typedef {{ t: 'p' | 'h' | 'li', s: string }} Block
 * @typedef {{ label: string, target: string, teaser: string, dir: string, kind?: string }} Branch
 * @typedef {{ gloss: string, kind: string, name: string }} Gloss
 * @typedef {{ title: string, deck: string, bridge: string, drift: number | null, facts: string[][], blocks: Block[], tunnels: Branch[],
 *   next: { label: string, target: string, why: string } | null, gloss: Record<string, Gloss>, notes: { n: number, s: string }[],
 *   questions: string[], time: { when: string, y: number, s: string }[], bodyDone: boolean }} Article
 */
/* Tolerant of partial, streaming text: a half-written link or bold run is held back until it closes. */
/** @param {unknown} raw @param {boolean} [streaming] @returns {Article} */
export function parseArticle(raw, streaming) {
  let text = String(raw || '').replace(/\r/g, '').replace(/^\s*```[a-z]*\s*\n/i, '').replace(/\n```\s*$/, '');
  if (streaming) text = text.replace(/\[\[[^\]\n]*$/, '').replace(/\*\*[^*\n]*$/, m => m.replace(/\*\*/, ''));
  /** @type {Article} */
  const A = { title: '', deck: '', bridge: '', drift: null, facts: [], blocks: [], tunnels: [], next: null, gloss: {}, notes: [], questions: [], time: [], bodyDone: false };
  let mode = 'body', pcount = 0;
  /** @type {string[]} */
  let para = [];
  const flush = () => { if (para.length) { A.blocks.push({ t: 'p', s: para.join(' ') }); pcount++; para = []; } };
  for (const ln of text.split('\n')) {
    const L = ln.trim(); let m;
    if (!L) { flush(); continue; }
    const mk = /^(={3,}|\+{3,}|\^{3,}|\?{3,}|>{3,}|%{3,}|-{3,})\s*$/.exec(L);
    if (mk) { flush(); const k = mk[1].slice(0, 3); mode = k === '---' ? 'body' : MARKS[k]; if (!PRE_BODY.has(mode) && mode !== 'body') A.bodyDone = true; continue; }
    if (mode === 'tunnels' || mode === 'next') {
      if ((m = /\[\[([^\]]+)\]\]\s*(.*)$/.exec(L))) {
        const [label, target] = splitLink(m[1]); const parts = m[2].replace(/^\s*(::|:|—|–|-)\s*/, '').split('::').map(s => s.trim());
        if (mode === 'next') { if (!A.next) A.next = { label, target, why: parts[0] || '' }; }
        else { const dir = DIRS.find(d => (parts[1] || '').toLowerCase().includes(d)) || ''; const kind = KINDS.find(k => (parts[2] || '').toLowerCase().startsWith(k)) || ''; A.tunnels.push({ label, target, teaser: parts[0] || '', dir, kind: kind === 'idea' ? 'concept' : kind }); }
      }
      continue;
    }
    if (mode === 'gloss') {
      if ((m = /^[-*•]?\s*\[\[([^\]]+)\]\]\s*(?:::|:)?\s*(.*)$/.exec(L))) { const [, target] = splitLink(m[1]); const parts = m[2].split('::').map(s => s.trim()); const kind = KINDS.find(k => (parts[1] || '').toLowerCase().startsWith(k)) || ''; if (parts[0]) A.gloss[keyOf(target)] = { gloss: parts[0], kind: kind === 'idea' ? 'concept' : kind, name: target }; continue; }
      mode = 'body';
    }
    if (mode === 'time') {
      if ((m = /^[-*•]?\s*(.{1,40}?)\s*::\s*(.+)$/.exec(L))) { const y = yearOf(m[1]); if (y != null && A.time.length < 8) A.time.push({ when: m[1].trim(), y, s: m[2].trim() }); continue; }
      mode = 'body';
    }
    if (mode === 'notes') { if ((m = /^\D{0,3}(\d{1,2})\s*(?:::|:|[.)–-])\s*(.+)$/.exec(L))) A.notes.push({ n: +m[1], s: m[2] }); continue; }
    if (mode === 'questions') { const q = L.replace(/^([-*•]|\d+[.)])\s*/, '').trim(); if (q.length > 3 && A.questions.length < 3) A.questions.push(q); continue; }
    if (/^[=+^?>%-]{1,2}$/.test(L) || /^#+$/.test(L)) continue;
    if ((m = /^\^\s+(.+)$/.exec(L))) { flush(); if (pcount) A.notes.push({ n: pcount, s: m[1] }); continue; }
    if ((m = /^#\s+(.+)$/.exec(L)) && !A.title) { A.title = m[1].replace(/\[\[|\]\]/g, '').replace(/\*\*/g, '').trim(); continue; }
    if ((m = /^#{2,3}\s+(.+)$/.exec(L))) { flush(); A.blocks.push({ t: 'h', s: m[1] }); continue; }
    if ((m = /^>\s?(.*)$/.exec(L)) && !A.deck) { A.deck = m[1]; continue; }
    if ((m = /^~\s?(.*)$/.exec(L))) { A.bridge = (A.bridge ? A.bridge + ' ' : '') + m[1]; continue; }
    if (/^@/.test(L)) { if ((m = /drift\D{0,4}(\d{1,3})/i.exec(L))) A.drift = Math.min(100, +m[1]); continue; }
    if (/^:/.test(L)) { if ((m = /^:\s*([^=]{1,48}?)\s*=\s*(.+)$/.exec(L))) A.facts.push([m[1], m[2]]); continue; }
    if ((m = /^[-*•]\s+(.+)$/.exec(L))) { flush(); A.blocks.push({ t: 'li', s: m[1] }); continue; }
    para.push(L);
  }
  flush();
  for (const t of A.tunnels) { const k = keyOf(t.target); if (!A.gloss[k] && (t.teaser || t.kind)) A.gloss[k] = { gloss: t.teaser, kind: t.kind || '', name: t.target }; else if (A.gloss[k] && !A.gloss[k].kind && t.kind) A.gloss[k].kind = t.kind; }
  if (!A.tunnels.length && !streaming) {
    const seen = new Set();
    for (const b of A.blocks) for (const m of b.s.matchAll(/\[\[([^\]]+)\]\]/g)) { const [label, target] = splitLink(m[1]); if (!seen.has(keyOf(target)) && A.tunnels.length < 5) { seen.add(keyOf(target)); A.tunnels.push({ label, target, teaser: '', dir: '' }); } }
  }
  return A;
}

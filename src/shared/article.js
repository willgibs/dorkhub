/* ================= the article format, shared by the browser and the server =================
   Pages stream in a line-prefixed plain-text format (FORMAT in lib/prompts.js). This
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
/* @@@ is only ever written ahead of time: the sources a page was checked against (a live writer is never asked for any) */
export const MARKS = { '===': 'tunnels', '+++': 'gloss', '^^^': 'notes', '???': 'questions', '>>>': 'next', '%%%': 'time', '&&&': 'hooks', '@@@': 'sources' };
export const KINDS = ['concept', 'phenomenon', 'mechanism', 'mystery', 'technique', 'thing', 'place', 'event', 'era', 'person', 'creature', 'work', 'idea'];
export const DIRS = ['deeper', 'sideways', 'wild'];
/* The panels a writer may set between paragraphs (FORMAT in lib/prompts.js). Anything else renders as a plain labelled list. */
export const PANELS = ['timeline', 'facts', 'steps', 'compare', 'theories', 'figures', 'myth', 'formula', 'guess'];
const PANEL_ALIAS = { time: 'timeline', fact: 'facts', glance: 'facts', step: 'steps', process: 'steps', comparison: 'compare', versus: 'compare', theory: 'theories', explanations: 'theories', figure: 'figures', numbers: 'figures', stats: 'figures', misconception: 'myth', equation: 'formula', math: 'formula', quiz: 'guess', predict: 'guess' };
const PRE_BODY = new Set(['time', 'gloss']);
const PLURAL = { people: 'person', phenomena: 'phenomenon', mysteries: 'mystery', ideas: 'idea' };

/* A clicked topic stays the topic. Only questions and connecting pages choose their own title.
   Pages written for their topic say so with `q` and `bridge`; older pages carry a depth and a `from`. */
/** @param {{ title: string, q?: boolean, bridge?: unknown, depth?: number, from?: { question?: string, bridge?: string, kind?: string } | null }} page */
export function titleIsLocked({ title, q, bridge, depth, from }) {
  if (q || bridge) return false;
  if (from && (from.question || from.bridge || from.kind === 'question' || from.kind === 'bridge')) return false;
  return !((depth === undefined || depth === 0) && isQuestion(title));
}

/* For answers that should be JSON: tolerate code fences and stray prose around the value. */
/** @param {unknown} text @returns {any} */
export function looseJSON(text) {
  const t = String(text || '').replace(/^\s*```[a-z]*\s*/i, '').replace(/```\s*$/, '');
  const a = t.search(/[[{]/); if (a < 0) return null;
  const b = t.lastIndexOf(t[a] === '[' ? ']' : '}'); if (b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

/* A timeline's WHEN as a year: "1932", "2 Nov 1932" (the year, not the day), "1950s", "300 BCE",
   "AD 79", "14th century", "65 million years ago". */
/** @param {unknown} t */
export function yearOf(t) {
  const s = String(t).toLowerCase().replace(/,/g, '');
  const big = /(\d+(?:\.\d+)?)\s*(billion|million|thousand)\b/.exec(s);
  if (big || /years? ago|\bya\b|\bmya\b/.test(s)) {
    const m = big || /(\d+(?:\.\d+)?)/.exec(s); if (!m) return null;
    let n = parseFloat(m[1]); const k = big && big[2]; if (k === 'billion') n *= 1e9; else if (k === 'million') n *= 1e6; else if (k === 'thousand') n *= 1e3;
    return new Date().getFullYear() - n;
  }
  let n; const c = /(\d{1,2})(?:st|nd|rd|th)\s+century/.exec(s);
  if (c) n = (+c[1] - 1) * 100 + 50;
  else { const nums = s.match(/\d+/g); if (!nums) return null; n = +(nums.find(x => x.length >= 3) || nums[0]); }
  return /\bbce?\b|\bb\.c/.test(s) ? -n : n;
}

/**
 * @typedef {{ t: 'p' | 'h' | 'li', s: string }} Block
 * @typedef {{ label: string, target: string, teaser: string, dir: string, kind?: string }} Branch
 * @typedef {{ gloss: string, kind: string, name: string }} Gloss
 * @typedef {{ type: string, title: string, heads: string[], rows: string[][], at: number, after: number, o: number, done: boolean, v1?: boolean }} Panel
 *   `at` is how many blocks come before the panel (its slot), `after` the paragraph it follows,
 *   `o` how many margin notes came before it (its place among them).
 * @typedef {{ title: string, kind: string, deck: string, bridge: string, blocks: Block[], panels: Panel[], tunnels: Branch[],
 *   next: { label: string, target: string, why: string } | null, gloss: Record<string, Gloss>, notes: { n: number, s: string }[],
 *   questions: string[], sources: { label: string, url: string }[], bodyDone: boolean, wait: boolean }} Article
 */
/* Writers link both ways round ([[shown|Topic]] and the wiki habit [[Topic|shown]]) and sometimes
   link a plural of a planned topic. The link plan arrives before the body, so every link can be
   pointed at the topic the writer planned: whichever side names a planned topic is the target. */
/** @param {string} k */
const stemOf = k => k.replace(/s$/, '');
/** @param {string} s @param {Record<string, Gloss>} gloss */
function canonLinks(s, gloss) {
  return s.replace(/\[\[([^\]\n]+?)\]\]/g, (whole, inner) => {
    const [a, b] = splitLink(inner);
    const exact = (/** @type {string} */ t) => gloss[keyOf(t)]?.name;
    const near = (/** @type {string} */ t) => { const k = stemOf(keyOf(t)); for (const [gk, g] of Object.entries(gloss)) if (stemOf(gk) === k) return g.name; return undefined; };
    let target;
    if ((target = exact(b))) return target === b ? whole : `[[${a}|${target}]]`;
    if ((target = exact(a))) return `[[${b}|${target}]]`;
    if ((target = near(b))) return `[[${a}|${target}]]`;
    if ((target = near(a))) return `[[${b}|${target}]]`;
    return whole;
  });
}

/* A kind named on its own ("thing", "events"), or, loosely, at the start of a field ("phenomenon, rare"). */
/** @param {string} s @param {boolean} [loose] */
function kindOfWord(s, loose) {
  const w = s.trim().toLowerCase(); const one = PLURAL[/** @type {keyof typeof PLURAL} */ (w)] || w.replace(/s$/, '');
  const k = KINDS.find(x => x === w || x === one) || (loose ? KINDS.find(x => w.startsWith(x)) : '');
  return k === 'idea' ? 'concept' : k || '';
}
/* One line grammar for the link plan, the hooks block and v1's plan: "[[Topic]] :: hook :: kind",
   "[[Topic]] :: kind" or "[[Topic]] :: hook". The first hook, kind and name heard for a topic stay. */
/** @param {Record<string, Gloss>} G @param {string} inner @param {string} rest */
function addGloss(G, inner, rest) {
  const [, target] = splitLink(inner); const k = keyOf(target); if (!k) return;
  const parts = rest.split('::').map(x => x.trim()).filter(Boolean);
  const lone = parts.length === 1 ? kindOfWord(parts[0]) : '';
  const hook = lone ? '' : parts[0] || ''; const kind = lone || kindOfWord(parts[1] || '', true);
  const e = G[k] || (G[k] = { gloss: '', kind: '', name: target });
  if (!e.gloss && hook) e.gloss = hook;
  if (!e.kind && kind) e.kind = kind;
}

/* ---------- panels: ::: type [title | A | B], rows that each hold " :: ", then ::: ---------- */
const SEP = /\s+::\s*|\s*::\s+/;
const OPENER = /^:{3,}\s*([a-z][a-z-]*)\s*(?:[:—–-]\s*)?(.*)$/i;
const CLOSER = /^:{3,}\s*$/;
/* "|" splits compare cells, but never inside a [[shown|Topic]] link */
/** @param {string} s */
function splitBars(s) {
  const out = ['']; let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s.startsWith('[[', i)) { depth++; out[out.length - 1] += '[['; i++; continue; }
    if (s.startsWith(']]', i) && depth) { depth--; out[out.length - 1] += ']]'; i++; continue; }
    if (s[i] === '|' && !depth) out.push(''); else out[out.length - 1] += s[i];
  }
  return out.map(x => x.trim()).filter(Boolean);
}
/** @param {string} R */
const isRow = R => { if (/^(#|\^\s)/.test(R)) return false; const m = SEP.exec(R); return !!m && m.index <= 64; };
/** @param {string} R @param {string} type */
function cellsOf(R, type) {
  const cells = R.split(new RegExp(SEP.source, 'g')).map(x => x.trim());
  if (type !== 'compare') return cells.filter((x, i) => x || i === 0);
  /* values split on "|"; a writer who used " :: " between them instead still gets columns */
  const rest = cells.slice(1); const bars = splitBars(rest.join(' :: '));
  return [cells[0], ...(bars.length > 1 || rest.length < 2 ? bars : rest)];
}
/** @param {string} t */
const panelType = t => { const w = t.trim().toLowerCase(); return /** @type {Record<string, string>} */ (PANEL_ALIAS)[w] || w.replace(/\s+/g, '-'); };

/* Tolerant of partial, streaming text: a half-written link, bold or italic run is held back until
   it closes, and so is a half-written line of the link plan, a panel or the hooks, so nothing
   flashes up in the wrong place and vanishes again. Panels never sit above the first paragraph:
   one written before it waits until that paragraph is finished, then settles in below it. */
/** @param {unknown} raw @param {boolean} [streaming] @returns {Article} */
export function parseArticle(raw, streaming) {
  let text = String(raw || '').replace(/\r/g, '').replace(/^\s*```[a-z]*\s*\n/i, '').replace(/\n```\s*$/, '');
  if (streaming) {
    const o = text.lastIndexOf('[['); if (o >= 0 && !/\]\]|\n/.test(text.slice(o))) text = text.slice(0, o);
    text = text.replace(/\*\*[^*\n]*$/, m => m.replace(/\*\*/, '')).replace(/(^|[\s(])\*([^*\s][^*\n]*)$/, '$1$2').replace(/[[*]$/, '');
  }
  /** @type {Article} */
  const A = { title: '', kind: '', deck: '', bridge: '', blocks: [], panels: [], tunnels: [], next: null, gloss: {}, notes: [], questions: [], sources: [], bodyDone: false, wait: false };
  let mode = 'body', pcount = 0, deckSeen = false, body = false, kept = 0, lastAfter = 0, paraOpen = false;
  /** @type {Set<string> | null} */ let plan = null;
  /** @type {Panel | null} */ let P = null;
  /** @type {Panel[]} */ const held = [];
  /** @type {{ facts: string[][], time: string[][] }} */ const v1 = { facts: [], time: [] };
  /** @type {string[]} */
  let para = [];
  /* the body begins: the link plan is fixed from here on, and v1's head facts and timeline count as its first panels */
  const begin = () => { if (body) return; body = true; plan = new Set(Object.keys(A.gloss)); kept = (v1.facts.length ? 1 : 0) + (v1.time.length >= 2 ? 1 : 0); lastAfter = kept ? 1 : 0; };
  const flush = () => { if (para.length) { begin(); A.blocks.push({ t: 'p', s: para.join(' ') }); pcount++; para = []; } };
  const lines = text.split('\n');
  const open = streaming && !text.endsWith('\n') ? lines.length - 1 : -1;
  for (let li = 0; li < lines.length; li++) {
    const L = lines[li].trim(); let m;
    if (P) {
      if (!L) continue;
      const R = L.replace(/^[-*•]\s+/, '');
      /* a line still being written waits for its newline, unless it can no longer be a row or the closer */
      if (li === open && !/^(#|\^\s)/.test(R) && !(R.length > 64 && !SEP.test(R.slice(0, 68)))) continue;
      if (CLOSER.test(L)) { P.done = true; P = null; continue; }
      if (!OPENER.test(L) && isRow(R)) { if (P.rows.length < 8) P.rows.push(cellsOf(R, P.type)); continue; }
      P.done = true; P = null;
    }
    if (!L) { flush(); continue; }
    const mk = /^(={3,}|\+{3,}|\^{3,}|\?{3,}|>{3,}|%{3,}|&{3,}|@{3,}|-{3,})\s*$/.exec(L);
    if (mk) {
      flush(); const k = mk[1].slice(0, 3);
      mode = k === '---' ? 'body' : k === '+++' && body ? 'hooks' : MARKS[k];
      if (mode === 'body' || !PRE_BODY.has(mode)) begin();
      if (!PRE_BODY.has(mode) && mode !== 'body') A.bodyDone = true;
      continue;
    }
    if (mode === 'tunnels' || mode === 'next') {
      if ((m = /\[\[([^\]]+)\]\]\s*(.*)$/.exec(L))) {
        const [label, target] = splitLink(m[1]); const parts = m[2].replace(/^\s*(::|:|—|–|-)\s*/, '').split('::').map(s => s.trim());
        if (mode === 'next') { if (!A.next) A.next = { label, target, why: parts[0] || '' }; }
        else {
          const rest = parts.slice(1);
          const dir = DIRS.find(d => rest.some(x => x.toLowerCase().includes(d))) || '';
          A.tunnels.push({ label, target, teaser: parts[0] || '', dir, kind: rest.map(x => kindOfWord(x, true)).find(Boolean) || '' });
        }
      }
      continue;
    }
    if (mode === 'gloss' || mode === 'hooks') {
      if ((m = /^[-*•]?\s*\[\[([^\]]+)\]\]\s*(?:::|:)?\s*(.*)$/.exec(L))) { if (li !== open) addGloss(A.gloss, m[1], m[2]); continue; }
      if (li === open || mode === 'hooks') continue;
      mode = 'body';
    }
    if (mode === 'time') {
      if ((m = /^[-*•]?\s*(.{1,40}?)\s*::\s*(.+)$/.exec(L))) { if (li !== open && yearOf(m[1]) != null && v1.time.length < 8) v1.time.push([m[1].trim(), m[2].trim()]); continue; }
      if (li === open) continue;
      mode = 'body';
    }
    if (mode === 'notes') { if ((m = /^\D{0,3}(\d{1,2})\s*(?:::|:|[.)–-])\s*(.+)$/.exec(L))) A.notes.push({ n: +m[1], s: m[2] }); continue; }
    if (mode === 'questions') { const q = L.replace(/^([-*•]|\d+[.)])\s*/, '').trim(); if (q.length > 3 && A.questions.length < 3) A.questions.push(q); continue; }
    /* "- Label :: https://…", or the address alone; a line still being written waits for its newline */
    if (mode === 'sources') { const sm = li === open ? null : /^[-*•]?\s*(?:(.+?)\s+::\s+)?(https:\/\/[^\s<>"]+)$/.exec(L); const url = sm ? sm[2] : ''; if (sm && A.sources.length < 16 && !A.sources.some(x => x.url === url)) A.sources.push({ label: (sm[1] || '').trim(), url }); continue; }
    if (/^[=+^?>%&@:-]{1,2}$/.test(L) || /^#+$/.test(L) || CLOSER.test(L)) continue;
    if ((m = OPENER.exec(L))) {
      if (li === open) continue;
      flush(); begin();
      const type = panelType(m[1]); const after = Math.max(1, pcount); const rest = (m[2] || '').trim();
      /** @type {Panel} */
      const panel = { type, title: type === 'compare' ? '' : clip(rest, 80), heads: type === 'compare' ? splitBars(rest).slice(0, 3) : [], rows: [], at: A.blocks.length, after, o: A.notes.length, done: false };
      /* at most two, and never two in a row: a panel needs a paragraph of its own since the last one */
      if (kept < 2 && after > lastAfter) { kept++; lastAfter = after; (pcount ? A.panels : held).push(panel); }
      P = panel; continue;
    }
    if ((m = /^\^\s+(.+)$/.exec(L))) { flush(); if (pcount) A.notes.push({ n: pcount, s: m[1] }); continue; }
    if ((m = /^#\s+(.+)$/.exec(L)) && !A.title) {
      /* v3 names the page's kind after " :: ". The kind counts once the line is whole, and a title
         like "std::vector" keeps its colons, the way "::" without spaces stays prose in the body. */
      let t = m[1]; const s = /\s+::|::(?=\s|$)/.exec(t);
      if (s) { if (li !== open) A.kind = kindOfWord(t.slice(s.index + s[0].length), true); t = t.slice(0, s.index); }
      else if (li === open) t = t.replace(/\s*:$/, '');
      A.title = t.replace(/\[\[|\]\]/g, '').replace(/\*\*/g, '').trim(); continue;
    }
    if ((m = /^#{2,3}\s+(.+)$/.exec(L))) { flush(); begin(); A.blocks.push({ t: 'h', s: m[1] }); continue; }
    if ((m = /^>\s?(.*)$/.exec(L)) && !deckSeen) {
      /* the format names the line "Deck:", and writers sometimes copy the label */
      deckSeen = true; A.deck = m[1].replace(/^\**\s*deck\s*\**\s*:\s*\**\s*/i, '');
      if (li === open && /^\**\s*d(e(c(k)?)?)?\s*\**$/i.test(A.deck)) A.deck = '';
      continue;
    }
    if ((m = /^~\s?(.*)$/.exec(L))) { A.bridge = (A.bridge ? A.bridge + ' ' : '') + m[1]; continue; }
    if (/^@/.test(L)) continue;
    if (/^:(?!:)/.test(L) && !body) { if (li !== open && (m = /^:\s*([^=]{1,48}?)\s*=\s*(.+)$/.exec(L))) v1.facts.push([m[1], m[2]]); continue; }
    if ((m = /^[-*•]\s+(.+)$/.exec(L))) { flush(); begin(); A.blocks.push({ t: 'li', s: m[1] }); continue; }
    para.push(L); paraOpen = li === open;
  }
  /* a paragraph counts as finished once a line that isn't part of it has begun */
  const settled = pcount + (para.length && !paraOpen ? 1 : 0); flush();
  if (P && !streaming) P.done = true;
  if (settled >= 1 || !streaming) {
    const p1 = A.blocks.findIndex(b => b.t === 'p'); const at = p1 >= 0 ? p1 + 1 : A.blocks.length;
    /** @type {Panel[]} */ const early = [];
    if (v1.facts.length) early.push({ type: 'facts', title: '', heads: [], rows: v1.facts, at, after: 1, o: 0, done: true, v1: true });
    if (v1.time.length >= 2) early.push({ type: 'timeline', title: '', heads: [], rows: v1.time, at, after: 1, o: 0, done: true, v1: true });
    held.forEach(p => { p.at = at; p.after = 1; p.o = 0; });
    A.panels.unshift(...early, ...held);
  }
  A.wait = !A.blocks.length && !A.bodyDone && (mode === 'gloss' || mode === 'time' || body || v1.facts.length > 0);
  /* links point at planned topics; a page with no plan is only straightened out once it is finished */
  const ps = /** @type {Set<string> | null} */ (plan);
  const G = ps && ps.size ? Object.fromEntries([...ps].map(k => [k, A.gloss[k]])) : !streaming && Object.keys(A.gloss).length ? A.gloss : null;
  if (G) {
    const fix = (/** @type {string} */ s) => canonLinks(s, G);
    A.blocks.forEach(b => { b.s = fix(b.s); }); A.notes.forEach(n => { n.s = fix(n.s); });
    A.deck = fix(A.deck); A.bridge = fix(A.bridge); A.panels.forEach(p => { p.title = fix(p.title); p.heads = p.heads.map(fix); p.rows = p.rows.map(r => r.map(fix)); });
  }
  /* branches add a kind to topics the plan didn't name; their hooks stay with the branch (hookOf) */
  for (const t of A.tunnels) { const k = keyOf(t.target); const e = A.gloss[k]; if (!e) { if (t.kind) A.gloss[k] = { gloss: '', kind: t.kind, name: t.target }; } else if (!e.kind && t.kind) e.kind = t.kind; }
  if (!A.tunnels.length && !streaming) {
    const seen = new Set();
    for (const b of A.blocks) for (const m of b.s.matchAll(/\[\[([^\]]+)\]\]/g)) { const [label, target] = splitLink(m[1]); if (!seen.has(keyOf(target)) && A.tunnels.length < 6) { seen.add(keyOf(target)); A.tunnels.push({ label, target, teaser: '', dir: '' }); } }
  }
  return A;
}

/* What makes a topic on this page worth opening: its hook, else its branch's hook, else why it's next. */
/** @param {Article} A @param {string} k */
export function hookOf(A, k) {
  const g = A.gloss[k]; if (g && g.gloss) return g.gloss;
  const t = A.tunnels.find(x => keyOf(x.target) === k); if (t && t.teaser) return t.teaser;
  return A.next && keyOf(A.next.target) === k ? A.next.why : '';
}
/* The topics a page offers next, as equal cards: an older page's single "next" first, then its
   branches, without repeats or the page itself. */
/** @param {Article} A @param {number} [n] @returns {{ label: string, target: string, teaser: string, kind: string }[]} */
export function cardsOf(A, n = 6) {
  /** @type {{ label: string, target: string, teaser: string, kind: string }[]} */ const out = [];
  const seen = new Set([keyOf(A.title)]);
  /** @param {string} label @param {string} target @param {string} teaser @param {string} [kind] */
  const add = (label, target, teaser, kind) => { const k = keyOf(target); if (!k || seen.has(k) || out.length >= n) return; seen.add(k); out.push({ label, target, teaser, kind: kind || A.gloss[k]?.kind || '' }); };
  if (A.next) add(A.next.label, A.next.target, A.next.why);
  for (const t of A.tunnels) add(t.label, t.target, t.teaser, t.kind);
  return out;
}
/* The dated rows of a page's timelines, for its deep time. */
/** @param {Article} A */
export const timeOf = A => A.panels.filter(p => p.type === 'timeline').flatMap(p => p.rows).map(([when, s = '']) => ({ when, y: yearOf(when), s })).filter(t => t.y != null).map(t => ({ ...t, y: /** @type {number} */ (t.y) }));
/* A page's panels as plain lines, for the tools that read a page as text (skeptic, quiz, recap, export). */
/** @param {Article} A */
export function panelLines(A) {
  return A.panels.flatMap(p => p.type === 'compare' && p.heads.length
    ? p.rows.map(([label, ...vals]) => `${label}: ${vals.map((v, i) => `${p.heads[i] || '?'} ${v}`).join('; ')}`)
    : p.rows.map(r => r.filter(Boolean).join(': ')));
}

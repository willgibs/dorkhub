/* ================= what you've read: one index over your world, rebuilt only when it changes ================= */
let WV = 0;                       // bumps whenever a page finishes, is saved or leaves
let WIDX = null;
const touchWorld = () => { WV++; };
/* read topics by key (the page you'd open for each), and which of your pages link to each topic */
function worldIndex() {
  if (WIDX && WIDX.v === WV) return WIDX;
  const read = new Map(), back = new Map();
  for (const p of Object.values(store.pages)) {
    if (p.status !== 'done' && p.status !== 'partial') continue;
    const k = nodeKeyOf(p); const ex = read.get(k); if (!ex || (p.last || 0) > (ex.last || 0)) read.set(k, p);
    for (const [lk] of p.links || []) { let a = back.get(lk); if (!a) back.set(lk, a = []); if (!a.includes(p.id)) a.push(p.id); }
  }
  return (WIDX = { v: WV, read, back });
}
/* pages read before Dorkhub kept their links get them in the background, a few at a time */
function backfillLinks() {
  const todo = Object.values(store.pages).filter(p => !p.links && p.text && (p.status === 'done' || p.status === 'partial'));
  if (!todo.length) return;
  const idle = window.requestIdleCallback || (f => setTimeout(() => f({ timeRemaining: () => 8 }), 60));
  const run = d => { while (todo.length && d.timeRemaining() > 2) { const p = todo.shift(); p.links = linksFrom(parseArticle(p.text, false), p); } touchWorld(); if (todo.length) idle(run); else { save(); renderSide(); } };
  idle(run);
}
/* every topic a page links, by key, in the order they appear */
function linksOf(p) {
  const A = parsed(p); if (A._links) return A._links;
  const out = new Map(); const grab = s => { for (const m of String(s).matchAll(/\[\[([^\]]+)\]\]/g)) { const [, t] = splitLink(m[1]); const k = keyOf(t); if (k && !out.has(k)) out.set(k, t); } };
  A.blocks.forEach(b => grab(b.s)); A.notes.forEach(n => grab(n.s)); A.panels.forEach(x => [x.title, ...x.heads, ...x.rows.flat()].forEach(grab));
  cardsOf(A).forEach(c => { const k = keyOf(c.target); if (k && !out.has(k)) out.set(k, c.target); });
  A._links = out; return out;
}
/* everything you've met: the pages you've read and every topic they mention (the Index) */
function buildIndex() {
  const idx = new Map();
  const touch = (k, name) => { let e = idx.get(k); if (!e) { e = { key: k, name, gloss: '', kind: '', mentions: new Set(), page: null }; idx.set(k, e); } return e; };
  const read = Object.values(store.pages).filter(p => p.text && (p.status === 'done' || p.status === 'partial'));
  for (const p of read) {
    const A = parsed(p); const own = new Set([keyOf(p.title), keyOf(p.req.title)]);
    for (const [k, t] of linksOf(p)) { if (own.has(k)) continue; touch(k, t).mentions.add(p.id); }
    for (const [k, g] of Object.entries(A.gloss)) { const e = touch(k, g.name || k); if (!e.gloss) e.gloss = hookOf(A, k); if (!e.kind) e.kind = g.kind; }
  }
  for (const p of read) {
    const k = keyOf(p.title); const e = touch(k, p.title); e.name = p.title; if (!e.page || p.last > e.page.last) e.page = p; if (p.deck && !e.gloss) e.gloss = plain(p.deck); if (p.kind && !e.kind) e.kind = p.kind;
    const k2 = keyOf(p.req.title); const o = k2 !== k && idx.get(k2); if (o) { o.mentions.forEach(m => e.mentions.add(m)); if (!e.gloss) e.gloss = o.gloss; if (!e.kind) e.kind = o.kind; idx.delete(k2); }
  }
  return [...idx.values()];
}
const plural = k => ({ person: 'people', phenomenon: 'phenomena', mystery: 'mysteries', creature: 'creatures' }[k] || k + 's');
const fmt = h => h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
/* a link is a real address, so a middle click or ⌘-click opens it in a new tab; one to a topic you've read carries a quiet mark */
function holeHTML(disp, target, p) {
  const k = keyOf(target); if (!k || (p && (keyOf(p.req.title) === k || keyOf(p.title) === k))) return fmt(esc(disp));
  const g = p && parsed(p).gloss[k]; const kind = (g && g.kind) || '';
  const read = worldIndex().read.has(topicKey(target));
  return `<a class="hole${read ? ' read' : ''}" href="${esc(routeOf({ title: target, lens: store.settings.lens }))}" data-t="${esc(target)}"${kattr(kind)}>${fmt(esc(disp))}</a>`;
}
function inline(s, p) {
  let out = '', last = 0; const re = /\[\[([^\]\n]+?)\]\]/g; let m;
  while ((m = re.exec(s))) { out += fmt(esc(s.slice(last, m.index))); const [d, t] = splitLink(m[1]); out += holeHTML(d, t, p); last = re.lastIndex; }
  return out + fmt(esc(s.slice(last)));
}
/* a page has finished: its title, deck and kind settle, and its links join your world */
function finalize(p) {
  const A = parseArticle(p.text || '', false);
  p.title = clip(shownTitle(p, A), 120);
  p.deck = A.deck || p.deck; if (A.kind) p.kind = A.kind;
  p.links = linksFrom(A, p); touchWorld();
}

/* ================= smooth reveal: text glides in at a steady pace =================
   Time-based, so a 120 Hz screen reads like a 60 Hz one. It keeps pace with a live writer and
   never runs faster than one, so a page that arrives whole (from the cache, or written ahead
   of time) still streams in the way a live page does. */
const REV_MIN = 84, REV_MAX = 960;   // characters a second
let revRaf = 0, revLast = 0;
function reveal(p, from = 0) { if (reducedMotion()) return; REV.set(p.id, { node: p, shown: from }); if (!revRaf) { revLast = performance.now(); revRaf = requestAnimationFrame(revealLoop); } }
function revealLoop(now) {
  revRaf = 0; const dt = Math.min(.1, Math.max(0, (now - revLast) / 1000)); revLast = now;
  for (const [id, r] of REV) {
    const target = (r.node.text || '').length; const backlog = target - r.shown;
    if (backlog > 0) r.shown = Math.min(target, r.shown + Math.max(REV_MIN, Math.min(REV_MAX, backlog * 5)) * dt);
    const finished = r.node.status !== 'digging' && r.shown >= target;
    if (finished) REV.delete(id);
    if (backlog > 0 || finished) paint(r.node, !finished);
    if (finished) pageDone(r.node);
  }
  if (REV.size) revRaf = requestAnimationFrame(revealLoop);
}

/* ================= writing a page ================= */
const secFor = id => { const s = $('.chamber'); return s && s.dataset.pid === id ? s : null; };
/* text that arrived whole (written ahead of time, or already written for someone) still reveals the way a live page does */
function fill(p, text, seeded) {
  p.text = text; p.status = 'done'; p.seeded = seeded || false; p.error = null; p.errorCode = null; finalize(p); save();
  reveal(p, 0); paint(p); if (!REV.has(p.id)) pageDone(p);
}
async function generate(p, { fresh = false } = {}) {
  if (ACTIVE.has(p.id)) return;
  p.status = 'digging'; p.text = ''; p.error = null; p.errorCode = null; p.doubts = null; p.peeks = []; p.unfolds = {}; p.reveals = null;
  reveal(p, 0); paint(p);
  const ctl = new AbortController(); ACTIVE.set(p.id, ctl);
  if (ACTIVE.size > 2) { const [oldId, oldCtl] = ACTIVE.entries().next().value; if (oldId !== p.id) oldCtl.abort(); }
  let queued = false;
  try {
    const input = pageInput(p); p.wlens = input.lens; /* the voice this text is in */
    const res = await write('page', input, {
      signal: ctl.signal, fresh,
      onText: ({ text }) => { p.text = text; if (!REV.has(p.id) && !queued) { queued = true; requestAnimationFrame(() => { queued = false; paint(p, true); }); } },
    });
    p.text = res.text; p.status = res.truncated ? 'partial' : 'done'; p.seeded = res.seeded || false; finalize(p);
  } catch (e) {
    const code = (e && e.code) || 'upstream_error';
    p.text = typeof e?.text === 'string' ? e.text : '';
    if (code === 'refused') p.text = '';
    if (code === 'cancelled') p.status = p.text ? 'partial' : 'empty';
    else { p.status = p.text ? 'partial' : 'error'; p.error = errText(code); p.errorCode = code; }
    if (p.text) finalize(p);
    if (p.status !== 'done') REV.delete(p.id);
  } finally {
    ACTIVE.delete(p.id); save();
    if (!REV.has(p.id)) { paint(p); pageDone(p); }
  }
}
/* a page finished revealing: Your world grows (quietly: only its count moves while you read) */
function pageDone(p) {
  if (p.status !== 'done' && p.status !== 'partial') return;
  touchWorld(); renderWorldBtn(true); if (VIEW === 'page') syncFab(); worldGrew(p);
}

/* ================= keyed rendering: elements are created once, then only updated ================= */
function setHTML(el, h) { if (el._h !== h) { el.innerHTML = h; el._h = h; } }
function place(parent, el, prev) { const want = prev ? prev.nextSibling : parent.firstChild; if (want !== el) parent.insertBefore(el, want); }
function patch(container, items, animate = true) {
  const existing = new Map(); for (const el of container.children) if (el.dataset.k) existing.set(el.dataset.k, el);
  let prev = null;
  for (const it of items) {
    let el = existing.get(it.k);
    if (!el) { el = document.createElement(it.tag || 'div'); el.dataset.k = it.k; el.className = ((it.cls || '') + (animate && !reducedMotion() ? ' enter' : '')).trim(); }
    else { existing.delete(it.k); const want = ((it.cls || '') + (el.classList.contains('enter') ? ' enter' : '')).trim(); if (el.className !== want) el.className = want; }
    if (it.role && el.getAttribute('role') !== it.role) el.setAttribute('role', it.role);
    if (it.attrs) for (const [a, v] of Object.entries(it.attrs)) if (el.getAttribute(a) !== v) el.setAttribute(a, v);
    if (it.fill) it.fill(el); else if (it.ink != null) inkHTML(el, it.html, it.ink); else setHTML(el, it.html);
    place(container, el, prev); prev = el;
  }
  existing.forEach(el => el.remove());
}
const UF_LABEL = { simpler: 'In plainer words', deeper: 'One level deeper', example: 'For example', counter: 'The counterpoint' };
function chamberHTML(p) {
  return `<section class="chamber" data-pid="${esc(p.id)}" aria-label="${esc(p.title)}">
  <article class="article">
    <header class="a-head">${plateSlotHTML(p)}<div class="h-row"><p class="where"></p><div class="tools" role="toolbar" aria-label="Page tools"></div></div><div class="h-main"></div></header>
    <div class="a-body body"></div>
    <section class="a-doubt"></section>
    <div class="a-end"></div>
    <div class="fineprint"></div>
  </article>
</section>`;
}
/* The page's colour is its kind. A new page opens in the colour of the link you followed and takes its
   own kind from its title line, which arrives before a single word of the page shows; from then on the
   colour holds for the visit, so it never changes while you read. */
let ACC = null;
function accentFor(p, A) {
  if (!ACC || ACC.id !== p.id) ACC = { id: p.id, kind: (p.status === 'done' && p.kind) || (p.hint && p.hint.kind) || p.kind || '', settled: p.status === 'done' };
  if (!ACC.settled && A.kind && !A.blocks.length) { ACC.kind = A.kind; ACC.settled = true; }
  if (A.blocks.length) ACC.settled = true;
  return kindOf(ACC.kind) || 'concept';
}
function paint(p, streamOnly) {
  const sec = secFor(p.id); if (!sec) return;
  const A = parsed(p); const live = isLive(p);
  /* a page arrived at from outside waits for the reader's word (guard in 16-router.js) */
  if (GUARD.has(p.id)) {
    sec._guard = true; const acc = accentFor(p, A); document.documentElement.dataset.accent = acc;
    paintHead(p, sec, A, true); setHTML($('.a-body', sec), guardHTML(p)); setHTML($('.a-end', sec), ''); setHTML($('.tools', sec), '');
    return;
  }
  if (sec._guard) { sec._guard = false; for (const s of ['.a-body', '.a-end', '.tools']) { const el = $(s, sec); el.innerHTML = ''; el._h = null; } }
  const art = $('.article', sec); if (art.getAttribute('aria-busy') !== String(live)) { art.setAttribute('aria-busy', String(live)); if (!live && p.status === 'done' && p.id === CUR) announce(`${shownTitle(p, A)}: page ready.`); }
  const acc = accentFor(p, A); if (document.documentElement.dataset.accent !== acc) document.documentElement.dataset.accent = acc;
  paintHead(p, sec, A, live); paintBody(p, sec, A, live); paintEnd(p, sec, A, live);
  /* the note that pages can be wrong sits once at the bottom (.colfoot); a page written ahead of time says how it was
     made, and what it was checked against */
  setHTML($('.fineprint', sec), live || !p.seeded ? '' : provenanceHTML(p, A));
  if (!streamOnly) {
    paintTools(p, sec); paintDoubt(p, sec);
    if (p.status === 'done' && !live && !store.settings.tipped) setTimeout(() => { if (store.settings.tipped || !CUR) return; store.settings.tipped = true; save(); toast(matchMedia('(hover: hover)').matches ? 'Tip: hover any link for a one-line hook, or press / to ask anything.' : 'Tip: tap any link for a one-line hook, and tap again to open it.', 7000); }, 1400);
  }
}
/* A page written ahead of time says so in one quiet line; one that keeps sources (today, a placeholder) lists them under it.
   Only a page written ahead of time can carry sources: a live writer is never asked for any, so none can be made up. */
function provenanceHTML(p, A) {
  /* one bar for every page (Will, 2026-10-19): a page written ahead of time comes from the same writer, in one pass */
  const said = p.seeded === 'placeholder' ? 'A placeholder until this page is written. Its few claims were checked against sources.' : 'Written ahead of time.';
  const line = `<span class="pv-l">${ic('check')}<span>${said}</span></span>`; const src = A.sources || [];
  if (!src.length) return `<p class="pv">${line}</p>`;
  return `<details class="pv"><summary>${line}<span class="pv-n">${src.length} source${src.length === 1 ? '' : 's'}</span></summary><ol class="pv-list">${src.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label || s.url.replace(/^https:\/\/(www\.)?/, '').split('/')[0])}</a></li>`).join('')}</ol></details>`;
}
/* the page you came here from, by following one of its links, its cards or its questions; nothing when you started here */
const FROM_VIA = new Set(['link', 'card', 'question', 'select', 'peek', 'around', 'sketch', 'connect']);
function fromOf(p) {
  const t = curTrail(); if (!t) return null;
  for (let i = t.steps.length - 1; i >= 0; i--) { const [pid, , from, via] = t.steps[i]; if (pid !== p.id) continue; const f = from && from !== p.id && FROM_VIA.has(via) ? pageOf(from) : null; return f && f.title ? f : null; }
  return null;
}
/* The head: what kind of topic this is and the page's tools on one quiet row, then the title (already
   there, from the link you clicked) and the deck. */
function paintHead(p, sec, A, live) {
  const head = $('.a-head', sec); const title = shownTitle(p, A);
  const kind = A.kind || (ACC && ACC.id === p.id && ACC.kind) || p.kind || '';
  const lens = p.req.lens !== 'encyclopedic' && LENS_PHRASE[p.req.lens] ? LENS_PHRASE[p.req.lens] : '';
  const from = fromOf(p);
  setHTML($('.where', head), `${kind ? `<span class="kind"${kattr(kind)}>${esc(capFirst(kind))}</span>` : ''}${p.req.bridge ? '<span class="kind plain">A connecting page</span>' : ''}${lens ? `<span class="kind lens">${esc(lens)}</span>` : ''}${from ? `<a class="from" href="${esc(routeOf(from.req))}" data-goto="${esc(from.id)}"${kattr(from.kind)}><span>From</span><b>${esc(clip(from.title, 44))}</b></a>` : ''}`);
  const main = []; const head0 = live && !A.blocks.length;
  main.push({ k: 'title', tag: 'h1', cls: 'a-title', html: esc(title) });
  /* the link's hook stands in for the deck until the real deck has caught up with it, so it never shrinks and regrows */
  const seedDeck = live && p.hint && p.hint.gloss ? p.hint.gloss : '';
  const deckDone = !!(A.bridge || A.wait || A.blocks.length || Object.keys(A.gloss).length || A.keyFacts.length);
  if (A.deck && !(seedDeck && plain(A.deck).length < seedDeck.length && !deckDone)) main.push({ k: 'deck', tag: 'p', cls: 'deck', html: inline(A.deck, p), ink: head0 });
  else if (seedDeck) main.push({ k: 'deck', tag: 'p', cls: 'deck seed', html: esc(capFirst(seedDeck)) });
  /* the line of key facts under the deck, shown once its three are in (or the plan has begun), so it never reflows */
  const factsIn = A.keyFacts.length >= 3 || (A.keyFacts.length >= 2 && (!live || A.blocks.length > 0 || Object.keys(A.gloss).length > 0));
  if (factsIn) main.push({ k: 'keyfacts', tag: 'dl', cls: `keyfacts n${A.keyFacts.length}`, html: A.keyFacts.map(f => `<div><dt>${esc(f.label)}</dt><dd>${esc(capFirst(plain(f.value)))}</dd></div>`).join('') });
  patch($('.h-main', head), main);
  const h1 = $('.a-title', head); if (h1 && !h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
}

/* ================= the soft frontier: the newest words resolve in, then settle into plain text =================
   While a block is being written, each new stretch of text is wrapped in a span that fades in from the
   moment it arrived (a negative animation-delay keeps the fade going across rebuilds). Arrivals are
   grouped into 70 ms beats, so a block carries at most a handful of spans; older text is plain. */
const INK_MS = 420, INK_BEAT = 70;
function inkHTML(el, html, tip) {
  const now = performance.now(); const st = el._ink;
  if (st && !tip && now - st.last < INK_MS) tip = true;
  if (!tip || reducedMotion()) { if (st) { el._ink = null; el._h = null; } setHTML(el, html); return; }
  if (el._h === html) return;
  el.innerHTML = html; el._h = html;
  const len = el.textContent.length; const s = st || (el._ink = { len: 0, marks: [], last: 0 });
  const beat = Math.floor(now / INK_BEAT) * INK_BEAT;
  if (len < s.len) s.marks = [];
  else if (len > s.len && (!s.marks.length || s.marks[s.marks.length - 1][1] !== beat)) { s.marks.push([s.len, beat]); s.last = now; }
  s.len = len; s.marks = s.marks.filter(([, b]) => now - b < INK_MS);
  if (!s.marks.length) return;
  const texts = []; const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t, pos = 0;
  while ((t = walk.nextNode())) { texts.push([t, pos]); pos += t.data.length; }
  for (let r = s.marks.length - 1; r >= 0; r--) {
    const [from0, born] = s.marks[r]; const to0 = r + 1 < s.marks.length ? s.marks[r + 1][0] : len;
    for (let x = texts.length - 1; x >= 0; x--) {
      const [tn, at] = texts[x]; const end = at + tn.data.length; if (end <= from0 || at >= to0) continue;
      const a = Math.max(from0, at) - at, b = Math.min(to0, end) - at;
      const mid = a > 0 ? tn.splitText(a) : tn; if (b - a < mid.data.length) mid.splitText(b - a);
      const span = document.createElement('span'); span.className = 'ink'; span.style.animationDelay = `-${Math.round(now - born)}ms`;
      mid.parentNode.insertBefore(span, mid); span.appendChild(mid);
    }
  }
}

/* ================= panels: information the writer chose to lay out, drawn by us =================
   Each panel streams in like the text: its frame appears with the opener, rows rise in as they are
   finished, and the label shimmers until the panel is done. A guess keeps its answer until asked. */
const VERDICT = { accepted: 'Accepted', partly: 'Partly right', disputed: 'Disputed', rejected: 'Rejected', open: 'Open' };
const verdictOf = v => { const w = String(v || '').toLowerCase(); return Object.keys(VERDICT).find(k => w.startsWith(k.slice(0, 5))) || (/part/.test(w) ? 'partly' : /unsettled|debat|unknown/.test(w) ? 'open' : ''); };
const digitsHTML = s => esc(s).replace(/[0-9]/g, (d, i) => `<span class="dg" style="--i:${i % 12}">${d}</span>`);
/* a figure's number and its unit: "17,400 tonnes" draws 17,400 large and "tonnes" small beside it */
const FIGURE = /^((?:[~≈<>±]\s?)?(?:[$£€¥]\s?)?[−-]?\d(?:[\d,.]*\d)?(?:\s?(?:%|‰|°[CF]?|×))?\+?)\s+(\S.*)$/;
const numHTML = s => { const m = FIGURE.exec(String(s).trim()); return m ? `${digitsHTML(m[1])}<small>${esc(m[2])}</small>` : digitsHTML(s); };
/* a guess's answer leads with its number when it has one ("About 29, …" → about 29), whose digits
   roll in like an odometer when the reader asks; the reel lives in CSS. The reels are for the eye and hidden
   from screen readers, which hear the phrase once, whole, from hidden text (digits in boxes of their own are
   read one by one, "about 2 9") */
const ANSWER = /^(?:(about|around|roughly|nearly|almost|over|under|more than|less than|fewer than|only|just|some|exactly)\s+)?([−-]?\d(?:[\d,.]*\d)?(?:\s?(?:%|‰|×))?)(?:\s(million|billion|trillion|thousand|hundred|percent|per cent))?(?=$|[\s,.;:)])/i;
const reelHTML = s => { let i = 0; return esc(s).replace(/[0-9]/g, d => `<span class="odo" style="--d:${d};--i:${i++}">${d}</span>`); };
const row = (k, html, extra = {}) => ({ k, cls: 'pn-r', html, ...extra });
const PANEL_UI = {
  /* once the panel is whole, a skip far longer than its usual step (and a century at least) dashes the rail
     there, so even spacing never pretends the years ran evenly; it changes paint only, never the layout */
  timeline: { label: 'Timeline', tag: 'ol', rows: (p, n) => {
    const ys = p.rows.map(r => yearOf(r[0])); const gap = i => (p.done && ys[i] != null && ys[i + 1] != null ? Math.abs(ys[i + 1] - ys[i]) : null);
    const gs = p.rows.map((_, i) => gap(i)).filter(g => g != null).sort((a, b) => a - b); const usual = gs.length ? gs[(gs.length - 1) >> 1] : 0;
    return p.rows.map((r, i) => { const g = gap(i); return row('r' + i, `<b class="pn-k">${esc(r[0])}</b><span>${inline(r[1] || '', n)}</span>`, { tag: 'li', cls: g != null && g >= 100 && g >= 4 * Math.max(usual, 1) ? 'pn-r pn-gap' : 'pn-r' }); });
  } },
  facts: { label: 'At a glance', tag: 'dl', rows: (p, n) => p.rows.map((r, i) => row('r' + i, `<dt>${inline(r[0], n)}</dt><dd>${inline(r.slice(1).join(' · '), n)}</dd>`)) },
  steps: { label: 'How it works', tag: 'ol', rows: (p, n) => p.rows.map((r, i) => row('r' + i, `<b>${inline(r[0], n)}</b>${r[1] ? `<span>${inline(r.slice(1).join(' · '), n)}</span>` : ''}`, { tag: 'li' })) },
  compare: { label: 'Side by side', tag: 'div', role: 'table', rows: (p, n) => {
    const cols = Math.min(3, Math.max(p.heads.length, ...p.rows.map(r => r.length - 1), 2)); const cell = (h, role) => `<span role="${role}">${h}</span>`;
    const heads = Array.from({ length: cols }, (_, i) => cell(inline(p.heads[i] || '', n), 'columnheader'));
    return [row('hd', cell('', 'columnheader') + heads.join(''), { cls: 'pn-r pn-hd', role: 'row' }), ...p.rows.map((r, i) => row('r' + i, cell(inline(r[0], n), 'rowheader') + Array.from({ length: cols }, (_, c) => cell(inline(r[c + 1] || '', n), 'cell')).join(''), { role: 'row' }))];
  } },
  theories: { label: 'The explanations', tag: 'ul', rows: (p, n) => p.rows.map((r, i) => { const v = verdictOf(r[2]); return row('r' + i, `<p class="pn-th"><b>${inline(r[0], n)}</b>${v ? `<em class="pn-v" data-v="${v}">${VERDICT[v]}</em>` : ''}</p><span>${inline(r[1] || '', n)}</span>`, { tag: 'li', cls: v === 'rejected' ? 'pn-r is-out' : 'pn-r' }); }) },
  figures: { label: 'By the numbers', tag: 'dl', rows: (p, n) => p.rows.map((r, i) => row('r' + i, `<dt class="pn-num">${numHTML(r[0])}</dt><dd>${inline(r.slice(1).join(' · '), n)}</dd>`)) },
  myth: { label: 'Myth and fact', tag: 'div', rows: (p, n) => p.rows.map((r, i) => { const fact = /^(actually|fact|truth|in fact|reality)/i.test(r[0]) || (i > 0 && !/^myth/i.test(r[0])); return row('r' + i, `<b>${esc(r[0])}</b><span>${inline(r.slice(1).join(' · '), n)}</span>`, { cls: `pn-r ${fact ? 'is-fact' : 'is-myth'}` }); }) },
  formula: { label: 'The equation', tag: 'div', rows: (p, n) => p.rows.map((r, i) => /^(equation|formula|law)$/i.test(r[0]) ? row('r' + i, `<code class="pn-eq">${esc(r.slice(1).join(' :: '))}</code>`, { cls: 'pn-r pn-eqr' }) : row('r' + i, `<b class="pn-sym">${esc(r[0])}</b><span>${inline(r.slice(1).join(' · '), n)}</span>`)) },
  guess: { label: 'Guess first', tag: 'div', rows: (p, n, j) => {
    const get = re => p.rows.find(r => re.test(r[0])); const q = get(/^q/i) || p.rows[0]; const a = get(/^a/i); const why = get(/^(why|because)/i);
    const open = !!(n.reveals && n.reveals[j]); const out = [];
    if (q) out.push(row('q', `<p class="pn-q">${inline(q.slice(1).join(' ') || q[0], n)}</p>`));
    if (a && !open) out.push(row('btn', `<button class="pn-reveal" type="button" data-guess="${j}" aria-expanded="false">Reveal the answer</button>`));
    if (a && open) {
      const said = a.slice(1).join(' ').trim(); const m = ANSWER.exec(said);
      const big = m ? `<span class="sr">${esc([m[1], m[2], m[3]].filter(Boolean).join(' ').toLowerCase())}</span><span aria-hidden="true">${m[1] ? `<small>${esc(m[1].toLowerCase())}</small>` : ''}${reelHTML(m[2])}${m[3] ? `<small class="after">${esc(m[3].toLowerCase())}</small>` : ''}</span>` : '';
      const rest = m ? said.slice(m[0].length) : said;
      out.push(row('a', `<div class="pn-a">${big ? `<p class="pn-big">${big}</p>` : ''}${/[\p{L}\p{N}]/u.test(rest) ? `<p class="pn-said">${inline(said, n)}</p>` : ''}</div>`));
    }
    if (why && open) out.push(row('why', `<p class="pn-why">${inline(why.slice(1).join(' '), n)}</p>`));
    return out;
  } },
  list: { label: '', tag: 'dl', rows: (p, n) => p.rows.map((r, i) => row('r' + i, `<dt>${inline(r[0], n)}</dt><dd>${inline(r.slice(1).join(' · '), n)}</dd>`)) },
};
function paintPanel(el, p, node, j) {
  const ui = PANEL_UI[p.type] || PANEL_UI.list;
  if (!el._built) { el.innerHTML = `<p class="pn-h"></p><${ui.tag} class="pn-rows"${ui.role ? ` role="${ui.role}"` : ''}></${ui.tag}>`; el._built = true; el.dataset.type = PANEL_UI[p.type] ? p.type : 'list'; }
  if (p.type === 'compare') el.style.setProperty('--n', String(Math.min(3, Math.max(p.heads.length, ...p.rows.map(r => r.length - 1), 2))));
  el.toggleAttribute('data-live', !p.done);
  const label = p.title ? inline(p.title, node) : esc(ui.label || capFirst(p.type.replace(/-/g, ' ')));
  setHTML($('.pn-h', el), `<span data-text="${esc(plain(p.title) || ui.label || p.type)}">${label}</span>`);
  patch($('.pn-rows', el), ui.rows(p, node, j));
}
const panelItem = (p, j, node) => ({ k: 'pn' + j, tag: 'section', cls: 'panel', fill: el => paintPanel(el, p, node, j) });

/* a note that points at a topic you've read says so, quietly */
function noteItem(n, p, j) {
  const known = [...n.s.matchAll(/\[\[([^\]]+)\]\]/g)].some(m => { const k = topicKey(splitLink(m[1])[1]); return k !== nodeKeyOf(p) && worldIndex().read.has(k); });
  return { k: 'n' + j, tag: 'aside', cls: 'mnote' + (known ? ' cb' : ''), html: `${known ? `<span class="ml" data-tip="Links to a topic you’ve read">${ic('loop')}</span>` : ''}${inline(n.s, p)}` };
}
function extrasItems(node, i) {
  const items = [];
  const u = node.unfolds && node.unfolds[i];
  if (u) items.push({ k: 'u', cls: 'xp', html: `<p class="xp-h"><span>${UF_LABEL[u.mode]}</span><button type="button" data-fold="${i}" aria-label="Close">×</button></p><div>${u.text ? inline(u.text, node) : `<span class="digging">${waitHTML('composing', 'Expanding')}</span>`}</div>` });
  (node.peeks || []).filter(p => p.after === i && p.open !== false).forEach(p => {
    items.push({ k: 'pk-' + p.key, cls: 'xp', html: `<p class="xp-h"><span>Peek</span><b>${esc(p.target)}</b><button type="button" data-peek-close="${esc(p.key)}" aria-label="Close">×</button></p><div>${p.text ? inline(p.text, node) : `<span class="digging">${waitHTML('searching', 'Taking a look')}</span>`}</div>${p.status === 'done' ? `<button class="xp-go" type="button" data-peek-dig="${esc(p.target)}">Open the full page on ${esc(clip(p.target, 34))} →</button>` : ''}` });
  });
  return items;
}
/* ================= pictures: a page's lead picture, resolving out of dots =================
   Looked up by title (no model involved) while the page is written. As soon as the lookup says
   there is one, its slot is reserved at the picture's own shape (below the first paragraph) if the
   first paragraph is still being written; otherwise it waits for the next
   visit, so it never moves anything a reader has seen. While the picture loads, the slot holds a
   field of dots that breathe on their own clocks (transitions.dev's Pro image placeholder); once
   it has arrived, the dots take its colours and grow into a mosaic along a diagonal sweep (the
   reveal of libraries.dev's Image, MIT), and the photo itself fades in sharp over them. A picture
   seen on an earlier visit appears plainly. */
const PICLOAD = new Set(), PICASKED = new Set(), PICAT = new Map(), PICFRESH = new Set(), PICREADY = new Map(), PICS = new Set();
function picFor(node, A) {
  if (node.pic !== undefined || PICLOAD.has(node.id)) return;
  const title = titleLocked(node) ? node.title : A.deck ? shownTitle(node, A) : ''; if (!title) return;
  PICLOAD.add(node.id); PICASKED.add(node.id);
  fetch(`/api/picture?t=${encodeURIComponent(clip(title, 120))}`, { signal: AbortSignal.timeout(8000) })
    .then(r => (r.status === 200 ? r.json() : null)).catch(() => null)
    .then(p => {
      PICLOAD.delete(node.id);
      if (!p || typeof p.src !== 'string' || !p.src.startsWith('/api/picture?')) { node.pic = null; save(); return; }
      node.pic = { src: p.src, w: +p.w || 0, h: +p.h || 0, alt: String(p.alt || ''), desc: clip(String(p.desc || ''), 200), credit: String(p.credit || ''), license: String(p.license || ''), file: String(p.file || '') };
      PICFRESH.add(node.id); save(); if (secFor(node.id)) paint(node, true);
      const img = new Image(); img.src = p.src;
      img.decode().then(() => revealPic(node, img), () => dropPic(node));
    });
}
/* The plate's shape. A landscape picture fills the column at its own shape (a 4:3 gives up a sliver top and bottom
   so the plate stays under half a screen); a tall or square one stands whole on a mat instead of being cropped. */
const PIC_WIDE = 1.42;
function picShape(p) {
  const r = p.w && p.h ? p.w / p.h : 1.5;
  return r >= 1.2 ? { mat: false, style: `--par:${Math.max(r, PIC_WIDE).toFixed(4)}` } : { mat: true, style: `--par:${PIC_WIDE};--parn:${Math.max(r, .8).toFixed(4)}` };
}
function picItem(p, fresh) {
  const by = [p.credit ? esc(p.credit) : 'Wikimedia Commons', esc(p.license)].filter(Boolean).join(' · ');
  const pl = picShape(p);
  return { k: 'pic', tag: 'figure', cls: 'pic', html: `<div class="pic-box${pl.mat ? ' mat' : ''}${fresh ? ' loading' : ''}" style="${pl.style}">${fresh ? '<canvas class="pic-field" aria-hidden="true"></canvas>' : ''}<img src="${esc(p.src)}" alt="${esc(p.alt)}" width="${p.w}" height="${p.h}" decoding="async"></div><figcaption>${p.desc ? `<span>${esc(p.desc)}</span>` : ''}<a href="${esc(p.file)}" target="_blank" rel="noopener noreferrer">${by}</a></figcaption>` };
}
/* the dot field: a lattice of dots, each breathing on its own tempo and phase, drawn on one canvas */
const PIC_PITCH = 5, PIC_CYCLE = 1400, PIC_SWEEP = 700;
function picField(box) {
  const cv = $('canvas', box); const w = box.clientWidth, h = box.clientHeight; if (!cv || !w || !h) return;
  const k = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
  const cols = Math.max(1, Math.floor(w / PIC_PITCH)), rows = Math.max(1, Math.floor(h / PIC_PITCH));
  const ox = (w - (cols - 1) * PIC_PITCH) / 2, oy = (h - (rows - 1) * PIC_PITCH) / 2; const dots = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = ox + c * PIC_PITCH, y = oy + r * PIC_PITCH; dots.push({ x, y, c, r, k: .9 + Math.random() * .2, ph: Math.random() * 6000, d: Math.min(.65, .6 * (x / w + y / h) / 2 + Math.random() * .08), col: '' }); }
  const m = /^#?([0-9a-f]{6})$/i.exec(getComputedStyle(box).getPropertyValue('--ink').trim()); const n = m ? parseInt(m[1], 16) : 0x18181b;
  const F = { box, cv, ctx: cv.getContext('2d'), k, w, h, cols, rows, dots, ink: `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`, t0: null, img: null };
  box._f = F; PICS.add(F); drawPic(F, reducedMotion() ? 0 : performance.now()); if (!reducedMotion()) wakePics();
  const pid = box.closest('.chamber')?.dataset.pid; if (pid && PICREADY.has(pid)) revealPic(null, PICREADY.get(pid), box);
}
function drawPic(F, now) {
  const { ctx, k, w, h, dots } = F; if (!ctx) return; ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, w, h);
  const rev = F.t0 == null ? -1 : (now - F.t0) / PIC_SWEEP;
  for (const d of dots) {
    const p = rev < 0 ? 0 : Math.max(0, Math.min(1, (rev - d.d) / .35));
    if (p > 0 && d.col) { const e = 1 - (1 - p) ** 3; const s = 1.6 + (PIC_PITCH + .6 - 1.6) * e; ctx.globalAlpha = .35 + .65 * e; ctx.fillStyle = d.col; ctx.fillRect(d.x - s / 2, d.y - s / 2, s, s); continue; }
    const cyc = PIC_CYCLE * d.k; const v = .5 - .5 * Math.cos(2 * Math.PI * (((now + d.ph) % cyc) / cyc));
    ctx.globalAlpha = .34 * v; ctx.fillStyle = `rgb(${F.ink})`; ctx.beginPath(); ctx.arc(d.x, d.y, .75 * v + .05, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (rev >= 1 && !F.handed) { F.handed = true; F.box.classList.add('reveal'); setTimeout(() => finishPic(F), 800); }
}
let PIC_RAF = 0;
function picLoop(now) {
  PIC_RAF = 0;
  for (const F of PICS) { if (!F.box.isConnected) { PICS.delete(F); continue; } const r = F.box.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight && !document.hidden) drawPic(F, now); }
  if (PICS.size) PIC_RAF = requestAnimationFrame(picLoop);
}
function wakePics() { if (!PIC_RAF && PICS.size) PIC_RAF = requestAnimationFrame(picLoop); }
/* the picture has arrived: its colours go to the dots, which grow into a mosaic, then the photo takes over */
function revealPic(node, img, box0) {
  if (node) PICREADY.set(node.id, img); /* kept, in case its slot is drawn after it arrives */
  const box = box0 || (node && secFor(node.id) && $('.pic-box.loading', secFor(node.id)));
  const F = box && box._f; if (!F || F.t0 != null) return;
  if (reducedMotion()) { finishPic(F); return; }
  try {
    /* each dot takes the colour of the picture where it lies: the picture covers the plate, or stands on its mat,
       where the dots have nothing to take and simply fade */
    const oc = document.createElement('canvas'); oc.width = F.cols; oc.height = F.rows; const octx = oc.getContext('2d');
    const ir = (img.naturalWidth || 1) / (img.naturalHeight || 1), br = F.w / F.h, whole = F.box.classList.contains('mat');
    const [dw, dh] = (whole ? ir > br : ir < br) ? [F.w, F.w / ir] : [F.h * ir, F.h]; const sx = F.cols / F.w, sy = F.rows / F.h;
    octx.drawImage(img, (F.w - dw) / 2 * sx, (F.h - dh) / 2 * sy, dw * sx, dh * sy);
    const px = octx.getImageData(0, 0, F.cols, F.rows).data; for (const d of F.dots) { const i = (d.r * F.cols + d.c) * 4; if (px[i + 3] > 127) d.col = `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`; }
  } catch (e) { /* no colours to borrow: the dots simply give way to the picture */ }
  F.t0 = performance.now(); wakePics();
}
function finishPic(F) {
  const box = F.box; PICS.delete(F); box._f = null; F.cv.remove(); box.classList.remove('loading', 'reveal'); box.classList.add('shown');
  /* the slot now looks exactly like a plain picture; tell the renderer so it doesn't redraw it */
  const fig = box.closest('figure'); const node = pageOf(box.closest('.chamber')?.dataset.pid); if (fig && node && node.pic) fig._h = picItem(node.pic, false).html;
  if (node) { PICFRESH.delete(node.id); PICREADY.delete(node.id); }
}
function dropPic(node) {
  node.pic = null; save(); PICFRESH.delete(node.id); PICREADY.delete(node.id);
  const fig = secFor(node.id) && $('figure.pic', secFor(node.id)); if (fig) fig.remove();
}

/* The status line tells the truth about a wait, and only while there is one: an orb for the kind of
   wait, then what is happening. The orb stays put when the wait moves on; only its motion changes. */
function setStatus(el, text, orb) {
  if (el._t === text) return; const swap = !!el._t; el._t = text;
  const shim = `<span class="shim${swap ? ' swap' : ''}" data-text="${esc(text)}">${esc(text)}</span>`;
  const c = $('canvas.orb', el); if (c) { c.dataset.orb = orb; c.nextElementSibling.outerHTML = shim; } else el.innerHTML = `<span class="wait">${orbHTML(orb)}${shim}</span>`;
}
function paintBody(node, sec, A, live) {
  const body = $('.a-body', sec); const want = []; let pi = 0, first = true; const lastIdx = A.blocks.length - 1;
  const writing = live && !A.bodyDone;
  picFor(node, A);
  /* known from an earlier visit: it's there from the start; found during this one: only while the first paragraph is still being written */
  if (node.pic && !PICAT.has(node.id)) { const p1 = A.blocks.findIndex(b => b.t === 'p'); PICAT.set(node.id, !PICASKED.has(node.id) || (live && !A.bodyDone && (p1 < 0 || p1 === lastIdx))); }
  const pic = node.pic && PICAT.get(node.id) ? node.pic : null;
  if (live && !A.blocks.length) want.push({ k: 'status', type: 'status', text: A.wait ? 'Choosing what to link' : 'Writing this page', orb: A.wait ? 'connecting' : 'composing' });
  /* a facts panel goes with its paragraph, below it with any aside; the rest where the writer put them */
  const side = new Map(), flow = [];
  A.panels.forEach((p, j) => { const b = A.blocks[p.at - 1]; if (p.type === 'facts' && b && b.t === 'p') { if (!side.has(p.at - 1)) side.set(p.at - 1, []); side.get(p.at - 1).push([p, j]); } else flow.push([p, j]); });
  const panelsAt = i => flow.filter(([p]) => p.at === i).forEach(([p, j]) => want.push({ k: 'pn' + j, type: 'panel', p, j }));
  A.blocks.forEach((b, i) => {
    panelsAt(i);
    const tip = writing && i === lastIdx;
    if (b.t === 'h') want.push({ k: 'h' + i, type: 'h', html: inline(b.s, node), tip });
    else if (b.t === 'li') { const last = want[want.length - 1]; if (last && last.type === 'ul') { last.items.push(inline(b.s, node)); last.tip = tip; } else want.push({ k: 'u' + i, type: 'ul', items: [inline(b.s, node)], tip }); }
    else {
      pi++; want.push({ k: 'p' + i, type: 'p', i, pi, html: inline(b.s, node), tip, lead: first, side: side.get(i) || [] }); first = false;
      if (pi === 1 && node.figure) want.push({ k: 'fig', type: 'fig' });
    }
  });
  panelsAt(A.blocks.length);
  if (pi < 1 && node.figure) want.push({ k: 'fig', type: 'fig' });
  const existing = new Map(); for (const el of body.children) if (el.dataset.k) existing.set(el.dataset.k, el);
  let prev = null; const anim = !reducedMotion();
  for (const w of want) {
    let el = existing.get(w.k);
    if (el) existing.delete(w.k);
    else {
      if (w.type === 'h') el = document.createElement('h2');
      else if (w.type === 'ul') el = document.createElement('ul');
      else if (w.type === 'p') { el = document.createElement('div'); el.className = 'pb'; el.innerHTML = `<div class="mcol"></div><div class="pcol"><button class="ptool" type="button" aria-label="Expand this paragraph" aria-haspopup="menu" aria-expanded="false">¶</button><p></p><div class="px"></div></div>`; }
      else if (w.type === 'panel') { el = document.createElement('section'); el.className = 'panel' + (anim ? ' enter' : ''); }
      else if (w.type === 'fig') { el = document.createElement('div'); if (anim) el.className = 'enter'; }
      else { el = document.createElement('p'); el.className = 'status-line'; el.setAttribute('role', 'status'); }
      el.dataset.k = w.k;
    }
    if (w.type === 'h') inkHTML(el, w.html, w.tip);
    else if (w.type === 'ul') inkHTML(el, w.items.map(x => `<li>${x}</li>`).join(''), w.tip);
    else if (w.type === 'p') {
      el.dataset.i = w.i; $('.ptool', el).dataset.i = w.i;
      const p = $('.pcol > p', el); inkHTML(p, w.html, w.tip); p.classList.toggle('lead', w.lead);
      patch($('.px', el), extrasItems(node, w.i));
      /* this paragraph's asides and any facts panel, below it, in the order they were written */
      const notes = A.notes.map((n, g) => ({ n, g })).filter(x => x.n.n === w.pi); const items = []; const sp = [...w.side];
      notes.forEach((x, j) => { while (sp.length && sp[0][0].o <= x.g) { const [pp, pj] = sp.shift(); items.push(panelItem(pp, pj, node)); } items.push({ ...noteItem(x.n, node, j), ink: writing && x.g === A.notes.length - 1 }); });
      sp.forEach(([pp, pj]) => items.push(panelItem(pp, pj, node)));
      /* the picture is placed before the first paragraph is finished, so before that paragraph's notes: it goes first and nothing moves it */
      if (pic && w.pi === 1) items.unshift(picItem(pic, PICFRESH.has(node.id)));
      patch($('.mcol', el), items);
      const pb = pic && w.pi === 1 && $('.pic-box.loading', el); if (pb && !pb._f) picField(pb);
    }
    else if (w.type === 'panel') paintPanel(el, w.p, node, w.j);
    else if (w.type === 'fig') setHTML(el, figureHTML(node));
    else setStatus(el, w.text, w.orb);
    place(body, el, prev); prev = el;
  }
  existing.forEach(el => el.remove());
}

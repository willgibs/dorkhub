/* ================= index, reactions, voices, taste learning ================= */
function linksOf(node) {
  const A = parsed(node); if (A._links) return A._links;
  const out = new Map(); const grab = s => { for (const m of String(s).matchAll(/\[\[([^\]]+)\]\]/g)) { const [, t] = splitLink(m[1]); const k = keyOf(t); if (k && !out.has(k)) out.set(k, t); } };
  A.blocks.forEach(b => grab(b.s)); A.notes.forEach(n => grab(n.s)); A.panels.forEach(p => [p.title, ...p.heads, ...p.rows.flat()].forEach(grab));
  A.tunnels.forEach(t => { const k = keyOf(t.target); if (k && !out.has(k)) out.set(k, t.target); });
  A._links = out; return out;
}
function buildIndex(w = W) {
  const idx = new Map();
  const touch = (k, name) => { let e = idx.get(k); if (!e) { e = { key: k, name, gloss: '', kind: '', mentions: new Set(), node: null }; idx.set(k, e); } return e; };
  for (const n of w.order.map(x => w.nodes[x])) {
    if (!n.text) continue; const A = parsed(n);
    for (const [k, t] of linksOf(n)) { if (n.keys.includes(k)) continue; touch(k, t).mentions.add(n.id); }
    for (const [k, g] of Object.entries(A.gloss)) { const e = touch(k, g.name || k); if (!e.gloss) e.gloss = hookOf(A, k); if (!e.kind) e.kind = g.kind; }
  }
  for (const n of w.order.map(x => w.nodes[x])) { const e = touch(n.keys[n.keys.length - 1], n.title); e.name = n.title; e.node = n; if (n.deck && !e.gloss) e.gloss = plain(n.deck); n.keys.forEach(k => { const o = idx.get(k); if (o && o !== e) { o.mentions.forEach(m => e.mentions.add(m)); if (!e.gloss) e.gloss = o.gloss; if (!e.kind) e.kind = o.kind; idx.delete(k); } }); }
  return [...idx.values()];
}
const KIND_GROUP = { concept: 'concept', idea: 'concept', phenomenon: 'phenomenon', mechanism: 'mechanism', technique: 'mechanism', place: 'place', person: 'person', event: 'event', era: 'event', thing: 'thing', creature: 'thing', work: 'thing', mystery: 'mystery' };
const KIND_LABEL = { concept: 'Ideas', phenomenon: 'Phenomena', mechanism: 'Mechanisms', place: 'Places', person: 'People', event: 'Events', thing: 'Things', mystery: 'Mysteries' };
const kindOf = k => KIND_GROUP[k] || '';
const kattr = k => { const g = kindOf(k); return g ? ` data-kind="${g}"` : ''; };
const REACT = { basic: ['Too basic', 'too basic, go further'], right: ['Just right', 'just right'], lost: ['Lost me', 'lost them, slow down and explain more'], wow: ['Mind-blown', 'loved it, more like this'] };
const LENS_SHORT = { story: 'a story', nerd: 'deep nerd', kid: 'for a kid', skeptic: 'a skeptic' };
const LENS_PHRASE = { encyclopedic: 'encyclopedic', story: 'told as a story', nerd: 'for deep nerds', kid: 'for a curious kid', skeptic: 'through a skeptic’s eyes' };
const plural = k => ({ person: 'people', phenomenon: 'phenomena', mystery: 'mysteries', creature: 'creatures' }[k] || k + 's');
const fmt = h => h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
function holeHTML(disp, target, cur) {
  const k = keyOf(target); if (!k || (cur && cur.keys.includes(k))) return fmt(esc(disp));
  const ex = findByKey(k); const cls = ex ? (ex.parent === cur.id ? ' dug' : ' loop') : '';
  const g = cur && parsed(cur).gloss[k]; const kind = (g && g.kind) || (ex && ex.seed && ex.seed.kind) || '';
  return `<a class="hole${cls}" href="#" data-t="${esc(target)}"${kattr(kind)}>${fmt(esc(disp))}</a>`;
}
function inline(s, cur) {
  let out = '', last = 0; const re = /\[\[([^\]\n]+?)\]\]/g; let m;
  while ((m = re.exec(s))) { out += fmt(esc(s.slice(last, m.index))); const [d, t] = splitLink(m[1]); out += holeHTML(d, t, cur); last = re.lastIndex; }
  return out + fmt(esc(s.slice(last)));
}
const shownTitle = (node, A) => titleLocked(node) ? (A.title && keyOf(A.title) === keyOf(node.title) ? A.title : capFirst(node.title)) : (A.title || node.title);
function finalize(node) {
  const A = parseArticle(node.text, false);
  if (A.title) { const k = keyOf(A.title); if (k && !node.keys.includes(k) && !titleLocked(node)) node.keys.push(k); }
  node.title = clip(shownTitle(node, A), 120);
  node.deck = A.deck || node.deck;
}

/* ================= smooth reveal: text glides in at a steady pace =================
   Time-based, so a 120 Hz screen reads like a 60 Hz one. It keeps pace with a live writer and
   never runs faster than one, so a page that arrives whole (from the cache, or written ahead
   of time) still streams in the way a live page does. */
const REV_MIN = 84, REV_MAX = 960;   // characters a second
let revRaf = 0, revLast = 0;
function reveal(node, from = 0) { if (reducedMotion()) return; REV.set(node.id, { node, shown: from }); if (!revRaf) { revLast = performance.now(); revRaf = requestAnimationFrame(revealLoop); } }
function revealLoop(now) {
  revRaf = 0; const dt = Math.min(.1, Math.max(0, (now - revLast) / 1000)); revLast = now;
  for (const [id, r] of REV) {
    const target = r.node.text.length; const backlog = target - r.shown;
    if (backlog > 0) r.shown = Math.min(target, r.shown + Math.max(REV_MIN, Math.min(REV_MAX, backlog * 5)) * dt);
    const finished = r.node.status !== 'digging' && r.shown >= target;
    if (finished) REV.delete(id);
    if (backlog > 0 || finished) paint(r.node, !finished);
    if (finished) { renderMap(); renderTrail(); }
  }
  if (REV.size) revRaf = requestAnimationFrame(revealLoop);
}

/* ================= generation ================= */
const secFor = nid => $(`.chamber[data-nid="${nid}"]`);
function fakeStream(node, text) {
  node.text = text; node.status = 'done'; finalize(node); save();
  reveal(node, 0); paint(node); renderMap(); renderTrail();
}
async function generate(node, { fresh = false } = {}) {
  if (ACTIVE.has(node.id)) return;
  const w = W; const demo = DEMO[node.keys.find(k => DEMO[k])];
  if (w.demo && demo && !fresh) return fakeStream(node, demo);
  node.status = 'digging'; node.text = ''; node.error = null; node.errorCode = null; node.doubts = null; node.thread = null; node.peeks = []; node.unfolds = {};
  reveal(node, 0); paint(node); renderMap();
  const ctl = new AbortController(); ACTIVE.set(node.id, ctl);
  if (ACTIVE.size > 2) { const [oldId, oldCtl] = ACTIVE.entries().next().value; if (oldId !== node.id) oldCtl.abort(); }
  let queued = false;
  try {
    const res = await write('page', pageInput(node), {
      signal: ctl.signal, fresh,
      onText: ({ text }) => { node.text = text; if (!REV.has(node.id) && !queued) { queued = true; requestAnimationFrame(() => { queued = false; paint(node, true); }); } },
    });
    node.text = res.text; node.status = res.truncated ? 'partial' : 'done'; node.seeded = !!res.seeded; finalize(node);
  } catch (e) {
    const code = (e && e.code) || 'upstream_error';
    node.text = typeof e?.text === 'string' ? e.text : '';
    if (code === 'refused') node.text = '';
    if (code === 'cancelled') node.status = node.text ? 'partial' : 'empty';
    else if (code === 'trial_over' && demo && !node.text) { ACTIVE.delete(node.id); REV.delete(node.id); return fakeStream(node, demo); }
    else { node.status = node.text ? 'partial' : 'error'; node.error = errText(code); node.errorCode = code; }
    if (node.text) finalize(node);
    if (node.status !== 'done') REV.delete(node.id);
  } finally {
    ACTIVE.delete(node.id); w.updated = Date.now(); save();
    if (W === w && !REV.has(node.id)) { paint(node); renderMap(); renderTrail(); }
  }
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
    if (it.fill) it.fill(el); else if (it.ink != null) inkHTML(el, it.html, it.ink); else setHTML(el, it.html);
    place(container, el, prev); prev = el;
  }
  existing.forEach(el => el.remove());
}
const UF_LABEL = { simpler: 'In plainer words', deeper: 'One level deeper', example: 'For example', counter: 'The counterpoint' };
const levelOf = d => LEVELS[stratumOf(d)];
function chamberHTML(node, via) {
  const prev = via ? W.nodes[via] : null;
  const change = prev && stratumOf(prev.depth) !== stratumOf(node.depth);
  return `<section class="chamber" data-nid="${node.id}" data-s="${stratumOf(node.depth)}" aria-label="${esc(node.title)}">
  ${change ? `<div class="levelband"><span>Level <b>${node.depth}</b></span><span>${esc(levelOf(node.depth).name)}</span></div>` : ''}
  <article class="article">
    <div class="recap-slot">${via ? '' : recapHTML(node)}</div>
    <header class="a-head"><div class="h-row"><p class="where"></p><div class="tools" role="toolbar" aria-label="Page tools"></div></div><div class="h-cols"><div class="h-main"></div><aside class="h-pic" hidden></aside></div></header>
    <div class="a-body body"></div>
    <section class="a-doubt"></section>
    <div class="a-end"></div>
    ${node.depth === 0 ? `<p class="fineprint"><span></span><button class="tool ib" type="button" data-act="help" data-tip="Tips and shortcuts" data-key="?" aria-label="Tips and shortcuts">${ic('help')}</button></p>` : ''}
  </article>
</section>`;
}
function paint(node, streamOnly) {
  const sec = secFor(node.id); if (!sec) return;
  const A = parsed(node); const live = isLive(node);
  const art = $('.article', sec); if (art.getAttribute('aria-busy') !== String(live)) { art.setAttribute('aria-busy', String(live)); if (!live && node.status === 'done' && node.id === (W && W.current)) announce(`${shownTitle(node, A)}: page ready.`); }
  paintHead(node, sec, A, live); paintBody(node, sec, A, live); paintEnd(node, sec, A, live);
  /* the first page of a rabbit hole says when its opening pages were written ahead of time; the note
     that pages can be wrong sits once at the bottom of the stream (.colfoot), not on every page */
  const fp = node.depth === 0 && $('.fineprint span', sec);
  if (fp) setHTML(fp, node.seeded ? 'The first pages of this path were written ahead of time; past them, every page is written live for your path.' : '');
  if (!streamOnly) {
    paintTools(node, sec); paintDoubt(node, sec);
    if (W && node.id === W.current) updateUpNext();
    if (node.status === 'done' && !live && !store.settings.tipped) setTimeout(() => { if (store.settings.tipped || !W || document.body.classList.contains('at-start')) return; store.settings.tipped = true; save(); toast(matchMedia('(hover: hover)').matches ? 'Tip: hover any link for a one-line hook, or press / to ask anything.' : 'Tip: tap any link for a one-line hook, and tap again to open it.', 7000); }, 1400);
  }
}
/* The head: where you are and the page's tools on one quiet row, then the title (already there,
   from the link you clicked), the deck and the bridge back to where you came from. */
function paintHead(node, sec, A, live) {
  const head = $('.a-head', sec); const parent = node.parent ? W.nodes[node.parent] : null;
  const title = shownTitle(node, A); const lvl = levelOf(node.depth); const kd = kindOf(node.seed && node.seed.kind);
  setHTML($('.where', head), `<span class="mk" data-tip="Level ${node.depth}: ${esc(lvl.name)}. Page ${pathTo(node).length} of this rabbit hole">${node.depth}</span>${kd ? `<span class="kdot2" data-kind="${kd}" data-tip="${esc(capFirst(node.seed.kind))}"></span>` : ''}${node.lens ? `<span class="kind lens">${esc(LENS_PHRASE[node.lens])}</span>` : ''}`);
  const main = []; const head0 = live && !A.blocks.length;
  main.push({ k: 'title', tag: 'h1', cls: 'a-title', html: esc(title) });
  /* the link's hook stands in for the deck until the real deck has caught up with it, so it never shrinks and regrows */
  const seedDeck = live && node.seed && node.seed.gloss ? node.seed.gloss : '';
  if (A.deck && !(seedDeck && plain(A.deck).length < seedDeck.length && !A.bridge)) main.push({ k: 'deck', tag: 'p', cls: 'deck', html: inline(A.deck, node), ink: head0 });
  else if (seedDeck) main.push({ k: 'deck', tag: 'p', cls: 'deck seed', html: esc(capFirst(seedDeck)) });
  const from = node.from && node.from.bridge && W.nodes[node.from.bridge] && parent ? `Connecting <a href="#/w/${W.id}/${parent.id}">${esc(parent.title)}</a> and <a href="#/w/${W.id}/${node.from.bridge}">${esc(W.nodes[node.from.bridge].title)}</a>` : parent ? `From <a href="#/w/${W.id}/${parent.id}">${esc(parent.title)}</a>` : 'Where it starts';
  if (A.bridge || live) main.push({ k: 'bridge', cls: 'bridge', html: `<p class="bridge-from">${from}</p>${A.bridge ? `<p class="bridge-t">${inline(A.bridge, node)}</p>` : ''}`, ink: head0 });
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
   roll in like an odometer when the reader asks; the reel lives in CSS, so the text stays the number */
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
      const big = m ? `${m[1] ? `<small>${esc(m[1].toLowerCase())}</small>` : ''}${reelHTML(m[2])}${m[3] ? `<small class="after">${esc(m[3].toLowerCase())}</small>` : ''}` : '';
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

function noteItem(n, node, j) {
  const callback = [...n.s.matchAll(/\[\[([^\]]+)\]\]/g)].some(m => { const ex = findByKey(keyOf(splitLink(m[1])[1])); return ex && ex.id !== node.id && ex.status === 'done'; });
  return { k: 'n' + j, tag: 'aside', cls: 'mnote' + (callback ? ' cb' : ''), html: `${callback ? `<span class="ml" data-tip="A callback to a page you already read">${ic('loop')}</span>` : ''}${inline(n.s, node)}` };
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
   there is one, its slot is reserved at the picture's own shape (beside the first paragraph, below
   it on a phone) if the first paragraph is still being written; otherwise it waits for the next
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
      node.pic = { src: p.src, w: +p.w || 0, h: +p.h || 0, alt: String(p.alt || ''), credit: String(p.credit || ''), license: String(p.license || ''), file: String(p.file || '') };
      PICFRESH.add(node.id); save(); if (secFor(node.id)) paint(node, true);
      const img = new Image(); img.src = p.src;
      img.decode().then(() => revealPic(node, img), () => dropPic(node));
    });
}
function picItem(p, fresh) {
  const by = [p.credit ? esc(p.credit) : 'Wikimedia Commons', esc(p.license)].filter(Boolean).join(' · ');
  const ar = p.w && p.h ? ` style="--ar:${p.w}/${p.h};--arn:${(p.w / p.h).toFixed(4)}"` : '';
  return { k: 'pic', tag: 'figure', cls: 'pic', html: `<div class="pic-box${fresh ? ' loading' : ''}"${ar}>${fresh ? '<canvas class="pic-field" aria-hidden="true"></canvas>' : ''}<img src="${esc(p.src)}" alt="${esc(p.alt)}" width="${p.w}" height="${p.h}" decoding="async"></div><figcaption><a href="${esc(p.file)}" target="_blank" rel="noopener noreferrer">${by}</a></figcaption>` };
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
  const nid = box.closest('.chamber')?.dataset.nid; if (nid && PICREADY.has(nid)) revealPic(null, PICREADY.get(nid), box);
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
    const oc = document.createElement('canvas'); oc.width = F.cols; oc.height = F.rows; const octx = oc.getContext('2d'); octx.drawImage(img, 0, 0, F.cols, F.rows);
    const px = octx.getImageData(0, 0, F.cols, F.rows).data; for (const d of F.dots) { const i = (d.r * F.cols + d.c) * 4; d.col = `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`; }
  } catch (e) { /* no colours to borrow: the dots simply give way to the picture */ }
  F.t0 = performance.now(); wakePics();
}
function finishPic(F) {
  const box = F.box; PICS.delete(F); box._f = null; F.cv.remove(); box.classList.remove('loading', 'reveal'); box.classList.add('shown');
  /* the slot now looks exactly like a plain picture; tell the renderer so it doesn't redraw it */
  const fig = box.closest('figure'); const node = W && W.nodes[box.closest('.chamber')?.dataset.nid]; if (fig && node && node.pic) fig._h = picItem(node.pic, false).html;
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
  if (live && !A.blocks.length) want.push({ k: 'status', type: 'status', text: A.wait ? 'Choosing links for your path' : 'Writing this page for your path', orb: A.wait ? 'connecting' : 'composing' });
  /* facts sit in the margin beside their paragraph on a wide screen (below it on a narrow one); the rest in the reading column */
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
      /* margin notes and any facts panel beside this paragraph, in the order they were written */
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

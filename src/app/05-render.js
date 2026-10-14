/* ================= index, reactions, voices, taste learning ================= */
function linksOf(node) {
  const A = parsed(node); if (A._links) return A._links;
  const out = new Map(); const grab = s => { for (const m of String(s).matchAll(/\[\[([^\]]+)\]\]/g)) { const [, t] = splitLink(m[1]); const k = keyOf(t); if (k && !out.has(k)) out.set(k, t); } };
  A.blocks.forEach(b => grab(b.s)); A.notes.forEach(n => grab(n.s)); A.tunnels.forEach(t => { const k = keyOf(t.target); if (k && !out.has(k)) out.set(k, t.target); });
  A._links = out; return out;
}
function buildIndex(w = W) {
  const idx = new Map();
  const touch = (k, name) => { let e = idx.get(k); if (!e) { e = { key: k, name, gloss: '', kind: '', mentions: new Set(), node: null }; idx.set(k, e); } return e; };
  for (const n of w.order.map(x => w.nodes[x])) {
    if (!n.text) continue; const A = parsed(n);
    for (const [k, t] of linksOf(n)) { if (n.keys.includes(k)) continue; touch(k, t).mentions.add(n.id); }
    for (const [k, g] of Object.entries(A.gloss)) { const e = touch(k, g.name || k); if (!e.gloss) { e.gloss = g.gloss; e.kind = g.kind; } }
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
  node.deck = A.deck || node.deck; node.drift = node.depth === 0 ? 0 : A.drift;
}

/* ================= smooth reveal: text glides in at a steady pace ================= */
let revRaf = 0;
function reveal(node, from = 0) { if (reducedMotion()) return; REV.set(node.id, { node, shown: from }); if (!revRaf) revRaf = requestAnimationFrame(revealLoop); }
function revealLoop() {
  revRaf = 0;
  for (const [id, r] of REV) {
    const target = r.node.text.length; const backlog = target - r.shown;
    if (backlog > 0) r.shown = Math.min(target, r.shown + Math.max(1.4, Math.min(90, backlog * .085)));
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
    node.text = res.text; node.status = res.truncated ? 'partial' : 'done'; finalize(node);
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
    setHTML(el, it.html); place(container, el, prev); prev = el;
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
    <header class="a-head"><div class="h-top"></div><div class="h-cols"><div class="h-main"></div><aside class="h-side" aria-label="At a glance"></aside></div></header>
    <div class="tools" role="toolbar" aria-label="Page tools"></div>
    <div class="a-body body"></div>
    <section class="a-doubt"></section>
    <div class="a-end"></div>
    <form class="ask" data-nid="${node.id}" autocomplete="off"><label class="sr" for="ask-${node.id}">Ask your own question from here</label><div class="ask-row"><input id="ask-${node.id}" placeholder="Ask your own question from here" maxlength="160"><button class="btn" type="submit">Open ↵</button></div></form>
    <p class="fineprint"><span>Written live by AI for your path. Check anything you plan to repeat.</span><button class="tool ib" type="button" data-act="help" data-tip="Tips and shortcuts" data-key="?" aria-label="Tips and shortcuts">${ic('help')}</button></p>
  </article>
</section>`;
}
function paint(node, streamOnly) {
  const sec = secFor(node.id); if (!sec) return;
  const A = parsed(node); const live = isLive(node);
  const art = $('.article', sec); if (art.getAttribute('aria-busy') !== String(live)) { art.setAttribute('aria-busy', String(live)); if (!live && node.status === 'done' && node.id === (W && W.current)) announce(`${shownTitle(node, A)}: page ready.`); }
  paintHead(node, sec, A, live); paintBody(node, sec, A, live); paintEnd(node, sec, A, live);
  if (!streamOnly) {
    paintTools(node, sec); paintDoubt(node, sec);
    if (W && node.id === W.current) updateUpNext();
    if (node.status === 'done' && !live && !store.settings.tipped) setTimeout(() => { if (store.settings.tipped || !W || document.body.classList.contains('at-start')) return; store.settings.tipped = true; save(); toast(matchMedia('(hover: hover)').matches ? 'Tip: hover any link for a one-line hook, or press / to ask anything.' : 'Tip: tap any link for a one-line hook, and tap again to open it.', 7000); }, 1400);
  }
}
/* Quick facts, drift and the timeline are reference, not reading. On a wide screen they sit in the
   margin column beside the opening; on a narrower one they wait until the first paragraph has
   been written, then settle in below it, so the first screen is always mostly words. */
function driftHTML(node, A) {
  if (!(node.depth > 0 && A.drift != null)) return '';
  return `<div class="drift"><span>Drift from ${esc(clip(W.nodes[W.root].title, 32))}</span><span class="dg" role="img" aria-label="${A.drift} percent"><i style="width:${A.drift}%"></i></span><b>${A.drift}%</b></div>`;
}
const factsHTML = (node, A) => A.facts.length ? `<dl class="facts" aria-label="Quick facts">${A.facts.map(([k, v]) => `<div class="fact"><dt>${esc(k)}</dt><dd>${inline(v, node)}</dd></div>`).join('')}</dl>` : '';
const timeHTML = (node, A) => A.time.length >= 2 ? `<ol class="tline" aria-label="Timeline">${A.time.map(t => `<li data-tip="${esc(t.when)}: ${esc(plain(t.s))}"><b>${esc(t.when)}</b><span>${inline(t.s, node)}</span></li>`).join('')}</ol>` : '';
function paintHead(node, sec, A, live) {
  const head = $('.a-head', sec); const parent = node.parent ? W.nodes[node.parent] : null;
  const title = shownTitle(node, A); const lvl = levelOf(node.depth);
  const top = [], main = [], side = [];
  const kd = kindOf(node.seed && node.seed.kind);
  top.push({ k: 'where', tag: 'p', cls: 'where', html: `<span class="mk" data-tip="Level ${node.depth}: ${esc(lvl.name)}. Page ${pathTo(node).length} of this rabbit hole">${node.depth}</span>${kd ? `<span class="kdot2" data-kind="${kd}" data-tip="${esc(capFirst(node.seed.kind))}"></span>` : ''}${node.lens ? `<span class="kind lens">${esc(LENS_PHRASE[node.lens])}</span>` : ''}` });
  top.push({ k: 'title', tag: 'h1', cls: 'a-title', html: esc(title) });
  /* the link's hook stands in for the deck until the real deck has caught up with it, so it never shrinks and regrows */
  const seedDeck = live && node.seed && node.seed.gloss ? node.seed.gloss : '';
  if (A.deck && !(seedDeck && plain(A.deck).length < seedDeck.length && !A.bridge)) main.push({ k: 'deck', tag: 'p', cls: 'deck', html: inline(A.deck, node) });
  else if (seedDeck) main.push({ k: 'deck', tag: 'p', cls: 'deck seed', html: esc(seedDeck) });
  const from = node.from && node.from.bridge && W.nodes[node.from.bridge] && parent ? `Connecting <a href="#/w/${W.id}/${parent.id}">${esc(parent.title)}</a> and <a href="#/w/${W.id}/${node.from.bridge}">${esc(W.nodes[node.from.bridge].title)}</a>` : parent ? `From <a href="#/w/${W.id}/${parent.id}">${esc(parent.title)}</a>` : 'Where it starts';
  if (A.bridge) main.push({ k: 'bridge', cls: 'bridge', html: `<p class="bridge-from">${from}</p><p>${inline(A.bridge, node)}</p>` });
  else if (live) main.push({ k: 'bridge', cls: 'bridge', html: `<p class="bridge-from">${from}</p><div class="arrive" role="status"><span class="ar-dots" aria-hidden="true">${'<i></i>'.repeat(8)}</span>Writing this page for your path</div>` });
  const t = timeHTML(node, A); if (t) main.push({ k: 'time', cls: 'h-time', html: t });
  const g = driftHTML(node, A) + factsHTML(node, A); if (g) side.push({ k: 'glance', cls: 'glance', html: g });
  patch($('.h-top', head), top); patch($('.h-main', head), main); patch($('.h-side', head), side);
  const h1 = $('.a-title', head); if (h1 && !h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
}
const CARET = '<span class="caret" aria-hidden="true"></span>';
function noteItem(n, node, j) {
  const callback = [...n.s.matchAll(/\[\[([^\]]+)\]\]/g)].some(m => { const ex = findByKey(keyOf(splitLink(m[1])[1])); return ex && ex.id !== node.id && ex.status === 'done'; });
  return { k: 'n' + j, tag: 'aside', cls: 'mnote' + (callback ? ' cb' : ''), html: `${callback ? `<span class="ml" data-tip="A callback to a page you already read">${ic('loop')}</span>` : ''}${inline(n.s, node)}` };
}
function extrasItems(node, i) {
  const items = [];
  const u = node.unfolds && node.unfolds[i];
  if (u) items.push({ k: 'u', cls: 'xp', html: `<p class="xp-h"><span>${UF_LABEL[u.mode]}</span><button type="button" data-fold="${i}" aria-label="Close">×</button></p><div>${u.text ? inline(u.text, node) : `<span class="digging">Expanding<span class="dots"></span></span>`}</div>` });
  (node.peeks || []).filter(p => p.after === i && p.open !== false).forEach(p => {
    items.push({ k: 'pk-' + p.key, cls: 'xp', html: `<p class="xp-h"><span>Peek</span><b>${esc(p.target)}</b><button type="button" data-peek-close="${esc(p.key)}" aria-label="Close">×</button></p><div>${p.text ? inline(p.text, node) : `<span class="digging">Taking a look<span class="dots"></span></span>`}</div>${p.status === 'done' ? `<button class="xp-go" type="button" data-peek-dig="${esc(p.target)}">Open the full page on ${esc(clip(p.target, 34))} →</button>` : ''}` });
  });
  return items;
}
function paintBody(node, sec, A, live) {
  const body = $('.a-body', sec); const want = []; let pi = 0, first = true; const lastIdx = A.blocks.length - 1;
  const glance = driftHTML(node, A) + factsHTML(node, A) + timeHTML(node, A);
  A.blocks.forEach((b, i) => {
    const caret = live && !A.bodyDone && i === lastIdx ? CARET : '';
    if (b.t === 'h') want.push({ k: 'h' + i, type: 'h', html: inline(b.s, node) + caret });
    else if (b.t === 'li') { const last = want[want.length - 1]; if (last && last.type === 'ul') last.items.push(inline(b.s, node) + caret); else want.push({ k: 'u' + i, type: 'ul', items: [inline(b.s, node) + caret] }); }
    else {
      pi++; want.push({ k: 'p' + i, type: 'p', i, html: inline(b.s, node) + caret, lead: first, notes: A.notes.filter(n => n.n === pi) }); first = false;
      /* narrow screens: the glance settles in once the first paragraph is finished, below it */
      if (pi === 1 && glance && (i < lastIdx || A.bodyDone || !live)) want.push({ k: 'glance', type: 'glance', html: glance });
      if (pi === 1 && node.figure) want.push({ k: 'fig', type: 'fig' });
    }
  });
  if (pi < 1 && node.figure) want.push({ k: 'fig', type: 'fig' });
  if (live && !A.blocks.length && (A.bridge || A.facts.length)) want.push({ k: 'wait', type: 'wait' });
  const existing = new Map(); for (const el of body.children) if (el.dataset.k) existing.set(el.dataset.k, el);
  let prev = null; const anim = !reducedMotion();
  for (const w of want) {
    let el = existing.get(w.k);
    if (el) existing.delete(w.k);
    else {
      if (w.type === 'h') el = document.createElement('h2');
      else if (w.type === 'ul') el = document.createElement('ul');
      else if (w.type === 'p') { el = document.createElement('div'); el.className = 'pb'; el.innerHTML = `<div class="pcol"><button class="ptool" type="button" aria-label="Expand this paragraph" aria-haspopup="menu" aria-expanded="false">¶</button><p></p><div class="px"></div></div><div class="mcol"></div>`; }
      else if (w.type === 'fig') { el = document.createElement('div'); if (anim) el.className = 'enter'; }
      else if (w.type === 'glance') { el = document.createElement('aside'); el.className = 'glance-band' + (anim ? ' enter' : ''); el.setAttribute('aria-label', 'At a glance'); }
      else { el = document.createElement('div'); el.className = 'waitline'; }
      el.dataset.k = w.k;
    }
    if (w.type === 'h') setHTML(el, w.html);
    else if (w.type === 'ul') setHTML(el, w.items.map(x => `<li>${x}</li>`).join(''));
    else if (w.type === 'p') {
      el.dataset.i = w.i; $('.ptool', el).dataset.i = w.i;
      const p = $('p', el); setHTML(p, w.html); p.classList.toggle('lead', w.lead);
      patch($('.px', el), extrasItems(node, w.i));
      patch($('.mcol', el), w.notes.map((n, j) => noteItem(n, node, j)));
    }
    else if (w.type === 'fig') setHTML(el, figureHTML(node));
    else if (w.type === 'glance') setHTML(el, w.html);
    else setHTML(el, `<span class="arrive" role="status"><span class="ar-dots" aria-hidden="true">${'<i></i>'.repeat(8)}</span>Choosing the most interesting links for this page</span>`);
    place(body, el, prev); prev = el;
  }
  existing.forEach(el => el.remove());
}

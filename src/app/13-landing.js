/* ================= the front page: one composer to start from, and ways in below it =================
   Its job is to get a visitor into their first page. The suggestions under the composer and the cards
   below it lead into the front page's topics, chosen and drawn by hand (lib/front.js; the build puts the
   list in FRONT and the cards in /front.json). Each opens a page written ahead of time, or its placeholder
   until it is. Surprise me, and the doors a paused or used-up page offers, open only those, and the pages
   written before them (EARLIER): free and instant. */
const DOORS = [...FRONT, ...EARLIER];
/* Surprise me opens a page that isn't on screen: written ahead of time, so it's free and instant */
function surprise() {
  const shown = new Set($$('.door[data-seed]').map(b => b.dataset.seed));
  const pool = DOORS.filter(d => !shown.has(d.t));
  openTopic((pool[Math.floor(Math.random() * pool.length)] || DOORS[0]).t, { via: 'start' });
}
const doorHTML = d => `<button class="door" type="button" data-seed="${esc(d.t)}" data-tip="${esc(d.h)}">${esc(d.t)}</button>`;
/* days turn over at the reader's own midnight */
const dayN = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
/* the suggestions: four of the planned topics, the same four all day, re-rolled as a set by shuffle */
function suggestions(n = 4) { const a = FRONT.slice(); let s = dayN(); for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); }
/* the presets re-roll as a set: the shown ones step back quickly, the new ones rise in a beat apart, and none repeats */
function shufflePresets() {
  const list = $('#presetList'); if (!list || list.dataset.busy) return;
  const shown = new Set($$('.door', list).map(b => b.dataset.seed));
  const pool = FRONT.filter(d => !shown.has(d.t)).sort(() => Math.random() - .5).slice(0, 4);
  const swap = () => { list.innerHTML = pool.map(doorHTML).join(''); $$('.door', list).forEach((b, i) => b.style.setProperty('--i', String(i))); list.classList.remove('out'); list.classList.add('in'); };
  if (reducedMotion()) { swap(); return; }
  list.dataset.busy = '1'; list.classList.remove('in'); list.classList.add('out');
  setTimeout(() => { swap(); setTimeout(() => { delete list.dataset.busy; }, 600); }, 160);
}

/* ================= ways in: the cards, the map of threads, and a reader's world =================
   Each card is its own piece (lib/front.js): a drawing, edge to edge, that leads into one topic, with only its kind
   and its title, which links to the page (Will, 2026-10-16: the drawings are the point, and a visitor clicks in to
   find out what they show). Between the two groups of cards, a map of every planned topic and the threads that tie
   them, labelled when you point at one. A reader's own world takes the last slot. */
let FRONTD = null, FRONTP = null, THREADMAP = null, WORLDCARD = null; const THREAD_POS = new Map();
/* the cards' look comes with them: only the front page loads /front.css, so reading pages never carry it */
const frontCss = () => new Promise(done => { if ($('#frontCss')) { done(); return; } const l = document.createElement('link'); l.id = 'frontCss'; l.rel = 'stylesheet'; l.href = '/front.css'; l.onload = l.onerror = () => done(); document.head.appendChild(l); });
function loadFront() {
  FRONTP = FRONTP || Promise.all([fetch('/front.json').then(r => (r.ok ? r.json() : null)), frontCss()]).then(([j]) => (FRONTD = j && Array.isArray(j.cards) ? j : { cards: [], threads: [] }), () => { FRONTP = null; return null; });
  return FRONTP;
}
const slugOfCard = t => topicKey(t).replace(/[^a-z0-9]+/g, '-');
/* a card tells its story once a visit, on its turn (see stage); without motion every card shows finished */
const PLAYED = new Set(); const LIVE = new Set(['flytrap', 'enigma']);
const motionOK = () => !reducedMotion() && typeof IntersectionObserver === 'function';
function wayHTML(c) {
  const href = routeOf({ title: c.t, lens: 'encyclopedic', q: asksQuestion(c.t), ctx: '', bridge: null });
  const slug = slugOfCard(c.t), live = LIVE.has(c.fx); const go = `href="${esc(href)}" data-way="${esc(c.t)}" data-fk="${esc(c.k)}" data-h="${esc(c.hook)}"`;
  /* every card opens its page from the arrow in its corner; one without controls of its own opens from anywhere on it */
  const open = live ? `<a class="wc-open" ${go}${tipAttrs('Open the page')}>${ic('arrow')}</a>` : `<span class="wc-open" aria-hidden="true">${ic('arrow')}</span>`;
  return `<article class="wc wc-${c.size}${c.tab ? ` wc-tab-${c.tab}` : ''}${c.night ? ' wc-night' : ''}${live ? ' wc-live' : ''}${motionOK() && !PLAYED.has(slug) ? ' armed' : ''}" data-card="${slug}"${kattr(c.k)}${c.fx ? ` data-fx="${c.fx}"` : ''}${c.beat ? ` data-beat="${c.beat}"` : ''}>
  <div class="wc-art">${c.art}</div>
  <div class="wc-cap"><p class="wc-kind"><span class="kind"${kattr(c.k)}>${esc(capFirst(c.k))}</span></p><h3 class="wc-t"><a ${go}>${esc(c.t)}</a></h3></div>
  ${c.more || ''}${c.credit ? `<p class="wc-cr">${esc(c.credit)}</p>` : ''}${open}
</article>`;
}
const frontShellHTML = () => `<section class="ways" id="ways" aria-labelledby="waysH">
  <h2 class="ways-h" id="waysH">Ways in</h2>
  <div class="bento" id="bentoA"></div>
  <div class="threads" id="threads"></div>
  <div class="bento" id="bentoB"></div>
</section>`;
function renderFront() {
  const A = $('#bentoA'), B = $('#bentoB'); if (!A || !B || !FRONTD) return;
  if (!FRONTD.cards.length) { $('#ways').hidden = true; return; }
  const cards = FRONTD.cards; const cut = cards.findIndex(c => c.t === 'Fireworks'); const split = cut > 0 ? cut : Math.ceil(cards.length / 2);
  /* a reader's world takes the last card's place, at its size */
  const mine = worldCount() > 0; const last = cards[cards.length - 1]; const later = cards.slice(split).filter(c => !(mine && c === last));
  A.innerHTML = cards.slice(0, split).map(c => wayHTML(c)).join('');
  B.innerHTML = later.map(c => wayHTML(c)).join('') + (mine ? worldCardHTML(last) : '');
  renderThreads(); if (mine) mountWorldCard(); startFx();
}
/* the map of threads: every planned topic, and why each one leads to the next */
function renderThreads() {
  const el = $('#threads'); if (!el) return;
  el.innerHTML = `<div class="th-side"><h2 class="th-h">Pull a thread</h2><div class="th-body" aria-live="polite"><p class="th-p">Every topic here is tied to others. Point at one to see why.</p><p class="th-stats"><b>${FRONT.length}</b> topics · <b>${FRONTD.threads.length}</b> threads</p></div></div><div class="th-stage" id="threadStage" role="img" aria-label="A map of the topics and the threads between them"></div>`;
  /* the topic you point at, and every thread it has, beside the map (it stays until you point at another) */
  const body = $('.th-body', el);
  const panel = n => {
    if (!n || body.dataset.at === n.key) return; body.dataset.at = n.key;
    const mine = FRONTD.threads.filter(t => t.a === n.title || t.b === n.title);
    const href = routeOf({ title: n.title, lens: 'encyclopedic', q: asksQuestion(n.title), ctx: '', bridge: null });
    body.innerHTML = `<p class="th-k"><span class="kind"${kattr(n.kind)}>${esc(capFirst(n.kind))}</span><span>${mine.length} thread${mine.length === 1 ? '' : 's'}</span></p><h3 class="th-t">${esc(n.title)}</h3><p class="th-p">${esc(n.hook)}</p><ul class="th-list">${mine.map(t => `<li><b>${esc(t.a === n.title ? t.b : t.a)}</b><span>${esc(t.l)}</span></li>`).join('')}</ul><a class="wc-go" href="${esc(href)}" data-way="${esc(n.title)}" data-fk="${esc(n.kind)}" data-h="${esc(n.hook)}">Open the page ${ic('right')}</a>`;
  };
  const nodes = FRONT.map(f => ({ key: topicKey(f.t), pid: '', title: f.t, kind: f.k, read: true, saved: 0, first: 0, last: 0, hook: f.h, count: 0, deg: 0, cur: false, x: 0, y: 0, vx: 0, vy: 0, fx: null, fy: null }));
  const at = new Map(nodes.map((n, i) => [n.title, i])); const edges = [];
  for (const th of FRONTD.threads) { const a = at.get(th.a), b = at.get(th.b); if (a == null || b == null) continue; edges.push({ a, b, move: false, unread: false, len: 96, label: th.l }); nodes[a].deg++; nodes[b].deg++; }
  if (THREADMAP) THREADMAP.destroy();
  /* the map traces in on its turn among the cards, once a visit */
  const hold = motionOK() && !PLAYED.has('threads'); el.classList.toggle('armed', hold); el.dataset.beat = '1300';
  THREADMAP = makeGraph($('#threadStage'), { still: true, hold, positions: THREAD_POS, panel, open: n => openTopic(n.title, { via: 'start', hint: { gloss: n.hook, kind: n.kind } }) });
  THREADMAP.setData({ nodes, edges });
}
/* a reader's world, in the last slot: the neighbourhood of the last page read, edge to edge, and how far it reaches */
function worldCardHTML(slot) {
  const n = worldCount();
  return `<article class="wc wc-${slot.size}${slot.tab ? ` wc-tab-${slot.tab}` : ''} wc-world wc-live"><div class="wc-art"><div class="ww-stage" id="worldStage"></div></div><div class="wc-cap"><p class="wc-kind"><span class="ww-you">You</span></p><h3 class="wc-t"><a href="/world">Your world</a></h3></div><p class="ww-stats"><b>${n}</b> topic${n === 1 ? '' : 's'} read · <b>${oneClickAway()}</b> one click away</p><a class="wc-open" href="/world"${tipAttrs('Open Your world')}>${ic('arrow')}</a></article>`;
}
function mountWorldCard() {
  const host = $('#worldStage'); if (!host) return; if (WORLDCARD) WORLDCARD.destroy();
  const full = worldGraph(); const last = pageOf(store.current);
  const start = last && (last.status === 'done' || last.status === 'partial') ? nodeKeyOf(last) : (full.nodes.find(n => n.read) || {}).key || '';
  WORLDCARD = makeGraph(host, { mini: true, still: true, positions: MINI_POS });
  WORLDCARD.setData(start ? localGraph(full, start, 24, 6) : { nodes: [], edges: [] }, { center: start });
}
/* ---------- one card at a time ----------
   Will (2026-10-16): when everything moves at once, nothing is seen. So a card tells its story (its entrance) once a
   visit, and only when it is mostly in view, the page has stopped being flung, and no other card is telling one. The
   rest wait, still, in their first frames, and go in reading order: a screenful reached in one fling plays left to
   right, top to bottom, each card starting as the one before it settles. The map of threads takes its turn too. Without motion every card
   simply shows finished, and the cards' controls and readings work either way. */
let STAGE = null; const FX_STOP = [];
function startFx() {
  stopStage(); FX_STOP.splice(0).forEach(f => f());
  const cards = $$('#ways .wc');
  $$('.wc[data-fx="flytrap"]').forEach(flytrapFx); $$('.wc[data-fx="enigma"]').forEach(enigmaFx); $$('.wc[data-fx="origami"]').forEach(origamiFx); $$('.wc[data-fx="magnets"]').forEach(magnetsFx);
  cards.forEach(el => { if ($('[data-read]', el)) readoutFx(el); });
  if (!motionOK()) { cards.forEach(el => el.classList.add('seen')); if (THREADMAP) THREADMAP.play(); return; }
  cards.forEach(el => { if (!el.classList.contains('armed')) el.classList.add('seen'); });
  const map = $('#threads.armed');
  stage([...cards.filter(el => el.classList.contains('armed')), ...(map ? [map] : [])]);
}
/* what a card does as its story starts, beyond what its stylesheet plays */
const FX_PLAY = new WeakMap();
function beatFx(el) {
  const n = $('[data-fx="odometer"]', el); if (n && !n.dataset.done) odometer(n);
  if (el.dataset.fx === 'enigma') enigmaDemo(el);
  const play = FX_PLAY.get(el); if (play) play();
}
/* the stage: the cards still waiting, played one at a time. A card counts as in view once 60% of it (or of the
   screen, for one taller than the screen) shows, and is ready once it has stayed in view for a moment, so one a
   fling only carries past never starts; a scroll faster than about 1.4 px/ms is a fling, and nothing starts until it
   has been still for a moment. A card scrolled away mid-story ends its turn: the eye has moved on, to the next. */
const DWELL = 150;
function stage(waiting) {
  const S = { left: new Set(waiting), since: new Map(), cur: null, busy: 0, fling: 0, raf: 0, wait: 0, ready: false, y: scrollY, t: performance.now(), io: null, stop: () => {} };
  STAGE = S;
  const shown = el => { const r = el.getBoundingClientRect(), h = innerHeight; return Math.max(0, Math.min(r.bottom, h) - Math.max(r.top, 0)) / Math.min(r.height, h); };
  const done = () => { clearTimeout(S.busy); S.busy = 0; if (S.cur) S.cur.classList.remove('playing'); S.cur = null; };
  const next = () => {
    if (STAGE !== S) return;
    const t = performance.now();
    if (S.cur && shown(S.cur) < .25) done();
    S.left.forEach(el => { if (shown(el) < .6) S.since.delete(el); else if (!S.since.has(el)) S.since.set(el, t); });
    if (S.busy || S.fling || !S.ready) return;
    const now = [...S.since].filter(([, t0]) => t - t0 >= DWELL).map(([el]) => ({ el, r: el.getBoundingClientRect() })).sort((a, b) => (Math.abs(a.r.top - b.r.top) > 48 ? a.r.top - b.r.top : a.r.left - b.r.left));
    if (!now.length) { if (S.since.size) { clearTimeout(S.wait); S.wait = setTimeout(soon, Math.min(...S.since.values()) + DWELL - t); } return; }
    const { el } = now[0]; S.left.delete(el); S.since.delete(el); S.io.unobserve(el);
    S.cur = el; el.classList.add('seen', 'playing'); PLAYED.add(el.dataset.card || el.id);
    if (el.id === 'threads') { if (THREADMAP) THREADMAP.play(); } else beatFx(el);
    /* the next one starts as this one settles: one card leads at a time, and the eye moves on with it */
    S.busy = setTimeout(() => { done(); next(); }, Math.max(600, (Number(el.dataset.beat) || 1200) * .7));
  };
  const soon = () => { if (!S.raf) S.raf = requestAnimationFrame(() => { S.raf = 0; next(); }); };
  const onScroll = () => {
    const t = performance.now(), v = Math.abs(scrollY - S.y) / Math.max(8, t - S.t); S.y = scrollY; S.t = t;
    if (v > 1.4 || S.fling) { clearTimeout(S.fling); S.fling = setTimeout(() => { S.fling = 0; soon(); }, 180); } else soon();
  };
  S.io = new IntersectionObserver(soon, { threshold: [0, .3, .6, .9] }); S.left.forEach(el => S.io.observe(el));
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', soon);
  /* the first story waits for the composer to finish rising */
  const go = setTimeout(() => { S.ready = true; soon(); }, 700);
  S.stop = () => { clearTimeout(S.busy); clearTimeout(S.fling); clearTimeout(S.wait); clearTimeout(go); cancelAnimationFrame(S.raf); S.io.disconnect(); removeEventListener('scroll', onScroll); removeEventListener('resize', soon); $$('#ways .playing').forEach(el => el.classList.remove('playing')); };
}
function stopStage() { if (STAGE) { STAGE.stop(); STAGE = null; } }
/* a drawing answers the pointer: whatever part carries a reading (data-read) is named in a small label beside the
   pointer. The card's link lies over the drawing, so the parts are found by position rather than by events of their
   own; touch has no pointer to follow, so the drawings say what they must without it */
function readoutFx(card) {
  if (card.dataset.reads) return; card.dataset.reads = '1';
  const out = document.createElement('p'); out.className = 'wc-read'; out.setAttribute('aria-hidden', 'true'); card.appendChild(out);
  let on = null;
  const show = (hit, x, y) => {
    if (hit !== on) { if (on) on.classList.remove('on'); on = hit; if (on) { on.classList.add('on'); out.textContent = on.dataset.read; } card.classList.toggle('reading', !!on); }
    if (!on) return;
    const r = card.getBoundingClientRect(), w = out.offsetWidth, h = out.offsetHeight;
    const left = Math.min(Math.max(8, x - r.left + 14), r.width - w - 8), top = y - r.top + 18 + h > r.height - 8 ? y - r.top - h - 12 : y - r.top + 18;
    out.style.transform = `translate(${Math.round(left)}px,${Math.round(top)}px)`;
  };
  card.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; show(document.elementsFromPoint(e.clientX, e.clientY).find(el => el.dataset && el.dataset.read && card.contains(el)) || null, e.clientX, e.clientY); });
  card.addEventListener('pointerleave', () => show(null, 0, 0));
}
/* Origami: the sheet moves as Miura's fold does, in one motion. Waiting its turn, it lies folded shut; on its turn it
   pulls open to rest; with a mouse, pointing across the card opens it toward the right and folds it toward the left,
   and when the pointer leaves it settles back to rest */
function origamiFx(card) {
  const sheets = $$('.vz.mi', card); if (!sheets.length || card.dataset.wired) return; card.dataset.wired = '1';
  /* the sheet's faces, laid here rather than shipped, since they move */
  for (const el of sheets) { const g = $('.mi-sheet', el); g.innerHTML = '<path class="mi-f"/>'.repeat(Number(g.dataset.faces) || 0); }
  let th = card.classList.contains('armed') && !card.classList.contains('seen') ? FOLD.shut : FOLD.rest, aim = th, raf = 0, tween = null;
  const draw = () => {
    for (const el of sheets) {
      if (!el.getClientRects().length) continue;
      const { faces, shadow } = foldView(th, el.classList.contains('vz-n') ? 'n' : 'w'), ps = $$('.mi-f', el);
      faces.forEach((f, k) => { if (!ps[k]) return; ps[k].setAttribute('d', f.d); ps[k].setAttribute('class', `mi-f mi-o${f.o}`); });
      $('.mi-shadow', el).setAttribute('d', shadow);
      for (let o = 0; o < 4; o++) el.style.setProperty(`--s${o}`, (faces.find(f => f.o === o)?.s || 0).toFixed(3));
    }
  };
  const loop = now => {
    raf = 0;
    if (tween) { const t = Math.min(1, (now - tween.t0) / tween.ms), e = 1 - Math.pow(1 - t, 3); th = tween.from + (tween.to - tween.from) * e; if (t >= 1) { tween = null; aim = th; } }
    else th += (aim - th) * .16;
    draw(); if (tween || Math.abs(aim - th) > .002) raf = requestAnimationFrame(loop);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(loop); };
  draw();
  FX_PLAY.set(card, () => { tween = { from: th, to: FOLD.rest, t0: performance.now(), ms: 1400 }; go(); });
  /* a sheet hidden at first (a phone's or a desk's) is laid when it shows */
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => draw()) : null; if (ro) ro.observe(card);
  FX_STOP.push(() => { if (ro) ro.disconnect(); });
  card.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || !card.classList.contains('seen') || reducedMotion()) return; const r = card.getBoundingClientRect(), f = Math.min(1, Math.max(0, (e.clientX - r.left - r.width * .12) / (r.width * .76))); tween = null; aim = FOLD.shut + (FOLD.open - FOLD.shut) * f; go(); });
  card.addEventListener('pointerleave', () => { if (tween) return; aim = FOLD.rest; go(); });
  FX_STOP.push(() => { if (raf) cancelAnimationFrame(raf); raf = 0; });
}
/* Magnets: about 1,800 filings on a canvas, each turned along the field where it lies (src/shared/plates.js). Waiting
   its turn they lie scattered; on its turn they swing into line, rippling out from the bar; with a mouse the pointer is
   a pole they turn toward, and when it leaves they settle back. Drawn in the theme's ink, again when the theme changes */
function magnetsFx(card) {
  const cv = $('.mg-cv', card); if (!cv || cv.dataset.wired) return; cv.dataset.wired = '1';
  const ctx = cv.getContext('2d'), F = filings(), rand = F.map((_, i) => ((i * 7919) % 360) / 360 * Math.PI);
  const ang = new Float32Array(F.length), aim = new Float32Array(F.length);
  let W = 0, H = 0, s = 1, ox = 0, oy = 0, raf = 0, pole = null, pull = 0, play = 0, ink = '';
  const along = p => F.forEach((q, i) => { const [bx, by] = barField(q.x, q.y, p); aim[i] = Math.atan2(by, bx) + q.jit; });
  const size = () => { const r = card.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d); s = Math.max(W / BAR.W, H / BAR.H); ox = (W - BAR.W * s) / 2; oy = (H - BAR.H * s) / 2; ctx.setTransform(d, 0, 0, d, 0, 0); ink = getComputedStyle(card).getPropertyValue('--ink').trim() || '#18181B'; };
  const draw = () => {
    ctx.clearRect(0, 0, W, H); ctx.strokeStyle = ink; ctx.lineCap = 'round';
    /* fainter and finer away from the bar, where the field is weak */
    for (const a of [0, 1, 2]) for (const heavy of [false, true]) {
      ctx.globalAlpha = [.3, .5, .72][a] + (heavy ? .1 : 0); ctx.lineWidth = heavy ? 1.45 : 1.05; ctx.beginPath();
      F.forEach((q, i) => { if (q.a !== a || (q.w > 1.2) !== heavy) return; const c = Math.cos(ang[i]) * q.len / 2 * s, n = Math.sin(ang[i]) * q.len / 2 * s, x = ox + q.x * s, y = oy + q.y * s; ctx.moveTo(x - c, y - n); ctx.lineTo(x + c, y + n); });
      ctx.stroke();
    }
  };
  /* a filing has no ends to tell apart: it turns the short way to its line */
  const near = (a, b) => { let d = (b - a) % Math.PI; if (d > Math.PI / 2) d -= Math.PI; if (d < -Math.PI / 2) d += Math.PI; return d; };
  const loop = now => {
    raf = 0; let moving = false;
    if (play) { const t = now - play; F.forEach((q, i) => { const delay = Math.hypot(q.x - BAR.cx, (q.y - BAR.cy) * 1.4) / 260 * 650, k = Math.min(1, Math.max(0, (t - delay) / 520)); const e = 1 - Math.pow(1 - k, 3); ang[i] = rand[i] + near(rand[i], aim[i]) * e; }); if (t > 1300) { play = 0; } moving = true; }
    else { F.forEach((q, i) => { const d = near(ang[i], aim[i]); if (Math.abs(d) > .002) { ang[i] += d * .22; moving = true; } }); }
    draw(); if (moving) raf = requestAnimationFrame(loop);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(loop); };
  size(); along(null);
  const waiting = card.classList.contains('armed') && !card.classList.contains('seen');
  F.forEach((_, i) => { ang[i] = waiting ? rand[i] : aim[i]; }); draw();
  FX_PLAY.set(card, () => { play = performance.now(); go(); });
  card.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || !card.classList.contains('seen') || play) return; const r = card.getBoundingClientRect(); pole = [(e.clientX - r.left - ox) / s, (e.clientY - r.top - oy) / s, 2.6]; along(pole); go(); });
  card.addEventListener('pointerleave', () => { if (!pole) return; pole = null; along(null); go(); });
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { size(); draw(); }) : null; if (ro) ro.observe(card);
  const mo = new MutationObserver(() => { size(); draw(); }); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const mq = matchMedia('(prefers-color-scheme: dark)'), re = () => { size(); draw(); }; mq.addEventListener('change', re);
  FX_STOP.push(() => { if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); mo.disconnect(); mq.removeEventListener('change', re); });
}
/* the cube's number rolls in, digit by digit, like a slot machine settling from the left. The reels are for the eye
   and hidden from screen readers, which read the number once, whole, from hidden text (a paragraph's aria-label is
   ignored, and digits in boxes of their own are read one by one) */
function odometer(el) {
  el.dataset.done = '1'; const text = el.textContent; let k = 0;
  const reels = [...text].map(ch => (/\d/.test(ch) ? `<span class="od" style="--d:${ch};--k:${k++}"><span>0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9</span></span>` : esc(ch) + (ch === ',' ? '<wbr>' : ''))).join('');
  el.innerHTML = `<span class="sr">${esc(text)}</span><span aria-hidden="true">${reels}</span>`;
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('rolled')));
}
/* a flytrap you can touch: one touch it remembers for 20 seconds, a second shuts it in about a tenth of a second (the
   page turns its lobes about the midrib, src/shared/plates.js, with a little overshoot, so the teeth cross), and five
   start digestion. The meter under it counts, marked where it shuts and where it starts to digest */
function flytrapFx(card) {
  const art = $('.wc-art', card), sv = $('.vz.ft', card); if (!art || !sv || art.dataset.wired) return; art.dataset.wired = '1';
  art.insertAdjacentHTML('beforeend', `<button class="ft-btn" type="button" aria-label="Touch a trigger hair"></button><div class="ft-meter" aria-live="polite"><span class="ft-s">Touch a hair</span><ol class="ft-steps">${[1, 2, 3, 4, 5].map(i => `<li${i === 2 ? ' data-l="Shuts"' : i === 5 ? ' data-l="Digests"' : ''}><i></i></li>`).join('')}</ol></div>`);
  let n = 0, armed = 0, timer = 0, rest = 0, phi = TRAP.open, raf = 0; const steps = $$('.ft-steps li', art);
  /* the trap at an opening: each lobe's face, rim, teeth, hairs and nectar, and the line its colour follows */
  const draw = () => {
    const v = trapView(phi, TRAP);
    v.lobes.forEach((l, i) => {
      const g = $(`.ft-l${i}`, sv), gr = $(`#ft-g${i}`, sv); if (!g) return;
      $('.ft-shell', g).setAttribute('d', l.shell);
      const face = $('.ft-face', g); face.setAttribute('d', l.face); face.setAttribute('class', `ft-face${l.inside ? '' : ' ft-hid'}`);
      $('.ft-rim', g).setAttribute('d', l.rim); $('.ft-teeth', g).setAttribute('d', l.teeth); $('.ft-hair', g).setAttribute('d', l.hairs.map(h => h.d).join(''));
      $('.ft-nectar', g).setAttribute('d', l.nectar.map(([x, y]) => `M${x} ${y}h0`).join(''));
      /* shut, the hairs and the nectar are inside */
      for (const sel of ['.ft-hair', '.ft-nectar']) $(sel, g).classList.toggle('ft-hid', !l.inside);
      if (gr) ['x1', 'y1', 'x2', 'y2'].forEach((a, j) => gr.setAttribute(a, String(l.across[j])));
    });
  };
  /* close (or open) over ms, overshooting a little when it snaps */
  const move = (to, ms, snap) => {
    if (raf) cancelAnimationFrame(raf); const from = phi, t0 = performance.now();
    if (reducedMotion()) { phi = to; draw(); return; }
    const step = now => { const t = Math.min(1, (now - t0) / ms), e = snap ? 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2) : 1 - Math.pow(1 - t, 3); phi = from + (to - from) * e; draw(); raf = t < 1 ? requestAnimationFrame(step) : 0; };
    raf = requestAnimationFrame(step);
  };
  const say = (c, t) => { $('.ft-s', art).textContent = t; steps.forEach((s, i) => s.classList.toggle('on', i < c)); };
  const reset = () => { n = 0; armed = 0; card.dataset.state = ''; say(0, 'Touch a hair'); if (phi !== TRAP.open) move(TRAP.open, 900, false); };
  $('.ft-btn', art).addEventListener('click', () => {
    clearTimeout(rest); const now = Date.now(); if (armed && now - armed > 20000 && n < 2) n = 0;
    n = Math.min(n + 1, 5); card.classList.remove('zap'); void card.offsetWidth; card.classList.add('zap');
    if (n === 1) { armed = now; card.dataset.state = 'armed'; say(1, 'It remembers for 20 s'); clearTimeout(timer); timer = setTimeout(() => { if (n < 2) reset(); }, 20000); }
    else if (n < 5) { clearTimeout(timer); if (card.dataset.state !== 'shut') move(TRAP.shut, 140, true); card.dataset.state = 'shut'; say(n, n === 2 ? 'Shut, in a tenth of a second' : `${5 - n} more to digest`); }
    else { card.dataset.state = 'digest'; move(TRAP.shut * .2, 300, false); say(5, 'Digesting'); }
    rest = setTimeout(reset, 9000);
  });
  FX_STOP.push(() => { if (raf) cancelAnimationFrame(raf); clearTimeout(timer); clearTimeout(rest); });
}
/* an Enigma you can type into or tap: rotors I, II, III and reflector B from AAA. Each letter steps the rotors (their
   windows roll on), lights the lamp it becomes and joins the tape; the tally counts the letters that lit themselves,
   which never happens. First seen, it types WETTER by itself, once */
const EN_DEMO = new WeakMap();
const enigmaStop = card => { const t = EN_DEMO.get(card); if (t) { clearInterval(t); EN_DEMO.delete(card); } };
function enigmaPress(card, c) {
  const input = $('.en-in input', card); if (!input || input.value.length >= 16) return;
  const k = $(`.en-keys [data-k="${c}"]`, card); if (k) { k.classList.add('down'); setTimeout(() => k.classList.remove('down'), 140); }
  input.value += c; input.dispatchEvent(new Event('input', { bubbles: true }));
}
function enigmaFx(card) {
  const input = $('.en-in input', card); if (!input || input.dataset.wired) return; input.dataset.wired = '1';
  const pl = $('.en-pl', card), cy = $('.en-cy', card), lamps = new Map($$('.en-lamps i', card).map(i => [i.dataset.l, i])), wheels = $$('.en-rw', card), at = [0, 0, 0];
  $('.en-tape', card).insertAdjacentHTML('beforeend', `<button class="en-x" type="button"${tipAttrs('Clear')}>${ic('x')}</button>`);
  /* a rotor only turns forwards: past Z it rolls on to the ring's second A, then sits back on the first */
  const roll = (w, i, to) => {
    const strip = $('.en-strip', w), from = at[i]; at[i] = to; w.dataset.at = String.fromCharCode(65 + to); if (to === from) return;
    if (to > from) { strip.style.setProperty('--i', String(to)); return; }
    strip.style.setProperty('--i', '26'); setTimeout(() => { if (at[i] !== to) return; strip.classList.add('snap'); strip.style.setProperty('--i', String(to)); void strip.offsetWidth; strip.classList.remove('snap'); }, 260);
  };
  const show = () => {
    const plain = input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 16); if (input.value !== plain) input.value = plain;
    const { out, pos } = enigma(plain, 'AAA');
    wheels.forEach((w, i) => roll(w, i, pos.charCodeAt(i) - 65));
    for (const l of lamps.values()) l.classList.remove('on');
    if (out) lamps.get(out[out.length - 1])?.classList.add('on');
    pl.innerHTML = [...plain].map(c => `<i>${c}</i>`).join(''); cy.innerHTML = [...out].map(c => `<i>${c}</i>`).join('');
    $('.en-n', card).textContent = String([...plain].filter((c, i) => c === out[i]).length); $('.en-of', card).textContent = String(plain.length);
    card.classList.toggle('typed', !!plain);
  };
  input.addEventListener('input', () => { if (!EN_DEMO.has(card) || input.dataset.demo !== '1') enigmaStop(card); show(); });
  card.addEventListener('click', e => {
    const k = e.target.closest('.en-keys button'); if (k) { enigmaStop(card); enigmaPress(card, k.dataset.k); return; }
    if (e.target.closest('.en-x')) { enigmaStop(card); input.value = ''; show(); }
  });
  /* with a key of the machine in focus, the keyboard types too */
  card.addEventListener('keydown', e => { if (e.target === input || e.metaKey || e.ctrlKey || e.altKey || !e.target.closest('.en')) return; const c = e.key.toUpperCase(); if (/^[A-Z]$/.test(c)) { e.preventDefault(); enigmaStop(card); enigmaPress(card, c); } });
  if (!motionOK()) { input.value = 'WETTER'; show(); }
}
function enigmaDemo(card) {
  const input = $('.en-in input', card); if (!input || input.value || EN_DEMO.has(card)) return;
  let i = 0; const t = setInterval(() => { if (i >= 6 || input.value.length !== i) { enigmaStop(card); delete input.dataset.demo; return; } input.dataset.demo = '1'; enigmaPress(card, 'WETTER'[i++]); input.dataset.demo = ''; }, 300);
  EN_DEMO.set(card, t); FX_STOP.push(() => enigmaStop(card));
}
const voiceChipHTML = () => store.settings.lens === 'encyclopedic' ? '' : `<button class="cchip" type="button" data-act="voice-clear"${tipAttrs('Back to the encyclopedic voice')}>${esc(LENSES[store.settings.lens][0])}${ic('x')}</button>`;
/* the key pill: free pages left, or the model a reader's own key writes with */
const seedKeyHTML = () => auth.byok ? `${ic('key')}<b>${esc(modelName(auth.byok.model).replace(/^Claude /, ''))}</b>` : `${ic('key')}<b>${pagesLeft()}</b>`;
/* send doubles as Surprise me: a dice while the box is empty, an arrow once there is something to read about */
function syncSend() {
  const b = $('#seedGo'), i = $('#seedIn'); if (!b || !i) return;
  const go = !!i.value.trim(); if (b.dataset.mode === (go ? 'go' : 'dice')) return;
  b.dataset.mode = go ? 'go' : 'dice'; b.type = go ? 'submit' : 'button';
  if (go) delete b.dataset.act; else b.dataset.act = 'surprise';
  const label = go ? 'Start reading' : 'Surprise me'; b.dataset.tip = label; b.setAttribute('aria-label', label);
  if (go) { b.dataset.key = '↵'; } else delete b.dataset.key;
}
function growSeed() { const i = $('#seedIn'); if (!i) return; i.style.height = 'auto'; i.style.height = `${Math.min(i.scrollHeight, 168)}px`; }
/* what you typed becomes the page title: a copy of it takes the title's place in the page transition */
function seedMirror(v) {
  const box = $('#seedBox'), i = $('#seedIn'); if (!box || !i) return null;
  const m = document.createElement('span'); m.className = 'cmirror'; m.textContent = v.replace(/\s+/g, ' ');
  box.appendChild(m); i.style.color = 'transparent'; return m;
}
let LANDED = false;
function viewStart() {
  /* Continue reopens the last page you read */
  const last = pageOf(store.current); const cont = last && (last.status === 'done' || last.status === 'partial') ? last : [...worldIndex().read.values()].sort((a, b) => b.last - a.last)[0];
  const doors = suggestions(4);
  /* the first arrival of a visit rises in, line by line; coming back to it later doesn't replay that */
  const intro = !LANDED && !reducedMotion(); LANDED = true;
  return `<section class="hero${intro ? ' intro' : ''}" aria-labelledby="startH">
  ${cont ? `<a class="resume rise" style="--i:0" href="${esc(routeOf(cont.req))}" data-goto="${esc(cont.id)}"${kattr(cont.kind)}>Continue <b>${esc(clip(cont.title, 40))}</b><span class="rs-go">→</span></a>` : ''}
  <h1 class="s-h rise" style="--i:1" id="startH" tabindex="-1">Learn about anything</h1>
  <form class="composer rise" style="--i:2" id="seedForm" autocomplete="off">
    <div class="cbox beam" id="seedBox">
      <textarea id="seedIn" rows="1" maxlength="160" aria-labelledby="startH" placeholder="A topic, question, or idea…" enterkeyhint="go"></textarea>
      <div class="ctools">
        <details class="voice cvoice"><summary class="ctool"${tipAttrs('Voice')}>${ic('voice')}</summary><div class="pop voice-pop"></div></details>
        <span id="seedChips">${voiceChipHTML()}</span>
        <button class="ckey" type="button" id="seedKey" data-act="keys">${seedKeyHTML()}</button>
        <button class="send" type="button" id="seedGo" data-mode="dice" data-act="surprise"${tipAttrs('Surprise me')}><span class="sw" data-icon="dice">${ic('dice')}</span><span class="sw" data-icon="go">${ic('send')}</span></button>
      </div>
      <span class="beam-bloom" aria-hidden="true"></span>
    </div>
    <p class="seed-err" id="seedErr" aria-live="polite"></p>
  </form>
  <div class="presets rise" style="--i:3" role="group" aria-label="Or start with one of these">
    <div class="pr-list" id="presetList">${doors.map(doorHTML).join('')}</div>
    <button class="pr-shuf" type="button" data-act="shuffle"${tipAttrs('Show other topics')}>${ic('shuffle')}</button>
  </div>
  <div id="statusSlot" class="rise" style="--i:4">${trialLine()}</div>
</section>
${frontShellHTML()}
<footer class="land-foot"><p class="lf-mark">dorkhub</p><p class="credit">Every page is written by AI for its topic, and pages can contain mistakes, so check anything you plan to repeat. Your world stays in this browser, and nothing you read is tracked. <a href="/licenses.txt">Credits</a></p></footer>`;
}
/* the beam only runs while someone can see it */
let BEAM_IO = null;
function watchBeam() {
  const box = $('#seedBox'); if (!box || typeof IntersectionObserver !== 'function') return;
  BEAM_IO = new IntersectionObserver(([e]) => box.toggleAttribute('data-paused', !e.isIntersecting)); BEAM_IO.observe(box);
}
/* with a mouse, the caret is already waiting in the composer; a phone keeps its keyboard down until asked */
function startLanding() { watchBeam(); renderVoice(); renderKeyBtn(); syncSend(); loadFront().then(() => { if (VIEW === 'home') renderFront(); }); if (matchMedia('(hover: hover) and (pointer: fine)').matches) $('#seedIn')?.focus({ preventScroll: true }); }
function stopLanding() { if (BEAM_IO) { BEAM_IO.disconnect(); BEAM_IO = null; } stopStage(); FX_STOP.splice(0).forEach(f => f()); for (const m of [THREADMAP, WORLDCARD]) if (m) m.destroy(); THREADMAP = WORLDCARD = null; }
document.addEventListener('input', e => { if (e.target.id !== 'seedIn') return; growSeed(); syncSend(); const err = $('#seedErr'); if (err && err.textContent) err.textContent = ''; });
/* Enter starts reading, Shift+Enter breaks the line, and a word mid-composition (an IME) is left alone */
document.addEventListener('keydown', e => { if (e.target.id === 'seedIn' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#seedForm')?.requestSubmit(); } });

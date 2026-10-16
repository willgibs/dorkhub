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
   Each card is its own piece (lib/front.js): a visual that leads into one topic, its hook, and its
   title, which links to the page. Between the two groups of cards, a map of every planned topic and
   the threads that tie them, labelled when you point at one. A reader's own world takes the last slot. */
let FRONTD = null, FRONTP = null, THREADMAP = null, WORLDCARD = null; const THREAD_POS = new Map();
/* the cards' look comes with them: only the front page loads /front.css, so reading pages never carry it */
const frontCss = () => new Promise(done => { if ($('#frontCss')) { done(); return; } const l = document.createElement('link'); l.id = 'frontCss'; l.rel = 'stylesheet'; l.href = '/front.css'; l.onload = l.onerror = () => done(); document.head.appendChild(l); });
function loadFront() {
  FRONTP = FRONTP || Promise.all([fetch('/front.json').then(r => (r.ok ? r.json() : null)), frontCss()]).then(([j]) => (FRONTD = j && Array.isArray(j.cards) ? j : { cards: [], threads: [] }), () => { FRONTP = null; return null; });
  return FRONTP;
}
const slugOfCard = t => topicKey(t).replace(/[^a-z0-9]+/g, '-');
/* a card tells its story once a visit, when it first comes into view; without motion every card shows finished */
const PLAYED = new Set(); const LIVE = new Set(['flytrap', 'enigma']);
const motionOK = () => !reducedMotion() && typeof IntersectionObserver === 'function';
function wayHTML(c, i) {
  const href = routeOf({ title: c.t, lens: 'encyclopedic', q: asksQuestion(c.t), ctx: '', bridge: null });
  const slug = slugOfCard(c.t), live = LIVE.has(c.fx); const go = `href="${esc(href)}" data-way="${esc(c.t)}" data-fk="${esc(c.k)}" data-h="${esc(c.hook)}"`;
  /* every card opens its page from the arrow in its corner; one without controls of its own opens from anywhere on it */
  const open = live ? `<a class="wc-open" ${go}${tipAttrs('Open the page')}>${ic('arrow')}</a>` : `<span class="wc-open" aria-hidden="true">${ic('arrow')}</span>`;
  return `<article class="wc wc-${c.size}${c.tab ? ` wc-tab-${c.tab}` : ''}${live ? ' wc-live' : ''}${motionOK() && !PLAYED.has(slug) ? ' armed' : ''}" data-card="${slug}"${kattr(c.k)}${c.fx ? ` data-fx="${c.fx}"` : ''} style="--i:${i}">
  <div class="wc-art">${c.art}</div>
  <div class="wc-txt"><p class="wc-meta"><span class="wc-n">${String(i + 1).padStart(2, '0')}</span><span class="kind"${kattr(c.k)}>${esc(capFirst(c.k))}</span></p><h3 class="wc-t"><a ${go}>${esc(c.t)}</a></h3><p class="wc-h">${esc(c.hook)}</p>${c.more || ''}${c.credit ? `<p class="wc-cr">${esc(c.credit)}</p>` : ''}</div>
  ${open}
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
  A.innerHTML = cards.slice(0, split).map(wayHTML).join('');
  B.innerHTML = later.map((c, j) => wayHTML(c, split + j)).join('') + (mine ? worldCardHTML(last) : '');
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
  THREADMAP = makeGraph($('#threadStage'), { still: true, positions: THREAD_POS, panel, open: n => openTopic(n.title, { via: 'start', hint: { gloss: n.hook, kind: n.kind } }) });
  THREADMAP.setData({ nodes, edges });
}
/* a reader's world, in the last slot: the neighbourhood of the last page read, and what they read lately */
function worldCardHTML(slot) {
  const seen = new Set(); const read = Object.values(store.pages).filter(p => p.status === 'done' || p.status === 'partial').sort((a, b) => b.last - a.last).filter(p => { const k = nodeKeyOf(p); if (seen.has(k)) return false; seen.add(k); return true; });
  const n = worldCount();
  return `<article class="wc wc-${slot.size}${slot.tab ? ` wc-tab-${slot.tab}` : ''} wc-world wc-live"><div class="wc-art"><div class="ww-stage" id="worldStage"></div></div><div class="wc-txt"><p class="wc-meta"><span class="wc-n">YOU</span></p><h3 class="wc-t"><a href="/world">Your world</a></h3><p class="wc-h"><b>${n}</b> topic${n === 1 ? '' : 's'} read · <b>${oneClickAway()}</b> one click away</p><ul class="ww-list">${read.slice(0, 3).map(p => `<li><a href="${esc(routeOf(p.req))}" data-goto="${esc(p.id)}"${kattr(p.kind || (p.hint && p.hint.kind))}>${esc(clip(p.title, 34))}</a></li>`).join('')}</ul></div><a class="wc-open" href="/world"${tipAttrs('Open Your world')}>${ic('arrow')}</a></article>`;
}
function mountWorldCard() {
  const host = $('#worldStage'); if (!host) return; if (WORLDCARD) WORLDCARD.destroy();
  const full = worldGraph(); const last = pageOf(store.current);
  const start = last && (last.status === 'done' || last.status === 'partial') ? nodeKeyOf(last) : (full.nodes.find(n => n.read) || {}).key || '';
  WORLDCARD = makeGraph(host, { mini: true, still: true, positions: MINI_POS });
  WORLDCARD.setData(start ? localGraph(full, start, 24, 6) : { nodes: [], edges: [] }, { center: start });
}
/* ---------- the cards that do something: each tells its story when first seen; a cube's count rolls in, a
   flytrap counts, an Enigma types, a clock drifts, and charts read out what you point at ---------- */
let FX_IO = null; const FX_STOP = [];
function startFx() {
  if (FX_IO) FX_IO.disconnect(); FX_STOP.splice(0).forEach(f => f());
  const cards = $$('#ways .wc');
  const seen = el => { el.classList.add('seen'); PLAYED.add(el.dataset.card || ''); const n = $('[data-fx="odometer"]', el); if (n && !n.dataset.done) odometer(n); if (el.dataset.fx === 'enigma') enigmaDemo(el); };
  if (!motionOK()) cards.forEach(el => el.classList.add('seen'));
  else { FX_IO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { seen(/** @type {HTMLElement} */ (e.target)); FX_IO.unobserve(e.target); } }), { threshold: .35 }); cards.forEach(el => (el.classList.contains('armed') ? FX_IO.observe(el) : el.classList.add('seen'))); }
  $$('.wc[data-fx="flytrap"]').forEach(flytrapFx); $$('.wc[data-fx="enigma"]').forEach(enigmaFx); $$('.wc[data-fx="ticker"]').forEach(tickerFx);
  cards.forEach(el => { if ($('[data-read]', el)) readoutFx(el); });
}
/* a chart answers the pointer: whatever part carries a reading shows it in the card's line for it. The card's
   link lies over the drawing, so the parts are found by position rather than by events of their own */
function readoutFx(card) {
  const out = $('.wc-read', card); if (!out || card.dataset.reads) return; card.dataset.reads = '1';
  const rest = out.innerHTML; let on = null;
  const show = hit => { if (hit === on) return; if (on) on.classList.remove('on'); on = hit; if (on) on.classList.add('on'); card.classList.toggle('reading', !!on); out.innerHTML = on ? esc(on.dataset.read) : rest; };
  card.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; show(document.elementsFromPoint(e.clientX, e.clientY).find(el => el.dataset && el.dataset.read && card.contains(el)) || null); });
  card.addEventListener('pointerleave', () => show(null));
}
/* Time travel: how far an uncorrected satellite clock and your map would have drifted since this page opened
   (38.6 µs and about 11.4 km a day), counted only while the card is on screen */
function tickerFx(card) {
  const ns = $('.tt-ns', card), m = $('.tt-m', card); if (!ns || !m) return;
  const dot = n => n.toFixed(1).replace('.', '<i>.</i>');
  const tick = () => { const s = performance.now() / 1000; ns.innerHTML = `+${dot(s * 38600 / 86400)}`; m.innerHTML = dot(s * 11400 / 86400); };
  tick(); if (typeof IntersectionObserver !== 'function') return; let t = 0;
  const io = new IntersectionObserver(([e]) => { clearInterval(t); if (e.isIntersecting) { tick(); t = setInterval(tick, 200); } }); io.observe(card);
  FX_STOP.push(() => { io.disconnect(); clearInterval(t); });
}
/* the cube's number rolls in, digit by digit, like a slot machine settling from the left */
function odometer(el) {
  el.dataset.done = '1'; const text = el.textContent; let k = 0;
  el.innerHTML = [...text].map(ch => (/\d/.test(ch) ? `<span class="od" style="--d:${ch};--k:${k++}"><span>0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9</span></span>` : esc(ch) + (ch === ',' ? '<wbr>' : ''))).join('');
  el.setAttribute('aria-label', text); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('rolled')));
}
/* a flytrap you can touch: one touch it remembers for 20 seconds, a second shuts it, five start digestion. The
   meter under it counts, marked where it shuts and where it starts to digest */
function flytrapFx(card) {
  const art = $('.wc-art', card); if (!art || art.dataset.wired) return; art.dataset.wired = '1';
  art.insertAdjacentHTML('beforeend', `<button class="ft-btn" type="button" aria-label="Touch a trigger hair"></button><div class="ft-meter" aria-live="polite"><b class="ft-c">0</b><span class="ft-s">Touch a hair</span><ol class="ft-steps">${[1, 2, 3, 4, 5].map(i => `<li${i === 2 ? ' data-l="Shuts"' : i === 5 ? ' data-l="Digests"' : ''}><i></i></li>`).join('')}</ol></div>`);
  let n = 0, armed = 0, timer = 0, rest = 0; const steps = $$('.ft-steps li', art);
  const say = (c, t) => { $('.ft-c', art).textContent = c; $('.ft-s', art).textContent = t; steps.forEach((s, i) => s.classList.toggle('on', i < +c)); };
  const reset = () => { n = 0; armed = 0; card.dataset.state = ''; say('0', 'Touch a hair'); };
  $('.ft-btn', art).addEventListener('click', () => {
    clearTimeout(rest); const now = Date.now(); if (armed && now - armed > 20000 && n < 2) n = 0;
    n = Math.min(n + 1, 5); card.classList.remove('zap'); void card.offsetWidth; card.classList.add('zap');
    if (n === 1) { armed = now; card.dataset.state = 'armed'; say('1', 'It remembers for 20 s'); clearTimeout(timer); timer = setTimeout(() => { if (n < 2) reset(); }, 20000); }
    else if (n < 5) { clearTimeout(timer); card.dataset.state = 'shut'; say(String(n), n === 2 ? 'Shut, in a tenth of a second' : `${5 - n} more to digest`); }
    else { card.dataset.state = 'digest'; say('5', 'Digesting'); }
    rest = setTimeout(reset, 9000);
  });
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
function stopLanding() { if (BEAM_IO) { BEAM_IO.disconnect(); BEAM_IO = null; } if (FX_IO) { FX_IO.disconnect(); FX_IO = null; } FX_STOP.splice(0).forEach(f => f()); for (const m of [THREADMAP, WORLDCARD]) if (m) m.destroy(); THREADMAP = WORLDCARD = null; }
document.addEventListener('input', e => { if (e.target.id !== 'seedIn') return; growSeed(); syncSend(); const err = $('#seedErr'); if (err && err.textContent) err.textContent = ''; });
/* Enter starts reading, Shift+Enter breaks the line, and a word mid-composition (an IME) is left alone */
document.addEventListener('keydown', e => { if (e.target.id === 'seedIn' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#seedForm')?.requestSubmit(); } });

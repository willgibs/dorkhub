/* ================= the front page: one composer to start from, and ways in below it =================
   Its job is to get a visitor into their first page. The suggestions under the composer and the cards
   below it lead into the topics planned as pages written ahead of time, chosen and drawn by hand
   (lib/front.js; the build puts the list in FRONT and the cards in /front.json). Surprise me, and the
   doors a paused or used-up page offers, open only pages already written: free and instant. */
const DOORS = [
  { t: 'The Carrington Event', h: 'The 1859 solar storm that set telegraph offices sparking.', k: 'event' },
  { t: 'Tardigrades', h: 'Animals that survive freezing, boiling and the vacuum of space.', k: 'thing' },
  { t: 'Whale falls', h: 'One dead whale can feed a deep-sea ecosystem for decades.', k: 'phenomenon' },
  { t: 'The Antikythera mechanism', h: 'A 2,000-year-old Greek computer, found in a shipwreck.', k: 'thing' },
  { t: 'The Voynich manuscript', h: 'A 600-year-old book that nobody can read.', k: 'mystery' },
  { t: 'Umami', h: 'The fifth taste, first identified in a bowl of seaweed broth.', k: 'concept' },
  { t: 'Why is ice slippery?', h: 'Physicists have argued about it since Michael Faraday.', k: 'mystery' },
  { t: 'The Great Emu War', h: 'In 1932 Australia sent machine guns after emus. The emus won.', k: 'event' },
  { t: 'Kessler syndrome', h: 'How one collision could lock us out of orbit for generations.', k: 'phenomenon' },
  { t: 'Fresnel lenses', h: 'How lighthouses folded a giant lens into rings of glass.', k: 'mechanism' },
  { t: 'Tulip mania', h: 'The 1630s bubble where a single bulb reportedly cost a house.', k: 'event' },
  { t: 'Bioluminescence', h: 'Most animals in the deep ocean make their own light.', k: 'phenomenon' },
];
/* Surprise me opens a page that isn't on screen: written ahead of time, so it's free, instant and checked */
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
function loadFront() {
  FRONTP = FRONTP || fetch('/front.json').then(r => (r.ok ? r.json() : null)).then(j => (FRONTD = j && Array.isArray(j.cards) ? j : { cards: [], threads: [] }), () => { FRONTP = null; return null; });
  return FRONTP;
}
const slugOfCard = t => topicKey(t).replace(/[^a-z0-9]+/g, '-');
function wayHTML(c, i) {
  const href = routeOf({ title: c.t, lens: 'encyclopedic', q: asksQuestion(c.t), ctx: '', bridge: null });
  const live = c.fx === 'flytrap' || c.fx === 'enigma'; const go = `href="${esc(href)}" data-way="${esc(c.t)}" data-fk="${esc(c.k)}" data-h="${esc(c.hook)}"`;
  return `<article class="wc wc-${c.size}${c.tab ? ` wc-tab-${c.tab}` : ''}${live ? ' wc-live' : ''}" data-card="${slugOfCard(c.t)}"${kattr(c.k)}${c.fx ? ` data-fx="${c.fx}"` : ''} style="--i:${i}">
  <div class="wc-art">${c.art}</div>
  <div class="wc-txt"><p class="wc-meta"><span class="wc-n">${String(i + 1).padStart(2, '0')}</span><span class="kind"${kattr(c.k)}>${esc(capFirst(c.k))}</span></p><h3 class="wc-t"><a ${go}>${esc(c.t)}</a></h3><p class="wc-h">${esc(c.hook)}</p>${c.more || ''}${c.credit ? `<p class="wc-cr">${esc(c.credit)}</p>` : ''}${live ? `<a class="wc-go" ${go}>Open the page ${ic('right')}</a>` : ''}</div>
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
  return `<article class="wc wc-${slot.size}${slot.tab ? ` wc-tab-${slot.tab}` : ''} wc-world wc-live"><div class="wc-art"><div class="ww-stage" id="worldStage"></div></div><div class="wc-txt"><p class="wc-meta"><span class="wc-n">YOU</span></p><h3 class="wc-t"><a href="/world">Your world</a></h3><p class="wc-h"><b>${n}</b> topic${n === 1 ? '' : 's'} read · <b>${oneClickAway()}</b> one click away</p><ul class="ww-list">${read.slice(0, 3).map(p => `<li><a href="${esc(routeOf(p.req))}" data-goto="${esc(p.id)}"${kattr(p.kind || (p.hint && p.hint.kind))}>${esc(clip(p.title, 34))}</a></li>`).join('')}</ul></div></article>`;
}
function mountWorldCard() {
  const host = $('#worldStage'); if (!host) return; if (WORLDCARD) WORLDCARD.destroy();
  const full = worldGraph(); const last = pageOf(store.current);
  const start = last && (last.status === 'done' || last.status === 'partial') ? nodeKeyOf(last) : (full.nodes.find(n => n.read) || {}).key || '';
  WORLDCARD = makeGraph(host, { mini: true, still: true, positions: MINI_POS });
  WORLDCARD.setData(start ? localGraph(full, start, 24, 6) : { nodes: [], edges: [] }, { center: start });
}
/* ---------- the cards that do something: a cube's count rolls in, a flytrap counts, an Enigma types ---------- */
let FX_IO = null;
function startFx() {
  if (FX_IO) FX_IO.disconnect();
  const seen = el => { el.classList.add('seen'); const n = $('[data-fx="odometer"]', el); if (n && !n.dataset.done) odometer(n); };
  if (typeof IntersectionObserver !== 'function' || reducedMotion()) $$('.wc').forEach(el => { el.classList.add('seen', 'still'); });
  else { FX_IO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { seen(e.target); FX_IO.unobserve(e.target); } }), { threshold: .35 }); $$('.wc').forEach(el => FX_IO.observe(el)); }
  $$('.wc[data-fx="flytrap"]').forEach(flytrapFx); $$('.wc[data-fx="enigma"]').forEach(enigmaFx);
}
/* the cube's number rolls in, digit by digit, like a slot machine settling from the left */
function odometer(el) {
  el.dataset.done = '1'; const text = el.textContent; let k = 0;
  el.innerHTML = [...text].map(ch => (/\d/.test(ch) ? `<span class="od" style="--d:${ch};--k:${k++}"><span>0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9</span></span>` : esc(ch) + (ch === ',' ? '<wbr>' : ''))).join('');
  el.setAttribute('aria-label', text); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('rolled')));
}
/* a flytrap you can touch: one touch it remembers for 20 seconds, a second shuts it, five start digestion */
function flytrapFx(card) {
  const art = $('.wc-art', card); if (!art || art.dataset.wired) return; art.dataset.wired = '1';
  art.insertAdjacentHTML('beforeend', `<button class="ft-btn" type="button" aria-label="Touch a trigger hair"></button><p class="ft-read" aria-live="polite"><span class="ft-c">0</span><span class="ft-s">Touch a hair</span><i class="ft-bar"></i></p>`);
  let n = 0, armed = 0, timer = 0, rest = 0; const say = (c, t) => { $('.ft-c', art).textContent = c; $('.ft-s', art).textContent = t; };
  const reset = () => { n = 0; armed = 0; card.dataset.state = ''; say('0', 'Touch a hair'); };
  $('.ft-btn', art).addEventListener('click', () => {
    clearTimeout(rest); const now = Date.now(); if (armed && now - armed > 20000 && n < 2) n = 0;
    n = Math.min(n + 1, 5); card.classList.remove('zap'); void card.offsetWidth; card.classList.add('zap');
    if (n === 1) { armed = now; card.dataset.state = 'armed'; say('1', 'It remembers for 20 s'); clearTimeout(timer); timer = setTimeout(() => { if (n < 2) reset(); }, 20000); }
    else if (n < 5) { clearTimeout(timer); card.dataset.state = 'shut'; say(String(n), n === 2 ? 'Shut. Keep going' : `${5 - n} more to digest`); }
    else { card.dataset.state = 'digest'; say('5', 'Digesting'); }
    rest = setTimeout(reset, 9000);
  });
}
/* an Enigma you can type into: rotors I, II, III and reflector B from AAA. The lamp your last letter
   becomes lights, and the tape below pairs every letter with its lamp: no letter ever lights itself */
function enigmaFx(card) {
  const input = $('.en-in input', card); if (!input || input.dataset.wired) return; input.dataset.wired = '1';
  const pl = $('.en-pl', card), cy = $('.en-cy', card), lamps = new Map($$('.en-lamps i', card).map(i => [i.dataset.l, i]));
  input.addEventListener('input', () => {
    const plain = input.value.toUpperCase().replace(/[^A-Z]/g, ''); const { out, pos } = enigma(plain, 'AAA');
    $$('.en-r span', card).forEach((s, i) => { s.textContent = pos[i]; });
    for (const l of lamps.values()) l.classList.remove('on');
    if (out) lamps.get(out[out.length - 1])?.classList.add('on');
    pl.innerHTML = [...plain].map(c => `<i>${c}</i>`).join(''); cy.innerHTML = [...out].map(c => `<i>${c}</i>`).join('');
  });
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
function stopLanding() { if (BEAM_IO) { BEAM_IO.disconnect(); BEAM_IO = null; } if (FX_IO) { FX_IO.disconnect(); FX_IO = null; } for (const m of [THREADMAP, WORLDCARD]) if (m) m.destroy(); THREADMAP = WORLDCARD = null; }
document.addEventListener('input', e => { if (e.target.id !== 'seedIn') return; growSeed(); syncSend(); const err = $('#seedErr'); if (err && err.textContent) err.textContent = ''; });
/* Enter starts reading, Shift+Enter breaks the line, and a word mid-composition (an IME) is left alone */
document.addEventListener('keydown', e => { if (e.target.id === 'seedIn' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#seedForm')?.requestSubmit(); } });

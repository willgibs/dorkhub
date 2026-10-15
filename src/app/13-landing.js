/* ================= the front page: one composer to start from, and today's pages below it =================
   Its job is to get a visitor into their first page. The topics below the composer were written
   ahead of time, so a click on one opens at once and costs nothing, even while free pages are paused. */
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
const doorHTML = (d, today) => `<button class="door${today ? ' today' : ''}" type="button" data-seed="${esc(d.t)}" data-tip="${today ? 'Today’s topic. ' : ''}${esc(d.h)}">${esc(d.t)}</button>`;
/* the presets re-roll as a set: the shown ones step back quickly, the new ones rise in a beat apart, and none repeats */
function shufflePresets() {
  const list = $('#presetList'); if (!list || list.dataset.busy) return;
  const shown = new Set($$('.door', list).map(b => b.dataset.seed));
  const pool = DOORS.filter(d => !shown.has(d.t)).sort(() => Math.random() - .5).slice(0, 4);
  const swap = () => { list.innerHTML = pool.map(d => doorHTML(d, false)).join(''); $$('.door', list).forEach((b, i) => b.style.setProperty('--i', String(i))); list.classList.remove('out'); list.classList.add('in'); };
  if (reducedMotion()) { swap(); return; }
  list.dataset.busy = '1'; list.classList.remove('in'); list.classList.add('out');
  setTimeout(() => { swap(); setTimeout(() => { delete list.dataset.busy; }, 600); }, 160);
}
/* ================= the feed: today's pages, written ahead of time =================
   Below the composer, cards that peek above the fold. Today's topic leads (the one the presets start
   with), the rest follow in the day's order, and shuffle deals them again. Every card opens a page that
   is already written: free, and at once. A card only says what its page says (lib/feed.js); the cards
   come from /feed.json, so reading pages never carry them. */
let FEED = null, FEEDP = null, FEED_SEED = 0, FEED_SEEN = false, FEEDMAP = null;
const FEED_POS = new Map();
/* days turn over at the reader's own midnight, with the date the feed shows */
const dayN = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
function loadFeed() {
  FEEDP = FEEDP || fetch('/feed.json').then(r => (r.ok ? r.json() : null)).then(j => (FEED = Array.isArray(j && j.topics) ? j.topics : []), () => { FEEDP = null; return []; });
  return FEEDP;
}
/* the day's order: the same for everyone all day (a seeded shuffle), today's topic first */
function dealFeed(seed) {
  let s = seed | 0; const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const all = FEED.slice(); for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const lead = seed === dayN() ? all.findIndex(f => f.t === DOORS[seed % DOORS.length].t) : -1;
  if (lead > 0) all.unshift(all.splice(lead, 1)[0]);
  return all.slice(0, 12);
}
/* each card shows its page one way: the lead with its picture, a big number, a myth put right, an open question, or a picture */
const feedFormat = (f, i, seed) => (i === 0 ? 'lead' : f.fig ? 'num' : f.myth ? 'myth' : (i + seed) % 3 === 0 || !f.pic ? 'q' : 'pic');
function feedCardHTML(f, i, seed, at) {
  const fmt = feedFormat(f, i, seed);
  const href = routeOf({ title: f.t, lens: 'encyclopedic', q: asksQuestion(f.t), ctx: '', bridge: null });
  const kind = `<span class="kind"${kattr(f.k)}>${esc(capFirst(f.k))}</span>`, title = `<b class="fc-t">${esc(f.t)}</b>`;
  const pic = f.pic ? `<span class="fc-img"><img src="${esc(f.pic.src)}" alt="" width="${+f.pic.w || 500}" height="${+f.pic.h || 375}"${i ? ' loading="lazy"' : ''} decoding="async"></span>` : '';
  const credit = f.pic && (f.pic.credit || f.pic.license) ? `<span class="fc-cr">${esc([f.pic.credit, f.pic.license].filter(Boolean).join(' · '))}</span>` : '';
  const from = `<span class="fc-from">${kind}${title}</span>`;
  const myth = f.myth ? `<span class="fc-m"><em>Myth</em><s>${esc(f.myth[0])}</s></span><span class="fc-m"><em>Actually</em>${esc(f.myth[1])}</span>` : '';
  /* the lead says one more thing its page says: the myth it puts right, its big number, or a question it leaves open */
  const more = myth || (f.fig ? `<span class="fc-n">${esc(f.fig[0])}</span><span class="fc-cap">${esc(capFirst(f.fig[1]))}</span>` : f.q.length ? `<span class="fc-m"><em>Still open</em>${esc(f.q[seed % f.q.length])}</span>` : '');
  const body = fmt === 'lead' ? `${pic}<span class="fc-body">${seed === dayN() ? '<span class="fc-eye">Today’s topic</span>' : ''}${kind}${title}<span class="fc-d">${esc(f.d)}</span>${more ? `<span class="fc-more">${more}</span>` : ''}${credit}</span>`
    : fmt === 'pic' ? `${pic}<span class="fc-body">${kind}${title}<span class="fc-h">${esc(f.h)}</span>${credit}</span>`
    : fmt === 'num' ? `<span class="fc-n">${esc(f.fig[0])}</span><span class="fc-cap">${esc(capFirst(f.fig[1]))}</span>${from}`
    : fmt === 'myth' ? `${myth}${from}`
    : `<span class="fc-qm" aria-hidden="true">?</span><span class="fc-qt">${esc(f.q[(seed + i) % f.q.length] || f.h)}</span>${from}`;
  return `<a class="fc fc-${fmt}" href="${esc(href)}" data-feed="${esc(f.t)}" data-fk="${esc(f.k)}" data-h="${esc(f.h)}"${kattr(f.k)} style="--i:${at}">${body}</a>`;
}
const feedShellHTML = () => `<section class="feed" id="feed" aria-labelledby="feedH">
  <header class="fd-top"><div><h2 class="fd-h" id="feedH">${esc(new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }))}</h2><p class="fd-sub">Written ahead of time, so they’re free and open at once.</p></div><button class="pr-shuf" type="button" data-act="feed-shuffle"${tipAttrs('Shuffle these')}>${ic('shuffle')}</button></header>
  <div class="fd-cards" id="feedA"></div>
  <div class="fd-world" id="feedWorld"></div>
  <div class="fd-cards" id="feedB"></div>
</section>`;
function renderFeed(anim) {
  const A = $('#feedA'), B = $('#feedB'); if (!A || !B || !FEED) return;
  if (!FEED.length) { $('#feed').hidden = true; return; }
  const list = dealFeed(FEED_SEED); const card = (f, i) => feedCardHTML(f, i, FEED_SEED, i < 6 ? i : i - 6);
  A.innerHTML = list.slice(0, 6).map(card).join(''); B.innerHTML = list.slice(6).map((f, j) => card(f, j + 6)).join('');
  for (const el of [A, B]) { el.classList.remove('out'); el.classList.toggle('in', !!anim); }
}
/* between the cards, a map: for someone new, these pages and where they lead; for a reader, their own world */
function renderFeedWorld() {
  const el = $('#feedWorld'); if (!el || el.dataset.built) return; el.dataset.built = '1';
  const mine = worldCount() > 0; el.classList.toggle('mine', mine);
  if (!mine) {
    const leads = new Set(FEED.flatMap(f => f.cards.map(c => topicKey(c[0])))); for (const f of FEED) leads.delete(topicKey(f.t));
    el.innerHTML = `<div class="fw-side"><h3 class="fw-h">A world of topics</h3><p class="fw-p">Every page here, and the topics each one opens onto. What you read becomes Your world.</p><p class="fw-stats"><b>${FEED.length}</b> pages · <b>${leads.size}</b> topics they lead to</p></div><div class="fw-stage" id="feedStage" role="img" aria-label="A map of these pages and the topics they lead to"></div>`;
  }
  else {
    const seen = new Set(); const read = Object.values(store.pages).filter(p => p.status === 'done' || p.status === 'partial').sort((a, b) => b.last - a.last).filter(p => { const k = nodeKeyOf(p); if (seen.has(k)) return false; seen.add(k); return true; });
    const saved = read.filter(p => p.saved).sort((a, b) => b.saved - a.saved); const n = worldCount();
    const row = p => `<li><a href="${esc(routeOf(p.req))}" data-goto="${esc(p.id)}"${kattr(p.kind || (p.hint && p.hint.kind))}>${esc(clip(p.title, 46))}</a></li>`;
    el.innerHTML = `<div class="fw-side"><h3 class="fw-h">Your world</h3><p class="fw-stats"><b>${n}</b> topic${n === 1 ? '' : 's'} read · <b>${oneClickAway()}</b> one click away</p><div class="fw-lists"><div><h4>Recently</h4><ul>${read.slice(0, 5).map(row).join('')}</ul></div>${saved.length ? `<div><h4>Saved</h4><ul>${saved.slice(0, 4).map(row).join('')}</ul></div>` : ''}</div><a class="fw-open" href="/world">Open Your world ${ic('right')}</a></div><div class="fw-stage" id="feedStage" role="img" aria-label="The topics you've read and where they lead"></div>`;
  }
  const host = $('#feedStage'); if (FEEDMAP) FEEDMAP.destroy();
  if (mine) {
    const full = worldGraph(); const last = pageOf(store.current);
    const start = last && (last.status === 'done' || last.status === 'partial') ? nodeKeyOf(last) : (full.nodes.find(n => n.read) || {}).key || '';
    FEEDMAP = makeGraph(host, { mini: true, still: true, positions: MINI_POS });
    FEEDMAP.setData(start ? localGraph(full, start, 48, 12) : { nodes: [], edges: [] }, { center: start });
    return;
  }
  /* these pages as if read, so they shine; what they lead to waits faintly around them */
  const pages = {};
  for (const f of FEED) { const req = { title: f.t, lens: 'encyclopedic', q: asksQuestion(f.t), ctx: '', bridge: null }; const id = pageId(req); pages[id] = { id, req, title: f.t, status: 'done', text: 'x', kind: f.k, first: 1, last: 1, links: f.cards.map(([t, k, h]) => [topicKey(t), t, k, h]) }; }
  const g = buildGraph(pages, [], { perPage: 6 }); const hook = new Map(FEED.map(f => [topicKey(f.t), f.h]));
  for (const n of g.nodes) if (n.read) n.hook = hook.get(n.key) || '';
  FEEDMAP = makeGraph(host, { still: true, positions: FEED_POS, describe: n => (n.read ? 'Ready to read' : 'One click away'), open: n => openTopic(n.title, { via: 'start', hint: n.kind || n.hook ? { gloss: n.hook, kind: n.kind } : null }) });
  FEEDMAP.setData(g);
}
/* shuffle deals the cards again: the shown ones step back quickly, the new ones rise in a beat apart */
function shuffleFeed() {
  const A = $('#feedA'), B = $('#feedB'); if (!A || !B || !FEED || !FEED.length || A.dataset.busy) return;
  let s; do s = Math.floor(Math.random() * 1e9); while (s === dayN()); FEED_SEED = s;
  if (reducedMotion()) { renderFeed(false); return; }
  A.dataset.busy = '1'; A.classList.add('out'); B.classList.add('out');
  setTimeout(() => { renderFeed(true); setTimeout(() => { delete A.dataset.busy; }, 600); }, 160);
}
function startFeed() {
  if (!FEED_SEED) FEED_SEED = dayN();
  loadFeed().then(() => { if (VIEW !== 'home') return; renderFeed(!FEED_SEEN && !reducedMotion()); FEED_SEEN = true; if (FEED && FEED.length) renderFeedWorld(); });
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
  const today = DOORS[dayN() % DOORS.length];
  const doors = [today, ...DOORS.filter(d => d !== today).sort(() => Math.random() - .5).slice(0, 3)];
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
    <div class="pr-list" id="presetList">${doors.map((d, i) => doorHTML(d, i === 0)).join('')}</div>
    <button class="pr-shuf" type="button" data-act="shuffle"${tipAttrs('Show other topics')}>${ic('shuffle')}</button>
  </div>
  <div id="statusSlot" class="rise" style="--i:4">${trialLine()}</div>
</section>
${feedShellHTML()}
<footer class="land-foot"><p class="lf-mark">dorkhub</p><p class="credit">Every page is written by AI for its topic, and pages can contain mistakes, so check anything you plan to repeat. Your world stays in this browser, and nothing you read is tracked. <a href="/licenses.txt">Credits</a></p></footer>`;
}
/* the beam only runs while someone can see it */
let BEAM_IO = null;
function watchBeam() {
  const box = $('#seedBox'); if (!box || typeof IntersectionObserver !== 'function') return;
  BEAM_IO = new IntersectionObserver(([e]) => box.toggleAttribute('data-paused', !e.isIntersecting)); BEAM_IO.observe(box);
}
/* with a mouse, the caret is already waiting in the composer; a phone keeps its keyboard down until asked */
function startLanding() { watchBeam(); renderVoice(); renderKeyBtn(); syncSend(); startFeed(); if (matchMedia('(hover: hover) and (pointer: fine)').matches) $('#seedIn')?.focus({ preventScroll: true }); }
function stopLanding() { if (BEAM_IO) { BEAM_IO.disconnect(); BEAM_IO = null; } if (FEEDMAP) { FEEDMAP.destroy(); FEEDMAP = null; } }
document.addEventListener('input', e => { if (e.target.id !== 'seedIn') return; growSeed(); syncSend(); const err = $('#seedErr'); if (err && err.textContent) err.textContent = ''; });
/* Enter starts reading, Shift+Enter breaks the line, and a word mid-composition (an IME) is left alone */
document.addEventListener('keydown', e => { if (e.target.id === 'seedIn' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#seedForm')?.requestSubmit(); } });

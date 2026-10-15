/* ================= the landing page ================= */
const CHAINS = [
  { lede: 'From a medieval cipher to the hexagons inside your brain', steps: ['Voynich manuscript', 'Radiocarbon dating', 'Bomb pulse', 'Adult neurogenesis', 'Hippocampus', 'Grid cells', 'Hexagonal lattices'] },
  { lede: 'From a 1630s market bubble to the bacteria that became part of you', steps: ['Tulip mania', 'Tulip breaking virus', 'Aphids', 'Buchnera', 'Endosymbiosis', 'Mitochondrial Eve'] },
  { lede: 'From a war Australia lost to birds, to the woman who mapped the ocean floor', steps: ['The Great Emu War', 'Ratites', 'Gondwana', 'Continental drift', 'Marie Tharp', 'Mid-Atlantic Ridge'] },
  { lede: 'From a question about skating to the atmosphere of 800,000 years ago', steps: ['Why is ice slippery?', 'Premelting', 'Michael Faraday', 'Regelation', 'Glaciers', 'Ice cores'] },
];
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
/* Surprise me opens a door that isn't on screen: written ahead of time, so it's free, instant and checked */
function surprise() {
  const shown = new Set($$('.door[data-seed]').map(b => b.dataset.seed));
  const pool = DOORS.filter(d => !shown.has(d.t));
  newWarren((pool[Math.floor(Math.random() * pool.length)] || DOORS[0]).t);
}
const doorHTML = (d, today) => `<button class="door${today ? ' today' : ''}" type="button" data-seed="${esc(d.t)}" data-kind="${d.k}" data-tip="${today ? 'Today’s rabbit hole. ' : ''}${esc(d.h)}"><i></i>${esc(d.t)}</button>`;
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
/* the voice chip: shown only when the next page won't be encyclopedic, and one click takes it back */
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
  const saved = store.warrens.filter(w => w.nodes[w.root]).sort((a, b) => (b.seenAt || b.updated) - (a.seenAt || a.updated));
  const last = saved[0]; const lastCur = last && (last.nodes[last.current] || last.nodes[last.root]);
  const day = Math.floor(Date.now() / 864e5); const today = DOORS[day % DOORS.length];
  const doors = [today, ...DOORS.filter(d => d !== today).sort(() => Math.random() - .5).slice(0, 3)];
  const legend = Object.entries(KIND_LABEL).map(([k, l]) => `<span data-kind="${k}"><i></i>${l}</span>`).join('');
  /* the first arrival of a visit rises in, line by line; coming back to it later doesn't replay that */
  const intro = !LANDED && !reducedMotion(); LANDED = true;
  return `<section class="hero${intro ? ' intro' : ''}" aria-labelledby="startH">
  ${last ? `<a class="resume rise" style="--i:0" href="#/w/${last.id}/${lastCur.id}" data-s="${stratumOf(lastCur.depth)}" data-tip="Level ${lastCur.depth}, on ${esc(clip(lastCur.title, 48))}"><span class="mk">${lastCur.depth}</span>Continue <b>${esc(clip(last.nodes[last.root].title, 40))}</b><span class="rs-go">→</span></a>` : ''}
  <h1 class="s-h rise" style="--i:1" id="startH" tabindex="-1">What do you want to learn?</h1>
  <form class="composer rise" style="--i:2" id="seedForm" autocomplete="off">
    <div class="cbox beam" id="seedBox">
      <textarea id="seedIn" rows="1" maxlength="160" aria-labelledby="startH" placeholder="A topic, a question, a half-remembered fact" enterkeyhint="go"></textarea>
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

<section class="land-sec intro-sec" aria-labelledby="introH">
  <div class="intro-l">
    <h2 id="introH" class="land-h">Get lost learning<span class="dot">.</span></h2>
    <p class="s-lede">An encyclopedia that writes itself around you. Start anywhere, and every link opens a page written for the path you took to reach it.</p>
  </div>
  <figure class="stage intro-r"><div class="demo" id="demo" aria-hidden="true"></div><figcaption class="stage-cap"><span>A demo of one rabbit hole, three pages deep.</span>${reducedMotion() ? '' : `<button class="tool ib" type="button" id="demoPause" data-act="demo-pause" aria-pressed="false"${tipAttrs('Pause the demo')}>${ic('pause')}</button>`}</figcaption></figure>
</section>

<section class="land-sec" aria-labelledby="goH">
  <h2 id="goH" class="land-h">Where rabbit holes go</h2>
  <ul class="chains">${CHAINS.slice(0, 3).map(c => `<li class="chain" data-seed="${esc(c.steps[0])}" role="button" tabindex="0"><p class="ch-l">${esc(c.lede)}</p><ol class="ch-dots">${c.steps.map((t, i) => `<li data-s="${stratumOf(i)}" style="--i:${i}"><i></i><span>${esc(t)}</span></li>`).join('')}</ol><span class="ch-go">Start at ${esc(c.steps[0])} →</span></li>`).join('')}</ul>
</section>

<section class="land-sec" aria-labelledby="howH">
  <h2 id="howH" class="land-h">How it works</h2>
  <ul class="ideas">
    <li><p class="klegend">${legend}</p><h3>Links you can read at a glance</h3><p>Every link is coloured by what it leads to, so you can see where it goes before you click.</p></li>
    <li><ol class="spectrum" aria-label="Eight levels, from Curious to Beyond">${LEVELS.map((l, i) => `<li data-s="${i}" title="${esc(l.name)}"><i></i></li>`).join('')}</ol><h3>The deeper you go, the nerdier it gets</h3><p>Eight levels, from Curious to Beyond, each with its own colour. Pages get more specific as you descend.</p></li>
    <li><p class="mini-bridge" data-s="1">From <u>Voynich manuscript</u>: here’s how a lab read a calf’s date of death from a page of parchment.</p><h3>Written for your path</h3><p>Every page opens by connecting to where you came from, so a rabbit hole reads like one story.</p></li>
  </ul>
</section>

${saved.length ? `<section class="land-sec saved" aria-labelledby="savedH"><h2 id="savedH" class="land-h">Your rabbit holes</h2><ul class="cards">${saved.slice(0, 6).map(w => {
    const ns = Object.values(w.nodes); const cur = w.nodes[w.current] || w.nodes[w.root]; const deep = Math.max(...ns.map(n => n.depth));
    return `<li><a href="#/w/${w.id}/${cur.id}">${esc(w.nodes[w.root].title)}</a><p class="card-path">${ns.slice(0, 12).map(n => `<i data-s="${stratumOf(n.depth)}"></i>`).join('')}</p><p>${ns.length} page${ns.length === 1 ? '' : 's'}, down to level ${deep}. ${relTime(w.seenAt || w.updated)}.</p><button class="del linkish" type="button" data-del="${w.id}">Delete</button></li>`;
  }).join('')}</ul></section>` : ''}
<footer class="land-foot"><p class="lf-mark">dorkhub</p><p class="credit">Pages are written live by AI for the path you take, and they can contain mistakes, so check anything you plan to repeat. Your rabbit holes stay in this browser, and nothing you read is tracked. <a href="/licenses.txt">Credits</a></p></footer>`;
}

/* ================= the hero demo: a scripted rabbit hole, nothing written live ================= */
const DEMO_PAGES = [
  { t: 'Voynich manuscript', deck: 'A 15th-century book in a script nobody has ever read.', bridge: ['Where it starts', 'A real object, a century of failed codebreakers, and doors into botany, astronomy and forgery.'],
    body: ['An illustrated codex of impossible plants, star charts and bathing figures, written in an ', ['alphabet no one has deciphered', '', 'mystery', 'Voynichese'], '. In 2009, ', ['radiocarbon dating', 'go', 'mechanism', 'Radiocarbon dating'], ' placed its vellum between 1404 and 1438, which only deepened the ', ['mystery of its author', '', 'mystery', 'Who wrote the Voynich manuscript?'], '.'],
    note: 'A 1665 letter claims an emperor paid 600 gold ducats for it.', hook: 'A clock hidden in every living thing that starts at death.' },
  { t: 'Radiocarbon dating', deck: 'The clock that starts ticking the moment something dies.', bridge: ['From Voynich manuscript', 'Here’s how a lab read a calf’s date of death from a page of parchment.'],
    body: ['Every living thing absorbs ', ['carbon-14', '', 'thing', 'Carbon-14'], ' from the air. When it dies, the clock starts: half of it decays every 5,730 years. Then Cold War bomb tests nearly doubled the carbon-14 in the atmosphere, a spike called the ', ['bomb pulse', '', 'phenomenon', 'Bomb pulse'], '.'],
    note: 'Libby’s method won the 1960 Nobel Prize in Chemistry.', next: 'Bomb pulse' },
  { t: 'Bomb pulse', deck: 'The moment humans broke the clock, and accidentally built a better one.', bridge: ['From Radiocarbon dating', 'The spike that ruined old dates turned into one of science’s sharpest timestamps.'],
    body: ['Nuclear tests in the 1950s and 60s left a timestamp in every living body. Scientists now use it to date ', ['cells in the human brain', '', 'thing', 'Adult neurogenesis'], ', ', ['tooth enamel', '', 'thing', 'Tooth enamel'], ' and ', ['seized elephant ivory', '', 'event', 'Ivory forensics'], '.'],
    note: 'It showed that some neurons in your hippocampus are younger than you are.' },
];
let DEMO_RUN = 0, DEMO_HOLD = null, DEMO_GO = null, DEMO_PAUSED = false, DEMO_SEEN = true, DEMO_IO = null;
/* waits, then waits out any pause; a demo that has been stopped throws instead of carrying on */
const dsleep = async (ms, run) => { await sleep(ms); while (DEMO_HOLD) await DEMO_HOLD; if (run !== DEMO_RUN) throw 'stop'; };
/* held while the reader has paused it or it is out of view, so it never runs where nobody is watching */
function holdDemo() {
  const on = DEMO_PAUSED || !DEMO_SEEN;
  if (on && !DEMO_HOLD) DEMO_HOLD = new Promise(res => { DEMO_GO = res; });
  else if (!on && DEMO_HOLD) { const go = DEMO_GO; DEMO_HOLD = DEMO_GO = null; go(); }
  $('#demo')?.classList.toggle('held', on);
}
function toggleDemo() {
  DEMO_PAUSED = !DEMO_PAUSED; holdDemo();
  const b = $('#demoPause'); if (!b) return; const label = DEMO_PAUSED ? 'Play the demo' : 'Pause the demo';
  b.setAttribute('aria-pressed', String(DEMO_PAUSED)); b.dataset.tip = label; b.setAttribute('aria-label', label); b.innerHTML = ic(DEMO_PAUSED ? 'play' : 'pause');
}
/* a window on a mat, with the path in its address bar: a picture of a page, not a second copy of the site */
function demoShell() {
  return `<div class="dm-win"><div class="dm-top"><span class="dm-dots"><i></i><i></i><i></i></span><span class="dm-url"><span class="dm-trail"></span></span></div>
<div class="dm-stage"><div class="dm-page"></div></div><div class="dm-card" hidden></div><button class="dm-pill" type="button" tabindex="-1" hidden></button><span class="dm-toast" hidden></span>
<svg class="dm-cursor" viewBox="0 0 16 20" width="16" height="20" aria-hidden="true"><path d="M1 1 L1 16 L5 12 L8 19 L10.5 18 L7.5 11 L13 11 Z" fill="#18181B" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg></div>`;
}
function demoPageHTML(p, lvl) {
  return `<p class="dm-where"><b>${lvl}</b>${esc(LEVELS[lvl].name)}</p><h3 class="dm-title">${esc(p.t)}</h3><p class="dm-deck">${esc(p.deck)}</p><div class="dm-bridge"><span>${esc(p.bridge[0])}</span>${esc(p.bridge[1])}</div><div class="dm-body"><p class="dm-p"></p><aside class="dm-note" hidden><span>aside</span>${esc(p.note)}</aside></div>`;
}
async function typeBody(el, tokens, run) {
  for (const tk of tokens) {
    let target = el, text = tk;
    if (Array.isArray(tk)) { target = document.createElement('span'); target.className = 'hole'; if (tk[1]) target.dataset.go = '1'; if (tk[2]) target.dataset.kind = tk[2]; el.appendChild(target); text = tk[0]; }
    const node = document.createTextNode(''); target.appendChild(node);
    for (let i = 0; i < text.length; i += 3) { node.data = text.slice(0, i + 3); await dsleep(16, run); }
  }
}
function moveCursor(cur, win, el, dx = .5, dy = .6) {
  const wr = win.getBoundingClientRect(); const r = el.getBoundingClientRect();
  cur.style.transform = `translate(${r.left - wr.left + r.width * dx}px, ${r.top - wr.top + r.height * dy}px)`;
}
async function heroDemo() {
  const host = $('#demo'); if (!host) return; const run = ++DEMO_RUN;
  host.innerHTML = demoShell();
  const win = $('.dm-win', host), stage = $('.dm-stage', host), trail = $('.dm-trail', host), card = $('.dm-card', host), pill = $('.dm-pill', host), toastEl = $('.dm-toast', host), cur = $('.dm-cursor', host);
  const setLevel = lvl => { win.dataset.s = lvl; };
  if (reducedMotion()) {
    const p = DEMO_PAGES[1]; setLevel(1); trail.textContent = 'Voynich manuscript › Radiocarbon dating';
    const page = $('.dm-page', stage); page.innerHTML = demoPageHTML(p, 1);
    $('.dm-p', page).innerHTML = p.body.map(t => Array.isArray(t) ? `<span class="hole"${t[2] ? ` data-kind="${t[2]}"` : ''}>${esc(t[0])}</span>` : esc(t)).join(''); $('.dm-note', page).hidden = false; cur.style.display = 'none'; return;
  }
  if (typeof IntersectionObserver === 'function') { DEMO_IO = new IntersectionObserver(([e]) => { DEMO_SEEN = e.isIntersecting; holdDemo(); }); DEMO_IO.observe(host); }
  try {
    for (;;) {
      cur.style.opacity = '0'; cur.style.transition = 'none'; cur.style.transform = 'translate(420px, 440px)';
      let page = $('.dm-page', stage); page.className = 'dm-page'; page.style.cssText = '';
      for (let lvl = 0; lvl < DEMO_PAGES.length; lvl++) {
        const p = DEMO_PAGES[lvl]; setLevel(lvl);
        trail.textContent = DEMO_PAGES.slice(0, lvl + 1).map(x => x.t).join(' › ');
        page.innerHTML = demoPageHTML(p, lvl); page.classList.add('in');
        await dsleep(450, run);
        await typeBody($('.dm-p', page), p.body, run);
        await dsleep(250, run); $('.dm-note', page).hidden = false;
        await dsleep(900, run);
        if (lvl === 0) {
          const link = $('[data-go]', page); cur.style.transition = 'transform .9s cubic-bezier(.3,.7,.2,1), opacity .3s'; cur.style.opacity = '1';
          moveCursor(cur, win, link); await dsleep(950, run);
          link.classList.add('v-on'); card.innerHTML = `<p class="hc-meta"><span class="kind" data-kind="mechanism">mechanism</span><span>Not read yet</span></p><p class="hc-title">Radiocarbon dating</p><p class="hc-hook">${esc(p.hook)}</p><span class="dm-cta">Open page ↵</span>`;
          card.style.visibility = 'hidden'; card.hidden = false;
          const wr = win.getBoundingClientRect(), lr = link.getBoundingClientRect(); const ch = card.offsetHeight;
          const below = lr.bottom - wr.top + 8; const top = below + ch > wr.height - 12 ? lr.top - wr.top - ch - 8 : below;
          card.style.left = `${Math.max(10, Math.min(lr.left - wr.left, wr.width - card.offsetWidth - 10))}px`; card.style.top = `${top}px`; card.style.visibility = '';
          await dsleep(1500, run);
          moveCursor(cur, win, $('.dm-cta', card)); await dsleep(900, run);
          cur.classList.add('click'); await dsleep(180, run); cur.classList.remove('click'); card.hidden = true;
          const title = $('.dm-title', page); const ghost = document.createElement('span'); ghost.className = 'dm-ghost'; ghost.textContent = link.textContent;
          const r1 = link.getBoundingClientRect(), r2 = title.getBoundingClientRect(), w0 = win.getBoundingClientRect();
          const fs = parseFloat(getComputedStyle(link).fontSize), k = parseFloat(getComputedStyle(title).fontSize) / fs;
          ghost.style.fontSize = `${fs}px`; ghost.style.left = `${r1.left - w0.left}px`; ghost.style.top = `${r1.top - w0.top}px`; win.appendChild(ghost);
          page.classList.add('out'); cur.style.opacity = '0';
          requestAnimationFrame(() => { ghost.style.transform = `translate(${r2.left - r1.left}px, ${r2.top - r1.top}px) scale(${k})`; ghost.style.color = 'var(--ink)'; });
          await dsleep(520, run); ghost.remove();
        } else if (lvl === 1) {
          pill.innerHTML = `<span class="un-dot"></span><span class="un-l">Up next</span><b>${esc(p.next)}</b><kbd>J</kbd>`; pill.dataset.s = 2; pill.hidden = false;
          await dsleep(500, run); cur.style.opacity = '1'; moveCursor(cur, win, pill, .6, .55); await dsleep(1000, run);
          cur.classList.add('click'); await dsleep(180, run); cur.classList.remove('click'); pill.hidden = true; cur.style.opacity = '0';
          page.classList.add('out'); await dsleep(380, run);
          toastEl.textContent = LEVEL_UP[2]; toastEl.hidden = false; setTimeout(() => { if (run === DEMO_RUN) toastEl.hidden = true; }, 2200);
        } else { await dsleep(3200, run); page.classList.add('out'); await dsleep(500, run); }
        page.className = 'dm-page';
      }
    }
  } catch (e) { /* stopped */ }
}
function stopDemo() { DEMO_RUN++; if (DEMO_IO) { DEMO_IO.disconnect(); DEMO_IO = null; } DEMO_PAUSED = false; DEMO_SEEN = true; holdDemo(); }
/* the beam only runs while someone can see it */
let BEAM_IO = null;
function watchBeam() {
  const box = $('#seedBox'); if (!box || typeof IntersectionObserver !== 'function') return;
  BEAM_IO = new IntersectionObserver(([e]) => box.toggleAttribute('data-paused', !e.isIntersecting)); BEAM_IO.observe(box);
}
/* with a mouse, the caret is already waiting in the composer; a phone keeps its keyboard down until asked */
function startLanding() { heroDemo(); watchBeam(); renderVoice(); renderKeyBtn(); syncSend(); if (matchMedia('(hover: hover) and (pointer: fine)').matches) $('#seedIn')?.focus({ preventScroll: true }); }
function stopLanding() { stopDemo(); if (BEAM_IO) { BEAM_IO.disconnect(); BEAM_IO = null; } }
document.addEventListener('input', e => { if (e.target.id !== 'seedIn') return; growSeed(); syncSend(); const err = $('#seedErr'); if (err && err.textContent) err.textContent = ''; });
/* Enter starts reading, Shift+Enter breaks the line, and a word mid-composition (an IME) is left alone */
document.addEventListener('keydown', e => { if (e.target.id === 'seedIn' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#seedForm')?.requestSubmit(); } });

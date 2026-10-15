/* ================= the front page: one composer to start from =================
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
  const day = Math.floor(Date.now() / 864e5); const today = DOORS[day % DOORS.length];
  const doors = [today, ...DOORS.filter(d => d !== today).sort(() => Math.random() - .5).slice(0, 3)];
  /* the first arrival of a visit rises in, line by line; coming back to it later doesn't replay that */
  const intro = !LANDED && !reducedMotion(); LANDED = true;
  return `<section class="hero${intro ? ' intro' : ''}" aria-labelledby="startH">
  ${cont ? `<a class="resume rise" style="--i:0" href="${esc(routeOf(cont.req))}" data-goto="${esc(cont.id)}"${kattr(cont.kind)}>Continue <b>${esc(clip(cont.title, 40))}</b><span class="rs-go">→</span></a>` : ''}
  <h1 class="s-h rise" style="--i:1" id="startH" tabindex="-1">Learn about anything</h1>
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
<footer class="land-foot"><p class="lf-mark">dorkhub</p><p class="credit">Every page is written by AI for its topic, and pages can contain mistakes, so check anything you plan to repeat. Your world stays in this browser, and nothing you read is tracked. <a href="/licenses.txt">Credits</a></p></footer>`;
}
/* the beam only runs while someone can see it */
let BEAM_IO = null;
function watchBeam() {
  const box = $('#seedBox'); if (!box || typeof IntersectionObserver !== 'function') return;
  BEAM_IO = new IntersectionObserver(([e]) => box.toggleAttribute('data-paused', !e.isIntersecting)); BEAM_IO.observe(box);
}
/* with a mouse, the caret is already waiting in the composer; a phone keeps its keyboard down until asked */
function startLanding() { watchBeam(); renderVoice(); renderKeyBtn(); syncSend(); if (matchMedia('(hover: hover) and (pointer: fine)').matches) $('#seedIn')?.focus({ preventScroll: true }); }
function stopLanding() { if (BEAM_IO) { BEAM_IO.disconnect(); BEAM_IO = null; } }
document.addEventListener('input', e => { if (e.target.id !== 'seedIn') return; growSeed(); syncSend(); const err = $('#seedErr'); if (err && err.textContent) err.textContent = ''; });
/* Enter starts reading, Shift+Enter breaks the line, and a word mid-composition (an IME) is left alone */
document.addEventListener('keydown', e => { if (e.target.id === 'seedIn' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#seedForm')?.requestSubmit(); } });

/* ================= the top bar: Your world, and how many topics are in it =================
   While you read, the only trace of your world growing is this count, its changed digits popping in
   (transitions.dev's Number pop-in). Nothing else on the page moves. */
let WCOUNT = -1;
function setDigits(group, str) {
  const prev = group.textContent.replace(/\s+/g, ''); let same = 0;
  while (same < prev.length && same < str.length && prev[same] === str[same]) same++;
  group.classList.remove('is-animating'); group.replaceChildren();
  [...str].forEach((c, i, a) => { const s = document.createElement('span'); s.className = 't-digit'; s.textContent = c; if (i < same) s.dataset.same = ''; if (i === a.length - 2) s.dataset.stagger = '1'; else if (i === a.length - 1 && a.length > 1) s.dataset.stagger = '2'; group.appendChild(s); });
  void group.offsetHeight; group.classList.add('is-animating');
}
function renderWorldBtn(bump) {
  const n = worldCount(); const b = $('#worldBtn'); if (!b) return;
  const label = n ? `Your world: ${n} topic${n === 1 ? '' : 's'}` : 'Your world';
  b.dataset.tip = label; b.setAttribute('aria-label', label);
  const g = $('.t-digit-group', b);
  if (n !== WCOUNT) { if (bump && WCOUNT >= 0 && n > WCOUNT && !reducedMotion()) setDigits(g, String(n)); else g.textContent = n ? String(n) : ''; WCOUNT = n; }
  g.hidden = !n;
}

/* ================= search or ask, from anywhere ================= */
const omni = $('#omni'), omniIn = $('#omniIn'), omniList = $('#omniList'); let OM = { items: [], i: 0 };
function openOmni(prefill = '') {
  hideCard(); closePMenu(); closeMenu();
  omniIn.value = prefill; renderOmni();
  if (!omni.open) omni.showModal();
  omniIn.focus(); omniIn.select();
}
/* every topic your pages mention, once, for finding things you've only met */
let MET = null;
function metTopics() {
  if (MET && MET.v === WV) return MET.list; const W = worldIndex(); const seen = new Map();
  for (const p of W.read.values()) for (const [k, name, kind, hook] of p.links || []) if (!W.read.has(k) && !seen.has(k)) seen.set(k, { k, name, kind, hook, n: (W.back.get(k) || []).length });
  MET = { v: WV, list: [...seen.values()] }; return MET.list;
}
const openPage = (p, via) => { if (p.id !== CUR) { addStep(store.trails, p.id, { from: CUR || null, via }); p.last = Date.now(); save(); } go(routeOf(p.req)); };
function omniItems(q) {
  const out = []; const cur = curPage(); const qq = q.trim(); const ql = qq.toLowerCase(); const W = worldIndex();
  if (qq) {
    out.push({ sec: 'Open', icon: '↵', title: `A page on <q>${esc(qq)}</q>`, hook: isQuestion(qq) ? 'Answered on its own page' : '', run: () => openTopic(qq, { via: 'search' }) });
    [...W.read.values()].filter(p => p.id !== CUR && p.title.toLowerCase().includes(ql)).sort((a, b) => b.last - a.last).slice(0, 5)
      .forEach(p => out.push({ sec: 'In your world', icon: '●', k: p.kind, title: esc(p.title), hook: p.deck ? esc(plain(p.deck)) : '', tag: relTime(p.last), run: () => openPage(p, 'search') }));
    metTopics().filter(e => e.name.toLowerCase().includes(ql) || (e.hook || '').toLowerCase().includes(ql)).sort((a, b) => b.n - a.n).slice(0, 5)
      .forEach(e => out.push({ sec: 'Mentioned on your pages', icon: '○', k: e.kind, title: esc(e.name), hook: esc(e.hook || ''), tag: e.kind || '', run: () => openTopic(e.name, { via: 'search', hint: { gloss: e.hook, kind: e.kind } }) }));
  } else {
    if (cur && cur.text) {
      const A = parsed(cur);
      cardsOf(A).forEach((c, i) => out.push({ sec: 'Keep exploring', icon: i + 1, k: c.kind, title: esc(c.label), hook: esc(plain(c.teaser || '')), run: () => openTopic(c.target, { via: 'card' }) }));
      A.questions.slice(0, 3).forEach(x => out.push({ sec: 'Open questions', icon: '?', k: 'mystery', title: esc(x), run: () => openTopic(x, { via: 'question', q: true }) }));
    }
    [...W.read.values()].filter(p => p.id !== CUR).sort((a, b) => b.last - a.last).slice(0, 4)
      .forEach(p => out.push({ sec: 'Recently read', icon: '●', k: p.kind, title: esc(p.title), hook: '', tag: relTime(p.last), run: () => openPage(p, 'search') }));
  }
  return out.slice(0, 16);
}
function renderOmni() {
  const items = omniItems(omniIn.value); OM = { items, i: 0 }; let h = '', sec = '';
  items.forEach((it, i) => {
    if (it.sec !== sec) { sec = it.sec; h += `<p class="om-sec">${esc(sec)}</p>`; }
    h += `<button class="om-i" type="button" role="option" id="om${i}" data-om="${i}" aria-selected="${i === 0}"${kattr(it.k)}><span class="oi">${it.icon}</span><span class="ot">${it.title}</span>${it.tag ? `<span class="od">${esc(String(it.tag))}</span>` : '<span></span>'}${it.hook ? `<span class="oh">${it.hook}</span>` : ''}</button>`;
  });
  omniList.innerHTML = h || `<p class="om-sec">Type anything: a question, a topic, a half-remembered fact.</p>`;
  if (items.length) omniIn.setAttribute('aria-activedescendant', 'om0'); else omniIn.removeAttribute('aria-activedescendant');
}
function moveOmni(dir) {
  if (!OM.items.length) return; OM.i = (OM.i + dir + OM.items.length) % OM.items.length;
  $$('.om-i', omniList).forEach((b, i) => b.setAttribute('aria-selected', String(i === OM.i)));
  const el = $(`#om${OM.i}`); if (el) { el.scrollIntoView({ block: 'nearest' }); omniIn.setAttribute('aria-activedescendant', el.id); }
}
function runOmni(i) { const it = OM.items[i]; if (!it) return; omni.close(); it.run(); }
omniIn.addEventListener('input', renderOmni);
omniIn.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveOmni(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveOmni(-1); }
  else if (e.key === 'Enter') { e.preventDefault(); runOmni(OM.i); }
});
omniList.addEventListener('click', e => { const b = e.target.closest('[data-om]'); if (b) runOmni(+b.dataset.om); });
omni.addEventListener('click', e => { if (e.target === omni) omni.close(); });
$('#omniBtn').addEventListener('click', () => openOmni());

/* ================= on a phone: a plain menu for occasional things =================
   Keys, voice, theme, export, shortcuts and a new topic: the things you reach for now and then.
   It grows from its button (transitions.dev's Menu dropdown) and closes faster than it opens. */
const menu = $('#menu'); const menuBtn = $('#menuBtn');
const THEMES = { system: ['system', 'Theme: same as your device'], light: ['sun', 'Theme: light'], dark: ['moon', 'Theme: dark'] };
const themeNow = () => (THEMES[store.settings.theme] ? store.settings.theme : 'system');
function renderMenu() {
  const k = auth.byok; const n = pagesLeft();
  menu.innerHTML = `<button class="mn-i" type="button" role="menuitem" data-mn="keys">${ic('key')}<span>Keys</span><em>${k ? esc(modelName(k.model).replace(/^Claude /, '')) : `${n} free`}</em></button>
<button class="mn-i" type="button" role="menuitem" data-mn="voice">${ic('voice')}<span>Voice</span><em>${esc(LENSES[store.settings.lens][0])}</em></button>
<button class="mn-i" type="button" role="menuitem" data-mn="theme">${ic(THEMES[themeNow()][0])}<span>Theme</span><em>${esc({ system: 'Device', light: 'Light', dark: 'Dark' }[themeNow()])}</em></button>
<button class="mn-i" type="button" role="menuitem" data-mn="export">${ic('download')}<span>Export this trail</span></button>
<button class="mn-i kb" type="button" role="menuitem" data-mn="help">${ic('help')}<span>Shortcuts</span></button>
<a class="mn-i" href="/" role="menuitem" data-mn="new">${ic('plus')}<span>New topic</span></a>`;
}
function openMenu() { renderMenu(); menu.hidden = false; menu.classList.remove('is-closing'); void menu.offsetWidth; menu.classList.add('is-open'); menuBtn.setAttribute('aria-expanded', 'true'); $('.mn-i', menu)?.focus({ preventScroll: true }); }
function closeMenu(refocus) {
  if (!menu.classList.contains('is-open')) return;
  menu.classList.remove('is-open'); menu.classList.add('is-closing'); menuBtn.setAttribute('aria-expanded', 'false');
  setTimeout(() => { menu.classList.remove('is-closing'); if (!menu.classList.contains('is-open')) menu.hidden = true; }, reducedMotion() ? 0 : 150);
  if (refocus) menuBtn.focus();
}
menuBtn.addEventListener('click', () => (menu.classList.contains('is-open') ? closeMenu() : openMenu()));
menu.addEventListener('click', e => {
  const b = e.target.closest('[data-mn]'); if (!b) return; const a = b.dataset.mn;
  if (a === 'theme') { cycleTheme(); renderMenu(); $('[data-mn="theme"]', menu)?.focus(); return; }
  closeMenu();
  if (a === 'keys') keysSheet();
  else if (a === 'voice') { openSheet('Voice', '<div class="voice-pop"></div>'); renderVoice(); }
  else if (a === 'export') exportTrail();
  else if (a === 'help') $('#help').showModal();
});
menu.addEventListener('keydown', e => {
  const items = $$('.mn-i', menu); const i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  else if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); closeMenu(true); }
});
document.addEventListener('click', e => { if (menu.classList.contains('is-open') && !menu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu(); });

/* ================= on a phone, the learning tools in one gooey button =================
   transitions.dev's Pro "Gooey plus menu", used under Will's licence and fitted to a corner: four
   droplets (search, Your world, save, around this) split from the button along an arc up and to the
   left, and merge back on close. The goo is an SVG filter over plain circles that mirror the buttons;
   the buttons above it stay crisp. Its four dots are the four things inside. */
const FAB_SAT = [['ask', 'search', 'Search or ask anything'], ['world', 'world', 'Your world'], ['save', 'star', 'Save this page'], ['land', 'around', 'Around this: the topics nearby']];
/* an arc of radius 104 from straight left to straight up: wide enough that open droplets stand apart */
const FAB_AT = FAB_SAT.map((_, i) => { const a = Math.PI - i * Math.PI / 6; return [Math.round(Math.cos(a) * 104), -Math.round(Math.sin(a) * 104)]; });
function fabHTML() {
  const off = i => ` style="--fx:${FAB_AT[i][0]}px;--fy:${FAB_AT[i][1]}px;--i:${i}"`;
  return `<svg class="fab-goo" viewBox="0 0 160 160" aria-hidden="true" focusable="false"><defs><filter id="fab-goo" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/><feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo"/><feComposite in="SourceGraphic" in2="goo" operator="atop" result="shape"/>
<feColorMatrix in="shape" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -29.5" result="ring-solid"/><feMorphology in="ring-solid" operator="dilate" radius="1" result="ring-a"/><feFlood class="fab-ring" result="ring-c"/><feComposite in="ring-c" in2="ring-a" operator="in" result="ring"/>
<feGaussianBlur in="shape" stdDeviation="3" result="s2-b"/><feOffset in="s2-b" dy="2" result="s2-o"/><feFlood class="fab-sh" result="s2-c"/><feComposite in="s2-c" in2="s2-o" operator="in" result="s2"/>
<feGaussianBlur in="shape" stdDeviation="14" result="s3-b"/><feOffset in="s3-b" dy="6" result="s3-o"/><feFlood class="fab-sh2" result="s3-c"/><feComposite in="s3-c" in2="s3-o" operator="in" result="s3"/>
<feMerge><feMergeNode in="s3"/><feMergeNode in="s2"/><feMergeNode in="ring"/><feMergeNode in="shape"/></feMerge></filter></defs>
<g filter="url(#fab-goo)">${FAB_SAT.map((_, i) => `<circle class="fab-blob" cx="132" cy="132" r="22"${off(i)}/>`).join('')}<circle class="fab-blob fab-blob-main" cx="132" cy="132" r="24"/></g></svg>
${FAB_SAT.map(([k, icon, label], i) => `<button class="fab-item" type="button" data-fab="${k}" aria-label="${esc(label)}" tabindex="-1"${off(i)}>${ic(icon)}</button>`).join('')}
<button class="fab-main" type="button" aria-expanded="false" aria-label="Open the tools"><span class="fab-sw" data-state="a"><span data-icon="a">${ic('dots')}</span><span data-icon="b">${ic('x')}</span></span></button>`;
}
const fab = document.createElement('div'); fab.className = 'fab'; fab.id = 'fab'; fab.dataset.open = 'false'; fab.innerHTML = fabHTML(); document.body.appendChild(fab);
let fabNudge = 0;
function setFab(open, refocus) {
  if ((fab.dataset.open === 'true') === open) return;
  if (open) syncFab();
  fab.dataset.open = String(open); const main = $('.fab-main', fab);
  main.setAttribute('aria-expanded', String(open)); main.setAttribute('aria-label', open ? 'Close the tools' : 'Open the tools');
  $('.fab-sw', fab).dataset.state = open ? 'b' : 'a';
  $$('.fab-item', fab).forEach(b => { b.tabIndex = open ? 0 : -1; });
  /* closing dips the button into the returning droplets' momentum, once; opening never bounces back */
  clearTimeout(fabNudge);
  if (!open) { fab.classList.add('nudge'); fabNudge = setTimeout(() => fab.classList.remove('nudge'), 750); if (refocus) main.focus(); }
}
/* the save droplet shows whether this page is saved; save and around wait for a finished page */
function syncFab() {
  const p = curPage(); const ready = !!p && p.status === 'done';
  const s = $('[data-fab="save"]', fab); s.classList.toggle('on', !!(p && p.saved)); s.setAttribute('aria-pressed', String(!!(p && p.saved))); s.setAttribute('aria-label', p && p.saved ? 'Saved. Tap to unsave' : 'Save this page'); s.disabled = !p || p.status === 'empty';
  $('[data-fab="land"]', fab).disabled = !ready;
}
fab.addEventListener('click', e => {
  if (e.target === fab) { setFab(false); return; } /* the scrim */
  if (e.target.closest('.fab-main')) { setFab(fab.dataset.open !== 'true'); return; }
  const it = e.target.closest('[data-fab]'); if (!it || it.disabled) return; setFab(false); const a = it.dataset.fab;
  if (a === 'ask') openOmni();
  else if (a === 'world') go('/world');
  else if (a === 'save') toggleSave(curPage());
  else if (a === 'land') landSheet(curPage());
});
document.addEventListener('click', e => { if (fab.dataset.open === 'true' && !fab.contains(e.target)) setFab(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && fab.dataset.open === 'true') setFab(false, true); });

/* ================= the theme switch: the top bar on every page, and the phone menu ================= */
function renderThemeBtn() {
  const b = $('#themeBtn'); if (!b) return; const t = themeNow();
  b.innerHTML = ic(THEMES[t][0]); b.dataset.tip = THEMES[t][1]; b.setAttribute('aria-label', `${THEMES[t][1]}. Change it`);
}
function cycleTheme() {
  const order = ['system', 'light', 'dark']; store.settings.theme = order[(order.indexOf(themeNow()) + 1) % order.length];
  if (store.settings.theme === 'system') delete store.settings.theme;
  save(true); applyTheme(); renderThemeBtn();
}
$('#themeBtn').addEventListener('click', cycleTheme);
renderThemeBtn();

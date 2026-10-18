/* ================= router: one view at a time, at a clean address =================
   /                the front page
   /world           Your world
   /<topic>         a page (?v= another voice, ?in= the sense of a name chosen on a page, ?q=1)
   /connect/<a>/<b> a connecting page
   #/w/<id>/<id>    an address from before Dorkhub had clean links: sent on to its page */
let VIEW = '', FIRST = true, GUARD = new Map();
const BOOT = Date.now();
function setView(v) {
  if (VIEW === 'world' && v !== 'world') leaveWorld();
  if (VIEW === 'home' && v !== 'home') stopLanding();
  if (VIEW === 'page' && v !== 'page') stopPlate();
  VIEW = v; document.body.classList.toggle('at-start', v === 'home'); document.body.classList.toggle('at-world', v === 'world'); document.body.classList.remove('titled');
}
function closeFloating() { hideSel(); hideCard(); closePMenu(); closeMenu(); stopListening(); setFab(false); if (sheet.open) sheet.close(); if (omni.open) omni.close(); }
function route() {
  closeFloating();
  const h = location.hash;
  if (h.startsWith('#/w/')) { const [, , wid, nid] = h.split('/'); const p = pageOf(store.legacy[wid] && store.legacy[wid][nid]); history.replaceState({ y: 0 }, '', p ? routeOf(p.req) : '/'); }
  else if (h === '#/' || h === '#') history.replaceState({ y: 0 }, '', '/');
  const r = parseRoute(location.pathname, location.search);
  if (r.view === 'page') showPage(r.input);
  else if (r.view === 'world') { setView('world'); CUR = ''; document.documentElement.dataset.accent = 'concept'; showWorld(); window.scrollTo(0, 0); renderWorldBtn(); updateProg(); }
  else { if (r.view === 'none') history.replaceState({ y: 0 }, '', '/'); showHome(); }
  FIRST = false;
}
function showHome() {
  setView('home'); CUR = ''; document.documentElement.dataset.accent = 'concept';
  $('#view').innerHTML = viewStart(); startLanding(); document.title = 'dorkhub: learn about anything';
  window.scrollTo(0, 0); updateProg(); renderWorldBtn();
}
const fromHere = () => { try { return !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) { return false; } };
function showPage(input) {
  const req = { ...input, lens: LENSES[input.lens] ? input.lens : 'encyclopedic' };
  const id = pageId(req); const known = !!store.pages[id] && !store.pages[id].guarded;
  const p = ensurePage(req);
  const arrived = CUR !== id; if (arrived && VIEW === 'page') stopPlate();
  setView('page'); CUR = id; store.current = id; ACC = null; PF.view = 0;
  $('#view').innerHTML = `<div class="column" id="column">${chamberHTML(p)}</div><p class="colfoot">Written by AI for this topic. It can make mistakes, so check anything you plan to repeat.</p>`;
  document.title = `${p.title}: dorkhub`;
  if (HERO) { const t = $('.a-title'); if (t) t.style.viewTransitionName = 'hero'; }
  if (PLATE) { const w = $('.a-plate .wc'); if (w) w.style.viewTransitionName = 'plate'; }
  paint(p); mountPlate(p); renderSide(); syncFab(); renderWorldBtn();
  window.scrollTo(0, (history.state && history.state.y) || 0); updateProg(); syncTopTitle();
  if (arrived && !FIRST) { const t = $('.a-title'); if (t) t.focus({ preventScroll: true }); }
  /* what to show: the page you have, one already written, or (for an address from outside) a choice */
  if (ACTIVE.has(p.id)) return;
  if (p.text && p.status !== 'empty') { if (p.seeded === 'placeholder' && !(history.state && history.state.y)) recheck(p); return; }
  const pf = PF.got.get(p.id); if (pf) { delete p.guarded; fill(p, pf.text, pf.seeded); return; }
  if (p.status === 'error') return;
  if ((p.status === 'done' || p.status === 'partial') && !p.text) { guard(p, 'cleared'); return; }
  if (OPENED.has(p.id) || known || (FIRST && fromHere())) { delete p.guarded; if (!OPENED.has(p.id)) { addStep(store.trails, p.id, { from: null, via: FIRST && fromHere() ? 'link' : 'start' }); OPENED.add(p.id); } generate(p); return; }
  p.guarded = true; guard(p, 'ask');
}
/* A placeholder is kept only until its page is written: opened again from the top, it asks for the page
   (free, and never a write), and takes the written one, or a newer placeholder, in its place. */
async function recheck(p) {
  try { const r = await write('page', pageInput(p), { cachedOnly: true }); if (CUR === p.id && !r.none && r.text && r.text !== p.text && !ACTIVE.has(p.id)) fill(p, r.text, r.seeded); }
  catch (e) { /* keep the placeholder */ }
}
/* A page arrived at from outside Dorkhub: free if it is already written, otherwise written only
   when the reader asks, so a shared link or a crawler never spends anything by itself. */
async function guard(p, why) {
  GUARD.set(p.id, 'checking'); paint(p);
  try { const r = await write('page', pageInput(p), { cachedOnly: true }); if (CUR !== p.id) return; if (!r.none && r.text) { GUARD.delete(p.id); delete p.guarded; addStep(store.trails, p.id, { from: null, via: 'start' }); OPENED.add(p.id); fill(p, r.text, r.seeded); return; } }
  catch (e) { /* offer the button anyway */ }
  if (CUR !== p.id) return;
  GUARD.set(p.id, why); paint(p);
}
function guardHTML(p) {
  const why = GUARD.get(p.id);
  if (why === 'checking') return `<p class="status-line" role="status"><span class="wait">${orbHTML('searching')}<span class="shim" data-text="Looking for this page">Looking for this page</span></span></p>`;
  const cost = auth.byok ? `It will be written with your ${esc(PROVIDERS[auth.byok.provider].name)} key.` : pagesLeft() > 0 ? `Writing it uses one of your ${pagesLeft()} free pages.` : 'You’ve read your free pages. Add your own key to write it.';
  return `<div class="guard"><p class="g-l">${why === 'cleared' ? 'This page was cleared from your browser to make room.' : 'This page hasn’t been written yet.'}</p><p class="g-f">${cost}</p><div class="sn-a">${!auth.byok && pagesLeft() <= 0 ? '<button class="btn glow" type="button" data-act="keys">Add a key</button>' : `<button class="btn glow" type="button" data-act="write-page">${why === 'cleared' ? 'Write it again' : 'Write this page'}</button>`}<a class="btn ghost" href="/">Start somewhere else</a></div></div>`;
}
function writeGuarded() {
  const p = curPage(); if (!p) return; GUARD.delete(p.id); delete p.guarded;
  if (!OPENED.has(p.id)) { addStep(store.trails, p.id, { from: null, via: 'start' }); OPENED.add(p.id); }
  p.last = Date.now(); generate(p);
}
addEventListener('popstate', () => { if (canVT() && VIEW === 'page') { try { quiet(document.startViewTransition(route)); return; } catch (e) { /* fall through */ } } route(); });
addEventListener('hashchange', () => { if (location.hash.startsWith('#/')) route(); });

/* ================= events ================= */
const plainClick = e => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0);
document.addEventListener('click', e => {
  const hole = e.target.closest('a.hole');
  if (hole) {
    if (!plainClick(e)) return; e.preventDefault();
    if (Date.now() - lastTouch < 700 && (!hc || hc.a !== hole)) { showCard(hole); return; }
    hideCard(); openTopic(hole.dataset.t, { via: 'link', src: hole }); return;
  }
  if (!e.target.closest('#hcard') && !hcard.hidden) hideCard();
  if (Date.now() - lastTouch < 700) tapPara(e.target);
  const pt = e.target.closest('.ptool'); if (pt) { if (pm && pm.btn === pt) closePMenu(); else openPMenu(pt); return; }
  if (!e.target.closest('#pmenu')) closePMenu();
  const card = e.target.closest('a.card[data-t]'); if (card) { if (!plainClick(e)) return; e.preventDefault(); openTopic(card.dataset.t, { via: 'card', src: $('.cd-t', card) }); return; }
  const q = e.target.closest('[data-q]'); if (q) { if (!plainClick(e)) return; e.preventDefault(); openTopic(q.dataset.q, { via: 'question', q: true, src: $('.rt', q) }); return; }
  const gt = e.target.closest('[data-goto]'); if (gt) { const p = pageOf(gt.dataset.goto); if (p && plainClick(e)) { e.preventDefault(); if (sheet.open) sheet.close(); openPage(p, gt.closest('.trail-list,.trails') ? 'trail' : gt.closest('.wpage') ? 'world' : gt.closest('.hero') ? 'start' : 'index'); } return; }
  const ld = e.target.closest('[data-land]'); if (ld) { if (!plainClick(e)) return; e.preventDefault(); const p = curPage(); const o = p && p.land && p.land[+ld.dataset.land]; if (o) { sheet.close(); openTopic(o.name, { via: 'around', hint: { gloss: o.relation, kind: o.kind } }); } return; }
  const sk = e.target.closest('[data-sk]'); if (sk) { openTopic(sk.dataset.sk, { via: 'sketch', src: $('b', sk), hint: sk.dataset.note ? { gloss: sk.dataset.note, kind: '' } : null }); return; }
  const qz = e.target.closest('[data-qz]'); if (qz) { const t = curTrail(); const R = t && t.recall; if (R && R.picked == null) { R.picked = +qz.dataset.qz; if (R.picked === R.qs[R.i].answer) R.score++; save(); renderQuiz(); } return; }
  if (!e.target.closest('.more')) $$('details.more[open]').forEach(d => { d.open = false; });
  const tab = e.target.closest('[data-tab]'); if (tab) { SIDE = tab.dataset.tab; renderSide(); return; }
  const ixs = e.target.closest('[data-ixsort]'); if (ixs) { IDXSORT = ixs.dataset.ixsort; renderIndex(); return; }
  const ixk = e.target.closest('[data-ixkind]'); if (ixk) { IDXKIND = IDXKIND === ixk.dataset.ixkind ? '' : ixk.dataset.ixkind; renderIndexList(); return; }
  const ix = e.target.closest('[data-ix]'); if (ix) { openIndexEntry(ix.dataset.ix); return; }
  const tr = e.target.closest('[data-trail]'); if (tr) { const t = store.trails.find(x => x.id === tr.dataset.trail); if (t) trailSheet(t); return; }
  const br = e.target.closest('[data-bridge]'); if (br) { makeBridge(br.dataset.bridge); return; }
  const gs = e.target.closest('[data-guess]');
  if (gs) { const p = curPage(); if (p) { p.reveals = { ...p.reveals, [gs.dataset.guess]: true }; save(); paint(p, true); const sec = secFor(p.id); const ans = sec && $(`.panel [data-k="a"] .pn-a`, sec); if (ans) { ans.tabIndex = -1; ans.focus({ preventScroll: true }); } } return; }
  const fold = e.target.closest('[data-fold]'); if (fold) { const p = curPage(); if (p && p.unfolds) { delete p.unfolds[fold.dataset.fold]; save(); paint(p); } return; }
  const pc = e.target.closest('[data-peek-close]'); if (pc) { const p = curPage(); const x = p && (p.peeks || []).find(y => y.key === pc.dataset.peekClose); if (x) { x.open = false; save(); paint(p); } return; }
  const pd = e.target.closest('[data-peek-dig]'); if (pd) { const p = curPage(); const x = p && (p.peeks || []).find(y => y.target === pd.dataset.peekDig); openTopic(pd.dataset.peekDig, { via: 'peek', hint: x && x.text ? { gloss: clip(plain(x.text), 120), kind: '' } : null }); return; }
  const wy = e.target.closest('a[data-way]'); if (wy) { if (!plainClick(e)) return; e.preventDefault(); openTopic(wy.dataset.way, { via: 'start', src: wy.closest('.wc-t') ? wy : null, plate: wy.closest('.wc[data-card]'), hint: { kind: wy.dataset.fk || '', gloss: wy.dataset.h || '' } }); return; }
  const seed = e.target.closest('[data-seed]'); if (seed) { openTopic(seed.dataset.seed, { via: 'start', src: seed.matches('.door') ? seed : null }); return; }
  /* any other address of ours opens here, without a reload */
  const a = e.target.closest('a[href^="/"]');
  if (a && plainClick(e) && !a.hasAttribute('download') && !a.target && parseRoute(new URL(a.href).pathname).view !== 'none') {
    const u = new URL(a.href); const r = parseRoute(u.pathname, u.search); e.preventDefault(); if (sheet.open) sheet.close();
    if (r.view === 'page') { const pid = pageId({ ...r.input, lens: LENSES[r.input.lens] ? r.input.lens : 'encyclopedic' }); const p = pageOf(pid); if (p && p.status !== 'empty') { openPage(p, 'link'); return; } openTopic(r.input.title, { via: 'link', lens: r.input.lens, ctx: r.input.ctx, q: r.input.q, bridge: r.input.bridge }); return; }
    go(u.pathname + u.search); return;
  }
  const act = e.target.closest('[data-act]'); if (!act) return;
  const x = act.dataset.act; if (act.tagName === 'A') e.preventDefault();
  const md = act.closest('details.more'); if (md) md.open = false;
  const p = curPage();
  if (x === 'surprise') surprise();
  else if (x === 'shuffle') shufflePresets();
  else if (x === 'voice-clear') { setLens('encyclopedic'); $('#seedIn')?.focus({ preventScroll: true }); }
  else if (x === 'stop' && p) { const c = ACTIVE.get(p.id); if (c) c.abort(); }
  else if (x === 'write-page') writeGuarded();
  else if (x === 'retry' && p && p.status !== 'digging') generate(p);
  /* rewriting in the voice the page is already in is a private rewrite; another voice is another page, which may already be written */
  else if (x === 'rewrite' && p && p.status !== 'digging') rewrite(p);
  else if (x === 'save') toggleSave(p);
  else if (x === 'trail') trailSheet();
  else if (x === 'doubt') doubtPage(p);
  else if (x === 'land') landSheet(p);
  else if (x === 'sketch') sketch(p);
  else if (x === 'sketch-redo') sketch(p, true);
  else if (x === 'sketch-close' && p) { p.figure = null; save(); paint(p); }
  else if (x === 'recall') recall(false);
  else if (x === 'recall-new') recall(true);
  else if (x === 'qz-next') { const t = curTrail(); if (t && t.recall) { t.recall.i++; t.recall.picked = null; save(); renderQuiz(); } }
  else if (x === 'sheet-close') sheet.close();
  else if (x === 'keys') keysSheet();
  else if (x === 'key-save') saveKey(act);
  else if (x === 'key-forget') forgetKey();
  else if (x === 'bridge') bridgeSheet(p);
  else if (x === 'listen') listen(p);
  else if (x === 'help') $('#help').showModal();
  else if (x === 'side-toggle') toggleSide();
  else if (x === 'recap') recapTrail(false);
  else if (x === 'save-notes') { const t = curTrail(); if (t && t.notes) saveFile(`${fileSlug((trailPages(t)[0] || {}).title || 'trail')}-recap.md`, t.notes); }
  else if (x === 'copy-notes') { const t = curTrail(); if (t && t.notes) navigator.clipboard?.writeText(t.notes).then(() => toast('Copied.'), () => toast('Copy isn’t allowed here. Select the text instead.')); }
  else if (x === 'renotes') recapTrail(true);
});
/* the same voice again is a private rewrite; another voice is another page, which may already be written */
function rewrite(p) {
  const lens = store.settings.lens;
  if ((p.wlens || p.req.lens) === lens) { p.figure = null; generate(p, { fresh: true }); return; }
  openTopic(p.req.title, { via: 'link', lens, ctx: p.req.ctx, q: p.req.q, bridge: p.req.bridge });
}
$('#helpX').addEventListener('click', () => $('#help').close());
$('#notesBtn').addEventListener('click', () => recapTrail(false));
$('#exportBtn').addEventListener('click', exportTrail);
document.addEventListener('submit', e => {
  if (e.target.id === 'seedForm') {
    e.preventDefault(); const v = $('#seedIn').value.trim();
    if (!v) { $('#seedErr').textContent = 'Type anything: a topic, a question, a name.'; $('#seedIn').focus(); return; }
    $('#seedBox')?.classList.add('go'); openTopic(v, { via: 'start', src: canVT() ? seedMirror(v) : null });
  } else if (e.target.classList.contains('ask')) {
    e.preventDefault(); const inp = $('input', e.target); const v = inp.value.trim(); if (!v) { inp.focus(); return; }
    openTopic(v, { via: 'ask' });
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { stopListening(); hideSel(); hideCard(); if (!pmenu.hidden) closePMenu(true); closeMenu(true); $$('details.voice[open]').forEach(d => { d.open = false; }); if (WORLD && (WORLD.focused || WORLD.replaying)) { WORLD.setFocus(''); WORLD.stopReplay(); WORLD.frameView(); } return; }
  const tag = (e.target.tagName || '').toLowerCase();
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (VIEW === 'home') $('#seedIn')?.focus(); else openOmni(); return; }
  if (['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
  if (omni.open || sheet.open || $('#help').open || !pmenu.hidden) return;
  if (e.key === '?') { e.preventDefault(); $('#help').showModal(); return; }
  const k = e.key.toLowerCase();
  if (VIEW === 'home') { if (e.key === '/') { e.preventDefault(); $('#seedIn')?.focus(); } else if (k === 'g') go('/world'); return; }
  if (e.key === '/') { e.preventDefault(); openOmni(); return; }
  if (k === 'n') { e.preventDefault(); go('/'); return; }
  if (k === 'g') { if (VIEW !== 'world') go('/world'); return; }
  const p = curPage(); if (VIEW !== 'page' || !p) return;
  const sec = secFor(p.id);
  if (/^[1-6]$/.test(e.key)) { const c = sec && $(`.card[data-n="${e.key}"]`, sec); if (c) { e.preventDefault(); c.click(); } }
  else if (k === 's') toggleSave(p);
  else if (k === 't') trailSheet();
  else if (k === 'd') doubtPage(p);
  else if (k === 'l') landSheet(p);
  else if (k === 'k') sketch(p);
  else if (k === 'q') recall(false);
  else if (k === 'c') bridgeSheet(p);
  else if (k === 'p') listen(p);
  else if (k === 'i') { SIDE = 'index'; if (narrow()) go('/world'); else toggleSide(true); setTimeout(() => $('#ixq')?.focus(), 50); }
  else if (k === 'r' && p.status !== 'digging') rewrite(p);
  else if (k === 'f') recapTrail(false);
  else if (k === 'a') { e.preventDefault(); sec && $('.ask input', sec)?.focus(); }
  else if (k === 'm') toggleSide();
});
const rerenderTheme = () => { if (WORLD) WORLD.retheme(); if (MINI) MINI.retheme(); };
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', rerenderTheme);
new MutationObserver(rerenderTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
let wasNarrow = narrow();
addEventListener('resize', () => { clearTimeout(selT); selT = setTimeout(() => { hideSel(); hideCard(); closePMenu(); if (narrow() !== wasNarrow) { wasNarrow = narrow(); renderSide(); } }, 150); });

$('#keyBtn').addEventListener('click', () => keysSheet());
$('#worldBtn').addEventListener('click', () => go('/world'));
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
renderKeyBtn();
renderVoice();
applySide();
route();
backfillLinks();
if (store.moved) { delete store.moved; save(true); setTimeout(() => toast('Everything you’ve read is now in Your world.', 5000), 900); }

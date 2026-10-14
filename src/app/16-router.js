/* ================= router ================= */
function route() {
  const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  $('#map').classList.remove('open'); $('#scrim').hidden = true; $('#mapBtn').setAttribute('aria-expanded', 'false'); hideSel(); hideCard(); closePMenu(); stopListening();
  if (sheet.open) sheet.close();
  if (omni.open) omni.close();
  if (p[0] === 'w') {
    const w = store.warrens.find(x => x.id === p[1]);
    if (w && w.nodes[p[2]]) {
      stopLanding();
      W = w; const node = w.nodes[p[2]];
      const col = $('#column');
      if (col && col.dataset.wid === w.id && secFor(node.id)) {       // already on screen: soft move
        setCurrent(node.id); const r = secFor(node.id).getBoundingClientRect();
        if (r.top > innerHeight * .5 || r.bottom < innerHeight * .3) scrollToSec(node.id);
        NAV_DIR = null; return;
      }
      const prevDepth = W.nodes[W.current] ? W.nodes[W.current].depth : null;
      if (!NAV_DIR && prevDepth != null && col) NAV_DIR = node.depth > prevDepth ? 'down' : node.depth < prevDepth ? 'up' : null;
      document.body.classList.remove('at-start');
      if (!col || col.dataset.wid !== w.id) { const last = w.seenAt || w.updated; if (last && Date.now() - last > 30 * 6e4 && w.order.length > 1) RECAP[w.id] = { nid: node.id, last }; }
      w.seenAt = Date.now();
      $('#view').innerHTML = `<div class="column" id="column" data-wid="${w.id}">${chamberHTML(node)}</div>`;
      NAV_DIR = null;
      paint(node); setCurrent(node.id); watchColumn();
      window.scrollTo(0, 0); const h = $('.a-title'); if (h && col) h.focus({ preventScroll: true });
      if (node.status === 'empty') generate(node);
      return;
    }
  }
  W = null; NAV_DIR = null; if (IO) IO.disconnect();
  document.body.classList.add('at-start'); document.documentElement.dataset.stratum = '0';
  $('#view').innerHTML = viewStart(); ENCQ = ''; updateUpNext(); startLanding(); document.title = 'dorkhub: get lost learning';
  window.scrollTo(0, 0); updateProg();
}
window.addEventListener('hashchange', () => { if (canVT() && !document.body.classList.contains('at-start')) { try { document.startViewTransition(route); return; } catch (e) { } } route(); });

/* ================= events ================= */
const nidOf = el => { const s = el && el.closest && el.closest('.chamber'); return s ? s.dataset.nid : (W && W.current); };
document.addEventListener('click', e => {
  const hole = e.target.closest('a.hole');
  if (hole) {
    e.preventDefault();
    if (Date.now() - lastTouch < 700 && (!hc || hc.a !== hole)) { showCard(hole); return; }
    const c = linkCtx(hole); hideCard(); dig(hole.dataset.t, { text: c.text }, c.nid, hole); return;
  }
  if (!e.target.closest('#hcard') && !hcard.hidden) hideCard();
  const pt = e.target.closest('.ptool'); if (pt) { if (pm && pm.btn === pt) closePMenu(); else openPMenu(pt); return; }
  if (!e.target.closest('#pmenu')) closePMenu();
  const tun = e.target.closest('.row[data-t]'); if (tun) { dig(tun.dataset.t, { text: `Chosen from the branches at the end of the page, with the hook: ${tun.dataset.teaser}`, dir: tun.dataset.dir }, nidOf(tun), $('.rt', tun)); return; }
  const gt = e.target.closest('[data-goto]'); if (gt && W && W.nodes[gt.dataset.goto]) { nav(gt.dataset.goto, 'down', $('.rt', gt)); return; }
  const sk = e.target.closest('[data-sk]'); if (sk) { dig(sk.dataset.sk, { text: `From a sketch of this page: ${sk.dataset.note || ''}` }, nidOf(sk), $('b', sk)); return; }
  const qz = e.target.closest('[data-qz]'); if (qz && W && W.recall) { const R = W.recall; if (R.picked == null) { R.picked = +qz.dataset.qz; if (R.picked === R.qs[R.i].answer) R.score++; save(); renderQuiz(); } return; }
  const enc = e.target.closest('[data-enc]'); if (enc) { openEnc(enc.dataset.enc); return; }
  if (!e.target.closest('.more')) $$('details.more[open]').forEach(d => { d.open = false; });
  const tab = e.target.closest('[data-tab]'); if (tab) { SIDE = tab.dataset.tab; renderMap(); return; }
  const ixs = e.target.closest('[data-ixsort]'); if (ixs) { IDXSORT = ixs.dataset.ixsort; renderIndex(); return; }
  const ixk = e.target.closest('[data-ixkind]'); if (ixk) { IDXKIND = IDXKIND === ixk.dataset.ixkind ? '' : ixk.dataset.ixkind; renderIndexList(); return; }
  const ix = e.target.closest('[data-ix]'); if (ix) { openIndexEntry(ix.dataset.ix); return; }
  const rc = e.target.closest('[data-react]'); if (rc) { const n = W.nodes[nidOf(rc)]; if (n) { n.reaction = n.reaction === rc.dataset.react ? null : rc.dataset.react; save(); paint(n); if (n.reaction) toast(n.reaction === 'right' ? 'Noted.' : 'Noted. The next chambers will adjust.'); } return; }
  const echo = e.target.closest('[data-echo]'); if (echo) { dig(echo.dataset.echo, { text: `A topic that kept recurring across the reader's rabbit hole. ${echo.dataset.gloss || ''}` }, nidOf(echo), $('.rt', echo) || echo); return; }
  const br = e.target.closest('[data-bridge]'); if (br) { makeBridge(br.dataset.from, br.dataset.bridge); return; }
  const ld = e.target.closest('[data-land]'); if (ld) { e.preventDefault(); const n = W.nodes[ld.dataset.nid]; const o = n && n.land && n.land[+ld.dataset.land]; if (o) dig(o.name, { text: `Chosen from the lay of the land around "${n.title}": ${o.relation}` }, n.id); return; }
  const nx = e.target.closest('[data-next]'); if (nx) { if (nx.closest('.recap')) { delete RECAP[W.id]; nx.closest('.recap').remove(); } keepReading(nx.dataset.next); return; }
  const q = e.target.closest('[data-q]'); if (q) { dig(q.dataset.q, { question: q.dataset.q }, nidOf(q), $('.rt', q)); return; }
  const fold = e.target.closest('[data-fold]'); if (fold) { const n = W.nodes[nidOf(fold)]; if (n && n.unfolds) { delete n.unfolds[fold.dataset.fold]; save(); paint(n); } return; }
  const pc = e.target.closest('[data-peek-close]'); if (pc) { const n = W.nodes[nidOf(pc)]; const p = n && (n.peeks || []).find(x => x.key === pc.dataset.peekClose); if (p) { p.open = false; save(); paint(n); } return; }
  const pd = e.target.closest('[data-peek-dig]'); if (pd) { const n = W.nodes[nidOf(pd)]; const p = n && (n.peeks || []).find(x => x.target === pd.dataset.peekDig); dig(pd.dataset.peekDig, { text: p ? plain(p.text) : '' }, n && n.id); return; }
  const seed = e.target.closest('[data-seed]');
  if (seed) { newWarren(seed.dataset.seed); return; }
  const del = e.target.closest('[data-del]');
  if (del) {
    if (!del.dataset.armed) { del.dataset.armed = '1'; del.textContent = 'Click again to delete it'; setTimeout(() => { if (del.isConnected) { delete del.dataset.armed; del.textContent = 'Delete'; } }, 3500); return; }
    store.warrens = store.warrens.filter(w => w.id !== del.dataset.del); save(true); route(); toast('Rabbit hole deleted.'); return;
  }
  const act = e.target.closest('[data-act]'); if (!act) return;
  const a = act.dataset.act; if (act.tagName === 'A') e.preventDefault();
  const md = act.closest('details.more'); if (md) md.open = false;
  const node = W && W.nodes[act.dataset.nid || nidOf(act)];
  if (a === 'surprise') newWarren(SEEDS[Math.floor(Math.random() * SEEDS.length)]);
  else if (a === 'demo') newWarren('Voynich manuscript', { demo: true });
  else if (a === 'up' && node && node.parent) nav(node.parent, 'up');
  else if (a === 'stop' && node) { const c = ACTIVE.get(node.id); if (c) c.abort(); }
  else if ((a === 'retry' || a === 'rewrite') && node && node.status !== 'digging') { if (a === 'rewrite') { node.lens = null; node.figure = null; } generate(node, { fresh: true }); }
  else if (a === 'thread') { if (node) W.current = node.id; threadSheet(); }
  else if (a === 'doubt' && node) doubtPage(node.id);
  else if (a === 'land' && node) landSheet(node.id);
  else if (a === 'sketch' && node) sketch(node.id);
  else if (a === 'sketch-redo' && node) sketch(node.id, true);
  else if (a === 'sketch-close' && node) { node.figure = null; save(); paint(node); paintTools(node, secFor(node.id)); }
  else if (a === 'recall') recall(false);
  else if (a === 'recall-new') recall(true);
  else if (a === 'qz-next' && W && W.recall) { W.recall.i++; W.recall.picked = null; save(); renderQuiz(); }
  else if (a === 'sheet-close') sheet.close();
  else if (a === 'keys') keysSheet();
  else if (a === 'key-save') saveKey(act);
  else if (a === 'key-forget') forgetKey();
  else if (a === 'bridge' && node) bridgeSheet(node.id);
  else if (a === 'listen' && node) listen(node.id);
  else if (a === 'help') $('#help').showModal();
  else if (a === 'side-toggle') toggleSide();
  else if (a === 'dismiss-recap') { delete RECAP[W.id]; act.closest('.recap')?.remove(); }
  else if (a === 'save-notes' && W && W.notes) saveFile(`${fileSlug(W.nodes[W.root].title)}-recap.md`, W.notes);
  else if (a === 'copy-notes' && W && W.notes) navigator.clipboard?.writeText(W.notes).then(() => toast('Copied.'), () => toast('Copy isn’t allowed here. Select the text instead.'));
  else if (a === 'renotes') fieldNotes(true);
});
$('#helpX').addEventListener('click', () => $('#help').close());
$('#notesBtn').addEventListener('click', () => fieldNotes(false));
document.addEventListener('input', e => { if (e.target.id === 'encq') { ENCQ = e.target.value.trim().toLowerCase(); $('#encList').innerHTML = encList(); } });
$('#exportBtn').addEventListener('click', () => W && saveFile(`${fileSlug(W.nodes[W.root].title)}-rabbit-hole.md`, warrenMarkdown(W)));
function toggleMap(force) { const m = $('#map'); const open = force ?? !m.classList.contains('open'); m.classList.toggle('open', open); $('#scrim').hidden = !(open && narrow()); $('#mapBtn').setAttribute('aria-expanded', String(open)); if (open) renderMap(); }
$('#scrim').addEventListener('click', () => toggleMap(false));
$('#mapBtn').addEventListener('click', () => toggleMap());
$('#mapX').addEventListener('click', () => toggleMap(false));
document.addEventListener('submit', e => {
  if (e.target.id === 'seedForm') {
    e.preventDefault(); const v = $('#seedIn').value.trim();
    if (!v) { $('#seedErr').textContent = 'Type anything: a topic, a question, a name.'; $('#seedIn').focus(); return; }
    newWarren(v);
  } else if (e.target.classList.contains('ask')) {
    e.preventDefault(); const inp = $('input', e.target); const v = inp.value.trim(); if (!v) { inp.focus(); return; }
    dig(v, isQuestion(v) ? { question: v } : { text: `Typed by the reader while reading this chamber: ${v}` }, e.target.dataset.nid);
  }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.chain[data-seed]')) { e.preventDefault(); e.target.click(); return; }
  if (e.key === 'Escape') { stopListening(); hideSel(); hideCard(); if (!pmenu.hidden) closePMenu(true); if ($('#voice').open) $('#voice').open = false; if ($('#map').classList.contains('open')) toggleMap(false); return; }
  const tag = (e.target.tagName || '').toLowerCase();
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (W) openOmni(); else $('#seedIn')?.focus(); return; }
  if (['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
  if (omni.open) return;
  if (sheet.open || $('#help').open || !pmenu.hidden) return;
  if (e.key === '?') { e.preventDefault(); $('#help').showModal(); return; }
  if (!W) { if (e.key === '/') { e.preventDefault(); $('#seedIn')?.focus(); } return; }
  const node = W.nodes[W.current]; const k = e.key.toLowerCase(); const sec = secFor(node.id);
  if (/^[1-5]$/.test(e.key)) { const b = sec && $(`.row[data-n="${e.key}"]`, sec); if (b) { e.preventDefault(); b.click(); } }
  else if (k === 'j') { e.preventDefault(); keepReading(node.id); }
  else if (k === 'u' && node.parent) nav(node.parent, 'up');
  else if (k === 's' && node.depth > 0) nav(W.root, 'up');
  else if (k === 't') threadSheet();
  else if (k === 'd') doubtPage(node.id);
  else if (k === 'l') landSheet(node.id);
  else if (k === 'k') sketch(node.id);
  else if (k === 'q') recall(false);
  else if (k === 'c' || k === 'b') bridgeSheet(node.id);
  else if (k === 'p') listen(node.id);
  else if (k === 'i') { SIDE = 'index'; if (narrow()) toggleMap(true); else { if (railMode()) { store.settings.side = 'open'; save(); applySide(); } renderMap(); } setTimeout(() => $('#ixq')?.focus(), 50); }
  else if (k === 'r' && node.status !== 'digging') { node.lens = null; node.figure = null; generate(node, { fresh: true }); }
  else if (k === 'f') fieldNotes(false);
  else if (k === 'a') { e.preventDefault(); sec && $('.ask input', sec).focus(); }
  else if (k === 'm') toggleSide();
  else if (e.key === '/') { e.preventDefault(); openOmni(); }
  else if (k === 'n') { e.preventDefault(); location.hash = '#/'; }
});
const rerenderTheme = () => { if (W) renderMap(); else if ($('.sfig')) $('.sfig').innerHTML = columnSVG() + $('.sfig figcaption').outerHTML; };
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', rerenderTheme);
new MutationObserver(rerenderTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
addEventListener('resize', () => { clearTimeout(selT); selT = setTimeout(() => { hideSel(); hideCard(); closePMenu(); $('#scrim').hidden = !($('#map').classList.contains('open') && narrow()); if (W) renderMap(); }, 150); });

$('#keyBtn').addEventListener('click', () => keysSheet());
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
renderKeyBtn();
renderVoice();
applySide();
route();

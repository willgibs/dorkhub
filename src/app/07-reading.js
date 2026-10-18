/* ================= reading progress: a thin line under the top bar ================= */
function updateProg() {
  const pr = $('#prog'); const sec = CUR && secFor(CUR); if (!sec) { pr.style.width = '0'; return; }
  const r = sec.getBoundingClientRect(); const v = Math.min(1, Math.max(0, (innerHeight * .45 - r.top) / Math.max(1, r.height)));
  pr.style.width = `${(v * 100).toFixed(1)}%`;
}
/* the page's title in the top bar, once the title itself has gone under it */
function syncTopTitle() {
  const h1 = VIEW === 'page' && $('.a-title'); const on = !!h1 && h1.getBoundingClientRect().bottom < TOP_H() + 4;
  if (on) { const p = curPage(); const t = $('#topT'); const want = h1.textContent; if (t.dataset.t !== want) { t.dataset.t = want; $('.top-tt', t).textContent = want; } const k = kindOf((p && p.kind) || (ACC && ACC.kind) || ''); const kd = $('.kind', t); if (kd.dataset.kind !== k) { if (k) kd.dataset.kind = k; else delete kd.dataset.kind; } }
  document.body.classList.toggle('titled', on);
}
$('#topT').addEventListener('click', () => scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }));
/* back and forward return you to where you were on a page */
let scrollQ = false, scrollT = 0;
addEventListener('scroll', () => {
  if (!scrollQ) { scrollQ = true; requestAnimationFrame(() => { scrollQ = false; updateProg(); document.body.classList.toggle('scrolled', scrollY > 4); syncTopTitle(); if (!hcard.hidden && Math.abs(scrollY - hcY) > 90) hideCard(); }); }
  clearTimeout(scrollT); scrollT = setTimeout(rememberScroll, 160);
}, { passive: true });

/* ================= prefetch: a page you're about to open may already be written =================
   On a pause over a link or card, and for the first cards once the end of a page is in view, ask
   the server whether the page is already written (cachedOnly: never a write, never a cost). A page
   that is opens at once. One ask at a time, a dozen per page and thirty a minute, and none at all
   when the reader's browser asks to save data. Nothing on screen ever says which pages were. */
const PF = { busy: false, view: 0, times: [], got: new Map() };
function prefetch(req) {
  const id = pageId(req); if (PF.got.has(id) || (store.pages[id] && store.pages[id].text)) return;
  if (navigator.connection && navigator.connection.saveData) return;
  const now = Date.now(); PF.times = PF.times.filter(t => now - t < 6e4);
  if (PF.busy || PF.view >= 12 || PF.times.length >= 30) return;
  PF.busy = true; PF.view++; PF.times.push(now); PF.got.set(id, null);
  write('page', req, { cachedOnly: true })
    .then(r => { PF.got.set(id, r.none ? false : { text: r.text, seeded: r.seeded }); }, () => { PF.got.delete(id); })
    .finally(() => { PF.busy = false; });
}
const reqFor = (title, extra = {}) => ({ title: cleanTitle(title), lens: store.settings.lens, q: asksQuestion(title), ctx: '', bridge: null, ...extra });
let pfT = 0;
function pfIntent(el) {
  clearTimeout(pfT); const t = el && el.dataset.t; if (!t) return;
  pfT = setTimeout(() => prefetch(reqFor(t)), 120);
}
/* the first cards, once the end of the page is in sight */
let END_IO = null;
function watchEnd(p, end) {
  if (end._watched || typeof IntersectionObserver !== 'function') return; end._watched = true;
  END_IO = END_IO || new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { END_IO.unobserve(e.target); $$('.card[data-t]', e.target).slice(0, 2).forEach(c => prefetch(reqFor(c.dataset.t))); } }, { rootMargin: '0px 0px 200px 0px' });
  END_IO.observe(end);
}

/* ================= link preview card ================= */
const hcard = $('#hcard'); let hc = null, hcTimer = 0, hideTimer = 0, lastTouch = 0, hcY = 0;
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') lastTouch = Date.now(); }, true);
function linkCtx(a) {
  const pb = a.closest('.pb'); const i = pb ? +pb.dataset.i : -1; const el = a.closest('.pn-r,p,li,h2,dd,.mnote,.xp,.card');
  return { i, text: el ? el.textContent : '' };
}
/* what Your world knows about a topic: when you read it, or which of your pages also lead there */
function worldNote(target) {
  const k = topicKey(target); const W = worldIndex(); const read = W.read.get(k);
  if (read) return { read, line: `You read this ${relTime(read.last)}` };
  const from = (W.back.get(k) || []).filter(id => id !== CUR).map(pageOf).filter(Boolean).map(x => x.title);
  if (!from.length) return { read: null, line: '' };
  const names = from.slice(0, 2); const more = from.length - names.length;
  return { read: null, line: `Also on ${names.map(n => `<b>${esc(clip(n, 30))}</b>`).join(' and ')}${more ? `, and ${more} more of your pages` : ''}` };
}
function showCard(a) {
  const p = curPage(); if (!p) return; const c = linkCtx(a); const target = a.dataset.t; const k = keyOf(target);
  const F = full(p); const g = F.gloss[k]; const hook = hookOf(F, k) || (a.closest('.card') ? (a.querySelector('.cd-h')?.textContent || '') : '');
  const busy = [...ACTIVE.keys()].some(id => { const x = pageOf(id); return x && topicKey(x.req.title) === topicKey(target); });
  const wn = worldNote(target); const kind = (g && g.kind) || a.dataset.kind || '';
  hc = { a, i: c.i, target, label: a.textContent, text: c.text };
  hcard.innerHTML = `<p class="hc-meta">${kind ? `<span class="kind"${kattr(kind)}>${esc(kind)}</span>` : '<span></span>'}<span>${busy ? 'Being written' : wn.read ? 'Read ↺' : ''}</span></p>
<p class="hc-title">${esc(target)}</p><p class="hc-hook">${hook ? esc(capFirst(plain(hook))) : isLive(p) ? 'The preview arrives when this page finishes writing.' : 'No preview yet. Peek to get a look.'}</p>
${wn.line ? `<p class="hc-else">${wn.line}</p>` : ''}
<div class="hc-actions"><button class="btn glow" type="button" data-hc="open">${wn.read ? 'Go there' : 'Open page'} ↵</button>${c.i >= 0 ? `<button class="btn ghost" type="button" data-hc="peek">Peek here</button>` : ''}</div>
${!wn.read ? `<div class="hc-lens"><span>Or read it as</span>${Object.keys(LENS_SHORT).map(key => `<button type="button" data-hc="lens" data-lens="${key}">${esc(LENS_SHORT[key])}</button>`).join('')}</div>` : ''}`;
  hcard.hidden = false; hcY = scrollY;
  placeCard(a);
}
/* Where there is room, the card sits in the margin beside the line it belongs to, a hairline leading to it, so it
   never covers what you are reading; otherwise just below the link (or above it, near the bottom of the screen). */
const HC_GAP = 32;
function placeCard(a) {
  const r = a.getBoundingClientRect(); const body = a.closest('.article')?.querySelector('.a-body'); const cr = body && body.getBoundingClientRect();
  const free = cr && !a.closest('.a-end') ? innerWidth - cr.right - HC_GAP - 16 : 0; const room = free >= 240;
  hcard.classList.toggle('in-margin', room); hcard.style.width = room ? `${Math.min(310, Math.floor(free))}px` : '';
  const ch = hcard.offsetHeight;
  if (room) {
    const mid = (r.top + r.bottom) / 2; const top = Math.max(TOP_H() + 12, Math.min(mid - 24, innerHeight - ch - 12));
    hcard.style.left = `${cr.right + HC_GAP + scrollX}px`; hcard.style.top = `${top + scrollY}px`;
    hcard.style.setProperty('--ly', `${Math.round(Math.max(14, Math.min(ch - 14, mid - top)))}px`);
    return;
  }
  const w = 320; let x = r.left + scrollX; x = Math.max(12 + scrollX, Math.min(x, scrollX + innerWidth - w - 12));
  const below = r.bottom + 10 + ch < innerHeight;
  hcard.style.left = `${x}px`; hcard.style.top = `${(below ? r.bottom + 8 : r.top - ch - 8) + scrollY}px`;
}
const TOP_H = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top-h')) || 56;
function hideCard() { clearTimeout(hcTimer); if (!hcard.hidden) { hcard.hidden = true; hc = null; } }
document.addEventListener('mouseover', e => {
  const a = e.target.closest && e.target.closest('a.hole,a.card');
  if (a) pfIntent(a);
  if (a && a.matches('a.hole') && matchMedia('(hover: hover)').matches) { clearTimeout(hideTimer); clearTimeout(hcTimer); if (!hc || hc.a !== a) hcTimer = setTimeout(() => showCard(a), 240); }
  else if (e.target.closest && e.target.closest('#hcard')) clearTimeout(hideTimer);
});
document.addEventListener('mouseout', e => {
  if (!matchMedia('(hover: hover)').matches || Date.now() - lastTouch < 900) return;
  const a = e.target.closest && e.target.closest('a.hole,#hcard'); if (!a) return;
  /* a card in the margin is further from its link, so it waits a little longer for the pointer to reach it */
  clearTimeout(hcTimer); hideTimer = setTimeout(hideCard, hcard.classList.contains('in-margin') ? 520 : 240);
});
document.addEventListener('focusin', e => { const a = e.target.closest && e.target.closest('a.hole,a.card'); if (a) pfIntent(a); if (a && a.matches('a.hole') && e.target.matches(':focus-visible')) showCard(a); });
hcard.addEventListener('click', e => {
  const b = e.target.closest('[data-hc]'); if (!b || !hc) return; const c = hc; hideCard();
  if (b.dataset.hc === 'open') openTopic(c.target, { via: 'link', src: c.a });
  else if (b.dataset.hc === 'lens') openTopic(c.target, { via: 'link', src: c.a, lens: b.dataset.lens });
  else peek(curPage(), c.target, c.label, c.i);
});

/* ================= paragraph menu ================= */
const pmenu = $('#pmenu'); let pm = null;
function openPMenu(btn) {
  pm = { i: +btn.dataset.i, btn };
  $$('.ptool[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  btn.setAttribute('aria-expanded', 'true'); pmenu.hidden = false;
  const r = btn.getBoundingClientRect(); const x = Math.max(12, Math.min(r.left, innerWidth - 250));
  pmenu.style.left = `${x + scrollX}px`; pmenu.style.top = `${r.bottom + 6 + scrollY}px`;
  $('button', pmenu).focus();
}
function closePMenu(refocus) { if (pmenu.hidden) return; pmenu.hidden = true; if (pm && pm.btn) { pm.btn.setAttribute('aria-expanded', 'false'); if (refocus && pm.btn.isConnected) pm.btn.focus(); } pm = null; }
pmenu.addEventListener('click', e => { const b = e.target.closest('[data-uf]'); if (!b || !pm) return; const x = pm; closePMenu(); unfold(curPage(), x.i, b.dataset.uf); });
pmenu.addEventListener('keydown', e => {
  const items = $$('button', pmenu); const i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  else if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); closePMenu(true); }
});

/* touch: a tap on a paragraph shows its ¶ button; a tap anywhere else hides it again */
function tapPara(t) {
  const pb = t.closest('.pb'); if (pb && t.closest('a,button,.xp,.mcol')) return;
  $$('.pb.tapped').forEach(x => { if (x !== pb) x.classList.remove('tapped'); });
  if (pb) pb.classList.toggle('tapped');
}

/* ================= selection → a new page, in the sense it had here ================= */
const digSel = $('#digSel'); let selInfo = null;
function hideSel() { digSel.hidden = true; selInfo = null; }
function checkSel() {
  const sel = getSelection(); if (!sel || sel.isCollapsed || !CUR) return hideSel();
  const txt = sel.toString().replace(/\s+/g, ' ').trim();
  const a = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
  const body = a && a.closest('.a-body');
  if (txt.length < 3 || txt.length > 90 || !body) return hideSel();
  const r = sel.getRangeAt(0).getBoundingClientRect(); if (!r.width) return hideSel();
  selInfo = { txt };
  digSel.textContent = `Open a page on “${clip(txt, 32)}”`; digSel.hidden = false;
  digSel.style.left = `${Math.min(innerWidth - 120, Math.max(120, r.left + r.width / 2)) + scrollX}px`;
  digSel.style.top = `${r.top + scrollY - 50}px`;
}
let selT = 0;
document.addEventListener('selectionchange', () => { clearTimeout(selT); selT = setTimeout(checkSel, 180); });
digSel.addEventListener('mousedown', e => e.preventDefault());
/* a name chosen inside a page keeps the sense it had there: "Mercury" on a page about planets is the planet */
digSel.addEventListener('click', () => { if (!selInfo) return; const s = selInfo; getSelection().removeAllRanges(); hideSel(); const p = curPage(); openTopic(s.txt, { via: 'select', ctx: p ? p.title : '' }); });

/* ================= continue reading: the preview becomes the next page ================= */
let IO = null;
function keepReading(nid) {
  const node = W.nodes[nid || W.current]; if (!node) return;
  const A = parsed(node); const pick = A.next || A.tunnels[0]; if (!pick) return;
  let child = findByKey(keyOf(pick.target));
  if (child && secFor(child.id)) { scrollToSec(child.id); return; }
  if (!child) child = mkNode(W, { title: pick.target, parent: node.id, depth: node.depth + 1, from: { cont: true, text: plain(pick.why || pick.teaser || '') }, seed: seedFor(node, pick.target) });
  const sec = secFor(node.id); const teaser = sec && $('.next-title', sec);
  const run = () => {
    let s = sec.nextElementSibling; while (s) { const n = s.nextElementSibling; if (IO) IO.unobserve(s); s.remove(); s = n; }
    sec.insertAdjacentHTML('afterend', chamberHTML(child, node.id));
    const ns = secFor(child.id); if (IO) IO.observe(ns);
    paint(child); paint(node, true);
    if (teaser) teaser.style.viewTransitionName = '';
    if (HERO) { const h1 = $('.a-title', ns); if (h1) h1.style.viewTransitionName = 'hero'; }
    history.pushState(null, '', `#/w/${W.id}/${child.id}`); setCurrent(child.id);
    scrollToSec(child.id, true); const h1 = $('.a-title', ns); if (h1) h1.focus({ preventScroll: true });
  };
  if (canVT() && teaser && sec) {
    teaser.style.viewTransitionName = 'hero'; HERO = true;
    try { const t = document.startViewTransition(run); t.finished.finally(clearHero); } catch (e) { clearHero(); run(); }
  } else if (sec) run();
  if (child.status === 'empty') generate(child);
}
function scrollToSec(nid, instant) {
  const sec = secFor(nid); if (!sec) return;
  const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top-h')) || 60;
  window.scrollTo({ top: Math.max(0, sec.getBoundingClientRect().top + scrollY - top), behavior: instant || reducedMotion() ? 'auto' : 'smooth' });
}
function setCurrent(nid) {
  const node = W.nodes[nid]; if (!node) return;
  W.current = nid; document.documentElement.dataset.stratum = String(stratumOf(node.depth));
  renderTrail(); checkLevelUp(node); renderMap(); document.title = `${node.title}: dorkhub`; save(); updateProg();
}
function watchColumn() {
  if (IO) IO.disconnect();
  IO = new IntersectionObserver(entries => {
    if (!W) return;
    for (const e of entries) {
      if (!e.isIntersecting) continue; const nid = e.target.dataset.nid;
      if (nid && nid !== W.current && $$('.chamber').length > 1) { history.replaceState(null, '', `#/w/${W.id}/${nid}`); setCurrent(nid); }
    }
  }, { rootMargin: '-38% 0px -58% 0px' });
  $$('.chamber').forEach(s => IO.observe(s));
}
function updateProg() {
  const p = $('#prog'); if (!W) { p.style.width = '0'; updateUpNext(); return; }
  const sec = secFor(W.current); if (!sec) return;
  const r = sec.getBoundingClientRect(); const v = Math.min(1, Math.max(0, (innerHeight * .45 - r.top) / Math.max(1, r.height)));
  p.style.width = `${(v * 100).toFixed(1)}%`;
  updateUpNext();
}

/* ================= link preview card ================= */
const hcard = $('#hcard'); let hc = null, hcTimer = 0, hideTimer = 0, lastTouch = 0, hcY = 0;
let progQ = false;
addEventListener('scroll', () => { if (!progQ) { progQ = true; requestAnimationFrame(() => { progQ = false; updateProg(); if (!hcard.hidden && Math.abs(scrollY - hcY) > 90) hideCard(); }); } }, { passive: true });
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') lastTouch = Date.now(); }, true);
function linkCtx(a) {
  const sec = a.closest('.chamber'); const nid = sec && sec.dataset.nid; const pb = a.closest('.pb');
  const i = pb ? +pb.dataset.i : -1; const el = a.closest('.pn-r,p,li,h2,dd,.mnote,.xp');
  return { nid, i, text: el ? el.textContent : '' };
}
function showCard(a) {
  const c = linkCtx(a); if (!c.nid || !W) return; const node = W.nodes[c.nid]; const target = a.dataset.t; const k = keyOf(target);
  const F = full(node); const g = F.gloss[k]; const hook = hookOf(F, k); const ex = findByKey(k);
  const ie = buildIndex().find(e => e.key === k || (e.node && e.node.keys.includes(k))); const men = ie ? ie.mentions.size : 0;
  const elsewhere = !ex ? findElsewhere(k) : null;
  const status = ex ? (ex.status === 'done' ? 'Already read ↺' : 'Being written') : men >= 2 ? `On ${men} pages` : 'Not read yet';
  hc = { a, nid: c.nid, i: c.i, target, label: a.textContent, text: c.text };
  hcard.innerHTML = `<p class="hc-meta">${g && g.kind ? `<span class="kind"${kattr(g.kind)}>${esc(g.kind)}</span>` : '<span></span>'}<span>${status}</span></p>
<p class="hc-title">${esc(target)}</p><p class="hc-hook">${hook ? esc(capFirst(hook)) : isLive(node) ? 'The preview arrives when this page finishes writing.' : 'No preview yet. Peek to get a look.'}</p>
${!ex && elsewhere ? `<p class="hc-else">You read this in another rabbit hole, <b>${esc(clip(elsewhere.w.nodes[elsewhere.w.root].title, 40))}</b>. <a href="#/w/${elsewhere.w.id}/${elsewhere.n.id}">Open it there</a></p>` : ''}
<div class="hc-actions"><button class="btn glow" type="button" data-hc="dig">${ex && ex.status === 'done' ? 'Go there' : 'Open page'} ↵</button>${c.i >= 0 ? `<button class="btn ghost" type="button" data-hc="peek">Peek here</button>` : ''}</div>
${!ex ? `<div class="hc-lens"><span>Or read it as</span>${Object.keys(LENS_SHORT).map(key => `<button type="button" data-hc="lens" data-lens="${key}">${esc(LENS_SHORT[key])}</button>`).join('')}</div>` : ''}`;
  hcard.hidden = false; hcY = scrollY;
  const r = a.getBoundingClientRect(); const w = 320; let x = r.left + scrollX; x = Math.max(12 + scrollX, Math.min(x, scrollX + innerWidth - w - 12));
  const below = r.bottom + 10 + hcard.offsetHeight < innerHeight;
  hcard.style.left = `${x}px`; hcard.style.top = `${(below ? r.bottom + 8 : r.top - hcard.offsetHeight - 8) + scrollY}px`;
}
function hideCard() { clearTimeout(hcTimer); if (!hcard.hidden) { hcard.hidden = true; hc = null; } }
document.addEventListener('mouseover', e => {
  const a = e.target.closest && e.target.closest('a.hole');
  if (a && matchMedia('(hover: hover)').matches) { clearTimeout(hideTimer); clearTimeout(hcTimer); if (!hc || hc.a !== a) hcTimer = setTimeout(() => showCard(a), 240); }
  else if (e.target.closest && e.target.closest('#hcard')) clearTimeout(hideTimer);
});
document.addEventListener('mouseout', e => {
  if (!matchMedia('(hover: hover)').matches || Date.now() - lastTouch < 900) return;
  const a = e.target.closest && e.target.closest('a.hole,#hcard'); if (!a) return;
  clearTimeout(hcTimer); hideTimer = setTimeout(hideCard, 240);
});
document.addEventListener('focusin', e => { const a = e.target.closest && e.target.closest('a.hole'); if (a && e.target.matches(':focus-visible')) showCard(a); });
hcard.addEventListener('click', e => {
  const b = e.target.closest('[data-hc]'); if (!b || !hc) return; const c = hc; hideCard();
  if (b.dataset.hc === 'dig') dig(c.target, { text: c.text }, c.nid, c.a);
  else if (b.dataset.hc === 'lens') dig(c.target, { text: c.text, lens: b.dataset.lens }, c.nid, c.a);
  else peek(c.nid, c.target, c.label, c.i);
});

/* ================= paragraph menu ================= */
const pmenu = $('#pmenu'); let pm = null;
function openPMenu(btn) {
  const sec = btn.closest('.chamber'); pm = { nid: sec.dataset.nid, i: +btn.dataset.i, btn };
  $$('.ptool[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  btn.setAttribute('aria-expanded', 'true'); pmenu.hidden = false;
  const r = btn.getBoundingClientRect(); const x = Math.max(12, Math.min(r.left, innerWidth - 250));
  pmenu.style.left = `${x + scrollX}px`; pmenu.style.top = `${r.bottom + 6 + scrollY}px`;
  $('button', pmenu).focus();
}
function closePMenu(refocus) { if (pmenu.hidden) return; pmenu.hidden = true; if (pm && pm.btn) { pm.btn.setAttribute('aria-expanded', 'false'); if (refocus && pm.btn.isConnected) pm.btn.focus(); } pm = null; }
pmenu.addEventListener('click', e => { const b = e.target.closest('[data-uf]'); if (!b || !pm) return; const p = pm; closePMenu(); unfold(p.nid, p.i, b.dataset.uf); });
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

/* ================= selection → a new page ================= */
const digSel = $('#digSel'); let selInfo = null;
function hideSel() { digSel.hidden = true; selInfo = null; }
function checkSel() {
  const sel = getSelection(); if (!sel || sel.isCollapsed || !W) return hideSel();
  const txt = sel.toString().replace(/\s+/g, ' ').trim();
  const a = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
  const body = a && a.closest('.a-body');
  if (txt.length < 3 || txt.length > 90 || !body) return hideSel();
  const r = sel.getRangeAt(0).getBoundingClientRect(); if (!r.width) return hideSel();
  const ctxEl = a.closest('.pn-r,p,li,h2,.mnote,.xp'); selInfo = { txt, ctx: ctxEl ? ctxEl.textContent : '', nid: a.closest('.chamber').dataset.nid };
  digSel.textContent = `Open a page on “${clip(txt, 32)}”`; digSel.hidden = false;
  digSel.style.left = `${Math.min(innerWidth - 120, Math.max(120, r.left + r.width / 2)) + scrollX}px`;
  digSel.style.top = `${r.top + scrollY - 50}px`;
}
let selT = 0;
document.addEventListener('selectionchange', () => { clearTimeout(selT); selT = setTimeout(checkSel, 180); });
digSel.addEventListener('mousedown', e => e.preventDefault());
digSel.addEventListener('click', () => { if (!selInfo) return; const s = selInfo; getSelection().removeAllRanges(); hideSel(); dig(s.txt, { text: s.ctx }, s.nid); });

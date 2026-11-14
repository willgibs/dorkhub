/* ================= reading position: a row of lamps along the top bar's lower edge ================= */
import { capFirst, clip, hookOf, keyOf, plain } from '../shared/article.js';
import { asksQuestion, pageId, topicKey } from '../shared/world.js';
import { LENS_SHORT, kattr, kindOf } from './01-data.js';
import { $, $$, esc, leave, reducedMotion, relTime, settle, stay, store, write } from './02-util.js';
import { ACTIVE, CUR, cleanTitle, curPage, full, isLive, openTopic, pageOf, rememberScroll } from './04-pages.js';
import { ACC, secFor, worldIndex } from './05-render.js';
import { peek, unfold } from './06-page-end.js';
import { narrow } from './10-tools.js';
import { VIEW } from './16-router.js';
/* How many lamps are lit, as last written: the row is written only when that number changes, so scrolling costs at most
   one write a frame and a page at rest costs nothing. -1 is no position at all (the row is hidden). The lamps' pitch is
   the stylesheet's, read once. */
let LIT = -2, PITCH = 0;
export function updateProg() {
  const pr = $('#prog'); const sec = CUR && secFor(CUR); let lit = -1;
  if (sec) {
    if (pr.hidden) pr.hidden = false;
    const r = sec.getBoundingClientRect(); const v = Math.min(1, Math.max(0, (innerHeight * .45 - r.top) / Math.max(1, r.height)));
    PITCH = PITCH || parseFloat(getComputedStyle(pr).getPropertyValue('--pitch')) || 6;
    lit = Math.round(v * Math.floor(pr.clientWidth / PITCH));
  } else if (!pr.hidden) pr.hidden = true;
  if (lit === LIT) return;
  if (lit >= 0) pr.style.setProperty('--lit', String(lit));
  LIT = lit;
}
/* the page's title in the top bar, once the title itself has gone under it, in its kind's colour */
export function syncTopTitle() {
  const h1 = VIEW === 'page' && $('.a-title'); const on = !!h1 && h1.getBoundingClientRect().bottom < TOP_H() + 4;
  if (on) { const p = curPage(); const t = $('#topT'); const want = h1.textContent; if (t.dataset.t !== want) { t.dataset.t = want; $('.top-tt', t).textContent = want; } const k = kindOf((p && p.kind) || (ACC && ACC.kind) || ''); if ((t.dataset.kind || '') !== k) { if (k) t.dataset.kind = k; else delete t.dataset.kind; } }
  document.body.classList.toggle('titled', on);
}
/* back and forward return you to where you were on a page */
let scrollQ = false, scrollT = 0;

/* ================= prefetch: a page you're about to open may already be written =================
   On a pause over a link or card, and for the first cards once the end of a page is in view, ask
   the server whether the page is already written (cachedOnly: never a write, never a cost). A page
   that is opens at once. One ask at a time, a dozen per page and thirty a minute, and none at all
   when the reader's browser asks to save data. Nothing on screen ever says which pages were. */
export const PF = { busy: false, view: 0, times: [], got: new Map() };
function prefetch(req) {
  const id = pageId(req); if (PF.got.has(id) || (store.pages[id] && store.pages[id].text)) return;
  if (/** @type {any} */ (navigator).connection && /** @type {any} */ (navigator).connection.saveData) return;
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
export function watchEnd(p, end) {
  if (end._watched || typeof IntersectionObserver !== 'function') return; end._watched = true;
  END_IO = END_IO || new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { END_IO.unobserve(e.target); $$('.card[data-t]', e.target).slice(0, 2).forEach(c => prefetch(reqFor(c.dataset.t))); } }, { rootMargin: '0px 0px 200px 0px' });
  END_IO.observe(end);
}

/* ================= link preview card ================= */
export let hcard; export let hc = null, hcTimer = 0, hideTimer = 0, lastTouch = 0, hcY = 0;
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
export function showCard(a) {
  const p = curPage(); if (!p) return; const c = linkCtx(a); const target = a.dataset.t; const k = keyOf(target);
  const F = full(p); const g = F.gloss[k]; const hook = hookOf(F, k) || (a.closest('.card') ? (a.querySelector('.cd-h')?.textContent || '') : '');
  const busy = [...ACTIVE.keys()].some(id => { const x = pageOf(id); return x && topicKey(x.req.title) === topicKey(target); });
  const wn = worldNote(target); const kind = (g && g.kind) || a.dataset.kind || '';
  if (hc && hc.a !== a) hc.a.classList.remove('hc-on');
  hc = { a, i: c.i, target, label: a.textContent, text: c.text };
  hcard.innerHTML = `<p class="hc-meta lbl">${kind ? `<span class="kind"${kattr(kind)}>${esc(kind)}</span>` : '<span></span>'}<span>${busy ? 'Being written' : wn.read ? 'Read ↺' : ''}</span></p>
<p class="hc-title${[...target].length > 28 ? ' long' : ''}">${esc(target)}</p><p class="hc-hook">${hook ? esc(capFirst(plain(hook))) : isLive(p) ? 'The preview arrives when this page finishes writing.' : 'No preview yet. Peek to get a look.'}</p>
${wn.line ? `<p class="hc-else">${wn.line}</p>` : ''}
<div class="hc-actions"><button class="btn glow" type="button" data-hc="open">${wn.read ? 'Go there' : 'Open page'}<span class="hc-key" aria-hidden="true"> ↵</span></button>${c.i >= 0 ? `<button class="btn ghost" type="button" data-hc="peek">Peek here</button>` : ''}</div>
${!wn.read ? `<div class="hc-lens"><span class="lbl">Or read it as</span>${Object.keys(LENS_SHORT).map(key => `<button type="button" data-hc="lens" data-lens="${key}">${esc(LENS_SHORT[key])}</button>`).join('')}</div>` : ''}`;
  stay(hcard); hcard.hidden = false; hcY = scrollY;
  placeCard(a);
}
/* Where there is room, the card sits in the margin beside the line it belongs to, a hairline leading to it, so it
   never covers what you are reading; otherwise just below the link (or above it, near the bottom of the screen). */
const HC_GAP = 32;
function placeCard(a) {
  const dock = docked(); hcard.classList.toggle('docked', dock); document.body.classList.toggle('hc-docked', dock);
  if (dock) {
    hcard.classList.remove('in-margin', 'going'); hcard.style.left = hcard.style.top = hcard.style.width = hcard.style.transform = ''; a.classList.add('hc-on');
    document.body.style.setProperty('--hc-h', `${hcard.offsetHeight}px`);
    clearOfSheet(a);
    return;
  }
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
/* the card leaves the way it came (docked, it slides back down); `now` (a route change) takes it at once */
export function hideCard(now = false) {
  clearTimeout(hcTimer); if (hc) { hc.a.classList.remove('hc-on'); hc = null; }
  document.body.classList.remove('hc-docked');
  const gone = () => { hcard.hidden = true; hcard.classList.remove('going'); hcard.style.transform = ''; };
  if (hcard.hidden || now) { settle(hcard); gone(); return; }
  leave(hcard, gone, hcard.classList.contains('docked') ? 'going' : 'leaving');
}

/* ---------- on a phone, the card is a sheet docked to the bottom edge ----------
   A phone is the narrow layout the tools button and the menu use (≤900 px), with no pointer that hovers: there a card
   floating by its link lands under the thumb and over the lines around it, somewhere new each time. Docked, it is the
   same card in one place, and not modal: no scrim, nothing locked, the page readable and scrollable behind it. Its link
   stays marked while it is up, a tap on another link swaps what it says, and a second tap on the same link (or Open)
   opens the page. It goes on a tap elsewhere, Escape, opening a page, reading on, or a swipe down. */
export const docked = () => narrow() && !matchMedia('(hover: hover)').matches;
/* reading on: two lines or so of scrolling sends the sheet away, since what comes next is the text it covers; a
   finger's wobble on a tap, or the page settling, moves far less */
const HC_READ_ON = 56;
let hcNudge = 0;
/* the sheet never hides the phrase it belongs to: if it would, the page moves up by the least that keeps the link's
   line in sight above it, and stays there when the sheet goes */
function clearOfSheet(a) {
  const rs = a.getClientRects(); const line = rs[rs.length - 1]; if (!line) return;
  const top = innerHeight - parseFloat(getComputedStyle(hcard).bottom) - hcard.offsetHeight; const by = Math.ceil(line.bottom + 12 - top);
  if (by <= 0) return;
  hcY = scrollY + by; hcNudge = Date.now() + 700;
  scrollBy({ top: by, behavior: reducedMotion() ? 'auto' : 'smooth' });
}
/* a swipe down on the sheet takes it away; a short one lets it settle back */
let drag = null;
function dragStart(e) { if (!hcard.classList.contains('docked') || e.touches.length !== 1) return; const y = e.touches[0].clientY, t = performance.now(); drag = { y0: y, dy: 0, y, t, v: 0 }; hcard.classList.add('dragging'); }
function dragMove(e) {
  if (!drag) return; e.preventDefault();
  const y = e.touches[0].clientY, t = performance.now(); drag.v = (y - drag.y) / Math.max(1, t - drag.t); drag.y = y; drag.t = t;
  drag.dy = Math.max(0, y - drag.y0); hcard.style.transform = drag.dy ? `translateY(${drag.dy}px)` : '';
}
function dragEnd() {
  if (!drag) return; const d = drag; drag = null; hcard.classList.remove('dragging');
  if (d.dy > 64 || (d.dy > 12 && d.v > .45)) dropSheet(); else hcard.style.transform = '';
}
function dropSheet() { hcard.style.transform = ''; hideCard(); }
/* the page's own resize (a phone's toolbar folding away as it scrolls) keeps the sheet; a new width does not */
export const keepsSheet = () => !hcard.hidden && hcard.classList.contains('docked') && docked();

/* ================= paragraph menu ================= */
export let pmenu; export let pm = null;
export function openPMenu(btn) {
  pm = { i: +btn.dataset.i, btn };
  $$('.ptool[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  btn.setAttribute('aria-expanded', 'true'); stay(pmenu); pmenu.hidden = false;
  const r = btn.getBoundingClientRect(); const x = Math.max(12, Math.min(r.left, innerWidth - 250));
  pmenu.style.left = `${x + scrollX}px`; pmenu.style.top = `${r.bottom + 6 + scrollY}px`;
  $('button', pmenu).focus();
}
/* the menu is closed the moment it is asked to close (pm is null); it leaves the way it came, and `now` takes it at once */
export function closePMenu(refocus, now = false) {
  if (!pm) { if (now) settle(pmenu); return; }
  pm.btn.setAttribute('aria-expanded', 'false'); if (refocus && pm.btn.isConnected) pm.btn.focus(); pm = null;
  if (now) { settle(pmenu); pmenu.hidden = true; } else leave(pmenu, () => { pmenu.hidden = true; });
}

/* touch: a tap on a paragraph shows its ¶ button; a tap anywhere else hides it again */
export function tapPara(t) {
  const pb = t.closest('.pb'); if (pb && t.closest('a,button,.xp,.mcol')) return;
  $$('.pb.tapped').forEach(x => { if (x !== pb) x.classList.remove('tapped'); });
  if (pb) pb.classList.toggle('tapped');
}

/* ================= selection → a new page, in the sense it had here ================= */
let digSel; let selInfo = null;
/* the selection's button is a raised surface: it arrives as one does and leaves the way it came (what opens, closes);
   a move to another view clears it at once */
export function hideSel(now = false) {
  selInfo = null; if (digSel.hidden) return;
  if (now) { settle(digSel); digSel.hidden = true; } else leave(digSel, () => { digSel.hidden = true; });
}
function checkSel() {
  const sel = getSelection(); if (!sel || sel.isCollapsed || !CUR) return hideSel();
  const txt = sel.toString().replace(/\s+/g, ' ').trim();
  const a = sel.anchorNode && /** @type {HTMLElement} */ (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
  const body = a && a.closest('.a-body');
  if (txt.length < 3 || txt.length > 90 || !body) return hideSel();
  const r = sel.getRangeAt(0).getBoundingClientRect(); if (!r.width) return hideSel();
  selInfo = { txt }; stay(digSel);
  digSel.textContent = `Open a page on “${clip(txt, 32)}”`; digSel.hidden = false;
  /* centred over the selection, and whole on the screen however long the selection's longest word */
  const w = digSel.offsetWidth;
  digSel.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + scrollX}px`;
  digSel.style.top = `${r.top + scrollY - 50}px`;
}
export let selT = 0;

/* written from other modules */
export function setSelT(v) { return (selT = v); }

/* What this module does when the page starts. main.js runs these in order, after every module has loaded. */
export function init() {
$('#topT').addEventListener('click', () => scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }));
/* a page grows as it arrives, which moves the reader's place without a scroll: the lamps follow the page's length too */
new ResizeObserver(() => updateProg()).observe($('#view'));
addEventListener('scroll', () => {
  if (!scrollQ) { scrollQ = true; requestAnimationFrame(() => { scrollQ = false; updateProg(); document.body.classList.toggle('scrolled', scrollY > 4); syncTopTitle(); if (!hcard.hidden && Date.now() > hcNudge && Math.abs(scrollY - hcY) > (hcard.classList.contains('docked') ? HC_READ_ON : 90)) hideCard(); }); }
  /* noted for this address only: a move in between (a click, back) must not hand this page's place to the next one */
  clearTimeout(scrollT); const at = location.href; scrollT = setTimeout(() => { if (location.href === at) rememberScroll(); }, 160);
}, { passive: true });
hcard = $('#hcard');
hcard.addEventListener('touchstart', dragStart, { passive: true });
hcard.addEventListener('touchmove', dragMove, { passive: false });
hcard.addEventListener('touchend', dragEnd); hcard.addEventListener('touchcancel', dragEnd);
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') lastTouch = Date.now(); }, true);
document.addEventListener('mouseover', e => {
  const a = /** @type {HTMLElement} */ (e.target).closest && /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (e.target).closest('a.hole,a.card'));
  if (a) pfIntent(a);
  if (a && a.matches('a.hole') && matchMedia('(hover: hover)').matches) { clearTimeout(hideTimer); clearTimeout(hcTimer); if (!hc || hc.a !== a) hcTimer = setTimeout(() => showCard(a), 240); }
  else if (/** @type {HTMLElement} */ (e.target).closest && /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (e.target).closest('#hcard'))) clearTimeout(hideTimer);
});
document.addEventListener('mouseout', e => {
  if (!matchMedia('(hover: hover)').matches || Date.now() - lastTouch < 900) return;
  const a = /** @type {HTMLElement} */ (e.target).closest && /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (e.target).closest('a.hole,#hcard')); if (!a) return;
  /* a card in the margin is further from its link, so it waits a little longer for the pointer to reach it */
  clearTimeout(hcTimer); hideTimer = setTimeout(hideCard, hcard.classList.contains('in-margin') ? 520 : 240);
});
document.addEventListener('focusin', e => { const a = /** @type {HTMLElement} */ (e.target).closest && /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (e.target).closest('a.hole,a.card')); if (a) pfIntent(a); if (a && a.matches('a.hole') && /** @type {HTMLElement} */ (e.target).matches(':focus-visible')) showCard(a); });
hcard.addEventListener('click', e => {
  const b = e.target.closest('[data-hc]'); if (!b || !hc) return; const c = hc; hideCard();
  if (b.dataset.hc === 'open') openTopic(c.target, { via: 'link', src: c.a });
  else if (b.dataset.hc === 'lens') openTopic(c.target, { via: 'link', src: c.a, lens: b.dataset.lens });
  else peek(curPage(), c.target, c.label, c.i);
});
pmenu = $('#pmenu');
pmenu.addEventListener('click', e => { const b = e.target.closest('[data-uf]'); if (!b || !pm) return; const x = pm; closePMenu(); unfold(curPage(), x.i, b.dataset.uf); });
pmenu.addEventListener('keydown', e => {
  const items = $$('button', pmenu); const i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  else if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); closePMenu(true); }
});
digSel = $('#digSel');
document.addEventListener('selectionchange', () => { clearTimeout(selT); selT = setTimeout(checkSel, 180); });
digSel.addEventListener('mousedown', e => e.preventDefault());
/* a name chosen inside a page keeps the sense it had there: "Mercury" on a page about planets is the planet */
digSel.addEventListener('click', () => { if (!selInfo) return; const s = selInfo; getSelection().removeAllRanges(); hideSel(); const p = curPage(); openTopic(s.txt, { via: 'select', ctx: p ? p.title : '' }); });
}

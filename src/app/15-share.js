/* ================= sharing: a page, or the trail that led to it, as a link =================
   A page's address is clean (dorkhub.com/black-holes), and its head says what it is (lib/share.js), so sharing just
   hands the address on: to the phone's share sheet where there is one, else to the clipboard. Nothing is reported.
   A trail travels as /trail/<a>/<b>/<c> (trailRouteOf in src/shared/world.js). Opened, it is drawn the way a page's end
   draws its threads, and each of its pages opens like a link from outside: free and at once when it is written,
   otherwise only once the reader asks for it to be written. */
async function shareLink(path, title) {
  const url = location.origin + path;
  if (navigator.share && matchMedia('(pointer: coarse)').matches) { try { await navigator.share({ title, url }); } catch (e) { /* closed, or not allowed */ } return; }
  try { await navigator.clipboard.writeText(url); toast('Link copied.'); } catch (e) { toast('Copying isn’t allowed here. The address is in the bar above.'); }
}
let TRAIL = null, WALK = null;
function shareHere() { const p = VIEW === 'page' && curPage(); if (p) shareLink(routeOf(p.req), p.title); else if (VIEW === 'trail') shareLink(trailRouteOf(TRAIL.steps), TRAIL.title); }
const trailTitle = names => names.length > 1 ? `From ${names[0]} to ${names[names.length - 1]}` : names[0];
/* how you got here: the trail you're on, up to the page you're on */
function shareTrail(t = curTrail()) {
  const ps = trailPages(t); const i = ps.findIndex(p => p.id === CUR); const at = i < 0 ? ps : ps.slice(0, i + 1);
  if (at.length) shareLink(trailRouteOf(at.map(p => p.req)), trailTitle(at.map(p => p.title)));
}
function showTrail(steps) {
  setView('trail'); CUR = ''; document.documentElement.dataset.accent = 'concept';
  const st = steps.map(s => { const p = pageOf(pageId(s)); const d = DOORS.find(x => topicKey(x.t) === topicKey(s.title)) || {}; return { s, read: worldIndex().read.get(nodeKeyOf(s)), title: (p && p.status !== 'empty' && p.title) || d.t || s.title, kind: (p && p.kind) || d.k || '', hook: d.h || plain((p && p.deck) || '') }; });
  const title = trailTitle(st.map(x => x.title)); TRAIL = { steps, title }; document.title = `${title}: dorkhub`;
  $('#view').innerHTML = `<div class="column" id="column">${chamberHTML({ id: '', title, req: {} })}</div>`;
  setHTML($('.where'), '<span class="kind plain">A trail</span>');
  setHTML($('.tools'), `<button class="tool ib" type="button" data-act="share"${tipAttrs('Share this trail')}>${ic('share')}</button>`);
  setHTML($('.h-main'), `<h1 class="a-title" tabindex="-1">${esc(title)}</h1><p class="deck">${st.length > 1 ? `${st.length} pages, in the order they were read.` : 'One page, shared.'}</p>`);
  setHTML($('.a-end'), `<div class="eblock"><div class="fan tr"><svg class="fan-svg" aria-hidden="true"></svg><div class="fan-out">${st.map((x, i) => `<a class="card fan-door${x.read ? ' is-read' : ''}" href="${esc(routeOf(x.s))}" data-walk="${i}"${kattr(x.kind)}><i class="fan-dot"></i><span class="cd-top"><span class="kind"${kattr(x.kind)}>${esc(capFirst(x.kind))}</span>${x.read ? '<span class="cd-read">Read</span>' : ''}</span><span class="cd-t">${esc(x.title)}</span>${x.hook ? `<span class="cd-h">${esc(x.hook)}</span>` : ''}</a>`).join('')}</div></div></div>`);
  const el = $('#view .eblock'); requestAnimationFrame(() => drawTrail(el));
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => drawTrail(el)).observe(el);
  if (reducedMotion()) el.classList.add('fan-drawn', 'fan-settled'); else requestAnimationFrame(() => { el.classList.add('fan-drawn'); setTimeout(() => el.classList.add('fan-settled'), 1600); });
  window.scrollTo(0, (history.state && history.state.y) || 0); updateProg(); renderWorldBtn();
  if (!FIRST) $('.a-title').focus({ preventScroll: true });
}
/* a thread from each page of the trail to the next, bowed like a page's own threads; straight on a phone */
function drawTrail(el) {
  const svg = $('.fan-svg', el); if (!svg.isConnected) return; const bow = fanNarrow() ? 0 : 30;
  const box = el.getBoundingClientRect(); const at = $$('.fan-dot', el).map(d => { const r = d.getBoundingClientRect(); return [r.left + 5.5 - box.left, r.top + 5.5 - box.top, d.parentNode]; });
  svg.setAttribute('viewBox', `0 0 ${Math.round(box.width)} ${Math.round(box.height)}`);
  svg.innerHTML = at.slice(1).map(([x, y, d], i) => { const [a, b] = at[i], k = (y - b) / 3; return `<path class="fan-t${d.classList.contains('is-read') ? ' read' : ''}"${kattr(d.dataset.kind)} style="--i:${i}" d="M${a} ${b}C${a - bow} ${b + k},${x - bow} ${y - k},${x} ${y}" pathLength="1"/>`; }).join('');
}
/* a page of a shared trail opens as a link from outside does (showPage's guard), and joins your own trail from the
   step before it, when you have that one */
function walk(i) {
  const s = TRAIL.steps[i], p = pageOf(pageId(s)), prev = i > 0 && pageOf(pageId(TRAIL.steps[i - 1]));
  WALK = { id: pageId(s), from: prev ? prev.id : null };
  if (p && p.text && p.status !== 'empty') { addStep(store.trails, p.id, { from: WALK.from, via: 'trail' }); p.last = Date.now(); save(); }
  go(routeOf(s));
}

/* ================= the end of a page: where to go next, then your own question ================= */
function rowHTML({ mark, title, hook, cls = '', attrs = '', markTip = '', href = '' }) {
  const tag = href ? 'a' : 'button';
  return `<${tag} class="row${cls}"${href ? ` href="${esc(href)}"` : ' type="button"'} ${attrs}><span class="rk"${markTip ? ` data-tip="${esc(markTip)}"` : ' aria-hidden="true"'}>${mark}</span><span class="rt">${title}</span>${hook ? `<span class="rh">${hook}</span>` : ''}</${tag}>`;
}
function rowsBlock(el, heading, rows) {
  if (!el._built) { el.innerHTML = `<h2 class="eh"></h2><div class="rows"></div>`; el._built = true; }
  setHTML($('.eh', el), heading);
  patch($('.rows', el), rows);
}
/* ================= where it leads: the page as a point on its threads =================
   The six ways on, drawn as threads out of this page, the way the front page draws its map of threads and Your world
   draws what you have read: this page a solid point (and the page you came from behind it), each way on a ring at the
   end of its thread, named as the front page names its cards (its kind in small capitals, its title, its hook). A topic
   you've read is solid; one that your other pages lead to too says which. The threads draw in once, the first time the
   end of a page comes into view, and this page pings as it joins your world. On a phone the threads hang from one stem. */
function fanBlock(el, items, p, complete) {
  if (!el._built) { el.innerHTML = `<h2 class="eh">Where it leads</h2><div class="fan"><svg class="fan-svg" aria-hidden="true"></svg><div class="fan-in"></div><div class="fan-out"></div></div>`; el._built = true; watchFan(el, p); }
  patch($('.fan-out', el), items);
  /* the point and the threads wait until all six ways on are there, so nothing moves while they arrive */
  const from = complete ? fromOf(p) : null;
  setHTML($('.fan-in', el), complete ? `${from ? `<a class="fan-from" href="${esc(routeOf(from.req))}" data-goto="${esc(from.id)}"${kattr(from.kind)}><i class="fan-dot"></i><span>From</span><b>${esc(clip(from.title, 34))}</b></a>` : ''}<p class="fan-me"${kattr(p.kind || (ACC && ACC.kind) || '')}><i class="fan-dot"></i><b>${esc(clip(p.title, 48))}</b></p>` : '');
  el.classList.toggle('fan-ready', complete);
  /* while a page streams it is painted every frame: the threads are redrawn only when the ways on change */
  const sig = `${complete}|${items.map(it => it.k + it.cls).join()}`; if (el._fan !== sig) { el._fan = sig; requestAnimationFrame(() => drawFan(el)); }
}
const fanNarrow = () => matchMedia('(max-width: 560px)').matches;
function drawFan(el) {
  const fan = $('.fan', el); const svg = fan && $('.fan-svg', fan); const me = fan && $('.fan-me .fan-dot', fan);
  if (!svg) return; if (!me || fanNarrow()) { svg.innerHTML = ''; return; }
  const box = fan.getBoundingClientRect(); const at = d => { const r = d.getBoundingClientRect(); return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top]; };
  const [mx, my] = at(me); const out = [];
  const fromDot = $('.fan-from .fan-dot', fan);
  if (fromDot) { const [fx, fy] = at(fromDot); out.push(`<path class="fan-t in" style="--i:0" d="M${fx} ${fy}C${fx} ${(fy + my) / 2},${fx} ${my},${mx} ${my}" pathLength="1"/>`); }
  $$('.fan-door', fan).forEach((door, i) => {
    const [x, y] = at($('.fan-dot', door)); const k = (x - mx) * .55;
    out.push(`<path class="fan-t${door.classList.contains('is-read') ? ' read' : ''}" data-n="${i + 1}"${door.dataset.kind ? ` data-kind="${door.dataset.kind}"` : ''} style="--i:${i + 1}" d="M${mx} ${my}C${mx + k} ${my},${x - k} ${y},${x} ${y}" pathLength="1"/>`);
  });
  svg.setAttribute('viewBox', `0 0 ${Math.round(box.width)} ${Math.round(box.height)}`); svg.innerHTML = out.join('');
}
/* redrawn when the column changes width; drawn in, once, the first time it comes into view */
const FAN_SEEN = new Set();
function watchFan(el, p) {
  if (typeof ResizeObserver === 'function') { const ro = new ResizeObserver(() => drawFan(el)); ro.observe(el); }
  if (reducedMotion() || FAN_SEEN.has(p.id) || typeof IntersectionObserver !== 'function') { el.classList.add('fan-drawn', 'fan-settled'); FAN_SEEN.add(p.id); return; }
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting) || !el.classList.contains('fan-ready')) return; io.disconnect(); FAN_SEEN.add(p.id);
    /* new to your world this visit: it pings as it joins */
    if ((p.first || 0) >= BOOT) el.classList.add('fan-new');
    el.classList.add('fan-drawn'); setTimeout(() => el.classList.add('fan-settled'), 1600);
  }, { threshold: .35 });
  io.observe(el);
}
/* which of your other pages lead to a topic too (not this one, nor the one you came from, which says nothing new):
   the latest of them, and how many more */
function alsoOn(target, p) {
  const came = (fromOf(p) || {}).id;
  const ids = (worldIndex().back.get(topicKey(target)) || []).filter(id => id !== p.id && id !== came); if (!ids.length) return '';
  const pages = ids.map(pageOf).filter(Boolean).sort((a, b) => (b.last || 0) - (a.last || 0)); if (!pages.length) return '';
  return `Also on ${esc(clip(pages[0].title, 32))}${pages.length > 1 ? ` and ${pages.length - 1} more of your pages` : ''}`;
}
const KEY_FIX = ['bad_key', 'key_limit', 'model_unavailable'];
/* three pages written ahead of time, the same three for a page every time it is painted */
function freeDoors(p) {
  const at = [...String(p.id)].reduce((a, c) => a + c.charCodeAt(0), 0) % DOORS.length;
  return [...DOORS.slice(at), ...DOORS.slice(0, at)].filter(d => topicKey(d.t) !== topicKey(p.title)).slice(0, 3);
}
function statusNote(p) {
  const code = p.errorCode; const doors = `<div class="sn-doors">${freeDoors(p).map(d => doorHTML(d, false)).join('')}</div>`;
  /* nothing new can be written for free right now, but the pages written ahead of time still open */
  if (p.status === 'error' && code === 'trial_paused') return `<div class="statusnote paused"><h2>Free pages are paused right now</h2><p>Nothing was taken from your free pages. Try again in a while, use your own key, or open one of these: they were written ahead of time, so they’re free and instant.</p>${doors}<div class="sn-a"><button class="btn ghost" type="button" data-act="retry">Try again</button><button class="btn ghost" type="button" data-act="keys">Use your own key</button></div></div>`;
  if (p.status === 'error' && code === 'trial_over') return `<div class="statusnote paywall"><h2>You’ve read your free pages</h2><p>Keep going with your own API key from Anthropic or Vercel AI Gateway. Pages then cost from about a tenth of a cent each, billed to you by the provider, and every tool keeps working. Dorkhub Pro, with no keys at all, is on its way. Pages written ahead of time stay free:</p>${doors}<div class="sn-a"><button class="btn glow" type="button" data-act="keys">Add a key</button></div></div>`;
  if (p.status === 'error' || p.status === 'offline') return `<div class="statusnote"><h2>That page didn’t come through</h2><p>${esc(p.error || errText())}</p><div class="sn-a">${KEY_FIX.includes(code) ? '<button class="btn glow" type="button" data-act="keys">Open Keys</button>' : ''}<button class="btn${KEY_FIX.includes(code) ? ' ghost' : ' glow'}" type="button" data-act="retry">Try again</button></div></div>`;
  if (p.status === 'partial') return `<div class="statusnote"><h2>This page stopped partway</h2><p>${esc(p.error || 'It was left unfinished.')}</p><button class="btn glow" type="button" data-act="retry">Finish it</button></div>`;
  return '';
}
function paintEnd(p, sec, A, live) {
  const end = $('.a-end', sec); const blocks = [];
  /* a page that didn't come through says so first, right where its text stops, and asks nothing of the reader */
  const failed = p.status === 'error' || p.status === 'offline';
  const st = statusNote(p); if (st) blocks.push({ k: 'status', html: st });
  const cards = cardsOf(A).map((c, i) => {
    const read = worldIndex().read.get(topicKey(c.target)); const kind = c.kind || (A.gloss[keyOf(c.target)] || {}).kind || '';
    const also = read ? '' : alsoOn(c.target, p);
    return { k: 'c' + keyOf(c.target), tag: 'a', cls: `card fan-door${read ? ' is-read' : ''}`, attrs: { href: routeOf({ title: c.target, lens: store.settings.lens }), 'data-t': c.target, 'data-n': String(i + 1), ...(kindOf(kind) ? { 'data-kind': kindOf(kind) } : {}) },
      html: `<i class="fan-dot" aria-hidden="true"></i><span class="cd-top">${kindOf(kind) ? `<span class="kind"${kattr(kind)}>${esc(capFirst(kind))}</span>` : '<span></span>'}${read ? `<span class="cd-read" data-tip="You read this ${esc(relTime(read.last))}">Read</span>` : matchMedia('(hover: hover)').matches ? `<kbd class="cd-n" data-tip="Press ${i + 1}">${i + 1}</kbd>` : ''}</span><span class="cd-t">${esc(c.label)}</span>${c.teaser ? `<span class="cd-h">${inline(capFirst(plain(c.teaser)), p)}</span>` : ''}${also ? `<span class="fan-also">${also}</span>` : ''}` };
  });
  if (cards.length) blocks.push({ k: 'cards', cards, complete: !live || A.questions.length > 0 || cards.length >= 6 });
  if (A.questions.length) blocks.push({ k: 'qs', rows: A.questions.map((q, i) => ({ k: 'q' + i, html: rowHTML({ mark: '?', markTip: 'Opens a page that answers it', title: esc(q), href: routeOf({ title: q, q: true, lens: store.settings.lens }), attrs: `data-q="${esc(q)}" data-kind="mystery"` }) })), heading: 'Open questions' });
  if (!failed && (!live || A.bodyDone)) blocks.push({ k: 'ask', html: `<form class="ask" autocomplete="off"><label class="sr" for="ask-in">Ask your own question</label><span class="rk" aria-hidden="true">?</span><input id="ask-in" placeholder="Ask your own question" maxlength="160"><button class="ask-go" type="submit" aria-label="Open a page that answers it">↵</button></form>` });
  const existing = new Map(); for (const el of end.children) if (el.dataset.k) existing.set(el.dataset.k, el);
  let prev = null; const anim = !reducedMotion();
  for (const b of blocks) {
    let el = existing.get(b.k);
    if (el) existing.delete(b.k); else { el = document.createElement('div'); el.dataset.k = b.k; el.className = ((b.rows || b.cards ? 'eblock' : '') + (anim ? ' enter' : '')).trim(); }
    if (b.cards) fanBlock(el, b.cards, p, b.complete); else if (b.rows) rowsBlock(el, b.heading, b.rows); else setHTML(el, b.html);
    place(end, el, prev); prev = el;
  }
  existing.forEach(el => el.remove());
  watchEnd(p, end);
}
/* the tools: Save first, then the ones that open something beside the page, then the rest in a menu */
function paintTools(p, sec) {
  const t = []; const ready = p.status === 'done' && !REV.has(p.id);
  const b = (act, icon, label, key, on = true, extra = '', cls = '') => `<button class="tool ib${cls}" type="button" data-act="${act}"${tipAttrs(label, key)}${on ? '' : ' disabled'}${extra}>${ic(icon)}</button>`;
  const mi = (act, label, key, on = true, cls = '') => `<button class="mi${cls}" type="button" data-act="${act}"${on ? '' : ' disabled'}>${label}${key ? ` <kbd>${key}</kbd>` : ''}</button>`;
  if (p.status === 'digging') t.push(b('stop', 'stop', 'Stop writing', '', true, '', ' stop'));
  /* a page that didn't come through has nothing to save, sketch, hear or quiz */
  if (p.status === 'error' || p.status === 'offline') { setHTML($('.tools', sec), t.join('')); return; }
  t.push(b('save', 'star', p.saved ? 'Saved. Click to unsave' : 'Save this page', 'S', p.status !== 'empty', ` aria-pressed="${!!p.saved}"`, ' save'));
  t.push(b('share', 'share', 'Share this page', '', p.status !== 'empty'));
  const connect = worldIndex().read.size > 1;
  const sketchLabel = p.figure && p.figure !== 'loading' ? 'Show the sketch' : 'Sketch it: a diagram of this page';
  t.push(b('sketch', 'sketch', sketchLabel, 'K', ready, '', ' tw'));
  t.push(b('land', 'around', 'Around this: the topics nearby', 'L', ready, '', ' tw'));
  if (connect) t.push(b('bridge', 'connect', 'Connect to another topic you’ve read', 'C', ready, '', ' tw'));
  if (TTS) t.push(b('listen', SPEAK.id === p.id ? 'stop' : 'listen', SPEAK.id === p.id ? 'Stop listening' : 'Listen', 'P', ready, ` aria-pressed="${SPEAK.id === p.id}"`, ' tw'));
  const more = [mi('sketch', sketchLabel, 'K', ready, ' tn'), mi('land', 'Around this', 'L', ready, ' tn')];
  if (connect) more.push(mi('bridge', 'Connect to another topic', 'C', ready, ' tn'));
  if (TTS) more.push(mi('listen', SPEAK.id === p.id ? 'Stop listening' : 'Listen', 'P', ready, ' tn'));
  more.push(mi('trail', 'How did I get here?', 'T', true));
  more.push(mi('doubt', 'Skeptic mode', 'D', ready));
  more.push(mi('recall', 'What stuck? A quick quiz', 'Q', true));
  more.push(mi('rewrite', `Rewrite as ${esc(LENSES[store.settings.lens][0].toLowerCase())}`, 'R', p.status !== 'digging'));
  more.push(`<button class="mi keys-mi" type="button" data-act="help">All shortcuts <kbd>?</kbd></button>`);
  t.push(`<details class="more"><summary class="tool ib"${tipAttrs('More')}>${ic('more')}</summary><div class="more-pop" role="menu">${more.join('')}</div></details>`);
  const tools = $('.tools', sec); if ($('details.more[open]', tools)) return;
  setHTML(tools, t.join(''));
}
/* Save: one star. Saved pages keep their text in this browser and gather in Your world. */
function toggleSave(p) {
  if (!p || p.status === 'empty') return;
  p.saved = p.saved ? 0 : Date.now(); save(); touchWorld();
  const sec = secFor(p.id); if (sec) paintTools(p, sec);
  const btn = sec && $('.tool.save', sec); if (btn && p.saved && !reducedMotion()) { btn.classList.remove('is-popping'); void btn.offsetWidth; btn.classList.add('is-popping'); }
  syncFab(); toast(p.saved ? 'Saved to Your world.' : 'Removed from saved.');
}
function paintDoubt(p, sec) {
  const el = $('.a-doubt', sec); if (!el) return;
  if (!p.doubts) { setHTML(el, ''); return; }
  if (p.doubts === 'loading') { setHTML(el, `<div class="doubt enter"><h2>Skeptic mode</h2><p class="digging">${waitHTML('searching', 'Reading this page with a raised eyebrow')}</p></div>`); return; }
  if (typeof p.doubts === 'string') { setHTML(el, `<div class="doubt"><h2>Skeptic mode</h2><p>${esc(p.doubts)}</p></div>`); return; }
  const label = { solid: 'Solid', check: 'Check', shaky: 'Shaky' };
  const h = `<div class="doubt"><h2>Skeptic mode</h2><p>The claims on this page most worth verifying before you repeat them, highlighted in the text above.</p><ol>${p.doubts.map(d => `<li><span class="r ${d.rating}">${label[d.rating]}</span><q>${esc(d.quote)}</q><p>${esc(d.note)}</p></li>`).join('')}</ol></div>`;
  if (el._h === h && $('mark.dq', sec)) return; setHTML(el, h);
  const body = $('.a-body', sec);
  for (const d of p.doubts) {
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT); let t;
    while ((t = walker.nextNode())) {
      if (t.parentElement.closest('mark,.mnote,.xp')) continue;
      const i = t.data.indexOf(d.quote); if (i < 0) continue;
      const r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + d.quote.length);
      const mk = document.createElement('mark'); mk.className = 'dq'; mk.title = d.note; r.surroundContents(mk); break;
    }
  }
}
async function doubtPage(p = curPage()) {
  if (!p || p.status !== 'done' || p.doubts === 'loading') return;
  p.doubts = 'loading'; paint(p); const sec = secFor(p.id); if (sec) $('.a-doubt', sec).scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
  const A = parsed(p); const txt = [A.deck, ...panelLines(A), ...A.blocks.map(b => b.s)].map(plain).join('\n');
  try {
    const out = await writeJSON('doubt', { page: clip(txt, 9000) });
    const list = (Array.isArray(out) ? out : []).filter(d => d && d.quote).slice(0, 5).map(d => ({ quote: String(d.quote).trim().replace(/^["“]|["”]$/g, ''), note: String(d.note || ''), rating: ['solid', 'check', 'shaky'].includes(d.rating) ? d.rating : 'check' }));
    p.doubts = list.length ? list : 'Nothing specific enough to flag. Still: check before you quote.';
  } catch (e) { p.doubts = errText(e?.code); }
  save(); paint(p);
}

/* ================= peeks & paragraph expansions: small, on demand, kept with the page ================= */
function blockText(p, i) { const b = parsed(p).blocks[i]; return b ? plain(b.s) : ''; }
async function streamSmall(p, holder, task, input) {
  let q = false;
  try {
    const { text } = await write(task, input, { onText: ({ text }) => { holder.text = text; if (!q) { q = true; requestAnimationFrame(() => { q = false; paint(p, true); }); } } });
    holder.text = text.trim(); holder.status = 'done';
  } catch (e) { holder.text = errText(e?.code); holder.status = 'error'; }
  save(); paint(p);
}
function peek(p, target, label, i) {
  if (!p) return;
  p.peeks = p.peeks || []; const key = keyOf(target);
  const ex = p.peeks.find(x => x.key === key);
  if (ex && ex.status !== 'error') { ex.open = true; ex.after = i; paint(p); return; }
  if (ex) p.peeks.splice(p.peeks.indexOf(ex), 1);
  const pk = { key, target, label, after: i, text: '', status: 'digging', open: true }; p.peeks.push(pk); paint(p);
  streamSmall(p, pk, 'peek', { ...ctxInput(p), passage: clip(blockText(p, i), 600), target });
}
function unfold(p, i, mode) {
  if (!p) return;
  p.unfolds = p.unfolds || {}; p.unfolds[i] = { mode, text: '', status: 'digging' };
  const sec = secFor(p.id); const old = sec && $(`.pb[data-i="${i}"] .px [data-k="u"]`, sec); if (old) old.remove();
  paint(p);
  streamSmall(p, p.unfolds[i], 'unfold', { ...ctxInput(p), paragraph: clip(blockText(p, i), 900), mode });
}

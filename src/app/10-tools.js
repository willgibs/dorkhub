/* ================= the sidebar: Your world beside the page, your index, your trails, deep time ================= */
let SIDE = 'world', IDXQ = '', IDXSORT = 'az', IDXKIND = '';
const narrow = () => matchMedia('(max-width: 900px)').matches;
const sideClosed = () => store.settings.side !== 'open' || narrow();
/* the sidebar opens and closes from its toggle in the top bar (or M); closed, it takes no room at all */
function applySide() {
  const open = store.settings.side === 'open'; document.body.classList.toggle('side-closed', !open);
  const b = $('#sideBtn'); if (!b) return; const label = open ? 'Close the sidebar' : 'Open the sidebar';
  b.setAttribute('aria-expanded', String(open)); b.dataset.tip = label; b.setAttribute('aria-label', label);
}
function renderSide() {
  if (VIEW !== 'page') return;
  if (sideClosed()) { sleepMini(); return; }
  $$('[data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === SIDE)));
  for (const k of ['world', 'index', 'trails', 'time']) $(`#${k}Pane`).hidden = SIDE !== k;
  if (SIDE !== 'world') sleepMini();
  if (SIDE === 'world') renderMini(); else if (SIDE === 'index') renderIndex(); else if (SIDE === 'trails') renderTrails(); else renderTime();
}
function toggleSide(open) {
  store.settings.side = (open ?? store.settings.side !== 'open') ? 'open' : 'rail'; save(); applySide(); renderSide();
}

/* ---------- index: everything you've met ---------- */
function renderIndex() {
  const pane = $('#indexPane');
  if (!pane.dataset.built) {
    pane.innerHTML = `<div class="ix-tools"><label class="sr" for="ixq">Filter the index</label><input id="ixq" type="search" placeholder="Filter everything you’ve met" autocomplete="off"><div class="ix-sort" role="group" aria-label="Sort the index"><button type="button" data-ixsort="az">A–Z</button><button type="button" data-ixsort="echo">Most mentioned</button></div><div class="ix-kinds" id="ixKinds" role="group" aria-label="Filter by kind"></div></div><div class="ix-list" id="ixList"></div>`;
    pane.dataset.built = '1';
    $('#ixq').addEventListener('input', e => { IDXQ = e.target.value.trim().toLowerCase(); renderIndexList(); });
  }
  $$('[data-ixsort]', pane).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ixsort === IDXSORT)));
  renderIndexList();
}
function renderIndexList() {
  const all = buildIndex(); const read = all.filter(e => e.page).length;
  $('#sideStats').textContent = `${all.length} things you’ve met, ${read} read`;
  const kinds = [...new Set(all.map(e => kindOf(e.kind)).filter(Boolean))].sort((a, b) => Object.keys(KIND_LABEL).indexOf(a) - Object.keys(KIND_LABEL).indexOf(b));
  if (IDXKIND && !kinds.includes(IDXKIND)) IDXKIND = '';
  const kx = $('#ixKinds'); if (kx) kx.innerHTML = kinds.length > 1 ? kinds.map(k => `<button type="button" data-ixkind="${k}" data-kind="${k}" aria-pressed="${IDXKIND === k}"><i></i>${KIND_LABEL[k]}</button>`).join('') : '';
  const list = all.filter(e => (!IDXKIND || kindOf(e.kind) === IDXKIND) && (!IDXQ || e.name.toLowerCase().includes(IDXQ) || (e.gloss || '').toLowerCase().includes(IDXQ)));
  if (IDXSORT === 'echo') list.sort((a, b) => b.mentions.size - a.mentions.size || a.name.localeCompare(b.name));
  else list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  let h = '', letter = '';
  for (const e of list.slice(0, 600)) {
    if (IDXSORT === 'az') { const L = (e.name.replace(/^(the|a|an)\s+/i, '')[0] || '#').toUpperCase(); const LL = /[A-Z]/.test(L) ? L : '#'; if (LL !== letter) { letter = LL; h += `<h3>${LL}</h3>`; } }
    h += `<button class="ix${e.page ? ' is-read' : ''}" type="button" data-ix="${esc(e.key)}"${kattr(e.kind)}><span class="ix-n"><i class="kdot" aria-hidden="true"></i>${esc(e.name)}${e.page ? '<i>read</i>' : ''}</span>${e.gloss ? `<span class="ix-g">${esc(e.gloss)}</span>` : ''}<span class="ix-m">${e.kind ? esc(e.kind) + ', ' : ''}${e.mentions.size ? `on ${e.mentions.size} of your page${e.mentions.size === 1 ? '' : 's'}` : 'a page you read'}</span></button>`;
  }
  $('#ixList').innerHTML = h || `<p class="ix-empty">${IDXQ ? `Nothing you’ve met matches “${esc(IDXQ)}”.` : 'The index fills in as pages finish writing.'}</p>`;
}
function openIndexEntry(key) {
  const e = buildIndex().find(x => x.key === key); if (!e) return;
  if (e.page) { if (e.page.id !== CUR) { addStep(store.trails, e.page.id, { from: CUR || null, via: 'index' }); save(); go(routeOf(e.page.req)); } return; }
  openTopic(e.name, { via: 'index' });
}

/* ---------- trails: each sitting, newest first ---------- */
function renderTrails() {
  const ts = store.trails.filter(t => t.steps.some(s => pageOf(s[0])));
  $('#sideStats').textContent = `${ts.length} trail${ts.length === 1 ? '' : 's'}`;
  $('#trailsPane').innerHTML = ts.length ? `<ol class="trails">${ts.map((t, i) => {
    const ps = trailPages(t); const last = t.steps[t.steps.length - 1][1];
    return `<li><button type="button" data-trail="${esc(t.id)}"><span class="tr-h"><b>${i === 0 ? 'This trail' : esc(relTime(last))}</b><em>${ps.length} topic${ps.length === 1 ? '' : 's'}</em></span><span class="tr-path">${ps.slice(0, 5).map(p => `<i${kattr(p.kind || (p.hint && p.hint.kind))}></i>${esc(clip(p.title, 28))}`).join('<span aria-hidden="true">→</span>')}${ps.length > 5 ? '<span aria-hidden="true">…</span>' : ''}</span></button></li>`;
  }).join('')}</ol>` : `<p class="ix-empty">Your trails gather here: each sitting, page by page.</p>`;
}

/* ---------- deep time: every dated moment you've read, on one line ---------- */
function gapLabel(d) {
  if (d >= 1e6) return `${fmtBig(d / 1e6)} million years`;
  if (d >= 1000) return `${Math.round(d).toLocaleString('en-US')} years`;
  return `${Math.round(d)} years`;
}
const fmtBig = n => n >= 10 ? Math.round(n).toLocaleString('en-US') : n.toFixed(1).replace(/\.0$/, '');
function renderTime() {
  const ev = [];
  for (const p of Object.values(store.pages)) { if (!p.text || (p.status !== 'done' && p.status !== 'partial')) continue; timeOf(parsed(p)).forEach(t => ev.push({ ...t, p })); }
  ev.sort((a, b) => a.y - b.y);
  $('#sideStats').textContent = `${ev.length} dated moment${ev.length === 1 ? '' : 's'} in your world`;
  let h = '';
  ev.forEach((e, i) => {
    if (i > 0) { const d = e.y - ev[i - 1].y; if (d >= 400) h += `<li class="gap" aria-hidden="true"><span>${gapLabel(d)} pass</span></li>`; }
    h += `<li><a href="${esc(routeOf(e.p.req))}" data-goto="${esc(e.p.id)}"${kattr(e.p.kind)}><b>${esc(e.when)}</b><span>${esc(plain(e.s))}</span><em>${esc(clip(e.p.title, 36))}</em></a></li>`;
  });
  $('#timePane').innerHTML = ev.length ? `<ol class="dtime">${h}</ol>` : `<p class="ix-empty">No dated moments yet. Pages with a real chronology add their timelines here, and they all merge into one line through time.</p>`;
}

/* ================= connect this page to any topic you've read ================= */
function bridgeSheet(p = curPage()) {
  if (!p || p.status !== 'done') return;
  const others = [...worldIndex().read.values()].filter(o => o.id !== p.id && !o.req.bridge && nodeKeyOf(o) !== nodeKeyOf(p)).sort((a, b) => b.last - a.last);
  if (!others.length) { toast('Read another page first, then connect them.'); return; }
  openSheet('Connect to…', `<p>Pick another topic from your world. Dorkhub will write the page that connects <b>${esc(p.title)}</b> to it, one link in the chain at a time.</p>
<label class="sr" for="bq">Filter your topics</label><input id="bq" class="sheet-q" type="search" placeholder="Filter your topics" autocomplete="off">
<ul class="bridge-list" id="bridgeList">${others.slice(0, 200).map(o => `<li><button type="button" data-bridge="${esc(o.id)}" data-name="${esc(o.title.toLowerCase())}"${kattr(o.kind)}><span class="bl-d"></span><b>${esc(o.title)}</b><span>${esc(relTime(o.last))}</span></button></li>`).join('')}</ul>`);
  setTimeout(() => { if (matchMedia('(hover: hover)').matches) $('#bq')?.focus(); }, 60);
}
document.addEventListener('input', e => { if (e.target.id !== 'bq') return; const q = e.target.value.trim().toLowerCase(); $$('#bridgeList li').forEach(li => { li.hidden = !!q && !li.firstElementChild.dataset.name.includes(q); }); });
function makeBridge(otherId) {
  const a = curPage(), b = pageOf(otherId); if (!a || !b) return;
  sheet.close(); openTopic(`${a.title} and ${b.title}`, { via: 'connect', bridge: [a.title, b.title] });
}

/* ================= around this: the lay of the land ================= */
const BEARINGS = { mechanism: -90, science: -30, elsewhere: 30, culture: 90, people: 150, history: 210 };
async function landSheet(p = curPage()) {
  if (!p || p.status !== 'done') return;
  if (p.land) { openSheet('Around this page', landHTML(p)); return; }
  openSheet('Around this page', `<p class="digging">${waitHTML('searching', `Mapping what surrounds ${p.title}`)}</p>`);
  const ctl = sheetCtl = new AbortController();
  try {
    /* the answer is written for the page, so it is the same for everyone; what this reader has already read is hidden here */
    const out = await writeJSON('around', ctxInput(p), { signal: ctl.signal });
    const read = worldIndex().read;
    const list = (Array.isArray(out) ? out : []).filter(o => o && o.name && !read.has(topicKey(String(o.name)))).slice(0, 8).map(o => ({ name: clip(String(o.name), 40), relation: String(o.relation || ''), kind: KINDS.includes(o.kind) ? o.kind : '', bearing: BEARINGS[o.bearing] != null ? o.bearing : 'elsewhere', distance: Math.max(1, Math.min(3, parseInt(o.distance, 10) || 2)) }));
    if (!list.length) throw writeError('bad_output');
    p.land = list; save(); if (sheet.open && sheetCtl === ctl) openSheet('Around this page', landHTML(p));
  } catch (e) { if (sheet.open && sheetCtl === ctl && e?.code !== 'cancelled') $('#sheetBody').innerHTML = `<p>${esc(errText(e?.code))}</p>`; }
}
function landHTML(p) {
  const Wd = 600, Ht = 470, cx = Wd / 2, cy = Ht / 2; const glow = kindHex(p.kind);
  const by = {}; p.land.forEach((o, i) => { (by[o.bearing] = by[o.bearing] || []).push({ o, i }); });
  let svg = `<rect width="${Wd}" height="${Ht}" rx="14" style="fill:var(--sunken)"/>`;
  [1, 2, 3].forEach(d => { svg += `<circle cx="${cx}" cy="${cy}" r="${34 + d * 50}" fill="none" stroke="currentColor" stroke-opacity=".16" stroke-dasharray="2 5"/>`; });
  Object.entries(BEARINGS).forEach(([b, deg]) => { const a = deg * Math.PI / 180; svg += `<text x="${(cx + Math.cos(a) * 268).toFixed(1)}" y="${(cy + Math.sin(a) * 226 + 4).toFixed(1)}" text-anchor="middle" font-size="11.5" font-family="Inter, system-ui, sans-serif" font-weight="700" fill="currentColor" opacity=".5">${b}</text>`; });
  const pts = [];
  Object.entries(by).forEach(([b, arr]) => arr.forEach((x, j) => { const spread = (j - (arr.length - 1) / 2) * 24; const a = (BEARINGS[b] + spread) * Math.PI / 180; const r = 34 + x.o.distance * 50; pts.push({ ...x, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); }));
  pts.forEach(q => { svg += `<line x1="${cx}" y1="${cy}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" stroke="currentColor" stroke-opacity=".2"/>`; });
  svg += `<circle cx="${cx}" cy="${cy}" r="26" fill="${glow}"/><text x="${cx}" y="${cy + 44}" text-anchor="middle" font-size="14" font-family="Inter, system-ui, sans-serif" font-weight="800" fill="currentColor" style="stroke:var(--sunken)" stroke-width="5" paint-order="stroke">${esc(clip(p.title, 30))}</text>`;
  pts.forEach(q => {
    const r = 14 - q.o.distance * 2;
    /* labels lean away from the centre, so neighbours on the same bearing don't collide */
    const side = q.x < cx - 24 ? -1 : q.x > cx + 24 ? 1 : 0;
    const lx = q.x + side * (r + 7), ly = side ? q.y + 4.5 : q.y + r + 15;
    svg += `<a href="${esc(routeOf({ title: q.o.name, lens: store.settings.lens }))}" data-land="${q.i}"${kattr(q.o.kind)} aria-label="${esc(q.o.name)}: ${esc(q.o.relation)}"><circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${r}" style="fill:var(--kc,currentColor)" fill-opacity=".85"/><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${side < 0 ? 'end' : side > 0 ? 'start' : 'middle'}" font-size="12.5" font-family="Inter, system-ui, sans-serif" font-weight="700" fill="currentColor" style="stroke:var(--sunken)" stroke-width="5" paint-order="stroke">${esc(clip(q.o.name, 24))}</text></a>`;
  });
  return `<p>What surrounds <b>${esc(p.title)}</b>.<span class="land-hint"> Closer rings are closer relatives.</span> Pick anything to open a page on it.</p>
<figure class="land"><svg viewBox="-24 -8 ${Wd + 48} ${Ht + 16}" role="img" aria-label="Radial map of topics around ${esc(p.title)}">${svg}</svg></figure>
<ol class="land-list">${p.land.map((o, i) => `<li><a href="${esc(routeOf({ title: o.name, lens: store.settings.lens }))}" data-land="${i}"${kattr(o.kind)}><b><i class="kdot3" aria-hidden="true"></i>${esc(o.name)}</b>${o.kind ? `<span class="kind">${esc(o.kind)}</span>` : ''}<span class="ll-r">${esc(o.relation)}</span><span class="ll-b">${o.bearing}, ${['', 'next door', 'nearby', 'far'][o.distance]}</span></a></li>`).join('')}</ol>`;
}

/* ================= listen: free narration with the browser's own voice ================= */
const TTS = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance === 'function';
const SPEAK = { id: null };
function repaintTools() { const p = curPage(); const sec = p && secFor(p.id); if (sec) paintTools(p, sec); }
function stopListening() { if (!TTS || !SPEAK.id) return; SPEAK.id = null; try { speechSynthesis.cancel(); } catch (e) { } $$('.speaking').forEach(e => e.classList.remove('speaking')); repaintTools(); }
function listen(p = curPage()) {
  if (!TTS || !p) return; if (SPEAK.id === p.id) { stopListening(); return; } stopListening();
  const sec = secFor(p.id); if (!sec || p.status !== 'done') return;
  const A = parsed(p); const parts = [{ text: `${shownTitle(p, A)}. ${plain(A.deck)}`, sel: '.a-title' }];
  A.blocks.forEach((b, i) => { if (b.t === 'p') parts.push({ text: plain(b.s), sel: `.pb[data-i="${i}"]` }); else if (b.t === 'h') parts.push({ text: plain(b.s) + '.', sel: null }); });
  SPEAK.id = p.id; repaintTools();
  let i = 0; const id = p.id;
  const next = () => {
    if (SPEAK.id !== id) return;
    $$('.speaking').forEach(e => e.classList.remove('speaking'));
    if (i >= parts.length) { SPEAK.id = null; repaintTools(); toast('End of the page. Keep exploring below.'); return; }
    const part = parts[i++]; const s2 = secFor(id); const el = part.sel && s2 && $(part.sel, s2);
    if (el) { el.classList.add('speaking'); el.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' }); }
    const u = new SpeechSynthesisUtterance(part.text); u.rate = 1.03; u.onend = next; u.onerror = () => { if (SPEAK.id === id) next(); };
    try { speechSynthesis.speak(u); } catch (e) { stopListening(); }
  };
  next();
}
/* ================= what stuck? a quiz on the trail you're on ================= */
async function recall(fresh) {
  const t = curTrail(); const done = trailPages(t).filter(p => p.text && p.status === 'done');
  if (done.length < 2) { toast('Read at least two pages, then see what stuck.'); return; }
  if (t.recall && !fresh && t.recall.i < t.recall.qs.length) { renderQuiz(); return; }
  openSheet('What stuck?', `<p class="digging">${waitHTML('solving', 'Writing questions from your trail')}</p>`);
  const ctl = sheetCtl = new AbortController();
  const pages = done.slice(-8).map(p => { const A = parsed(p); return { title: p.title, text: [A.deck, ...panelLines(A), ...A.blocks.filter(b => b.t === 'p').slice(0, 4).map(b => b.s)].map(plain).join('\n').slice(0, 900) }; });
  try {
    const out = await writeJSON('quiz', { pages }, { signal: ctl.signal });
    const byTitle = x => done.find(p => keyOf(p.title) === keyOf(x));
    const qs = (Array.isArray(out) ? out : []).filter(q => q && q.q && Array.isArray(q.options) && q.options.length >= 3).slice(0, 6).map(q => {
      const options = q.options.slice(0, 4).map(o => clip(String(o), 90)); const answer = Math.max(0, Math.min(options.length - 1, parseInt(q.answer, 10) || 0));
      const ch = byTitle(String(q.chamber || '')); return { q: clip(String(q.q), 200), options, answer, why: clip(String(q.why || ''), 240), from: ch ? ch.title : '', pid: ch ? ch.id : null };
    });
    if (!qs.length) throw writeError('bad_output');
    t.recall = { qs, i: 0, score: 0, picked: null, at: Date.now() }; save(); if (sheet.open && sheetCtl === ctl) renderQuiz();
  } catch (e) { if (sheet.open && sheetCtl === ctl && e?.code !== 'cancelled') $('#sheetBody').innerHTML = `<p>${esc(errText(e?.code))}</p>`; }
}
function renderQuiz() {
  const t = curTrail(); const R = t && t.recall; if (!R) return;
  if (R.i >= R.qs.length) {
    t.recallLast = { score: R.score, of: R.qs.length, at: Date.now() }; save();
    const verdict = R.score === R.qs.length ? 'Everything stuck.' : R.score >= R.qs.length * .6 ? 'Most of it stuck.' : 'Some of it slipped away. That’s what going back is for.';
    openSheet('What stuck?', `<p class="qz-score"><b>${R.score}</b> of ${R.qs.length}</p><p>${verdict} Questions you missed link back to the page where the answer lives.</p>`, `<button class="btn glow" type="button" data-act="recall-new">New questions</button><button class="btn ghost" type="button" data-act="sheet-close">Back to reading</button>`);
    return;
  }
  const q = R.qs[R.i]; const done = R.picked != null; const last = R.i === R.qs.length - 1; const src = pageOf(q.pid);
  openSheet('What stuck?', `<p class="qz-n">Question ${R.i + 1} of ${R.qs.length}${q.from ? `, from ${esc(q.from)}` : ''}</p><p class="qz-q">${esc(q.q)}</p>
<div class="qz-o">${q.options.map((o, j) => `<button type="button" data-qz="${j}"${done ? ' disabled' : ''} class="${done ? (j === q.answer ? 'right' : j === R.picked ? 'wrong' : '') : ''}">${esc(o)}</button>`).join('')}</div>
${done ? `<p class="qz-why"><b>${R.picked === q.answer ? 'Yes.' : 'Not quite.'}</b> ${esc(q.why)}</p>` : ''}`,
    done ? `<button class="btn glow" type="button" data-act="qz-next">${last ? 'See your score' : 'Next question'}</button>${src && R.picked !== q.answer ? `<a class="btn ghost" href="${esc(routeOf(src.req))}" data-goto="${esc(src.id)}">Revisit ${esc(clip(q.from, 30))}</a>` : ''}` : '');
}

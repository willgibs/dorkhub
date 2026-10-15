/* ================= sidebar: map / index / deep time ================= */
let SIDE = 'map', IDXQ = '', IDXSORT = 'az', IDXKIND = '';
function renderMap() {
  if (!W || document.body.classList.contains('at-start')) return;
  renderRail(); if (railMode()) return;
  $$('[data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === SIDE)));
  $('#mapScroll').hidden = SIDE !== 'map'; $('#indexPane').hidden = SIDE !== 'index'; $('#timePane').hidden = SIDE !== 'time';
  if (SIDE === 'map') drawMap(); else if (SIDE === 'index') renderIndex(); else renderTime();
  $('#legend').innerHTML = legendHTML();
}
function renderIndex() {
  const pane = $('#indexPane');
  if (!pane.dataset.built) {
    pane.innerHTML = `<div class="ix-tools"><label class="sr" for="ixq">Filter the index</label><input id="ixq" type="search" placeholder="Filter everything you’ve met" autocomplete="off"><div class="ix-sort" role="group" aria-label="Sort the index"><button type="button" data-ixsort="az">A–Z</button><button type="button" data-ixsort="echo">Echoes first</button></div></div><div class="ix-list" id="ixList"></div>`;
    pane.dataset.built = '1';
    $('#ixq').addEventListener('input', e => { IDXQ = e.target.value.trim().toLowerCase(); renderIndexList(); });
    $('.ix-tools', pane).insertAdjacentHTML('beforeend', '<div class="ix-kinds" id="ixKinds" role="group" aria-label="Filter by kind"></div>');
  }
  $$('[data-ixsort]', pane).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ixsort === IDXSORT)));
  renderIndexList();
}
function renderIndexList() {
  const all = buildIndex(); const dug = all.filter(e => e.node).length;
  $('#mapStats').textContent = `${all.length} things you’ve met, ${dug} read`;
  const kinds = [...new Set(all.map(e => kindOf(e.kind)).filter(Boolean))].sort((a, b) => Object.keys(KIND_LABEL).indexOf(a) - Object.keys(KIND_LABEL).indexOf(b));
  if (IDXKIND && !kinds.includes(IDXKIND)) IDXKIND = '';
  const kx = $('#ixKinds'); if (kx) kx.innerHTML = kinds.length > 1 ? kinds.map(k => `<button type="button" data-ixkind="${k}" data-kind="${k}" aria-pressed="${IDXKIND === k}"><i></i>${KIND_LABEL[k]}</button>`).join('') : '';
  const list = all.filter(e => (!IDXKIND || kindOf(e.kind) === IDXKIND) && (!IDXQ || e.name.toLowerCase().includes(IDXQ) || (e.gloss || '').toLowerCase().includes(IDXQ)));
  if (IDXSORT === 'echo') list.sort((a, b) => b.mentions.size - a.mentions.size || a.name.localeCompare(b.name));
  else list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  let h = '', letter = '';
  for (const e of list) {
    if (IDXSORT === 'az') { const L = (e.name.replace(/^(the|a|an)\s+/i, '')[0] || '#').toUpperCase(); const LL = /[A-Z]/.test(L) ? L : '#'; if (LL !== letter) { letter = LL; h += `<h3>${LL}</h3>`; } }
    h += `<button class="ix${e.node ? ' is-dug' : ''}" type="button" data-ix="${esc(e.key)}"${kattr(e.kind)}><span class="ix-n"><i class="kdot" aria-hidden="true"></i>${esc(e.name)}${e.node ? '<i>read</i>' : ''}</span>${e.gloss ? `<span class="ix-g">${esc(e.gloss)}</span>` : ''}<span class="ix-m">${e.kind ? esc(e.kind) + ', ' : ''}${e.mentions.size ? `${e.mentions.size} mention${e.mentions.size === 1 ? '' : 's'}` : 'a chamber'}</span></button>`;
  }
  $('#ixList').innerHTML = h || `<p class="ix-empty">${IDXQ ? `Nothing you’ve met matches “${esc(IDXQ)}”.` : 'The index fills in as pages finish writing.'}</p>`;
}
function openIndexEntry(key) {
  const e = buildIndex().find(x => x.key === key); if (!e) return;
  if (e.node) { nav(e.node.id, e.node.depth > W.nodes[W.current].depth ? 'down' : 'up'); return; }
  const from = W.order.filter(id => e.mentions.has(id)).pop() || W.current;
  dig(e.name, { text: `From the reader's index of this dig. ${e.gloss || ''}` }, from);
}
function gapLabel(d) {
  if (d >= 1e6) return `${fmtBig(d / 1e6)} million years`;
  if (d >= 1000) return `${Math.round(d).toLocaleString('en-US')} years`;
  return `${Math.round(d)} years`;
}
const fmtBig = n => n >= 10 ? Math.round(n).toLocaleString('en-US') : n.toFixed(1).replace(/\.0$/, '');
function renderTime() {
  const ev = [];
  for (const n of W.order.map(x => W.nodes[x])) { if (!n.text) continue; timeOf(parsed(n)).forEach(t => ev.push({ ...t, n })); }
  ev.sort((a, b) => a.y - b.y);
  $('#mapStats').textContent = `${ev.length} dated moment${ev.length === 1 ? '' : 's'} in this rabbit hole`;
  let h = '';
  ev.forEach((e, i) => {
    if (i > 0) { const d = e.y - ev[i - 1].y; if (d >= 400) h += `<li class="gap" aria-hidden="true"><span>${gapLabel(d)} pass</span></li>`; }
    h += `<li><a href="#/w/${W.id}/${e.n.id}" style="--dot:${pal(e.n.depth)[2]}"><b>${esc(e.when)}</b><span>${esc(plain(e.s))}</span><em>${esc(clip(e.n.title, 36))}</em></a></li>`;
  });
  $('#timePane').innerHTML = ev.length ? `<ol class="dtime">${h}</ol>` : `<p class="ix-empty">No dated moments yet. Pages with a real chronology add their timelines here, and they all merge into one line through time.</p>`;
}

/* ================= bridge any two chambers ================= */
function bridgeSheet(nid) {
  const node = W.nodes[nid]; if (!node || node.status !== 'done') return;
  const others = W.order.map(x => W.nodes[x]).filter(n => n.id !== nid && n.status === 'done' && n.id !== node.parent && n.parent !== nid);
  if (!others.length) { toast('Read a little further first, then connect pages.'); return; }
  openSheet('Connect to…', `<p>Pick another page from this rabbit hole. Dorkhub will write the page that connects <b>${esc(node.title)}</b> to it, one link in the chain at a time.</p>
<ul class="bridge-list">${others.map(o => `<li><button type="button" data-bridge="${o.id}" data-from="${nid}"><span class="bl-d" style="background:${pal(o.depth)[2]}"></span><b>${esc(o.title)}</b><span>level ${o.depth}</span></button></li>`).join('')}</ul>`);
}
function makeBridge(fromId, otherId) {
  const a = W.nodes[fromId], b = W.nodes[otherId]; if (!a || !b) return;
  const existing = W.order.map(x => W.nodes[x]).find(n => n.from && n.from.bridge === otherId && n.parent === fromId);
  if (existing) { nav(existing.id, 'down'); return; }
  W.current = a.id;
  const n = mkNode(W, { title: `${a.title} and ${b.title}`, parent: a.id, depth: a.depth + 1, from: { bridge: b.id, bridgeTitle: b.title } });
  W.bridges = W.bridges || []; W.bridges.push([b.id, n.id]); W.updated = Date.now(); save(); nav(n.id, 'down');
}

/* ================= lay of the land ================= */
const BEARINGS = { mechanism: -90, science: -30, elsewhere: 30, culture: 90, people: 150, history: 210 };
async function landSheet(nid) {
  const node = W.nodes[nid]; if (!node || node.status !== 'done') return;
  if (node.land) { openSheet('Around this page', landHTML(node)); return; }
  openSheet('Around this page', `<p class="digging">${waitHTML('searching', `Mapping what surrounds ${node.title}`)}</p>`);
  const ctl = sheetCtl = new AbortController();
  try {
    /* the answer is written for the page, so it is the same for everyone; what this reader has already read is hidden here */
    const out = await writeJSON('around', ctxInput(node), { signal: ctl.signal });
    const read = new Set(W.order.map(x => keyOf(W.nodes[x].title)));
    const list = (Array.isArray(out) ? out : []).filter(o => o && o.name && !read.has(keyOf(String(o.name)))).slice(0, 8).map(o => ({ name: clip(String(o.name), 40), relation: String(o.relation || ''), kind: KINDS.includes(o.kind) ? o.kind : '', bearing: BEARINGS[o.bearing] != null ? o.bearing : 'elsewhere', distance: Math.max(1, Math.min(3, parseInt(o.distance, 10) || 2)) }));
    if (!list.length) throw writeError('bad_output');
    node.land = list; save(); if (sheet.open && sheetCtl === ctl) openSheet('Around this page', landHTML(node));
  } catch (e) { if (sheet.open && sheetCtl === ctl && e?.code !== 'cancelled') $('#sheetBody').innerHTML = `<p>${esc(errText(e?.code))}</p>`; }
}
function landHTML(node) {
  const Wd = 600, Ht = 470, cx = Wd / 2, cy = Ht / 2; const [bg, ink, glow] = pal(node.depth);
  const by = {}; node.land.forEach((o, i) => { (by[o.bearing] = by[o.bearing] || []).push({ o, i }); });
  let svg = `<rect width="${Wd}" height="${Ht}" rx="14" fill="${bg}"/>`;
  [1, 2, 3].forEach(d => { svg += `<circle cx="${cx}" cy="${cy}" r="${34 + d * 50}" fill="none" stroke="${ink}" stroke-opacity=".16" stroke-dasharray="2 5"/>`; });
  Object.entries(BEARINGS).forEach(([b, deg]) => { const a = deg * Math.PI / 180; svg += `<text x="${(cx + Math.cos(a) * 268).toFixed(1)}" y="${(cy + Math.sin(a) * 226 + 4).toFixed(1)}" text-anchor="middle" font-size="11.5" font-family="Inter, system-ui, sans-serif" font-weight="700" fill="${ink}" opacity=".5">${b}</text>`; });
  const pts = [];
  Object.entries(by).forEach(([b, arr]) => arr.forEach((x, j) => { const spread = (j - (arr.length - 1) / 2) * 24; const a = (BEARINGS[b] + spread) * Math.PI / 180; const r = 34 + x.o.distance * 50; pts.push({ ...x, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); }));
  pts.forEach(p => { svg += `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="${ink}" stroke-opacity=".2"/>`; });
  svg += `<circle cx="${cx}" cy="${cy}" r="26" fill="${glow}"/><text x="${cx}" y="${cy + 44}" text-anchor="middle" font-size="14" font-family="Inter, system-ui, sans-serif" font-weight="800" fill="${ink}" stroke="${bg}" stroke-width="5" paint-order="stroke">${esc(clip(node.title, 30))}</text>`;
  pts.forEach(p => {
    const dug = findByKey(keyOf(p.o.name)); const r = 14 - p.o.distance * 2;
    /* labels lean away from the centre, so neighbours on the same bearing don't collide */
    const side = p.x < cx - 24 ? -1 : p.x > cx + 24 ? 1 : 0;
    const lx = p.x + side * (r + 7), ly = side ? p.y + 4.5 : p.y + r + 15;
    svg += `<a href="#" data-land="${p.i}" data-nid="${node.id}"${kattr(p.o.kind)} aria-label="${esc(p.o.name)}: ${esc(p.o.relation)}"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" style="fill:var(--kc,${ink})" fill-opacity="${dug ? 1 : .8}"${dug ? ` stroke="${glow}" stroke-width="3"` : ''}/><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${side < 0 ? 'end' : side > 0 ? 'start' : 'middle'}" font-size="12.5" font-family="Inter, system-ui, sans-serif" font-weight="700" fill="${ink}" stroke="${bg}" stroke-width="5" paint-order="stroke">${esc(clip(p.o.name, 24))}</text></a>`;
  });
  return `<p>What surrounds <b>${esc(node.title)}</b>.<span class="land-hint"> Closer rings are closer relatives.</span> Pick anything to open a page on it.</p>
<figure class="land"><svg viewBox="-24 -8 ${Wd + 48} ${Ht + 16}" role="img" aria-label="Radial map of topics around ${esc(node.title)}">${svg}</svg></figure>
<ol class="land-list">${node.land.map((o, i) => `<li><button type="button" data-land="${i}" data-nid="${node.id}"${kattr(o.kind)}><b><i class="kdot3" aria-hidden="true"></i>${esc(o.name)}</b>${o.kind ? `<span class="kind">${esc(o.kind)}</span>` : ''}<span class="ll-r">${esc(o.relation)}</span><span class="ll-b">${o.bearing}, ${['', 'next door', 'nearby', 'far'][o.distance]}</span></button></li>`).join('')}</ol>`;
}

/* ================= listen: free narration with the browser's own voice ================= */
const TTS = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance === 'function';
const SPEAK = { nid: null };
function repaintTools() { if (!W) return; $$('.chamber').forEach(sec => { const n = W.nodes[sec.dataset.nid]; if (n) paintTools(n, sec); }); }
function stopListening() { if (!TTS || !SPEAK.nid) return; SPEAK.nid = null; try { speechSynthesis.cancel(); } catch (e) { } $$('.speaking').forEach(e => e.classList.remove('speaking')); repaintTools(); }
function listen(nid) {
  if (!TTS) return; if (SPEAK.nid === nid) { stopListening(); return; } stopListening();
  const node = W.nodes[nid]; const sec = secFor(nid); if (!node || !sec || node.status !== 'done') return;
  const A = parsed(node); const parts = [{ text: `${shownTitle(node, A)}. ${plain(A.deck)}`, sel: '.a-title' }];
  A.blocks.forEach((b, i) => { if (b.t === 'p') parts.push({ text: plain(b.s), sel: `.pb[data-i="${i}"]` }); else if (b.t === 'h') parts.push({ text: plain(b.s) + '.', sel: null }); });
  SPEAK.nid = nid; repaintTools();
  let i = 0;
  const next = () => {
    if (SPEAK.nid !== nid) return;
    $$('.speaking').forEach(e => e.classList.remove('speaking'));
    if (i >= parts.length) { SPEAK.nid = null; repaintTools(); toast('End of the page. Press J to continue reading.'); return; }
    const p = parts[i++]; const s2 = secFor(nid); const el = p.sel && s2 && $(p.sel, s2);
    if (el) { el.classList.add('speaking'); el.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' }); }
    const u = new SpeechSynthesisUtterance(p.text); u.rate = 1.03; u.onend = next; u.onerror = () => { if (SPEAK.nid === nid) next(); };
    try { speechSynthesis.speak(u); } catch (e) { stopListening(); }
  };
  next();
}
/* ================= sketch it: a generated diagram for any chamber ================= */
function normFigure(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const shape = ['chain', 'cycle', 'hub'].includes(o.shape) ? o.shape : 'chain';
  const nodes = (Array.isArray(o.nodes) ? o.nodes : []).filter(n => n && n.label).slice(0, 7).map(n => ({ label: clip(String(n.label), 40), note: clip(String(n.note || ''), 90) }));
  if (nodes.length < 3) return null;
  return { shape, title: clip(String(o.title || ''), 70), caption: clip(String(o.caption || ''), 220), center: clip(String(o.center || ''), 40), nodes, links: (Array.isArray(o.links) ? o.links : []).map(x => clip(String(x || ''), 30)) };
}
async function sketch(nid, fresh) {
  const node = W.nodes[nid]; if (!node || node.status !== 'done' || node.figure === 'loading') return;
  const reveal = () => { const s2 = secFor(nid); const f = s2 && $('.sketch', s2); if (f) f.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' }); };
  if (node.figure && !fresh) { reveal(); return; }
  const prev = node.figure; node.figure = 'loading'; paint(node); reveal();
  const A = parsed(node); const txt = [shownTitle(node, A), A.deck, ...A.blocks.map(b => b.s)].map(plain).join('\n');
  try {
    const fig = normFigure(await writeJSON('sketch', { ...ctxInput(node), page: clip(txt, 5000) }, { fresh: !!fresh })); if (!fig) throw writeError('bad_output');
    node.figure = fig;
  } catch (e) { node.figure = prev && prev !== 'loading' ? prev : null; toast(e?.code === 'bad_output' || e?.code === 'upstream_error' ? 'The sketch didn’t come out. Try again in a moment.' : errText(e?.code)); }
  save(); paint(node); reveal();
}
function figureHTML(node) {
  const f = node.figure; if (!f) return '';
  if (f === 'loading') return `<figure class="sketch"><p class="digging">${waitHTML('shaping', 'Sketching this page')}</p></figure>`;
  const box = n => `<button class="sk-n" type="button" data-sk="${esc(n.label)}" data-note="${esc(n.note)}"><b>${esc(n.label)}</b>${n.note ? `<span>${esc(n.note)}</span>` : ''}</button>`;
  let body = '';
  if (f.shape === 'chain') {
    body = `<ol class="sk-chain">${f.nodes.map((n, i) => `<li class="sk-step"><span class="sk-i">${i + 1}</span>${box(n)}</li>${i < f.nodes.length - 1 ? `<li class="sk-arr" aria-hidden="true"><span>${esc(f.links[i] || '')}</span></li>` : ''}`).join('')}</ol>`;
  } else {
    const n = f.nodes.length;
    const pos = f.nodes.map((_, i) => { const a = (-90 + i * 360 / n) * Math.PI / 180; return { x: 50 + Math.cos(a) * 37, y: 50 + Math.sin(a) * 39 }; });
    const lines = f.shape === 'hub' ? pos.map(p => `<line x1="50" y1="50" x2="${p.x.toFixed(2)}" y2="${p.y.toFixed(2)}"/>`).join('') : `<ellipse cx="50" cy="50" rx="37" ry="39"/>`;
    body = `<div class="sk-ring" data-shape="${f.shape}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg><div class="sk-center${f.shape === 'cycle' ? ' cyc' : ''}">${f.shape === 'hub' ? esc(f.center || node.title) : '↻'}</div>${f.nodes.map((nn, i) => `<div class="sk-pos" style="left:${pos[i].x.toFixed(2)}%;top:${pos[i].y.toFixed(2)}%">${box(nn)}</div>`).join('')}</div>`;
  }
  return `<figure class="sketch" data-shape="${f.shape}"><p class="sk-t"><span>Sketch</span>${esc(f.title || 'How it fits together')}</p>${body}${f.caption ? `<figcaption>${esc(f.caption)}</figcaption>` : ''}<p class="sk-foot"><span>Every box opens a page.</span><button type="button" data-act="sketch-redo" data-nid="${node.id}">Sketch again</button><button type="button" data-act="sketch-close" data-nid="${node.id}">Remove</button></p></figure>`;
}

/* ================= what stuck? a recall quiz from your own dig ================= */
async function recall(fresh) {
  if (!W) return;
  const done = W.order.map(x => W.nodes[x]).filter(n => n.status === 'done');
  if (done.length < 2) { toast('Read at least two pages, then see what stuck.'); return; }
  if (W.recall && !fresh && W.recall.i < W.recall.qs.length) { renderQuiz(); return; }
  openSheet('What stuck?', `<p class="digging">${waitHTML('solving', 'Writing questions from your rabbit hole')}</p>`);
  const ctl = sheetCtl = new AbortController();
  const pages = done.slice(-8).map(n => { const A = parsed(n); return { title: n.title, text: [A.deck, ...panelLines(A), ...A.blocks.filter(b => b.t === 'p').slice(0, 4).map(b => b.s)].map(plain).join('\n').slice(0, 900) }; });
  try {
    const out = await writeJSON('quiz', { pages }, { signal: ctl.signal });
    const byTitle = t => W.order.map(x => W.nodes[x]).find(n => keyOf(n.title) === keyOf(t));
    const qs = (Array.isArray(out) ? out : []).filter(q => q && q.q && Array.isArray(q.options) && q.options.length >= 3).slice(0, 6).map(q => {
      const options = q.options.slice(0, 4).map(o => clip(String(o), 90)); const answer = Math.max(0, Math.min(options.length - 1, parseInt(q.answer, 10) || 0));
      const ch = byTitle(String(q.chamber || '')); return { q: clip(String(q.q), 200), options, answer, why: clip(String(q.why || ''), 240), chamber: ch ? ch.title : '', nid: ch ? ch.id : null };
    });
    if (!qs.length) throw writeError('bad_output');
    W.recall = { qs, i: 0, score: 0, picked: null, at: Date.now() }; save(); if (sheet.open && sheetCtl === ctl) renderQuiz();
  } catch (e) { if (sheet.open && sheetCtl === ctl && e?.code !== 'cancelled') $('#sheetBody').innerHTML = `<p>${esc(errText(e?.code))}</p>`; }
}
function renderQuiz() {
  const R = W.recall; if (!R) return;
  if (R.i >= R.qs.length) {
    W.recallLast = { score: R.score, of: R.qs.length, at: Date.now() }; save();
    const verdict = R.score === R.qs.length ? 'Everything stuck.' : R.score >= R.qs.length * .6 ? 'Most of it stuck.' : 'Some of it slipped away. That’s what rabbit holes are for.';
    openSheet('What stuck?', `<p class="qz-score"><b>${R.score}</b> of ${R.qs.length}</p><p>${verdict} Questions you missed link back to the page where the answer lives.</p>`, `<button class="btn glow" type="button" data-act="recall-new">New questions</button><button class="btn ghost" type="button" data-act="sheet-close">Back to reading</button>`);
    return;
  }
  const q = R.qs[R.i]; const done = R.picked != null; const last = R.i === R.qs.length - 1;
  openSheet('What stuck?', `<p class="qz-n">Question ${R.i + 1} of ${R.qs.length}${q.chamber ? `, from ${esc(q.chamber)}` : ''}</p><p class="qz-q">${esc(q.q)}</p>
<div class="qz-o">${q.options.map((o, j) => `<button type="button" data-qz="${j}"${done ? ' disabled' : ''} class="${done ? (j === q.answer ? 'right' : j === R.picked ? 'wrong' : '') : ''}">${esc(o)}</button>`).join('')}</div>
${done ? `<p class="qz-why"><b>${R.picked === q.answer ? 'Yes.' : 'Not quite.'}</b> ${esc(q.why)}</p>` : ''}`,
    done ? `<button class="btn glow" type="button" data-act="qz-next">${last ? 'See your score' : 'Next question'}</button>${q.nid && R.picked !== q.answer ? `<a class="btn ghost" href="#/w/${W.id}/${q.nid}">Revisit ${esc(clip(q.chamber, 30))}</a>` : ''}` : '');
}

/* ================= nerd-o-meter ================= */
const LEVEL_UP = ['', 'Level 1: Hooked. That was quick.', 'Level 2: Invested. No turning back now.', 'Level 3: Obsessed. Snacks recommended.', 'Level 4: Deep nerd.', 'Level 5: Specialist. You now know more than most people.', 'Level 6: Galaxy brain.', 'Level 7: Beyond. Very few readers get here.'];
function meterHTML(d) {
  const seen = Math.max(W.maxLevel || 0, d); const name = LEVELS[stratumOf(d)].name;
  return `<span class="meter" role="img" aria-label="Level ${d}: ${esc(name)}" data-tip="Level ${d}: ${esc(name)}${seen > d ? `. You’ve been down to level ${seen}` : ''}">${LEVELS.map((l, i) => `<i data-s="${i}" class="${i <= Math.min(d, 7) ? 'on' : i <= Math.min(seen, 7) ? 'seen' : ''}"></i>`).join('')}</span><span class="gl"><b>${d}</b></span>`;
}
function checkLevelUp(node) {
  if (W.maxLevel == null) W.maxLevel = Math.max(0, ...W.order.map(x => W.nodes[x]).filter(n => n.status === 'done' && n.id !== node.id).map(n => n.depth));
  if (node.depth <= W.maxLevel) return;
  W.maxLevel = node.depth;
  const m = $('#gauge .meter'); if (m && !reducedMotion()) { m.classList.remove('up'); void m.offsetWidth; m.classList.add('up'); }
  $('#gauge').innerHTML = meterHTML(node.depth); const m2 = $('#gauge .meter'); if (m2 && !reducedMotion()) m2.classList.add('up');
  toast(LEVEL_UP[node.depth] || `Level ${node.depth}. Still going.`);
}

/* ================= path rail: the sidebar, collapsed to your path ================= */
const narrow = () => matchMedia('(max-width: 900px)').matches;
const railMode = () => store.settings.side !== 'open' && !narrow();
function applySide() { document.body.classList.toggle('side-rail', store.settings.side !== 'open'); }
function renderRail() {
  const el = $('#railbar'); if (!W) { el.innerHTML = ''; return; }
  const path = pathTo(W.nodes[W.current]); const shown = path.slice(-14);
  el.innerHTML = `<button class="rail-toggle" type="button" data-act="side-toggle"${tipAttrs('Expand the map', 'M')}>${ic('right')}</button>
<ol class="rail-path" aria-label="Your path">${shown.map(n => `<li><a href="#/w/${W.id}/${n.id}" data-s="${stratumOf(n.depth)}" class="${n.id === W.current ? 'cur' : ''}" aria-label="${esc(n.title)}, level ${n.depth}" data-tip="${esc(n.title)}"><i></i></a></li>`).join('')}</ol>
<span class="rail-more" data-tip="${W.order.length} page${W.order.length === 1 ? '' : 's'} in this rabbit hole">${W.order.length}</span>`;
}
function toggleSide() {
  if (narrow()) { toggleMap(); return; }
  store.settings.side = store.settings.side === 'open' ? 'rail' : 'open'; save(); applySide(); renderMap();
}

/* ================= ask anything ================= */
const omni = $('#omni'), omniIn = $('#omniIn'), omniList = $('#omniList'); let OM = { items: [], i: 0 };
function openOmni(prefill = '') {
  hideCard(); closePMenu();
  omniIn.value = prefill; renderOmni();
  if (!omni.open) omni.showModal();
  omniIn.focus(); omniIn.select();
}
function omniItems(q) {
  const out = []; const cur = W && W.nodes[W.current]; const qq = q.trim(); const ql = qq.toLowerCase();
  if (qq) {
    if (cur) out.push({ sec: 'Ask', icon: '↵', title: `Open a page on <q>${esc(qq)}</q>`, hook: `Written for your path from ${esc(clip(cur.title, 44))}`, run: () => dig(qq, isQuestion(qq) ? { question: qq } : { text: `Typed by the reader while reading this page: ${qq}` }, cur.id) });
    out.push({ sec: cur ? 'Ask' : 'Start', icon: '+', title: `Start a new rabbit hole on <q>${esc(qq)}</q>`, hook: 'A fresh first page', run: () => newWarren(qq) });
    if (W) {
      W.order.map(x => W.nodes[x]).filter(n => n.id !== W.current && n.title.toLowerCase().includes(ql)).slice(0, 5)
        .forEach(n => out.push({ sec: 'Pages in this rabbit hole', icon: n.depth, s: stratumOf(n.depth), title: esc(n.title), hook: n.deck ? esc(plain(n.deck)) : '', run: () => nav(n.id, n.depth > cur.depth ? 'down' : 'up') }));
      buildIndex().filter(e => !e.node && (e.name.toLowerCase().includes(ql) || (e.gloss || '').toLowerCase().includes(ql))).slice(0, 5)
        .forEach(e => out.push({ sec: 'Mentioned along the way', icon: '●', k: e.kind, title: esc(e.name), hook: esc(e.gloss || ''), tag: e.kind || '', run: () => openIndexEntry(e.key) }));
    }
    store.warrens.filter(w => w !== W).forEach(w => w.order.map(x => w.nodes[x]).filter(n => n && n.status === 'done' && n.title.toLowerCase().includes(ql)).slice(0, 2)
      .forEach(n => out.push({ sec: 'Your other rabbit holes', icon: '↗', title: esc(n.title), hook: `In ${esc(clip(w.nodes[w.root].title, 44))}`, run: () => { location.hash = `#/w/${w.id}/${n.id}`; } })));
  } else if (cur) {
    const A = parsed(cur); const nd = cur.depth + 1;
    if (A.next) out.push({ sec: 'Up next', icon: '→', s: stratumOf(nd), title: esc(A.next.label), hook: esc(plain(A.next.why)), tag: 'J', run: () => keepReading(cur.id) });
    A.tunnels.slice(0, 5).forEach((t, i) => out.push({ sec: 'Branches from this page', icon: i + 1, k: (A.gloss[keyOf(t.target)] || {}).kind, title: esc(t.label), hook: esc(t.teaser || ''), tag: t.dir ? (DIR_MARK[t.dir] || [])[1] || '' : '', run: () => dig(t.target, { text: `Chosen from the branches, with the hook: ${t.teaser}`, dir: t.dir }, cur.id) }));
    A.questions.slice(0, 3).forEach(q => out.push({ sec: 'Open questions', icon: '?', k: 'mystery', title: esc(q), run: () => dig(q, { question: q }, cur.id) }));
    store.warrens.filter(w => w !== W && w.nodes[w.root]).slice(0, 3).forEach(w => { const c = w.nodes[w.current] || w.nodes[w.root]; out.push({ sec: 'Your other rabbit holes', icon: '↗', title: esc(w.nodes[w.root].title), hook: `Last on ${esc(clip(c.title, 44))}`, run: () => { location.hash = `#/w/${w.id}/${c.id}`; } }); });
  }
  return out.slice(0, 16);
}
function renderOmni() {
  const items = omniItems(omniIn.value); OM = { items, i: 0 }; let h = '', sec = '';
  items.forEach((it, i) => {
    if (it.sec !== sec) { sec = it.sec; h += `<p class="om-sec">${esc(sec)}</p>`; }
    h += `<button class="om-i" type="button" role="option" id="om${i}" data-om="${i}" aria-selected="${i === 0}"${it.s != null ? ` data-s="${it.s}"` : ''}${kattr(it.k)}><span class="oi">${it.icon}</span><span class="ot">${it.title}</span>${it.tag ? `<span class="od">${esc(String(it.tag))}</span>` : '<span></span>'}${it.hook ? `<span class="oh">${it.hook}</span>` : ''}</button>`;
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

/* ================= up next ================= */
const upnext = $('#upnext');
function updateUpNext() {
  if (!W || document.body.classList.contains('at-start')) { upnext.hidden = true; return; }
  const node = W.nodes[W.current]; const sec = node && secFor(node.id);
  if (!sec || node.status !== 'done' || isLive(node)) { upnext.hidden = true; return; }
  const A = parsed(node); if (!A.next) { upnext.hidden = true; return; }
  const ex = findByKey(keyOf(A.next.target)); if (ex && secFor(ex.id)) { upnext.hidden = true; return; }
  /* a gentle nudge as the reader nears the end of the page, never while they are still in it */
  const body = $('.a-body', sec); const b = body && body.getBoundingClientRect();
  const nb = $('.next', sec); const nbTop = nb ? nb.getBoundingClientRect().top : Infinity;
  const show = !!b && b.height > 0 && (innerHeight - b.top) / b.height > .8 && nbTop > innerHeight - 30;
  if (show) {
    const key = node.id + '|' + A.next.target;
    if (upnext.dataset.key !== key) { upnext.dataset.key = key; upnext.dataset.s = stratumOf(node.depth + 1); upnext.innerHTML = `<span class="un-dot"></span><b>${esc(A.next.label)}</b><kbd>J</kbd>`; upnext.dataset.tip = `Up next, level ${node.depth + 1}: ${LEVELS[stratumOf(node.depth + 1)].name}`; upnext.setAttribute('aria-label', `Up next: ${A.next.label}`); }
    upnext.dataset.nid = node.id;
  }
  upnext.hidden = !show;
}
upnext.addEventListener('click', () => { upnext.hidden = true; keepReading(upnext.dataset.nid); });

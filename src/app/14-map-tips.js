/* ================= tooltips: fast, styled, keyboard-friendly ================= */
const TIPEL = document.createElement('div'); TIPEL.className = 'tip'; TIPEL.setAttribute('role', 'tooltip'); document.body.appendChild(TIPEL);
let tipT = 0, tipFor = null;
function showTip(el) {
  const t = el.dataset.tip; if (!t || !el.isConnected) return;
  TIPEL.innerHTML = esc(t) + (el.dataset.key ? `<kbd>${esc(el.dataset.key)}</kbd>` : '');
  TIPEL.classList.add('on'); tipFor = el;
  const r = el.getBoundingClientRect(); const tw = TIPEL.offsetWidth, th = TIPEL.offsetHeight;
  const x = Math.max(8, Math.min(r.left + r.width / 2 - tw / 2, innerWidth - tw - 8));
  let y = r.top - th - 8; if (y < 8) y = r.bottom + 8;
  TIPEL.style.left = `${x}px`; TIPEL.style.top = `${y}px`;
}
function hideTip() { clearTimeout(tipT); TIPEL.classList.remove('on'); tipFor = null; }
document.addEventListener('mouseover', e => {
  const el = e.target.closest && e.target.closest('[data-tip]');
  if (el === tipFor) return;
  clearTimeout(tipT);
  if (!el) { if (tipFor) hideTip(); return; }
  if (!matchMedia('(hover: hover)').matches) return;
  const warm = TIPEL.classList.contains('on');
  tipT = setTimeout(() => showTip(el), warm ? 40 : 360);
});
document.addEventListener('focusin', e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el && e.target.matches(':focus-visible')) showTip(el); else hideTip(); });
document.addEventListener('focusout', hideTip);
document.addEventListener('pointerdown', hideTip, true);
addEventListener('scroll', hideTip, { passive: true, capture: true });
const tipAttrs = (label, key) => ` data-tip="${esc(label)}" aria-label="${esc(label)}"${key ? ` data-key="${esc(key)}" aria-keyshortcuts="${esc(key)}"` : ''}`;

/* ================= the map: titles beside numbered markers, one spine, branches hang off it ================= */
function drawMap() {
  const sc = $('#mapScroll'); const cur = W.nodes[W.current]; const onPath = new Set(pathTo(cur).map(n => n.id));
  const loopsTo = {}; (W.loops || []).forEach(([a, b]) => { (loopsTo[b] = loopsTo[b] || []).push(a); });
  const row = n => {
    const dug = n.status === 'done' || n.status === 'partial';
    const cls = ['mrow', n.id === W.current ? 'cur' : '', onPath.has(n.id) ? 'on' : '', dug ? '' : 'unread', n.status === 'digging' ? 'writing' : ''].filter(Boolean).join(' ');
    const lp = loopsTo[n.id] ? `<span class="mx"${tipAttrs(`Looped back here from ${loopsTo[n.id].map(id => W.nodes[id] && W.nodes[id].title).filter(Boolean).join(', ')}`)}>${ic('loop')}</span>` : '';
    const br = n.from && n.from.bridge ? `<span class="mx"${tipAttrs('A connecting page')}>${ic('connect')}</span>` : '';
    return `<a class="${cls}" href="#/w/${W.id}/${n.id}" data-s="${stratumOf(n.depth)}"${n.id === W.current ? ' aria-current="page"' : ''}><span class="mk" data-tip="Level ${n.depth}: ${esc(LEVELS[stratumOf(n.depth)].name)}${dug ? '' : ', not read yet'}">${n.depth}</span><span class="mt">${esc(n.title)}</span>${lp}${br}</a>`;
  };
  const line = start => {
    let h = ''; let n = start;
    while (n) {
      const kids = childrenOf(n.id); const main = kids.find(k => onPath.has(k.id)) || kids[0]; const side = kids.filter(k => k !== main);
      h += `<li data-s="${stratumOf(n.depth)}" class="${main ? (onPath.has(main.id) ? 'pc' : '') : 'end'}">${row(n)}${side.length ? `<ol class="mbranch">${side.map(s => `<li class="bl"><ol class="mline">${line(s)}</ol></li>`).join('')}</ol>` : ''}</li>`;
      n = main;
    }
    return h;
  };
  sc.innerHTML = `<ol class="mline mtree">${line(W.nodes[W.root])}</ol>`;
  const nodes = W.order.map(x => W.nodes[x]); const done = nodes.filter(n => n.status === 'done').length; const deep = Math.max(...nodes.map(n => n.depth));
  $('#mapStats').textContent = `${done} page${done === 1 ? '' : 's'}, down to level ${deep}`;
  const c = $('.mrow.cur', sc); if (c) { const want = c.offsetTop - sc.clientHeight / 2 + 20; if (Math.abs(sc.scrollTop - want) > sc.clientHeight / 3) sc.scrollTo({ top: Math.max(0, want), behavior: reducedMotion() ? 'auto' : 'smooth' }); }
}
function legendHTML() {
  return `<p class="kmini" aria-label="Link colours">${Object.entries(KIND_LABEL).map(([k, l]) => `<span data-kind="${k}"${tipAttrs(`${l} links`)}></span>`).join('')}</p>`;
}

function renderTrail() {
  if (!W) return; const path = pathTo(W.nodes[W.current]);
  let items = path.map((n, i) => i === path.length - 1 ? `<b aria-current="page">${esc(n.title)}</b>` : `<a href="#/w/${W.id}/${n.id}">${esc(n.title)}</a>`);
  if (items.length > 4) items = [items[0], '<span>…</span>', ...items.slice(-2)];
  $('#trail').innerHTML = items.join('<i aria-hidden="true">›</i>');
  $('#gauge').innerHTML = meterHTML(W.nodes[W.current].depth);
}

/* ================= the front page ================= */
function ladderHTML() {
  return `<ol class="ladder" aria-label="Levels of nerd: an example path through eight levels">${LEVELS.map((l, i) => `<li data-s="${i}"><span class="ln">${i}</span><span class="lt">${esc(l.name)}<em>${esc(EXAMPLE_DIG[i])}</em></span><span class="lm">${esc(l.medium)}</span></li>`).join('')}</ol>
<p class="ladder-cap">Every link takes you one level deeper, from curious to galaxy brain. This example path runs from a medieval cipher to the hexagons inside your brain.</p>`;
}
function columnSVG() { return ladderHTML(); }
/* One quiet line under the start box: what reading costs right now. */
function trialLine() {
  if (auth.byok) return '';
  const n = pagesLeft();
  if (n > 0) return `<p class="status live" id="status">${n >= TRIAL_PAGES ? `Your first ${n} pages are on us.` : `${n} more free page${n === 1 ? '' : 's'} on this device.`} No account needed.</p>`;
  return `<p class="status" id="status"><span>You’ve read your free pages. <button class="linkish" type="button" data-act="keys">Add your own key</button> to keep going.</span></p>`;
}
/* ================= voice menu ================= */
function renderVoice() {
  $('#voicePop').innerHTML = `<fieldset><legend>Voice</legend>${Object.entries(LENSES).map(([k, [n, d]]) => `<label><input type="radio" name="lens" value="${k}"${store.settings.lens === k ? ' checked' : ''}><b>${n}</b><span>${d}</span></label>`).join('')}</fieldset>
<p class="fine">Applies to new pages. Press R to rewrite the one you are reading.</p>`;
}
$('#voicePop').addEventListener('change', e => {
  if (e.target.name === 'lens') store.settings.lens = e.target.value;
  save(); if (W) $$('.chamber').forEach(sec => { const n = W.nodes[sec.dataset.nid]; if (n) paintTools(n, sec); });
  toast(`${LENSES[store.settings.lens][0]} voice for new pages.`);
});
document.addEventListener('click', e => { const v = $('#voice'); if (v.open && !v.contains(e.target)) v.open = false; });

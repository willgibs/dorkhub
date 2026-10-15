/* ================= the trial line: what reading costs right now ================= */
function trialLine() {
  if (auth.byok) return '';
  const n = pagesLeft();
  if (n > 0) return `<p class="status live" id="status">${n >= TRIAL_PAGES ? `Your first ${n} pages are on us.` : `${n} more free page${n === 1 ? '' : 's'} on this device.`} No account needed.</p>`;
  return `<p class="status" id="status"><span>You’ve read your free pages. <button class="linkish" type="button" data-act="keys">Add your own key</button> to keep going.</span></p>`;
}
/* ================= voice menu: in the top bar while reading, in the composer on the front page ================= */
function renderVoice() {
  const fieldset = `<fieldset><legend>Voice</legend>${Object.entries(LENSES).map(([k, [n, d]]) => `<label><input type="radio" name="lens" value="${k}"${store.settings.lens === k ? ' checked' : ''}><b>${n}</b><span>${d}</span></label>`).join('')}</fieldset>`;
  $('#voicePop').innerHTML = `${fieldset}<p class="fine">Applies to new pages. Press R to rewrite the one you are reading.</p>`;
  $$('.voice-pop').forEach(el => { el.innerHTML = `${fieldset}<p class="fine">The pages you open from here are written in this voice.</p>`; });
}
function setLens(lens) {
  store.settings.lens = lens; save(); renderVoice();
  const chips = $('#seedChips'); if (chips) chips.innerHTML = voiceChipHTML();
  const p = curPage(); const sec = p && secFor(p.id); if (sec) paintTools(p, sec);
}
document.addEventListener('change', e => {
  if (e.target.name !== 'lens' || !LENSES[e.target.value]) return;
  const cv = e.target.closest('.cvoice'); /* found before the menu is redrawn under it */
  const inSheet = !!e.target.closest('#sheet');
  setLens(e.target.value); if (cv) cv.open = false; if (inSheet) sheet.close();
  toast(`${LENSES[store.settings.lens][0]} voice for new pages.`);
});
document.addEventListener('click', e => { $$('details.voice[open]').forEach(v => { if (!v.contains(e.target)) v.open = false; }); });

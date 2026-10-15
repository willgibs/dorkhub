/* ================= keys: free pages, your own key, and (soon) Pro =================
   No accounts for reading. The free pages are counted on the server; a reader's own key is
   kept in this browser only and sent with each request. */
const cents = x => (x < 0.01 ? `${(x * 100).toFixed(1).replace(/\.0$/, '')}¢` : `${Math.round(x * 100)}¢`);
const modelName = id => (findModel(id) || { name: id }).name;
function keyLabel() {
  const k = auth.byok; const n = pagesLeft();
  return k ? `Writing with your ${PROVIDERS[k.provider].name} key: ${modelName(k.model)}` : n > 0 ? `${n} free page${n === 1 ? '' : 's'} left. Bring your own key any time` : 'Free pages used. Add your own key';
}
function renderKeyBtn() {
  const k = auth.byok; const n = pagesLeft(); const label = keyLabel(); const state = k ? 'key' : n > 0 ? 'trial' : 'out';
  /* the top bar's key while reading, and the composer's key pill on the landing */
  for (const b of [$('#keyBtn'), $('#seedKey')]) { if (!b) continue; b.dataset.state = state; b.dataset.tip = label; b.setAttribute('aria-label', `Keys. ${label}`); }
  const kb = $('#keyBtn .kb-n'); if (kb) kb.textContent = k ? '' : String(n);
  const sk = $('#seedKey'); if (sk) sk.innerHTML = seedKeyHTML();
  const slot = $('#statusSlot'); if (slot) slot.innerHTML = trialLine();
}
function nowHTML() {
  const k = auth.byok;
  if (k) { const P = PROVIDERS[k.provider]; const m = findModel(k.model); return `<div class="ks-now" data-state="key"><p class="ks-h">Writing with your ${esc(P.name)} key</p><p>Pages use <b>${esc(m.name)}</b>, about ${cents(pageCost(m))} each, billed to you by ${esc(k.provider === 'gateway' ? 'Vercel' : P.name)}. Quick tools like peeks and sketches use ${esc(modelName(P.quick))}.</p></div>`; }
  const n = pagesLeft(); const dots = `<span class="ks-dots" aria-hidden="true">${Array.from({ length: TRIAL_PAGES }, (_, i) => `<i${i < n ? ' class="on"' : ''}></i>`).join('')}</span>`;
  if (n > 0) return `<div class="ks-now"><p class="ks-h"><b>${n}</b> of ${TRIAL_PAGES} free pages left${dots}</p><p>This month, on this device, no account needed. Quick tools like peeks, sketches and quizzes have their own, larger allowance.</p></div>`;
  return `<div class="ks-now" data-state="out"><p class="ks-h">You’ve read your free pages${dots}</p><p>Add your own API key below to keep going. Dorkhub Pro, with no keys at all, is on its way.</p></div>`;
}
function keyFormHTML(prov, model) {
  const P = PROVIDERS[prov]; const models = modelsFor(prov); const pick = models.find(m => m.id === model) || models[0]; const saved = auth.byok && auth.byok.provider === prov;
  return `<fieldset><legend>Use your own key</legend>
<div class="seg" role="radiogroup" aria-label="Provider">${Object.entries(PROVIDERS).filter(([, p]) => p.enabled).map(([id, p]) => `<label><input type="radio" name="kprov" value="${id}"${id === prov ? ' checked' : ''}><span>${esc(p.name)}</span></label>`).join('')}</div>
<div class="ks-models" role="radiogroup" aria-label="Model for pages">${models.map(m => `<label class="ks-m"><input type="radio" name="kmodel" value="${m.id}"${m === pick ? ' checked' : ''}><b>${esc(m.name)}</b><em>~${cents(pageCost(m))} a page</em><span>${esc(m.blurb)}</span></label>`).join('')}</div>
<label class="field" for="keyIn">${esc(P.name)} API key<input id="keyIn" type="password" placeholder="${saved ? 'Saved. Paste a new key to replace it' : esc(P.keyHint)}" spellcheck="false" autocomplete="off" autocapitalize="off"></label>
<p class="fine" id="keyMsg" aria-live="polite">Get one at ${esc(P.keyWhere)}. Your key stays in this browser: it travels with each request to write a page and is never stored or logged on Dorkhub’s servers.</p>
</fieldset>`;
}
function keysSheet() {
  const k = auth.byok; const prov = k ? k.provider : 'anthropic';
  openSheet('Keys', `<div class="keysheet">${nowHTML()}<form id="keyForm" autocomplete="off">${keyFormHTML(prov, k ? k.model : '')}</form>
<div class="ks-pro"><p class="ks-h">Dorkhub Pro <span class="soon">soon</span></p><p>No keys and no setup: a monthly allowance of pages, paid for directly.</p></div></div>`,
    `<button class="btn glow" type="button" data-act="key-save">${k ? 'Save' : 'Check and save key'}</button>${k ? '<button class="btn ghost" type="button" data-act="key-forget">Remove my key</button>' : ''}`);
  if (!k) setTimeout(() => { if (matchMedia('(hover: hover)').matches) $('#keyIn')?.focus(); }, 60);
}
document.addEventListener('change', e => {
  if (e.target.name !== 'kprov') return; const k = auth.byok;
  $('#keyForm').innerHTML = keyFormHTML(e.target.value, k && k.provider === e.target.value ? k.model : '');
  $(`#keyForm input[value="${e.target.value}"]`)?.focus();
});
document.addEventListener('submit', e => { if (e.target.id === 'keyForm') { e.preventDefault(); const b = $('[data-act="key-save"]'); if (b) saveKey(b); } });
async function saveKey(btn) {
  const form = $('#keyForm'); if (!form || btn.disabled) return;
  const provider = $('input[name="kprov"]:checked', form)?.value; const model = $('input[name="kmodel"]:checked', form)?.value;
  const P = PROVIDERS[provider]; const msg = $('#keyMsg'); if (!P || !model) return;
  const typed = $('#keyIn').value.trim(); const key = typed || (auth.byok && auth.byok.provider === provider ? auth.byok.key : '');
  if (!key) { msg.textContent = `Paste your ${P.name} key first.`; $('#keyIn').focus(); return; }
  if (!key.startsWith(P.keyPrefix)) { msg.textContent = `That doesn’t look like a ${P.name} key. Those start with ${P.keyPrefix}`; $('#keyIn').focus(); return; }
  btn.disabled = true; msg.textContent = `Checking the key with ${P.name}…`;
  try {
    await write('check', {}, { key: { provider, model, key } });
    auth.byok = { provider, model, key }; saveAuth(); renderKeyBtn();
    sheet.close(); toast(`Saved. New pages are written by ${modelName(model)}.`);
    const cur = W && W.nodes[W.current]; /* the page that was waiting on a key gets written now */
    if (cur && cur.status === 'error' && ['trial_over', ...KEY_FIX].includes(cur.errorCode)) generate(cur);
  } catch (e) {
    btn.disabled = false;
    msg.textContent = e.code === 'bad_key' ? `${P.name} turned that key down. Check it and try again.` : e.code === 'model_unavailable' ? `That key can’t use ${modelName(model)}. Pick another model.` : e.code === 'key_limit' ? 'That key works, but it’s out of credit or rate-limited right now.' : errText(e.code);
  }
}
function forgetKey() { auth.byok = null; saveAuth(); renderKeyBtn(); sheet.close(); toast('Key removed from this browser.'); }

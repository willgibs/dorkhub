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

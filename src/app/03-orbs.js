/* ================= thinking orbs: one loop for every orb on screen =================
   A real wait gets an orb (src/vendor/orbs.js), its motion chosen by what is happening:
   connecting while a page's links are chosen, composing while words are written, searching
   while something is looked up, solving for a quiz. They are drawn in the
   page's quiet ink, only while they are on screen, and hold one still frame for reduced motion. */
import { ORBS } from '../vendor/orbs.js';
import { $, $$, esc, isDark, reducedMotion } from './02-util.js';
const ORB_PX = 20;
export const orbHTML = state => `<canvas class="orb" data-orb="${state}" width="${ORB_PX * 2}" height="${ORB_PX * 2}" aria-hidden="true"></canvas>`;
/* a wait in plain words, with its orb in front */
export const waitHTML = (state, text) => `<span class="wait">${orbHTML(state)}<span>${esc(text)}</span></span>`;
let ORB_RAF = 0, ORB_INK = null;
function orbInk() {
  const m = /^#?([0-9a-f]{6})$/i.exec(getComputedStyle(document.body).getPropertyValue('--mute').trim());
  const n = m ? parseInt(m[1], 16) : 0x5e636b; return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255 };
}
function drawOrb(c, t) {
  const ctx = c.getContext('2d'); if (!ctx) return; const k = c.width / ORB_PX;
  ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, ORB_PX, ORB_PX);
  ORBS.paintFrame(ctx, ORBS.frame(c.dataset.orb, ORB_PX, t), isDark(), ORB_INK);
}
function orbLoop(now) {
  ORB_RAF = 0; const orbs = $$('canvas.orb'); if (!orbs.length) return;
  if (!document.hidden) for (const c of orbs) { const r = c.getBoundingClientRect(); if (r.width && r.bottom > 0 && r.top < innerHeight) drawOrb(c, now / 1000); }
  ORB_RAF = requestAnimationFrame(orbLoop);
}
function wakeOrbs() {
  if (ORB_RAF || !$('canvas.orb')) return;
  ORB_INK = orbInk();
  if (reducedMotion()) { $$('canvas.orb').forEach(c => drawOrb(c, 0.6)); return; }
  ORB_RAF = requestAnimationFrame(orbLoop);
}
/* the theme changed: the orbs take its ink at once, mid-wait included (a still orb is drawn again) */
export function rethemeOrbs() {
  if (!$('canvas.orb')) return; ORB_INK = orbInk();
  if (!ORB_RAF) $$('canvas.orb').forEach(c => drawOrb(c, 0.6));
}

/* What this module does when the page starts. main.js runs these in order, after every module has loaded. */
export function init() {
new MutationObserver(wakeOrbs).observe(document.body, { childList: true, subtree: true });
}

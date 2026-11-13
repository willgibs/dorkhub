/* ================= a graph view's card: the topic pointed at, and opening it =================
   The card beside a topic says what it is, when you read it and what it connects to; a map given a panel
   (the front page's) shows the topic there instead. Reads one map's state (S, made in 11-graph.js). */
import { clip, plain } from '../shared/article.js';
import { addStep, routeOf } from '../shared/world.js';
import { kattr } from './01-data.js';
import { esc, relTime, save, store } from './02-util.js';
import { CUR, go, openTopic, pageOf } from './04-pages.js';
import { kg, radius, setFocus, toScreen } from './11-graph-camera.js';

export function showTip(S, i, actions) {
  if (i < 0) { hideTip(S); return; }
  const { g, adj, tip, describe, open, panel, mini, still, cw, ch } = S;
  if (panel) { panel(g.nodes[i], actions); return; }
  const n = g.nodes[i]; const [x, y] = toScreen(S, n); const near = adj[i].map(j => g.nodes[j]).filter(m => m.read).map(m => m.title);
  const lead = n.read && pageOf(n.pid)?.deck ? plain(pageOf(n.pid).deck) : n.hook || '';
  const status = describe ? describe(n) : n.read ? `Read ${relTime(n.last)}${n.saved ? ' · saved' : ''}` : n.count === 1 ? 'On one of your pages' : `On ${n.count} of your pages`;
  const links = near.length ? `${n.read ? 'Links to' : 'Linked from'} ${near.slice(0, 2).map(t => `<b>${esc(clip(t, 26))}</b>`).join(' and ')}${near.length > 2 ? ` and ${near.length - 2} more` : ''}` : '';
  tip.innerHTML = `<p class="gt-k lbl"><span class="kind"${kattr(n.kind)}>${esc(n.kind || 'topic')}</span><span>${esc(status)}</span></p><p class="gt-t">${esc(n.title)}</p>${lead ? `<p class="gt-h">${esc(clip(lead, 140))}</p>` : ''}${links ? `<p class="gt-l">${links}</p>` : ''}${actions ? `<div class="gt-a"><button class="btn glow" type="button" data-gv="open">${n.read && !open ? 'Go there' : 'Open page'}</button>${mini || still ? '' : '<button class="btn ghost" type="button" data-gv="focus">Focus</button>'}</div>` : ''}`;
  tip.dataset.kind = kg(n); tip.hidden = false; tip.classList.toggle('act', !!actions);
  const tw = tip.offsetWidth, th = tip.offsetHeight; const r = radius(S, n);
  let left = x - tw / 2, top = y + r + 12; if (top + th > ch - 8) top = y - r - 12 - th;
  tip.style.left = `${Math.max(8, Math.min(cw - tw - 8, left))}px`; tip.style.top = `${Math.max(8, top)}px`;
}
export function hideTip(S) { S.tip.hidden = true; }
/* the card's buttons act on the selected topic */
export function listenCard(S) {
  S.tip.addEventListener('click', e => { const b = /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (e.target).closest('[data-gv]')); if (!b || S.sel < 0) return; const n = S.g.nodes[S.sel]; if (b.dataset.gv === 'open') openNode(S, n); else { setFocus(S, n.key); hideTip(S); } });
}
export function openNode(S, n) {
  hideTip(S); if (S.open) { S.open(n); return; }
  if (n.read && n.pid) { const p = pageOf(n.pid); if (p) { if (p.id !== CUR) { addStep(store.trails, p.id, { from: CUR || null, via: 'world' }); p.last = Date.now(); save(); } go(routeOf(p.req)); return; } }
  openTopic(n.title, { via: 'world', hint: n.kind || n.hook ? { gloss: n.hook, kind: n.kind } : null });
}

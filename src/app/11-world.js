/* ================= Your world: the graph of everything you've read =================
   The data (worldGraph), the small map beside a page and the full page at /world. Each map is a graph view
   (makeGraph, 11-graph.js), drawn like an instrument, not a light show. */
import { clip } from '../shared/article.js';
import { routeOf } from '../shared/world.js';
import { buildGraph, localGraph, nodeKeyOf } from '../shared/graph.js';
import { KIND_LABEL, kattr, kindOf } from './01-data.js';
import { $, esc, reducedMotion, relTime, save, store, toast } from './02-util.js';
import { ic } from './03-icons.js';
import { CUR, curPage, pageOf, trailPages, worldCount } from './04-pages.js';
import { worldIndex } from './05-render.js';
import { saveFile } from './08-sheets.js';
import { SIDE, sideClosed } from './10-tools.js';
import { makeGraph } from './11-graph.js';
import { DOORS, doorHTML } from './13-landing.js';
import { tipAttrs } from './14-map-tips.js';
import { VIEW } from './16-router.js';

/* ================= the graph data: your world, now ================= */
export function worldGraph() { return buildGraph(store.pages, store.trails, { current: CUR, maxRead: 500, maxUnread: 300 }); }
/* how many topics are one click away: everything your pages link to that you haven't read */
export function oneClickAway() { const W = worldIndex(); let n = 0; for (const k of W.back.keys()) if (!W.read.has(k)) n++; return n; }

/* ================= the small map beside a page ================= */
export let MINI = null; export const MINI_POS = new Map();
export function sleepMini() { if (MINI) MINI.sleep(); }
export function renderMini(grow = []) {
  const pane = $('#worldPane'); if (!pane) return;
  if (!pane.dataset.built) { pane.innerHTML = `<div class="mini"><div class="mini-stage" id="miniStage"></div><p class="mini-stats" id="miniStats"></p><a class="mini-open" href="/world" data-world="1">Open Your world ${ic('right')}</a></div>`; pane.dataset.built = '1'; MINI = null; }
  const p = curPage(); const full = worldGraph();
  const center = p && (p.status === 'done' || p.status === 'partial') ? nodeKeyOf(p) : '';
  const start = center || (full.nodes.find(n => n.read) || {}).key || '';
  const local = start ? localGraph(full, start, 48, 12) : { nodes: [], edges: [] };
  if (!MINI) MINI = makeGraph($('#miniStage'), { mini: true, positions: MINI_POS });
  MINI.setData(local, { center, grow });
  const n = worldCount(); $('#sideStats').textContent = n ? `${n} topic${n === 1 ? '' : 's'} in your world` : 'Your world starts with this page';
  $('#miniStats').innerHTML = n ? `<b>${n}</b> read · <b>${oneClickAway()}</b> one click away` : 'Every page you finish joins your world.';
}
/* a page finished: it springs into the map beside it, if that map is open; otherwise only the count moves */
export function worldGrew(p) {
  if (VIEW !== 'page' || sideClosed() || SIDE !== 'world' || !MINI) return;
  renderMini([nodeKeyOf(p)]);
}

/* ================= the full page: /world ================= */
export let WORLD = null, WHIDE = new Set();
function worldPageHTML() {
  const full = worldGraph(); const read = full.nodes.filter(n => n.read);
  if (!read.length) return `<section class="wpage empty"><div class="wp-empty"><span class="wp-glyph">${ic('world')}</span><h1>Your world starts with your first page</h1><p>Every page you read becomes a point of light here, joined to everything it links to. Start anywhere.</p><div class="wp-doors">${DOORS.slice(0, 4).map(d => doorHTML(d)).join('')}</div></div></section>`;
  const saved = Object.values(store.pages).filter(p => p.saved && (p.status === 'done' || p.status === 'partial')).sort((a, b) => b.saved - a.saved);
  const kinds = {}; for (const n of read) { const k = kindOf(n.kind) || 'concept'; kinds[k] = (kinds[k] || 0) + 1; }
  const kindList = Object.keys(KIND_LABEL).filter(k => kinds[k]);
  const most = [...read].sort((a, b) => b.deg - a.deg)[0];
  const trails = store.trails.filter(t => trailPages(t).length);
  const longest = trails.reduce((m, t) => Math.max(m, trailPages(t).length), 0);
  const since = Math.min(...read.map(n => n.first || Date.now()));
  return `<section class="wpage">
  <header class="wp-head"><h1>Your world</h1><p class="wp-sum"><span><b>${read.length}</b> topic${read.length === 1 ? '' : 's'} read</span><span><b>${oneClickAway()}</b> one click away</span><span><b>${saved.length}</b> saved</span></p></header>
  <div class="wp-stage" id="wpStage" role="img" aria-label="A map of the ${read.length} topics you have read and the topics they link to. The lists below hold the same topics.">
    <div class="wp-bar">
      <label class="wp-find"><span class="sr">Find a topic in your world</span>${ic('search')}<input id="wpFind" type="search" placeholder="Find a topic" autocomplete="off"></label>
      <div class="wp-kinds" role="group" aria-label="Show kinds">${kindList.map(k => `<button type="button" data-wkind="${k}" data-kind="${k}" aria-pressed="${!WHIDE.has(k)}"${tipAttrs(`${KIND_LABEL[k]}: ${kinds[k]}`)}><i></i></button>`).join('')}</div>
      <div class="wp-acts"><button class="tool ib" type="button" data-wact="fit"${tipAttrs('Fit everything')}>${ic('fit')}</button><button class="tool ib" type="button" data-wact="focus"${tipAttrs('Focus: within two links')}>${ic('focus')}</button><button class="tool ib" type="button" data-wact="replay"${tipAttrs('Replay your latest trail')}>${ic('trail')}</button><button class="tool ib" type="button" data-wact="image"${tipAttrs('Download a picture of your world')}>${ic('image')}</button></div>
    </div>
    <p class="wp-hint">${matchMedia('(hover: hover)').matches ? 'Drag to move, scroll to zoom, click a topic to open it. Shift-click to focus.' : 'Drag to move, pinch to zoom, tap a topic for more.'}</p>
  </div>
  <div class="wp-grid">
    <section class="wp-card"><h2>What you read</h2><div class="wp-bars" role="img" aria-label="${kindList.map(k => `${kinds[k]} ${KIND_LABEL[k].toLowerCase()}`).join(', ')}">${kindList.map(k => `<i data-kind="${k}" style="flex:${kinds[k]}"></i>`).join('')}</div><ul class="wp-legend">${kindList.map(k => `<li data-kind="${k}"><i></i>${KIND_LABEL[k]}<b>${kinds[k]}</b></li>`).join('')}</ul></section>
    <section class="wp-card"><h2>So far</h2><dl class="wp-facts">${most && most.deg ? `<div><dt>Most connected</dt><dd><a href="${esc(routeOf(pageOf(most.pid)?.req || { title: most.title }))}" data-goto="${esc(most.pid)}">${esc(most.title)}</a>, linked to ${most.deg} topic${most.deg === 1 ? '' : 's'}</dd></div>` : ''}<div><dt>Longest trail</dt><dd>${longest} topic${longest === 1 ? '' : 's'} in one sitting</dd></div><div><dt>Since</dt><dd>${esc(new Date(since).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }))}</dd></div></dl></section>
    <section class="wp-card"><h2>Saved</h2>${saved.length ? `<ul class="wp-list">${saved.slice(0, 12).map(p => `<li><a href="${esc(routeOf(p.req))}" data-goto="${esc(p.id)}"${kattr(p.kind)}><i></i><b>${esc(p.title)}</b><span>${esc(relTime(p.saved))}</span></a></li>`).join('')}</ul>` : `<p class="wp-none">Press the star on any page to keep it here.</p>`}</section>
    <section class="wp-card"><h2>Trails</h2><ul class="wp-list">${trails.slice(0, 8).map(t => { const ps = trailPages(t); return `<li><button type="button" data-replay="${esc(t.id)}"${tipAttrs('Replay this trail')}><i class="pl">${ic('play')}</i><b>${esc(clip(ps[0].title, 26))} → ${esc(clip(ps[ps.length - 1].title, 26))}</b><span>${ps.length} topic${ps.length === 1 ? '' : 's'}, ${esc(relTime(t.steps[t.steps.length - 1][1]))}</span></button></li>`; }).join('')}</ul></section>
  </div>
</section>`;
}
export function showWorld() {
  const seen = store.settings.worldSeen || 0;
  $('#view').innerHTML = worldPageHTML(); document.title = 'Your world: dorkhub';
  const stage = $('#wpStage'); if (!stage) { WORLD = null; return; }
  WORLD = makeGraph(stage, { positions: store.pos });
  WORLD.setHidden(WHIDE);
  /* what grew since you last looked springs in, newest last */
  const full = worldGraph(); const grown = seen ? full.nodes.filter(n => n.read && n.first > seen).sort((a, b) => a.first - b.first).slice(-12).map(n => n.key) : [];
  WORLD.setData(full, { grow: grown });
  store.settings.worldSeen = Date.now(); save();
  const t = new URLSearchParams(location.search).get('trail'); const tr = t && store.trails.find(x => x.id === t);
  if (tr) setTimeout(() => { if (WORLD) WORLD.startReplay(tr.steps.map(s => s[0])); }, reducedMotion() ? 0 : 500);
}
export function leaveWorld() { if (WORLD) { WORLD.destroy(); WORLD = null; } }

/* What this module does when the page starts. main.js runs these in order, after every module has loaded. */
export function init() {
document.addEventListener('click', e => {
  if (!WORLD) return;
  const k = /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (e.target).closest('[data-wkind]'));
  if (k) { const kind = k.dataset.wkind; if (WHIDE.has(kind)) WHIDE.delete(kind); else WHIDE.add(kind); k.setAttribute('aria-pressed', String(!WHIDE.has(kind))); WORLD.setHidden(WHIDE); return; }
  const a = /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (e.target).closest('[data-wact]')); if (a) {
    const w = a.dataset.wact;
    if (w === 'fit') { WORLD.setFocus(''); WORLD.stopReplay(); WORLD.frameView(); }
    else if (w === 'focus') { const p = pageOf(store.current); const key = WORLD.focused ? '' : p ? nodeKeyOf(p) : ''; WORLD.setFocus(key); if (!key) WORLD.frameView(); a.setAttribute('aria-pressed', String(!!key)); }
    else if (w === 'replay') { const t = store.trails.find(x => trailPages(x).length > 1) || store.trails[0]; if (!t || !WORLD.startReplay(t.steps.map(s => s[0]))) toast('Read a few pages, then replay the trail you took.'); }
    else if (w === 'image') { const n = worldCount(); WORLD.picture({ title: 'My world', sub: `${n} topic${n === 1 ? '' : 's'} read on Dorkhub · ${new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}` }).then(b => { if (b) saveFile('my-dorkhub-world.png', b); }); }
    return;
  }
  const r = /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (e.target).closest('[data-replay]')); if (r) { const t = store.trails.find(x => x.id === r.dataset.replay); if (t) { $('#wpStage')?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }); WORLD.startReplay(t.steps.map(s => s[0])); } }
});
document.addEventListener('keydown', e => {
  if (/** @type {HTMLElement} */ (e.target).id !== 'wpFind' || !WORLD) return;
  if (e.key === 'Enter') { e.preventDefault(); const i = WORLD.find(/** @type {HTMLInputElement} */ (e.target).value); if (i >= 0) WORLD.select(i); else toast('That topic isn’t in your world yet.'); }
  else if (e.key === 'Escape') { /** @type {HTMLInputElement} */ (e.target).value = ''; WORLD.select(-1); }
});
}

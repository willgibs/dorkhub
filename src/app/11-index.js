/* ================= your index: every topic you have met, across every rabbit hole ================= */
function findElsewhere(k) {
  for (const w of store.warrens) { if (w === W) continue; const n = w.order.map(x => w.nodes[x]).find(x => x && x.keys.includes(k) && x.status === 'done'); if (n) return { w, n }; }
  return null;
}
function encyclopedia() {
  const all = new Map();
  for (const w of store.warrens) {
    if (!w.order.some(x => w.nodes[x] && w.nodes[x].status === 'done')) continue;
    for (const e of buildIndex(w)) {
      let a = all.get(e.key); if (!a) { a = { key: e.key, name: e.name, gloss: e.gloss, kind: e.kind, mentions: 0, digs: new Set(), dug: null, from: null }; all.set(e.key, a); }
      a.mentions += e.mentions.size; a.digs.add(w.id); if (!a.gloss) a.gloss = e.gloss; if (!a.kind) a.kind = e.kind;
      if (e.node && e.node.status === 'done' && !a.dug) { a.dug = { w, n: e.node }; a.name = e.node.title; }
      if (!a.from && e.mentions.size) { const nid = w.order.filter(id => e.mentions.has(id)).pop(); if (nid) a.from = { w, nid }; }
    }
  }
  return [...all.values()];
}
let ENC = null, ENCQ = '';
function encHTML() {
  ENC = encyclopedia(); if (ENC.length < 8) return '';
  const digs = store.warrens.filter(w => w.order.some(x => w.nodes[x] && w.nodes[x].status === 'done')).length; const dug = ENC.filter(e => e.dug).length;
  return `<section class="enc" aria-labelledby="encH"><div class="sec-h"><h2 id="encH">Your index</h2><p>${ENC.length} things you’ve met across ${digs} rabbit hole${digs === 1 ? '' : 's'}, ${dug} of them read. It grows every time you do.</p></div>
<label class="sr" for="encq">Search your encyclopedia</label><input id="encq" type="search" placeholder="Search everything you’ve ever met" autocomplete="off">
<div class="enc-list" id="encList">${encList()}</div></section>`;
}
function encList() {
  const q = ENCQ; let list = ENC.filter(e => !q || e.name.toLowerCase().includes(q) || (e.gloss || '').toLowerCase().includes(q));
  list.sort(q ? (a, b) => a.name.localeCompare(b.name) : (a, b) => (b.digs.size * 3 + b.mentions) - (a.digs.size * 3 + a.mentions));
  list = list.slice(0, 12);
  if (!list.length) return `<p class="ix-empty">Nothing you’ve met matches “${esc(q)}”. Start a rabbit hole there?</p><button class="chip" type="button" data-seed="${esc(q)}">Start with ${esc(q)}</button>`;
  return list.map(e => `<button class="enc-i" type="button" data-enc="${esc(e.key)}"><b>${esc(e.name)}${e.dug ? '<i>read</i>' : ''}</b>${e.gloss ? `<span>${esc(e.gloss)}</span>` : ''}<em>${e.kind ? esc(e.kind) + ', ' : ''}${e.mentions} mention${e.mentions === 1 ? '' : 's'}${e.digs.size > 1 ? ` in ${e.digs.size} rabbit holes` : ''}</em></button>`).join('');
}
function openEnc(key) {
  const e = (ENC || []).find(x => x.key === key); if (!e) return;
  if (e.dug) { location.hash = `#/w/${e.dug.w.id}/${e.dug.n.id}`; return; }
  if (e.from) { W = e.from.w; dig(e.name, { text: `From the reader's encyclopedia. ${e.gloss || ''}` }, e.from.nid); return; }
  newWarren(e.name);
}

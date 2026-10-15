const sheet = $('#sheet');
/* Opening a sheet replaces whatever was in it, so anything still being written for the old one stops. */
function openSheet(title, bodyHTML, footHTML = '') { if (sheetCtl) { sheetCtl.abort(); sheetCtl = null; } $('#sheetTitle').textContent = title; $('#sheetBody').innerHTML = bodyHTML; $('#sheetFoot').innerHTML = footHTML; $('#sheetFoot').hidden = !footHTML; if (!sheet.open) sheet.showModal(); }
let sheetCtl = null;
/* The close event is queued, so it can arrive after the sheet was already reopened for something new. */
sheet.addEventListener('close', () => { if (sheet.open) return; if (sheetCtl) sheetCtl.abort(); sheetCtl = null; });
$('#sheetX').addEventListener('click', () => sheet.close());
function renderThread(text) {
  const lines = text.trim().split('\n').filter(Boolean); let h = '';
  for (const l of lines) { const m = /^thread:\s*(.+)$/i.exec(l.trim()); h += m ? `<p class="thread-line">${esc(m[1])}</p>` : `<p>${esc(l)}</p>`; }
  return h;
}
async function threadSheet() {
  const node = W.nodes[W.current]; if (node.depth === 0) return;
  const path = pathTo(node);
  if (node.thread) { openSheet('How you got here', renderThread(node.thread)); return; }
  openSheet('How you got here', `<p class="digging">${waitHTML('connecting', 'Following your footprints back up')}</p>`);
  const steps = path.map(n => ({ title: n.title, deck: n.deck ? clip(n.deck, 400) : '', via: n.from && (n.from.question || n.from.text) ? clip(n.from.question || n.from.text, 200) : '' }));
  const ctl = sheetCtl = new AbortController();
  try {
    const { text } = await write('thread', { steps }, { signal: ctl.signal, onText: ({ text }) => { if (sheetCtl === ctl) $('#sheetBody').innerHTML = renderThread(text); } });
    node.thread = text; save(); if (sheetCtl === ctl) $('#sheetBody').innerHTML = renderThread(text);
  } catch (e) { if (sheetCtl === ctl && e?.code !== 'cancelled') $('#sheetBody').innerHTML = `<p>${esc(errText(e?.code))}</p>`; }
}
function mdToHTML(md) {
  let h = '', list = false;
  for (const raw of md.split('\n')) {
    const l = raw.trim(); let m;
    if (!/^[-*]\s/.test(l) && list) { h += '</ul>'; list = false; }
    if (!l) continue;
    if ((m = /^#\s+(.+)/.exec(l))) h += `<h1>${esc(m[1])}</h1>`;
    else if ((m = /^#{2,3}\s+(.+)/.exec(l))) h += `<h2>${esc(m[1])}</h2>`;
    else if ((m = /^[-*]\s+(.+)/.exec(l))) { if (!list) { h += '<ul>'; list = true; } h += `<li>${fmt(esc(m[1]))}</li>`; }
    else h += `<p>${fmt(esc(l))}</p>`;
  }
  return h + (list ? '</ul>' : '');
}
function notesFoot() { return `<button class="btn glow" type="button" data-act="save-notes">Download recap (.md)</button><button class="btn ghost" type="button" data-act="copy-notes">Copy</button><button class="btn ghost" type="button" data-act="renotes">Write them again</button>`; }
async function fieldNotes(fresh) {
  if (!W) return; const w = W;
  if (w.notes && !fresh) { openSheet('Recap', mdToHTML(w.notes), notesFoot()); return; }
  const done = w.order.map(x => w.nodes[x]).filter(n => n.status === 'done');
  if (done.length < 2) { toast('Read at least two pages first. A recap needs a journey.'); return; }
  openSheet('Recap', `<p class="digging">${waitHTML('composing', 'Gathering what you found')}</p>`);
  const read = new Set(done.flatMap(n => n.keys));
  const untaken = [...new Set(done.flatMap(n => parseArticle(n.text).tunnels.map(t => t.target)).filter(t => !read.has(keyOf(t))))].slice(0, 14);
  const ctl = sheetCtl = new AbortController();
  try {
    const said = n => { const A = parsed(n); return clip([...panelLines(A), ...A.blocks.filter(b => b.t === 'p').slice(0, 2).map(b => b.s)].map(plain).join(' '), 420); };
    const { text } = await write('recap', { pages: done.map(n => ({ depth: n.depth, title: n.title, deck: n.deck ? clip(n.deck, 400) : '', text: said(n) })), untaken }, { signal: ctl.signal, fresh, onText: ({ text }) => { if (sheetCtl === ctl) $('#sheetBody').innerHTML = mdToHTML(text); } });
    w.notes = text; save(); if (sheetCtl === ctl) openSheet('Recap', mdToHTML(text), notesFoot());
  } catch (e) { if (sheetCtl === ctl && e?.code !== 'cancelled') $('#sheetBody').innerHTML = `<p>${esc(errText(e?.code))}</p>`; }
}
function warrenMarkdown(w) {
  const root = w.nodes[w.root]; const out = [`# dorkhub: ${root.title}`, '', `Started ${new Date(w.created).toDateString()}. ${Object.keys(w.nodes).length} pages. Written live by AI; verify before quoting.`, ''];
  if (w.notes) out.push(w.notes.trim(), '', '---', '');
  const walk = (n) => {
    if (n.status === 'done' || n.status === 'partial') {
      const A = parseArticle(n.text);
      out.push(`${'#'.repeat(Math.min(6, 2 + Math.min(n.depth, 3)))} ${A.title || n.title}`, '', `*Level ${n.depth}, ${STRATA[stratumOf(n.depth)].toLowerCase()}*`, '');
      if (A.deck) out.push(`> ${plain(A.deck)}`, '');
      const pl = panelLines(A); pl.forEach(l => out.push(`- ${plain(l)}`)); if (pl.length) out.push('');
      A.blocks.forEach(b => out.push(b.t === 'h' ? `**${plain(b.s)}**` : b.t === 'li' ? `- ${plain(b.s)}` : plain(b.s), ''));
    }
    w.order.map(x => w.nodes[x]).filter(c => c.parent === n.id).forEach(walk);
  };
  walk(root); return out.join('\n');
}
const fileSlug = s => keyOf(s).replace(/\s+/g, '-').slice(0, 40) || 'rabbit-hole';
function saveFile(name, data) {
  const url = URL.createObjectURL(new Blob([data], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.hidden = true;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  toast('Saved to your downloads.');
}

const NS = 'http://www.w3.org/2000/svg';

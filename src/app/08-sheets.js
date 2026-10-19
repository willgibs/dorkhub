const sheet = $('#sheet');
/* Opening a sheet replaces whatever was in it, so anything still being written for the old one stops. */
function openSheet(title, bodyHTML, footHTML = '') { if (sheetCtl) { sheetCtl.abort(); sheetCtl = null; } $('#sheetTitle').textContent = title; $('#sheetBody').innerHTML = bodyHTML; $('#sheetFoot').innerHTML = footHTML; $('#sheetFoot').hidden = !footHTML; if (!sheet.open) sheet.showModal(); }
let sheetCtl = null;
/* The close event is queued, so it can arrive after the sheet was already reopened for something new. */
sheet.addEventListener('close', () => { if (sheet.open) return; if (sheetCtl) sheetCtl.abort(); sheetCtl = null; });
$('#sheetX').addEventListener('click', () => sheet.close());

/* ================= your trail: how you got here, step by step ================= */
const VIA = { start: 'where you started', link: 'a link on', card: 'kept exploring from', question: 'a question on', ask: 'asked on', select: 'selected on', search: 'searched for', world: 'from Your world', connect: 'connecting', around: 'around', sketch: 'a sketch of' /* trails from before sketches were dropped */, peek: 'a peek on', index: 'from your index', trail: 'from your trail' };
function viaLine(step) {
  const [, at, from, via] = step; const f = pageOf(from); const when = new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const how = VIA[via] || 'opened'; const needsFrom = !['start', 'search', 'world', 'index', 'trail'].includes(via);
  return `${esc(capFirst(how))}${needsFrom && f ? ` ${esc(clip(f.title, 40))}` : ''} · ${esc(when)}`;
}
function trailHTML(t) {
  const steps = t.steps.filter(s => pageOf(s[0]));
  return `<p class="tr-sum">${steps.length} step${steps.length === 1 ? '' : 's'}, from ${esc(relTime(steps[0][1]))}.</p><ol class="trail-list">${steps.map((s, i) => { const p = pageOf(s[0]); return `<li><a href="${esc(routeOf(p.req))}" data-goto="${esc(p.id)}"${kattr(p.kind || (p.hint && p.hint.kind))}><span class="tl-n">${i + 1}</span><b>${esc(p.title)}</b><span>${viaLine(s)}</span></a></li>`; }).join('')}</ol>`;
}
function trailSheet(t = curTrail()) {
  if (!t || !t.steps.length) { toast('Your trail starts with your first page.'); return; }
  openSheet('How you got here', trailHTML(t), `<a class="btn glow" href="/world?trail=${esc(t.id)}" data-world-replay="${esc(t.id)}">See it in Your world</a><button class="btn ghost" type="button" data-act="recap">Recap this trail</button>`);
}

/* ================= recap: what you found on this trail ================= */
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
/* the sheet is already called Recap, so the recap's own title leads without saying it again */
const notesHTML = md => mdToHTML(md.replace(/^#\s+Recap:\s*(\S)/m, (_, c) => `# ${c.toUpperCase()}`));
function notesFoot() { return `<button class="btn glow" type="button" data-act="save-notes">Download recap (.md)</button><button class="btn ghost" type="button" data-act="copy-notes">Copy</button><button class="btn ghost" type="button" data-act="renotes">Write it again</button>`; }
async function recapTrail(fresh) {
  const t = curTrail(); if (!t) { toast('Read at least two pages first. A recap needs a trail.'); return; }
  if (t.notes && !fresh) { openSheet('Recap', notesHTML(t.notes), notesFoot()); return; }
  const done = trailPages(t).filter(p => p.text && p.status === 'done');
  if (done.length < 2) { toast('Read at least two pages first. A recap needs a trail.'); return; }
  openSheet('Recap', `<p class="digging">${waitHTML('composing', 'Gathering what you found')}</p>`);
  const read = new Set(done.map(p => topicKey(p.title)));
  const untaken = [...new Set(done.flatMap(p => cardsOf(parseArticle(p.text)).map(c => c.target)).filter(x => !read.has(topicKey(x))))].slice(0, 14);
  const ctl = sheetCtl = new AbortController();
  try {
    const said = p => { const A = parsed(p); return clip([...panelLines(A), ...A.blocks.filter(b => b.t === 'p').slice(0, 2).map(b => b.s)].map(plain).join(' '), 420); };
    const { text } = await write('recap', { pages: done.slice(-12).map(p => ({ title: p.title, deck: p.deck ? clip(p.deck, 400) : '', text: said(p) })), untaken }, { signal: ctl.signal, fresh, onText: ({ text }) => { if (sheetCtl === ctl) $('#sheetBody').innerHTML = notesHTML(text); } });
    t.notes = text; save(); if (sheetCtl === ctl) openSheet('Recap', notesHTML(text), notesFoot());
  } catch (e) { if (sheetCtl === ctl && e?.code !== 'cancelled') $('#sheetBody').innerHTML = `<p>${esc(errText(e?.code))}</p>`; }
}

/* ================= export: the trail you're on, as Markdown ================= */
function trailMarkdown(t = curTrail()) {
  const pages = trailPages(t).filter(p => p.text && (p.status === 'done' || p.status === 'partial'));
  const out = [`# Dorkhub: ${pages.length ? pages[0].title : 'a trail'}`, '', `${pages.length} page${pages.length === 1 ? '' : 's'}, ${new Date(t ? t.steps[0][1] : Date.now()).toDateString()}. Written by AI; verify before quoting.`, ''];
  if (t && t.notes) out.push(t.notes.trim(), '', '---', '');
  for (const p of pages) {
    const A = parseArticle(p.text);
    out.push(`## ${A.title || p.title}`, '');
    if (A.deck) out.push(`> ${plain(A.deck)}`, '');
    const pl = panelLines(A); pl.forEach(l => out.push(`- ${plain(l)}`)); if (pl.length) out.push('');
    A.blocks.forEach(b => out.push(b.t === 'h' ? `**${plain(b.s)}**` : b.t === 'li' ? `- ${plain(b.s)}` : plain(b.s), ''));
  }
  return out.join('\n');
}
const fileSlug = s => keyOf(s).replace(/\s+/g, '-').slice(0, 40) || 'dorkhub';
function saveFile(name, data, type = 'text/markdown;charset=utf-8') {
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.hidden = true;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  toast('Saved to your downloads.');
}
function exportTrail() {
  const t = curTrail(); const first = t && trailPages(t)[0];
  if (!first) { toast('Read a page first, then export your trail.'); return; }
  saveFile(`${fileSlug(first.title)}-trail.md`, trailMarkdown(t));
}

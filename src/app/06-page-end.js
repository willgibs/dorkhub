/* ================= the end of a page: one quiet row system ================= */
const DIR_MARK = { deeper: ['deeper', 'Deeper: more specific, same subject'], sideways: ['sideways', 'Sideways: a neighbouring subject'], wild: ['wild', 'Wild card: a surprising far jump'] };
function rowHTML({ mark, title, hook, tag = '', tagTip = '', cls = '', attrs = '', markTip = '' }) {
  return `<button class="row${cls}" type="button" ${attrs}><span class="rk"${markTip ? ` data-tip="${esc(markTip)}"` : ' aria-hidden="true"'}>${mark}</span><span class="rt">${title}</span>${tag ? `<span class="rd"${tagTip ? ` data-tip="${esc(tagTip)}"` : ''}>${tag}</span>` : ''}${hook ? `<span class="rh">${hook}</span>` : ''}</button>`;
}
function rowsBlock(el, heading, sub, rows) {
  if (!el._built) { el.innerHTML = `<h3 class="eh"></h3><div class="rows"></div>`; el._built = true; }
  setHTML($('.eh', el), `${heading}${sub ? ` <span>${sub}</span>` : ''}`);
  patch($('.rows', el), rows);
}
const KEY_FIX = ['bad_key', 'key_limit', 'model_unavailable'];
function statusNote(node) {
  const code = node.errorCode;
  if (node.status === 'error' && code === 'trial_over') return `<div class="statusnote paywall"><h2>You’ve read your free pages</h2><p>Keep going with your own API key from Anthropic or Vercel AI Gateway. Pages then cost from about a tenth of a cent each, billed to you by the provider, and every tool keeps working. Dorkhub Pro, with no keys at all, is on its way.</p><div class="sn-a"><button class="btn glow" type="button" data-act="keys">Add a key</button>${W.demo ? '' : '<button class="btn ghost" type="button" data-act="demo">Read the demo instead</button>'}</div></div>`;
  if (node.status === 'error' || node.status === 'offline') return `<div class="statusnote"><h2>That page didn’t come through</h2><p>${esc(node.error || errText())}</p><div class="sn-a">${KEY_FIX.includes(code) ? '<button class="btn glow" type="button" data-act="keys">Open Keys</button>' : ''}<button class="btn${KEY_FIX.includes(code) ? ' ghost' : ' glow'}" type="button" data-act="retry" data-nid="${node.id}">Try again</button></div></div>`;
  if (node.status === 'partial') return `<div class="statusnote"><h2>This page stopped partway</h2><p>${esc(node.error || 'It was left unfinished.')}</p><button class="btn glow" type="button" data-act="retry" data-nid="${node.id}">Finish it</button></div>`;
  return '';
}
function paintEnd(node, sec, A, live) {
  const end = $('.a-end', sec); const done = node.status === 'done' && !live; const blocks = [];
  const RIC = { basic: 'basic', right: 'right2', lost: 'lost', wow: 'wow' };
  if (done) blocks.push({ k: 'react', html: `<div class="react" role="group" aria-label="How was this page?">${Object.entries(REACT).map(([k, [l]]) => `<button type="button" data-react="${k}" aria-pressed="${node.reaction === k}"${tipAttrs(l)}>${ic(RIC[k])}</button>`).join('')}</div>` });
  if (A.next) {
    const ex = findByKey(keyOf(A.next.target)); const below = ex && secFor(ex.id); const nd = node.depth + 1;
    blocks.push({ k: 'next', html: `<button class="next${below ? ' below' : ''}" type="button" data-next="${node.id}" data-s="${stratumOf(nd)}"><span class="next-meta"><span class="mk" data-tip="Level ${nd}: ${esc(levelOf(nd).name)}">${nd}</span>${below ? 'Continued below' : 'Next'}</span><span class="next-title">${esc(A.next.label)}</span><span class="next-why">${esc(plain(A.next.why))}</span><span class="next-go">${below ? 'Scroll down ↓' : 'Continue reading <kbd>J</kbd>'}</span></button>` });
  }
  const g0 = parsed(node).gloss;
  const branchRows = A.tunnels.slice(0, 5).map((t, i) => {
    const ex = findByKey(keyOf(t.target)); const loop = ex && ex.parent !== node.id; const d = DIR_MARK[t.dir]; const g = g0[keyOf(t.target)];
    return { k: 't' + keyOf(t.target), html: rowHTML({ mark: i + 1, markTip: `Press ${i + 1}`, title: esc(t.label), hook: inline(t.teaser || (g && g.gloss) || '', node), tag: d ? ic(d[0]) : '', tagTip: d ? d[1] : '', cls: loop ? ' loop' : '', attrs: `data-t="${esc(t.target)}" data-teaser="${esc(t.teaser)}" data-dir="${t.dir}" data-n="${i + 1}"${kattr(g && g.kind)}` }) };
  });
  if (done) {
    const mine = linksOf(node);
    const echo = buildIndex().filter(e => !e.node && e.mentions.size >= 3 && mine.has(e.key)).sort((a, b) => b.mentions.size - a.mentions.size)[0];
    if (echo) branchRows.push({ k: 'echo', html: rowHTML({ mark: '↻', title: esc(echo.name), hook: `You keep running into this: it has come up on ${echo.mentions.size} pages. ${esc(echo.gloss || '')}`, tag: ic('loop'), tagTip: 'Keeps coming up in this rabbit hole', attrs: `data-echo="${esc(echo.name)}" data-gloss="${esc(echo.gloss)}"${kattr(echo.kind)}` }) });
  }
  if (branchRows.length) blocks.push({ k: 'branches', rows: branchRows, heading: 'Branches', sub: '' });
  if (A.questions.length) blocks.push({ k: 'qs', rows: A.questions.map((q, i) => ({ k: 'q' + i, html: rowHTML({ mark: '?', markTip: 'Opens a page that answers it', title: esc(q), attrs: `data-q="${esc(q)}" data-kind="mystery"` }) })), heading: 'Open questions', sub: '' });
  if (done) {
    const kids = childrenOf(node.id).filter(k => k.status === 'done' || k.status === 'partial');
    if (kids.length) blocks.push({ k: 'explored', rows: kids.map(k => ({ k: 'x' + k.id, html: rowHTML({ mark: '✓', title: esc(k.title), hook: k.deck ? esc(plain(k.deck)) : '', attrs: `data-goto="${k.id}" data-s="${stratumOf(k.depth)}"` }) })), heading: 'Already read from here', sub: '' });
  }
  if (live && A.bodyDone) blocks.push({ k: 'enrich', html: `<p class="enriching">Adding branches, margin notes and link previews<span class="dots"></span></p>` });
  const st = statusNote(node); if (st) blocks.push({ k: 'status', html: st });
  const existing = new Map(); for (const el of end.children) if (el.dataset.k) existing.set(el.dataset.k, el);
  let prev = null; const anim = !reducedMotion();
  for (const b of blocks) {
    let el = existing.get(b.k);
    if (el) existing.delete(b.k); else { el = document.createElement('div'); el.dataset.k = b.k; el.className = ((b.rows ? 'eblock' : '') + (anim ? ' enter' : '')).trim(); }
    if (b.rows) rowsBlock(el, b.heading, b.sub, b.rows); else setHTML(el, b.html);
    place(end, el, prev); prev = el;
  }
  existing.forEach(el => el.remove());
}
function paintTools(node, sec) {
  const parent = node.parent ? W.nodes[node.parent] : null; const t = []; const ready = node.status === 'done' && !REV.has(node.id);
  const b = (act, icon, label, key, on = true, extra = '') => `<button class="tool ib" type="button" data-act="${act}" data-nid="${node.id}"${tipAttrs(label, key)}${on ? '' : ' disabled'}${extra}>${ic(icon)}</button>`;
  const mi = (act, label, key, on = true) => `<button class="mi" type="button" data-act="${act}" data-nid="${node.id}"${on ? '' : ' disabled'}>${label}${key ? ` <kbd>${key}</kbd>` : ''}</button>`;
  if (node.status === 'digging') t.push(`<button class="tool primary" type="button" data-act="stop" data-nid="${node.id}">${ic('stop')}Stop writing</button>`);
  if (parent) t.push(`<a class="tool ib" href="#/w/${W.id}/${parent.id}"${tipAttrs(`Back up to ${parent.title}`, 'U')}>${ic('up')}</a>`);
  if (node.depth > 1) t.push(`<a class="tool ib" href="#/w/${W.id}/${W.root}"${tipAttrs(`Back to the start: ${W.nodes[W.root].title}`, 'S')}>${ic('top')}</a>`);
  if (t.length) t.push('<span class="tsep" aria-hidden="true"></span>');
  t.push(b('sketch', 'sketch', node.figure && node.figure !== 'loading' ? 'Show the sketch' : 'Sketch it: a diagram of this page', 'K', ready));
  t.push(b('land', 'around', 'Around this: the topics nearby', 'L', ready));
  if (W.order.filter(x => W.nodes[x].status === 'done').length > 1) t.push(b('bridge', 'connect', 'Connect to another page you’ve read', 'C', ready));
  if (TTS) t.push(b('listen', SPEAK.nid === node.id ? 'stop' : 'listen', SPEAK.nid === node.id ? 'Stop listening' : 'Listen', 'P', ready, ` aria-pressed="${SPEAK.nid === node.id}"`));
  const more = [];
  if (node.depth > 0) more.push(mi('thread', 'How did I get here?', 'T', ready));
  more.push(mi('doubt', 'Skeptic mode', 'D', ready));
  more.push(mi('recall', 'What stuck? A quick quiz', 'Q', true));
  more.push(mi('rewrite', `Rewrite as ${esc(LENSES[store.settings.lens][0].toLowerCase())}`, 'R', node.status !== 'digging'));
  more.push(`<button class="mi" type="button" data-act="help">All shortcuts <kbd>?</kbd></button>`);
  t.push(`<details class="more"><summary class="tool ib"${tipAttrs('More')}>${ic('more')}</summary><div class="more-pop" role="menu">${more.join('')}</div></details>`);
  const tools = $('.tools', sec); if ($('details.more[open]', tools)) return;
  setHTML(tools, t.join(''));
}
function paintDoubt(node, sec) {
  const el = $('.a-doubt', sec); if (!el) return;
  if (!node.doubts) { setHTML(el, ''); return; }
  if (node.doubts === 'loading') { setHTML(el, `<div class="doubt enter"><h2>Skeptic mode</h2><p class="digging">Reading this page with a raised eyebrow<span class="dots"></span></p></div>`); return; }
  if (typeof node.doubts === 'string') { setHTML(el, `<div class="doubt"><h2>Skeptic mode</h2><p>${esc(node.doubts)}</p></div>`); return; }
  const label = { solid: 'Solid', check: 'Check', shaky: 'Shaky' };
  const h = `<div class="doubt"><h2>Skeptic mode</h2><p>The claims on this page most worth verifying before you repeat them, highlighted in the text above.</p><ol>${node.doubts.map(d => `<li><span class="r ${d.rating}">${label[d.rating]}</span><q>${esc(d.quote)}</q><p>${esc(d.note)}</p></li>`).join('')}</ol></div>`;
  if (el._h === h && $('mark.dq', sec)) return; setHTML(el, h);
  const body = $('.a-body', sec);
  for (const d of node.doubts) {
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT); let t;
    while ((t = walker.nextNode())) {
      if (t.parentElement.closest('mark,.mnote,.xp')) continue;
      const i = t.data.indexOf(d.quote); if (i < 0) continue;
      const r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + d.quote.length);
      const mk = document.createElement('mark'); mk.className = 'dq'; mk.title = d.note; r.surroundContents(mk); break;
    }
  }
}
async function doubtPage(nid) {
  const node = W.nodes[nid || W.current]; if (!node || node.status !== 'done' || node.doubts === 'loading') return;
  node.doubts = 'loading'; paint(node); const sec = secFor(node.id); if (sec) $('.a-doubt', sec).scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
  const A = parsed(node); const txt = [A.deck, ...A.facts.map(f => `${f[0]}: ${f[1]}`), ...A.blocks.map(b => b.s)].map(plain).join('\n');
  try {
    const out = await writeJSON('doubt', { page: clip(txt, 9000) });
    const list = (Array.isArray(out) ? out : []).filter(d => d && d.quote).slice(0, 5).map(d => ({ quote: String(d.quote).trim().replace(/^["“]|["”]$/g, ''), note: String(d.note || ''), rating: ['solid', 'check', 'shaky'].includes(d.rating) ? d.rating : 'check' }));
    node.doubts = list.length ? list : 'Nothing specific enough to flag. Still: check before you quote.';
  } catch (e) { node.doubts = errText(e?.code); }
  save(); paint(node);
}

/* ================= recap when you come back ================= */
const RECAP = {};
function recapHTML(node) {
  const r = RECAP[W.id]; if (!r || r.nid !== node.id) return '';
  const path = pathTo(node); const done = W.order.filter(x => W.nodes[x].status === 'done').length;
  const echo = buildIndex().filter(e => !e.node && e.mentions.size >= 3).sort((a, b) => b.mentions.size - a.mentions.size)[0];
  const chain = path.length > 1 ? `from <b>${esc(path[0].title)}</b> to <b>${esc(node.title)}</b>` : `at <b>${esc(node.title)}</b>`;
  return `<div class="recap" role="note"><p class="rc-l">Welcome back</p><p>You were last here ${esc(relTime(r.last))}, reading ${chain}, ${done} page${done === 1 ? '' : 's'} in all.${echo ? ` One thing kept coming up: <b>${esc(echo.name)}</b>.` : ''}</p><div class="rc-a">${node.depth > 0 ? `<button class="btn ghost" type="button" data-act="thread" data-nid="${node.id}">Retrace the thread</button>` : ''}<button class="btn ghost" type="button" data-next="${node.id}">Continue reading</button>${echo ? `<button class="btn ghost" type="button" data-echo="${esc(echo.name)}" data-gloss="${esc(echo.gloss)}">Open ${esc(clip(echo.name, 26))}</button>` : ''}${done >= 2 ? `<button class="btn ghost" type="button" data-act="recall-new">Quick quiz</button>` : ''}<button class="btn ghost" type="button" data-act="dismiss-recap">Dismiss</button></div>${W.recallLast ? `<p class="rc-s">Last quiz: ${W.recallLast.score} of ${W.recallLast.of}, ${esc(relTime(W.recallLast.at))}.</p>` : ''}</div>`;
}

/* ================= peeks & paragraph expansions: small, on demand, cached ================= */
function blockText(node, i) { const b = parsed(node).blocks[i]; return b ? plain(b.s) : ''; }
async function streamSmall(node, holder, task, input) {
  let q = false;
  try {
    const { text } = await write(task, input, { onText: ({ text }) => { holder.text = text; if (!q) { q = true; requestAnimationFrame(() => { q = false; paint(node, true); }); } } });
    holder.text = text.trim(); holder.status = 'done';
  } catch (e) { holder.text = errText(e?.code); holder.status = 'error'; }
  save(); paint(node);
}
function peek(nid, target, label, i) {
  const node = W.nodes[nid]; if (!node) return;
  node.peeks = node.peeks || []; const key = keyOf(target);
  const ex = node.peeks.find(p => p.key === key);
  if (ex && ex.status !== 'error') { ex.open = true; ex.after = i; paint(node); return; }
  if (ex) node.peeks.splice(node.peeks.indexOf(ex), 1);
  const p = { key, target, label, after: i, text: '', status: 'digging', open: true }; node.peeks.push(p); paint(node);
  streamSmall(node, p, 'peek', { ...ctxInput(node), passage: clip(blockText(node, i), 600), target });
}
function unfold(nid, i, mode) {
  const node = W.nodes[nid]; if (!node) return;
  node.unfolds = node.unfolds || {}; node.unfolds[i] = { mode, text: '', status: 'digging' };
  const sec = secFor(nid); const old = sec && $(`.pb[data-i="${i}"] .px [data-k="u"]`, sec); if (old) old.remove();
  paint(node);
  streamSmall(node, node.unfolds[i], 'unfold', { ...ctxInput(node), paragraph: clip(blockText(node, i), 900), mode });
}

// The run's two pages, each one self-contained HTML file: report.html (the summary) and review.html (the
// owner's blind review: pairs of pages side by side as plain text, a pick for each, kept in localStorage and
// exported as JSON for `node scripts/eval.mjs picks`).
import { cardsOf, parseArticle, plain } from '../../src/shared/article.js';

/** @param {unknown} s */
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** @param {unknown} v */
const json = v => JSON.stringify(v).replace(/</g, '\\u003c');

const STYLE = `:root{--bg:#fbfaf7;--fg:#1d1c1a;--mute:#6b6862;--line:#e3e0d8;--card:#fff;--good:#2f7d4f;--bad:#b3412f;--accent:#3b5bdb}
@media (prefers-color-scheme:dark){:root{--bg:#161615;--fg:#ecebe7;--mute:#a19e97;--line:#34332f;--card:#1f1f1d;--good:#6cc58f;--bad:#f08a76;--accent:#8ea2ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1180px;margin:0 auto;padding:24px 16px 80px}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:28px 0 8px}
.mute{color:var(--mute)}.warn{border:1px solid var(--bad);color:var(--bad);padding:8px 12px;border-radius:6px;margin:12px 0}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums;font-size:13px}th,td{padding:6px 8px;border-bottom:1px solid var(--line);text-align:right;vertical-align:top}
th:first-child,td:first-child{text-align:left}th{font-weight:600}.wrap{overflow-x:auto}.ns{color:var(--mute)}.sig{color:var(--good);font-weight:600}`;

/** @param {{ mean: number | null, lo: number | null, hi: number | null, n: number }} c @param {string} key */
function ci(c, key) {
  if (!c || c.mean == null) return '<span class="mute">n/a</span>';
  const pct = /Share|compliance|usable/.test(key); const ms = /^(first|firstBody|total)$/.test(key);
  const f = (/** @type {number} */ x) => pct ? `${(x * 100).toFixed(0)}%` : ms || Math.abs(x) >= 100 ? Math.round(x).toLocaleString('en-US') : x.toFixed(2);
  return `${f(c.mean)} <span class="mute">[${f(/** @type {number} */ (c.lo))}, ${f(/** @type {number} */ (c.hi))}]</span>`;
}

/** @param {any[]} rows @param {string} title */
function winTable(rows, title) {
  if (!rows || !rows.length) return '';
  return `<h2>${esc(title)}</h2><div class="wrap"><table><tr><th>pair</th><th>n</th><th>first wins</th><th>second wins</th><th>ties</th><th>first's win rate</th><th>sign test p</th><th></th></tr>
${rows.map(r => `<tr><td>${esc(r.a)} vs ${esc(r.b)}</td><td>${r.n}</td><td>${r.aWins}</td><td>${r.bWins}</td><td>${r.ties}</td><td>${r.aRate == null ? 'n/a' : `${(r.aRate * 100).toFixed(0)}%`}</td><td>${r.p.toFixed(3)}</td><td class="${r.verdict === 'significant' ? 'sig' : 'ns'}">${r.verdict}</td></tr>`).join('\n')}</table></div>`;
}

/** @param {ReturnType<typeof import('./summary.js').summarize>} S */
export function reportHtml(S) {
  const arms = S.arms;
  const rows = S.measures.map(m => `<tr><td>${esc(m.label)}</td>${arms.map(a => `<td>${ci(S.perArm[a][m.key], m.key)}</td>`).join('')}</tr>`).join('\n');
  const fails = arms.map(a => `<tr><td>${esc(a)}</td><td style="text-align:left">${Object.entries(S.perArm[a].failedChecks).map(([k, n]) => `${esc(k)} (${n})`).join(', ') || '<span class="mute">none</span>'}</td></tr>`).join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Writer eval report</title><style>${STYLE}</style></head><body><main>
<h1>Writer eval: ${esc(S.runId)}</h1>
<p class="mute">${esc(S.mode)} run · ${esc(S.createdAt)} · ${arms.length} arms · ${S.perArm[arms[0]]?.pages ?? 0} pages an arm · writer tokens ${S.tokens.writer.input.toLocaleString('en-US')} in, ${S.tokens.writer.output.toLocaleString('en-US')} out · judge tokens ${S.tokens.judge.input.toLocaleString('en-US')} in, ${S.tokens.judge.output.toLocaleString('en-US')} out · ${S.usd == null ? 'price unknown' : `$${S.usd.toFixed(2)} spent`} (plan: ${S.planned.calls} calls, ${S.planned.usd == null ? 'price unknown' : `$${S.planned.usd.toFixed(2)}`})</p>
${S.note ? `<div class="warn">${esc(S.note)}</div>` : ''}${S.stopped ? `<div class="warn">Stopped early: ${esc(S.stopped)}</div>` : ''}
<h2>Per arm: means with 95% bootstrap intervals</h2>
<p class="mute">Accuracy first: an arm that contradicts its sources more often than the control cannot win, however engaging.</p>
<div class="wrap"><table><tr><th>measure</th>${arms.map(a => `<th>${esc(a)}</th>`).join('')}</tr>
${rows}</table></div>
${winTable(S.pairwise, 'Blind pairwise: which page a curious reader would rather keep reading (judge)')}
${S.owner ? winTable(S.owner, "Will's blind picks") : '<p class="mute">Will\'s blind picks: not read in yet (review.html, then <code>node scripts/eval.mjs picks</code>).</p>'}
<h2>Format checks failed, by arm</h2><div class="wrap"><table><tr><th>arm</th><th style="text-align:left">check (pages failing)</th></tr>${fails}</table></div>
</main></body></html>`;
}

/* A page as a reader would read it, in plain text: title, deck, key facts, body, the six cards. */
/** @param {string} text */
export function pageHtml(text) {
  const A = parseArticle(text, false);
  const P = (/** @type {string} */ s) => esc(plain(s));
  let para = 0; const body = [];
  for (const [i, b] of A.blocks.entries()) {
    if (b.t === 'h') body.push(`<h4>${P(b.s)}</h4>`);
    else if (b.t === 'li') body.push(`<p>• ${P(b.s)}</p>`);
    else { para++; body.push(`<p>${P(b.s)}</p>`); for (const n of A.notes.filter(x => x.n === para)) body.push(`<p class="aside">${P(n.s)}</p>`); }
    for (const p of A.panels.filter(x => x.at === i + 1)) body.push(`<div class="panel"><b>${esc(p.type)}${p.title ? `: ${P(p.title)}` : ''}</b>${p.heads.length ? `<div>${p.heads.map(P).join(' | ')}</div>` : ''}${p.rows.map(r => `<div>${r.map(P).join(' · ')}</div>`).join('')}</div>`);
  }
  return `<h3>${esc(A.title)}</h3>${A.deck ? `<p class="deck">${P(A.deck)}</p>` : ''}
${A.keyFacts.length ? `<dl>${A.keyFacts.map(f => `<dt>${P(f.label)}</dt><dd>${P(f.value)}</dd>`).join('')}</dl>` : ''}
${body.join('\n')}
<p class="end">Keep exploring</p><ol class="cards">${cardsOf(A).map(c => `<li><b>${esc(c.target)}</b> ${P(c.teaser)}</li>`).join('')}</ol>`;
}

const REVIEW_STYLE = `${STYLE}
.pair{border-top:2px solid var(--line);padding:16px 0 8px}.cols{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media (max-width:760px){.cols{grid-template-columns:1fr}}
.page{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 16px;max-height:80vh;overflow:auto}
.page h3{margin:4px 0;font-size:19px}.deck{font-style:italic}.aside{color:var(--mute);font-size:13px;border-left:2px solid var(--line);padding-left:8px}
.panel{font-size:13px;border:1px solid var(--line);border-radius:6px;padding:6px 10px;margin:8px 0}dl{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:13px}dt{color:var(--mute)}dd{margin:0}
.end{font-weight:600;margin-top:16px}.cards{padding-left:20px;font-size:14px}.picks{display:flex;gap:8px;margin:10px 0}
button{font:inherit;padding:6px 14px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
button.on{background:var(--accent);border-color:var(--accent);color:#fff}.bar{position:sticky;top:0;background:var(--bg);padding:10px 0;border-bottom:1px solid var(--line);display:flex;gap:12px;align-items:center;z-index:1;flex-wrap:wrap}`;

/** @param {string} runId @param {{ id: string, topic: string, left: string, right: string }[]} pairs */
export function reviewHtml(runId, pairs) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blind page review</title><style>${REVIEW_STYLE}</style></head><body><main>
<h1>Which page would you rather keep reading?</h1>
<p class="mute">Run ${esc(runId)}. ${pairs.length} pairs, each the same topic from two writers, sides and order shuffled; which writer is which is hidden. Picks stay in this browser. Export them when done and give the file to <code>node scripts/eval.mjs picks</code>.</p>
<div class="bar"><span id="count"></span><button id="export" type="button">Export picks</button></div>
${pairs.map(p => `<section class="pair" data-id="${esc(p.id)}"><p class="mute">${esc(p.id)}</p><div class="cols"><article class="page">${pageHtml(p.left)}</article><article class="page">${pageHtml(p.right)}</article></div>
<div class="picks"><button type="button" data-pick="left">Left</button><button type="button" data-pick="tie">Same</button><button type="button" data-pick="right">Right</button></div></section>`).join('\n')}
</main><script>
const RUN = ${json(runId)}; const KEY = 'dorkhub-eval-picks:' + RUN;
let picks = {}; try { picks = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { picks = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(picks)); } catch (e) {} };
const total = document.querySelectorAll('.pair').length;
function paint() {
  document.querySelectorAll('.pair').forEach(s => s.querySelectorAll('button').forEach(b => b.classList.toggle('on', picks[s.dataset.id] === b.dataset.pick)));
  document.getElementById('count').textContent = Object.keys(picks).length + ' of ' + total + ' picked';
}
document.addEventListener('click', e => {
  const b = e.target.closest('button[data-pick]'); if (!b) return;
  const id = b.closest('.pair').dataset.id; if (picks[id] === b.dataset.pick) delete picks[id]; else picks[id] = b.dataset.pick; save(); paint();
});
document.getElementById('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ runId: RUN, exportedAt: new Date().toISOString(), picks }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'picks-' + RUN + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
paint();
</script></body></html>`;
}

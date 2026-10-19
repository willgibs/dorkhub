// Score pages against what the prompt asks, so the prompt is judged on measures across many pages, never on one.
//   node scripts/score.mjs                 the pages written ahead of time (lib/seeds)
//   node scripts/score.mjs <dir> [file]    every <dir>/<name>/<file> (default live.txt), e.g. a batch of first tries
// One row per page, then the totals. How it's used (Will, 2026-10-19: get any page right on the first try): write a
// small batch of first tries, score it, change the prompt only for a failure on two or more pages of different
// kinds, and score a regression set unlike the front page after every change, so a rule that helps one page
// can't quietly hurt another. Reads files only; spends nothing.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = fileURLToPath(new URL('..', import.meta.url));
const { parseArticle, keyOf, splitLink } = await import(join(repo, 'src/shared/article.js'));
const { FRONT, THREADS } = await import(join(repo, 'lib/front.js'));
const { topicKey } = await import(join(repo, 'src/shared/world.js'));
const [dirArg, fileArg] = process.argv.slice(2);
const dir = dirArg || join(repo, 'lib/seeds'); const file = fileArg || (dirArg ? 'live.txt' : 'index.txt');
const words = (/** @type {string} */ s) => s.split(/\s+/).filter(Boolean).length;
const sentences = (/** @type {string} */ s) => s.replace(/\b(?:c|ca|St|Mt|Dr|Mr|Mrs|No|vs|e\.g|i\.e|approx)\./g, '$&#').split(/(?<=[.!?])\s+(?=[A-Z"“(])/).filter(x => x.trim());
const VAGUE = /\b(researchers|scientists|experts|scholars|historians|astronomers|archaeologists)\b|\bfor a long time\b|\bit is said\b|\bsome (?:say|believe)\b/gi;
const SUPER = /\b(largest|biggest|smallest|first|only|oldest|fastest|deepest|highest|most)\b/i;
const rows = [];
for (const name of readdirSync(dir).filter(n => existsSync(join(dir, n, file))).sort()) {
  const text = readFileSync(join(dir, name, file), 'utf8'); const A = parseArticle(text, false);
  const paras = A.blocks.filter(b => b.t === 'p').map(b => b.s.replace(/\[\[([^\]]+)\]\]/g, (_, i) => splitLink(i)[0]));
  const plan = [...((text.split('\n+++\n')[1] || '').split('\n---\n')[0]).matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1]);
  const names = plan.concat(A.tunnels.map(t => t.target));
  const linked = new Set(A.blocks.flatMap(b => [...b.s.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => keyOf(splitLink(m[1])[1]))));
  const echo = A.notes.filter(n => { const p = (paras[n.n - 1] || '').toLowerCase(); const w = n.s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(x => x.length > 4); return w.length > 0 && w.filter(x => p.includes(x)).length / w.length >= .6; });
  const T = FRONT.find(f => topicKey(f.t) === topicKey(A.title));
  const threads = T ? THREADS.filter(x => x.a === T.t || x.b === T.t).map(x => x.a === T.t ? x.b : x.a) : [];
  const offered = threads.filter(t => plan.some(n => keyOf(splitLink(n)[1]) === keyOf(t)) || A.tunnels.some(c => keyOf(c.target) === keyOf(t)));
  rows.push({ name, words: words(paras.join(' ')), paras: paras.length, solo: paras.filter(p => sentences(p).length === 1).length, qual: names.filter(n => /\([^)]+\)\s*$/.test(n)).length, names: names.length,
    unlinked: plan.filter(n => !linked.has(keyOf(splitLink(n)[1]))).length, vague: (paras.join(' ').match(VAGUE) || []).length, years: (paras.join(' ').match(/\b1[0-9]{3}\b|\b20[0-2][0-9]\b/g) || []).length,
    notes: A.notes.length, echo: echo.length, facts: A.keyFacts.length, superl: A.keyFacts.filter(f => SUPER.test(f.value)).length, panels: A.panels.map(p => p.type).join('+') || '-',
    kind: !T || A.kind === parseArticle(`# x :: ${T.k}\n`, false).kind, threads: `${offered.length}/${threads.length}`, cards: A.tunnels.length, qs: A.questions.length });
}
const cols = /** @type {const} */ (['name', 'words', 'paras', 'solo', 'qual', 'unlinked', 'vague', 'years', 'notes', 'echo', 'facts', 'superl', 'panels', 'kind', 'threads']);
const w = [22, 6, 6, 5, 9, 9, 6, 6, 6, 5, 6, 7, 18, 6, 8];
console.log(cols.map((c, i) => c.padEnd(w[i])).join(''));
for (const r of rows) console.log(cols.map((c, i) => String(c === 'qual' ? `${r.qual}/${r.names}` : c === 'kind' ? (r.kind ? 'ok' : 'WRONG') : r[c]).padEnd(w[i])).join(''));
const n = rows.length || 1; const sum = (/** @type {keyof typeof rows[0]} */ k) => rows.reduce((a, r) => a + Number(r[k]), 0);
console.log(`\n${rows.length} pages: ${Math.round(sum('words') / n)} words avg; one-sentence paragraphs ${sum('solo')} of ${sum('paras')}; qualified names ${sum('qual')} of ${sum('names')}; planned links never used ${sum('unlinked')}; vague attributions ${(sum('vague') / n).toFixed(1)} a page; years ${(sum('years') / n).toFixed(1)} a page; margin notes ${(sum('notes') / n).toFixed(1)} a page (${sum('echo')} repeating their paragraph); pages without three key facts ${rows.filter(r => r.facts !== 3).length}; superlatives among key facts ${sum('superl')}; wrong kind ${rows.filter(r => !r.kind).length}`);

// Score pages against what the prompt asks, so the prompt is judged on measures across many pages, never on one.
//   node scripts/score.mjs                 the pages written ahead of time (lib/seeds)
//   node scripts/score.mjs <dir> [file]    every <dir>/<name>/<file> (default live.txt), e.g. a batch of first tries
// One row per page, then the totals. How it's used (Will, 2026-10-19: get any page right on the first try): write a
// small batch of first tries, score it, change the prompt only for a failure on two or more pages of different
// kinds, and score a regression set unlike the front page after every change, so a rule that helps one page
// can't quietly hurt another. Reads files only; spends nothing. The measures themselves live in
// scripts/eval/score.js (scorePage), which the eval harness (scripts/eval.mjs) uses too.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scorePage } from './eval/score.js';
const repo = fileURLToPath(new URL('..', import.meta.url));
const { parseArticle } = await import(join(repo, 'src/shared/article.js'));
const { FRONT, THREADS } = await import(join(repo, 'lib/front.js'));
const { topicKey } = await import(join(repo, 'src/shared/world.js'));
const [dirArg, fileArg] = process.argv.slice(2);
const dir = dirArg || join(repo, 'lib/seeds'); const file = fileArg || (dirArg ? 'live.txt' : 'index.txt');
const rows = [];
for (const name of readdirSync(dir).filter(n => existsSync(join(dir, n, file))).sort()) {
  const text = readFileSync(join(dir, name, file), 'utf8'); const A = parseArticle(text, false);
  /* a front-page topic is checked against its card's kind and the threads the front page draws from it */
  const T = FRONT.find(f => topicKey(f.t) === topicKey(A.title));
  const threads = T ? THREADS.filter(x => x.a === T.t || x.b === T.t).map(x => x.a === T.t ? x.b : x.a) : [];
  rows.push({ name, ...scorePage(text, { expectKind: T ? T.k : '', threads }) });
}
const cols = /** @type {const} */ (['name', 'words', 'paras', 'solo', 'qual', 'unlinked', 'vague', 'years', 'notes', 'echo', 'facts', 'superl', 'panels', 'kind', 'threads']);
const w = [22, 6, 6, 5, 9, 9, 6, 6, 6, 5, 6, 7, 18, 6, 8];
console.log(cols.map((c, i) => c.padEnd(w[i])).join(''));
for (const r of rows) console.log(cols.map((c, i) => String(c === 'qual' ? `${r.qual}/${r.names}` : c === 'kind' ? (r.kind ? 'ok' : 'WRONG') : r[c]).padEnd(w[i])).join(''));
const n = rows.length || 1; const sum = (/** @type {keyof typeof rows[0]} */ k) => rows.reduce((a, r) => a + Number(r[k]), 0);
console.log(`\n${rows.length} pages: ${Math.round(sum('words') / n)} words avg; one-sentence paragraphs ${sum('solo')} of ${sum('paras')}; qualified names ${sum('qual')} of ${sum('names')}; planned links never used ${sum('unlinked')}; vague attributions ${(sum('vague') / n).toFixed(1)} a page; years ${(sum('years') / n).toFixed(1)} a page; margin notes ${(sum('notes') / n).toFixed(1)} a page (${sum('echo')} repeating their paragraph); pages without three key facts ${rows.filter(r => r.facts !== 3).length}; superlatives among key facts ${sum('superl')}; wrong kind ${rows.filter(r => !r.kind).length}`);

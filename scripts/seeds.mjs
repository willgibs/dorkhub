// Seeds: pages written ahead of time for the landing doors and every page one click off them.
//   node scripts/seeds.mjs doors                         list the doors and their slugs
//   node scripts/seeds.mjs prompt-door "<title>"          the exact depth-0 prompt (a question door asks as a question)
//   node scripts/seeds.mjs children <slug>               the pages one click off a written door, with how a reader arrives
//   node scripts/seeds.mjs prompt-child <slug> "<title>"  the exact depth-1 prompt for one of them
//   node scripts/seeds.mjs index                         rebuild lib/seeds/index.json from the files present
// How a seed is made (the 12 doors, 2026-10-14): a Claude Opus writer gets the exact prompt from
// prompt-door or prompt-child and writes the page in that format, saved as lib/seeds/<door>/index.txt
// (a door) or lib/seeds/<door>/<page>.txt (a child). A fact-check pass then checks every number, date,
// name and attribution against sources, and fixes or cuts anything shaky. Agents that browse send a
// generic User-Agent and no personal data. Then: node scripts/seeds.mjs index, then npm run verify.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = fileURLToPath(new URL('..', import.meta.url));
const { pageInput, pagePrompt } = await import(join(repo, 'lib/prompts.js'));
const { parseArticle, keyOf, plain, splitLink, isQuestion } = await import(join(repo, 'src/shared/article.js'));
const dir = join(repo, 'lib/seeds');
const slug = t => keyOf(t).replace(/\s+/g, '-');
const landing = readFileSync(join(repo, 'src/app/13-landing.js'), 'utf8');
const DOORS = [...landing.matchAll(/\{ t: '([^']+)', h:/g)].map(m => m[1].replace(/\\u2019|’/g, '’'));
const [cmd, a, b] = process.argv.slice(2);
const doorFile = s => join(dir, s, 'index.txt');

/* how the page would describe the arrival, as src/app/04-pages.js does */
function children(s) {
  const A = parseArticle(readFileSync(doorFile(s), 'utf8'), false); const out = new Map();
  const add = (title, via, extra = {}) => { const k = keyOf(title); if (k && !out.has(k) && k !== keyOf(A.title)) out.set(k, { title, via, ...extra }); };
  if (A.next) add(A.next.target, 'next', { text: plain(A.next.why) });
  for (const t of A.tunnels) add(t.target, 'branch', { text: `Chosen from the branches at the end of the page, with the hook: ${t.teaser}` });
  for (const bl of A.blocks) for (const m of bl.s.matchAll(/\[\[([^\]]+)\]\]/g)) add(splitLink(m[1])[1], 'link', { text: plain(bl.s).slice(0, 600) });
  for (const q of A.questions) add(q, 'question');
  return { A, list: [...out.values()] };
}

if (cmd === 'doors') DOORS.forEach(t => console.log(`${slug(t)}\t${t}${existsSync(doorFile(slug(t))) ? '\t(written)' : ''}`));
else if (cmd === 'prompt-door') {
  const q = isQuestion(a);
  process.stdout.write(pagePrompt(pageInput({ title: a, depth: 0, lens: 'encyclopedic', path: [], from: q ? { kind: 'question', question: a } : null, seen: [], others: [], ratings: [] })));
} else if (cmd === 'children') {
  const { list } = children(a); list.forEach(c => console.log(`${c.via}\t${c.title}${existsSync(join(dir, a, `${slug(c.title)}.txt`)) ? '\t(written)' : ''}`));
} else if (cmd === 'prompt-child') {
  const { A, list } = children(a); const c = list.find(x => keyOf(x.title) === keyOf(b)); if (!c) throw new Error(`${b} is not one click off ${a}`);
  const g = A.gloss[keyOf(b)]; const kind = (g && g.kind) || (A.tunnels.find(t => keyOf(t.target) === keyOf(b)) || {}).kind || '';
  const from = c.via === 'question' ? { kind: 'question', question: c.title } : c.via === 'next' ? { kind: 'cont', text: c.text } : { kind: 'passage', text: c.text };
  const seen = []; const keys = new Set([keyOf(b)]);
  for (const s of [...A.blocks.map(x => x.t === 'h' ? '#' + x.s : x.s), ...A.panels.flatMap(p => p.rows.flat())]) { if (s[0] === '#') seen.push(plain(s.slice(1)).slice(0, 80)); else for (const m of s.matchAll(/\[\[([^\]]+)\]\]/g)) { const t = splitLink(m[1])[1]; if (!keys.has(keyOf(t))) { keys.add(keyOf(t)); seen.push(t.slice(0, 80)); } } }
  process.stdout.write(pagePrompt(pageInput({ title: c.title, depth: 1, lens: 'encyclopedic', kind: c.via === 'question' ? '' : kind, panels: [...new Set(A.panels.map(p => p.type))], path: [{ title: A.title, deck: A.deck }], from, seen: seen.slice(0, 24), others: [], ratings: [] })));
} else if (cmd === 'index') {
  const doors = {};
  for (const t of DOORS) {
    const s = slug(t); if (!existsSync(doorFile(s))) continue;
    const kids = {}; const { list } = children(s);
    for (const c of list) { const f = `${s}/${slug(c.title)}.txt`; if (existsSync(join(dir, f))) kids[keyOf(c.title)] = { title: c.title, file: f, ...(c.via === 'question' ? { question: true } : {}) }; }
    doors[keyOf(t)] = { title: t, file: `${s}/index.txt`, ...(isQuestion(t) ? { question: true } : {}), children: kids };
  }
  writeFileSync(join(dir, 'index.json'), JSON.stringify({ doors }, null, 1) + '\n');
  console.log(Object.values(doors).map(d => `${d.title}: ${Object.keys(d.children).length} children`).join('\n'));
} else console.error('usage: see the top of this file');

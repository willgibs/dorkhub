// Seeds: pages written ahead of time for the landing's topics.
//   node scripts/seeds.mjs doors              list the topics and their slugs
//   node scripts/seeds.mjs prompt "<title>"   the exact prompt a page on that topic gets (a question is asked as one)
//   node scripts/seeds.mjs index              rebuild lib/seeds/index.json from the files present
//   node scripts/seeds.mjs feed               rebuild src/static/feed.json, the front page's cards (looks up
//                                             each page's lead picture on Wikipedia; no model)
// How a seed is made: a Claude Opus writer gets the exact prompt from `prompt` and writes the page
// in that format, saved as lib/seeds/<slug>/index.txt. A fact-check pass then checks every number,
// date, name and attribution against sources, and fixes or cuts anything shaky. Agents that browse
// send a generic User-Agent and no personal data. Then: node scripts/seeds.mjs index, then npm run
// verify. Writing seeds spends real tokens: it waits for Will's go.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = fileURLToPath(new URL('..', import.meta.url));
const { pageInput, pagePrompt } = await import(join(repo, 'lib/prompts.js'));
const { topicKey } = await import(join(repo, 'src/shared/world.js'));
const { keyOf, isQuestion } = await import(join(repo, 'src/shared/article.js'));
const dir = join(repo, 'lib/seeds');
const slug = t => keyOf(t).replace(/\s+/g, '-');
const landing = readFileSync(join(repo, 'src/app/13-landing.js'), 'utf8');
const DOORS = [...landing.matchAll(/\{ t: '([^']+)', h:/g)].map(m => m[1].replace(/\\u2019|’/g, '’'));
const [cmd, a, b] = process.argv.slice(2);
const doorFile = s => join(dir, s, 'index.txt');

if (cmd === 'doors') DOORS.forEach(t => console.log(`${slug(t)}\t${t}${existsSync(doorFile(slug(t))) ? '\t(written)' : ''}`));
else if (cmd === 'prompt') process.stdout.write(pagePrompt(pageInput({ title: a, lens: 'encyclopedic' })));
else if (cmd === 'index') {
  /** @type {Record<string, { title: string, file: string, question?: boolean }>} */ const pages = {};
  for (const t of DOORS) { const s = slug(t); if (existsSync(doorFile(s))) pages[topicKey(t)] = { title: t, file: `${s}/index.txt`, ...(isQuestion(t) ? { question: true } : {}) }; }
  writeFileSync(join(dir, 'index.json'), JSON.stringify({ pages }, null, 1) + '\n');
  console.log(`${Object.keys(pages).length} pages: ${Object.values(pages).map(p => p.title).join(', ')}`);
} else if (cmd === 'feed') {
  const { doorsOf, feedEntry } = await import(join(repo, 'lib/feed.js'));
  const { lookup } = await import(join(repo, 'lib/picture.js'));
  const { parseArticle } = await import(join(repo, 'src/shared/article.js'));
  const { pages } = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
  const topics = [];
  for (const d of doorsOf(landing)) {
    const s = pages[topicKey(d.t)]; if (!s) continue;
    const text = readFileSync(join(dir, s.file), 'utf8'); const e = feedEntry(d, text);
    /* the picture the page itself shows: a question's page is looked up by the title it was given */
    const pic = await lookup(fetch, isQuestion(d.t) ? parseArticle(text, false).title || d.t : d.t);
    if (pic) e.pic = { src: pic.src, w: pic.w, h: pic.h, alt: pic.alt, credit: pic.credit, license: pic.license };
    topics.push(e); console.log(`${d.t}: ${[e.fig && 'number', e.myth && 'myth', e.pic ? 'picture' : 'no picture'].filter(Boolean).join(', ')}`);
  }
  writeFileSync(join(repo, 'src/static/feed.json'), JSON.stringify({ v: 1, topics }) + '\n');
  console.log(`${topics.length} topics in src/static/feed.json`);
} else console.error('usage: see the top of this file');

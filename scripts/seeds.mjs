// Seeds: pages written ahead of time, for the front page's topics (lib/front.js) and the pages from before it.
//   node scripts/seeds.mjs doors                  every topic written ahead of time, its slug, and whether it is
//                                                 written yet or still shows its placeholder
//   node scripts/seeds.mjs prompt "<title>"       the exact prompt a page on that topic gets (a question is asked as one)
//   node scripts/seeds.mjs brief "<title>"        the writer's brief for one of the front page's topics: that prompt,
//                                                 then what the front page says about it and the threads it draws
//                                                 from it, each with its source
//   node scripts/seeds.mjs placeholder "<title>"  the placeholder a front-page topic shows until its page is written
//   node scripts/seeds.mjs index                  rebuild lib/seeds/index.json from the files present
// How a seed is made: the way any page is (Will, 2026-10-19: one bar for every page, so a page that opens from the
// front page is never better or worse than the next one a reader opens). The production writer, Claude Haiku 5.5,
// gets the brief (for any other topic, the prompt) and writes the page in one pass, with no research and no
// fact-check: while the gateway has no credits, a Claude Code subagent on Haiku stands in, given the brief verbatim
// and no tools but the one that saves the page. Save it as lib/seeds/<slug>/index.txt, then
// node scripts/seeds.mjs index, then npm run verify. The written page takes its placeholder's place. What a page
// gets wrong is fixed in the prompt (lib/prompts.js), for every page, not by hand in one. Writing seeds spends
// tokens: it waits for Will's go.
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = fileURLToPath(new URL('..', import.meta.url));
const { pageInput, pagePrompt, seedBrief } = await import(join(repo, 'lib/prompts.js'));
const { CARDS, DOORS, FRONT, THREADS } = await import(join(repo, 'lib/front.js'));
const { placeholderText } = await import(join(repo, 'lib/placeholder.js'));
const { topicKey } = await import(join(repo, 'src/shared/world.js'));
const { keyOf, isQuestion } = await import(join(repo, 'src/shared/article.js'));
const dir = join(repo, 'lib/seeds');
const slug = t => keyOf(t).replace(/\s+/g, '-');
const [cmd, a] = process.argv.slice(2);
const doorFile = s => join(dir, s, 'index.txt');
const front = t => FRONT.find(f => topicKey(f.t) === topicKey(t || ''));
const unesc = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

if (cmd === 'doors') DOORS.forEach(d => console.log(`${slug(d.t)}\t${d.t}\t${existsSync(doorFile(slug(d.t))) ? 'written' : placeholderText(d.t) ? 'placeholder' : 'missing'}`));
else if (cmd === 'prompt') process.stdout.write(pagePrompt(pageInput({ title: a, lens: 'encyclopedic' })));
else if (cmd === 'brief') {
  const t = front(a); if (!t) { console.error(`"${a}" is not one of the front page's topics: use prompt`); process.exit(1); }
  /* what the front page says about it: the hook its suggestion and the map carry, and its card's hook and drawings */
  const card = CARDS.find(c => c.t === t.t); const promises = [{ text: t.h, src: [t.src] }];
  if (card) {
    if (card.hook && card.hook !== t.h) promises.push({ text: card.hook, src: card.src });
    for (const m of (card.art() + (card.more || '')).matchAll(/role="img" aria-label="([^"]+)"/g)) promises.push({ text: `Its card's drawing shows ${unesc(m[1]).replace(/^(A|An|The) /, w => w.toLowerCase())}.`, src: card.src });
  }
  const threads = THREADS.filter(x => x.a === t.t || x.b === t.t).map(x => ({ to: x.a === t.t ? x.b : x.a, label: x.l, src: x.src }));
  process.stdout.write(`${pagePrompt(pageInput({ title: t.t, lens: 'encyclopedic' }))}\n${seedBrief({ promises, threads, kind: t.k })}\n`);
} else if (cmd === 'placeholder') {
  const text = placeholderText(a || ''); if (!text) { console.error(`"${a}" is not one of the front page's topics`); process.exit(1); }
  process.stdout.write(text);
} else if (cmd === 'index') {
  /** @type {Record<string, { title: string, file: string, question?: boolean }>} */ const pages = {};
  for (const { t } of DOORS) { const s = slug(t); if (existsSync(doorFile(s))) pages[topicKey(t)] = { title: t, file: `${s}/index.txt`, ...(isQuestion(t) ? { question: true } : {}) }; }
  writeFileSync(join(dir, 'index.json'), JSON.stringify({ pages }, null, 1) + '\n');
  console.log(`${Object.keys(pages).length} pages: ${Object.values(pages).map(p => p.title).join(', ')}`);
  const waiting = FRONT.filter(f => !pages[topicKey(f.t)]); if (waiting.length) console.log(`${waiting.length} still placeholders: ${waiting.map(f => f.t).join(', ')}`);
} else console.error('usage: see the top of this file');

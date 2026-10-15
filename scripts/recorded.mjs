// Adds or replaces recorded writer output in lib/recorded.js: raw text a real writer produced for
// the exact production prompt. The mock writer replays it, and the parser tests run against it.
//   node scripts/recorded.mjs add "<title as requested>" <page.txt> "<source>" [after-title]
//   node scripts/recorded.mjs tool <task> <input.json> <answer.txt> "<source>"
//   node scripts/recorded.mjs v3     converts every recorded page to the format pages are written in now
//                                    (no bridge, the page's kind on its title line, "next" folded into
//                                    six equal cards, branches without directions). No model involved.
// A page's title is what the reader asked for (the node's title before the page was written).
// A tool answer is found by its task and a key made from its input (toolKey in lib/mock.js).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { keyOf, parseArticle } from '../src/shared/article.js';
import { toolKey } from '../lib/mock.js';

const file = fileURLToPath(new URL('../lib/recorded.js', import.meta.url));
const [cmd, ...args] = process.argv.slice(2);
const usage = () => { console.error('usage: node scripts/recorded.mjs add "<title>" <page.txt> "<source>" [after-title]\n       node scripts/recorded.mjs tool <task> <input.json> <answer.txt> "<source>"'); process.exit(1); };
const mod = await import(`${new URL('../lib/recorded.js', import.meta.url).href}?t=${Date.now()}`);
/** @type {{ title: string, source: string, text: string }[]} */ let pages = mod.RECORDED;
/** @type {{ task: string, key: string, source: string, text: string }[]} */ let tools = mod.RECORDED_TOOLS || [];
const read = (/** @type {string} */ f) => readFileSync(f, 'utf8').replace(/\r/g, '').trim();

if (cmd === 'add') {
  const [title, textFile, source, after] = args; if (!title || !textFile || !source) usage();
  pages = pages.filter(p => keyOf(p.title) !== keyOf(title));
  const at = after ? pages.findIndex(p => keyOf(p.title) === keyOf(after)) + 1 : 0;
  pages.splice(at > 0 ? at : pages.length, 0, { title, source, text: read(textFile) + '\n' });
  console.log(`${pages.length} recorded pages; ${title} saved`);
} else if (cmd === 'tool') {
  const [task, inputFile, textFile, source] = args; if (!task || !inputFile || !textFile || !source) usage();
  const key = toolKey(task, JSON.parse(readFileSync(inputFile, 'utf8')));
  tools = tools.filter(t => !(t.task === task && t.key === key));
  tools.push({ task, key, source, text: read(textFile) });
  console.log(`${tools.length} recorded tool answers; ${task} for "${key}" saved`);
} else if (cmd === 'v3') {
  /* every topic's kind, as any recorded page named it (link plans, hooks, branches) */
  /** @type {Map<string, string>} */ const kinds = new Map();
  for (const p of pages) { const A = parseArticle(p.text, false); for (const [k, g] of Object.entries(A.gloss)) if (g.kind && !kinds.has(k)) kinds.set(k, g.kind); for (const t of A.tunnels) if (t.kind && !kinds.has(keyOf(t.target))) kinds.set(keyOf(t.target), t.kind); }
  /* the pages nobody linked to: their kind by hand */
  /** @type {Record<string, string>} */ const own = { 'frederick lanchester': 'person', 'did the square law ever predict a real battle': 'mystery', 'popcorn': 'phenomenon', 'tobacco mosaic virus and tulip mania': 'concept', 'great emu war': 'event', 'why is ice slippery': 'mystery', 'lanchesters laws': 'concept', 'whale falls': 'phenomenon', 'bog bodies': 'thing', 'bioluminescence': 'phenomenon', 'tulip mania': 'event', 'mantis shrimp vision': 'mechanism', 'leidenfrost effect': 'phenomenon', 'steam explosion': 'phenomenon' };
  const word = (/** @type {string} */ s) => { const w = s.trim().toLowerCase(); return ['concept', 'phenomenon', 'mechanism', 'mystery', 'technique', 'thing', 'place', 'event', 'era', 'person', 'creature', 'work', 'idea'].find(k => w === k || w.startsWith(k)) || ''; };
  /** @type {string[]} */ const flagged = [];
  pages = pages.map(p => {
    if (/converted to v3/.test(p.source)) return p;
    const lines = p.text.split('\n').filter(l => !/^~\s?/.test(l.trim()));
    /* the single next page becomes the first of the cards */
    let next = ''; const ni = lines.findIndex(l => /^>{3,}\s*$/.test(l.trim()));
    if (ni >= 0) { const j = lines.findIndex((l, i) => i > ni && /\[\[/.test(l)); if (j > ni && !lines.slice(ni + 1, j).some(l => /^(={3,}|\?{3,}|&{3,}|\+{3,})\s*$/.test(l.trim()))) { next = lines[j].trim(); lines.splice(j, 1); } lines.splice(ni, 1); }
    const ti = lines.findIndex(l => /^#\s+/.test(l)); const title = lines[ti].replace(/^#\s+/, '').trim();
    const kind = own[keyOf(p.title)] || own[keyOf(title)] || kinds.get(keyOf(title)) || kinds.get(keyOf(p.title)) || 'concept';
    if (!title.includes('::')) lines[ti] = `# ${title} :: ${kind}`;
    /* branches lose their direction; the kind stays */
    const card = (/** @type {string} */ l) => { const m = /\[\[([^\]]+)\]\]\s*(.*)$/.exec(l); if (!m) return l; const parts = m[2].replace(/^\s*(::|:|—|–|-)\s*/, '').split('::').map(x => x.trim()); const k = parts.slice(1).map(word).find(Boolean) || kinds.get(keyOf(m[1].split('|').pop() || '')) || ''; return `- [[${m[1]}]] :: ${parts[0] || ''}${k ? ` :: ${k === 'idea' ? 'concept' : k}` : ''}`; };
    const bi = lines.findIndex(l => /^={3,}\s*$/.test(l.trim()));
    if (bi >= 0) { for (let i = bi + 1; i < lines.length && !/^(\?{3,}|&{3,}|>{3,}|\+{3,}|-{3,})\s*$/.test(lines[i].trim()); i++) if (/\[\[/.test(lines[i])) lines[i] = card(lines[i]); if (next) lines.splice(bi + 1, 0, card(next)); }
    const text = lines.join('\n');
    if (/your path|your rabbit hole/i.test(text)) flagged.push(p.title);
    return { ...p, source: `${p.source}; converted to v3 by script`, text };
  });
  console.log(`${pages.length} recorded pages converted to v3`);
  if (flagged.length) console.log(`still mention the reader's path in their prose (re-record later): ${flagged.join('; ')}`);
} else usage();

const lit = (/** @type {string} */ s) => '`' + s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
const head = readFileSync(file, 'utf8').split('/** @type {{ task: string')[0];
writeFileSync(file, `${head}/** @type {{ task: string, key: string, source: string, text: string }[]} */
export const RECORDED_TOOLS = [
${tools.map(t => `  {\n    task: ${JSON.stringify(t.task)},\n    key: ${JSON.stringify(t.key)},\n    source: ${JSON.stringify(t.source)},\n    text: ${lit(t.text)},\n  },\n`).join('')}];

/** @type {{ title: string, source: string, text: string }[]} */
export const RECORDED = [
${pages.map(p => `  {\n    title: ${JSON.stringify(p.title)},\n    source: ${JSON.stringify(p.source)},\n    text: ${lit(p.text)},\n  },\n`).join('')}];
`);

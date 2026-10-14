// Adds or replaces recorded writer output in lib/recorded.js: raw text a real writer produced for
// the exact production prompt. The mock writer replays it, and the parser tests run against it.
//   node scripts/recorded.mjs add "<title as requested>" <page.txt> "<source>" [after-title]
//   node scripts/recorded.mjs tool <task> <input.json> <answer.txt> "<source>"
// A page's title is what the reader asked for (the node's title before the page was written).
// A tool answer is found by its task and a key made from its input (toolKey in lib/mock.js).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { keyOf } from '../src/shared/article.js';
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

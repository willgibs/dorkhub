// Adds or replaces a recorded page in lib/recorded.js. Recorded pages are raw output that a real
// writer produced for the exact production prompt; the mock writer replays them, and the parser
// tests run against them.
//   node scripts/recorded.mjs add "<title as requested>" <page.txt> "<source>" [after-title]
// The title is what the reader asked for (the node's title before the page was written), so the
// replay finds it by the same request. Pass after-title to keep a rabbit hole's pages in order.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { keyOf } from '../src/shared/article.js';

const file = fileURLToPath(new URL('../lib/recorded.js', import.meta.url));
const [cmd, title, textFile, source, after] = process.argv.slice(2);
if (cmd !== 'add' || !title || !textFile || !source) {
  console.error('usage: node scripts/recorded.mjs add "<title>" <page.txt> "<source>" [after-title]');
  process.exit(1);
}
const { RECORDED } = await import(`${new URL('../lib/recorded.js', import.meta.url).href}?t=${Date.now()}`);
const pages = RECORDED.filter((/** @type {{ title: string }} */ p) => keyOf(p.title) !== keyOf(title));
const page = { title, source, text: readFileSync(textFile, 'utf8').replace(/\r/g, '').trim() + '\n' };
const at = after ? pages.findIndex((/** @type {{ title: string }} */ p) => keyOf(p.title) === keyOf(after)) + 1 : 0;
pages.splice(at > 0 ? at : pages.length, 0, page);

const lit = (/** @type {string} */ s) => '`' + s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
const head = readFileSync(file, 'utf8').split('export const RECORDED')[0];
writeFileSync(file, `${head}export const RECORDED = [\n${pages.map(p => `  {\n    title: ${JSON.stringify(p.title)},\n    source: ${JSON.stringify(p.source)},\n    text: ${lit(p.text)},\n  },\n`).join('')}];\n`);
console.log(`${pages.length} recorded pages; ${title} saved`);

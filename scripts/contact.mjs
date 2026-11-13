// A contact sheet: many screenshots on one page, so the whole app can be seen at once, before and after a change.
//   node scripts/contact.mjs <out.jpg> <columns> <tile width in px> <screenshot.png> ...
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve, basename } from 'node:path';
import { writeFileSync } from 'node:fs';
const [out, cols, tile, ...files] = process.argv.slice(2);
const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#777;font:11px/1.2 -apple-system,sans-serif}
.g{display:grid;grid-template-columns:repeat(${cols},${tile}px);gap:6px;padding:6px}figure{margin:0;background:#222}
img{display:block;width:${tile}px;height:auto}figcaption{color:#ddd;padding:2px 4px}</style><div class="g">${files.map(f => `<figure><img src="${pathToFileURL(resolve(f))}"><figcaption>${basename(f).replace(/\.png$/, '')}</figcaption></figure>`).join('')}</div>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: Number(cols) * (Number(tile) + 6) + 6, height: 600 } });
const page = resolve(out + '.html'); writeFileSync(page, html); await p.goto(String(pathToFileURL(page)), { waitUntil: 'load' }); await p.screenshot({ path: out, fullPage: true, type: 'jpeg', quality: 82 }); await b.close();
console.log(out);

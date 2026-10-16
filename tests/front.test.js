// The front page, made by hand (lib/front.js): every topic, card and thread is checkable, each card's
// drawing is accessible and inert, the bento tiles without holes at every width, and the Enigma card's
// cipher is the machine's own.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { CARDS, DOORS, EARLIER, FRONT, THREADS, frontData } from '../lib/front.js';
import { WIDTHS } from '../lib/picture.js';
import { KINDS, parseArticle } from '../src/shared/article.js';
import { enigma } from '../src/shared/enigma.js';
import { topicKey } from '../src/shared/world.js';

const titles = new Set(FRONT.map(t => t.t));
const https = (/** @type {string} */ u) => /^https:\/\/[^\s"]+$/.test(u);

test('the planned topics: each once, with a kind, a hook and a source', () => {
  assert.equal(FRONT.length, 33, 'the 32 planned, and Bioluminescence');
  assert.equal(titles.size, FRONT.length, 'no topic twice');
  for (const t of FRONT) {
    assert.ok(KINDS.includes(t.k), `${t.t}: kind ${t.k}`);
    assert.ok(t.h.length > 20 && t.h.length <= 100 && /[.!?]$/.test(t.h), `${t.t}: hook ${t.h}`);
    assert.ok(https(t.src), `${t.t}: source`);
  }
});

/* Surprise me and a paused page offer these: the front page's topics first, then the pages written before
   it, each once, each written (or, for the front page's, a placeholder until it is), each in its page's colour */
test('the pages written ahead of time: the front page\'s topics, then the earlier pages, each once', () => {
  const idx = JSON.parse(readFileSync(new URL('../lib/seeds/index.json', import.meta.url), 'utf8')).pages;
  assert.deepEqual(DOORS.map(d => d.t), [...FRONT, ...EARLIER].map(d => d.t));
  assert.equal(new Set(DOORS.map(d => topicKey(d.t))).size, DOORS.length, 'no topic twice');
  for (const d of DOORS) {
    assert.ok(KINDS.includes(d.k) && d.h.length > 20 && /[.!?]$/.test(d.h), `${d.t}: kind and hook`);
    const p = idx[topicKey(d.t)];
    if (!p) { assert.ok(FRONT.some(f => f.t === d.t), `${d.t}: written`); continue; }
    const A = parseArticle(readFileSync(new URL(`../lib/seeds/${p.file}`, import.meta.url), 'utf8'), false);
    assert.equal(A.kind, parseArticle(`# x :: ${d.k}\n`, false).kind, `${d.t}: the kind its page names`);
  }
  for (const p of Object.values(idx)) assert.ok(DOORS.some(d => d.t === /** @type {any} */ (p).title), `${/** @type {any} */ (p).title}: offered`);
});

test('the threads join two planned topics, each with a short label and a source, and leave none alone', () => {
  const pairs = new Set();
  for (const th of THREADS) {
    assert.ok(titles.has(th.a) && titles.has(th.b) && th.a !== th.b, `${th.a} – ${th.b}`);
    const k = [th.a, th.b].sort().join('|'); assert.ok(!pairs.has(k), `twice: ${k}`); pairs.add(k);
    assert.ok(th.l.length >= 3 && th.l.length <= 34 && th.l === th.l.trim(), `label: ${th.l}`);
    assert.ok(https(th.src), `${th.a} – ${th.b}: source`);
  }
  for (const t of titles) assert.ok(THREADS.some(th => th.a === t || th.b === t), `${t} has no thread`);
});

test('every card leads into a planned topic, with a source, and a drawing that is labelled and inert', () => {
  const data = frontData();
  assert.equal(data.cards.length, CARDS.length);
  assert.equal(new Set(CARDS.map(c => c.t)).size, CARDS.length, 'one card per topic');
  for (const c of data.cards) {
    const card = /** @type {import('../lib/front.js').Card} */ (CARDS.find(x => x.t === c.t));
    assert.ok(titles.has(c.t), c.t);
    assert.ok(['hero', 'big', 'wide', 'sq', 'small'].includes(c.size), `${c.t}: size ${c.size}`);
    assert.ok(card.src.length && card.src.every(https), `${c.t}: sources`);
    const html = c.art + (c.more || '');
    assert.match(html, /role="img" aria-label="[^"]{20,}"|<img [^>]*alt="[^"]{10,}"|class="(tt|en)"/, `${c.t}: its drawing says what it shows`);
    assert.doesNotMatch(html, /\son[a-z]+=|<script|javascript:|style="/i, `${c.t}: nothing runs, nothing is styled inline (the page's CSP)`);
    for (const m of html.matchAll(/\b(?:src|href)="([^"]*)"/g)) assert.match(m[1], /^\/api\/picture\?f=[^"]+&amp;w=\d+$/, `${c.t}: ${m[1]}`);
  }
  /* a photograph comes through the picture proxy, at a width it serves, and says whose it is */
  for (const c of data.cards.filter(c => /<img /.test(c.art))) {
    const w = Number(/&amp;w=(\d+)/.exec(c.art)?.[1]); assert.ok(WIDTHS.includes(w), `${c.t}: width ${w}`);
    assert.ok(c.credit && /·/.test(c.credit), `${c.t}: credit and licence`);
  }
  assert.ok(JSON.stringify(data).length < 80 * 1024, `front.json is ${(JSON.stringify(data).length / 1024).toFixed(0)} KB`);
});

/* CSS grid's dense packing, as the browser does it: each card takes the first place it fits */
function holes(/** @type {{ w: number, h: number }[]} */ items, /** @type {number} */ cols) {
  /** @type {boolean[][]} */ const g = []; const free = (r, c, it) => { if (c + it.w > cols) return false; for (let y = r; y < r + it.h; y++) for (let x = c; x < c + it.w; x++) if (g[y]?.[x]) return false; return true; };
  for (const it of items) {
    let done = false;
    for (let r = 0; !done; r++) for (let c = 0; c < cols && !done; c++) if (free(r, c, it)) { for (let y = r; y < r + it.h; y++) { g[y] = g[y] || []; for (let x = c; x < c + it.w; x++) g[y][x] = true; } done = true; }
  }
  let n = 0; for (const row of g) for (let x = 0; x < cols; x++) if (!row[x]) n++; return n;
}
test('the cards tile without holes, on a desktop and on a tablet', () => {
  const desk = { hero: [4, 3], big: [4, 2], wide: [4, 1], sq: [2, 2], small: [2, 1] };
  const tab = { ...desk };
  const cut = CARDS.findIndex(c => c.t === 'Fireworks'); assert.ok(cut > 0, 'the map of threads sits before Fireworks');
  for (const [name, part] of [['above the map', CARDS.slice(0, cut)], ['below it', CARDS.slice(cut)]]) {
    assert.equal(holes(part.map(c => ({ w: desk[c.size][0], h: desk[c.size][1] })), 6), 0, `desktop, ${name}`);
    assert.equal(holes(part.map(c => { const [w, h] = tab[c.tab || c.size]; return { w, h }; }), 4), 0, `tablet, ${name}`);
  }
});

test('the Enigma card is an Enigma I: rotors I, II, III, reflector B, the double step, and never itself', () => {
  assert.deepEqual(enigma('AAAAA'), { out: 'BDZGO', pos: 'AAF' });
  assert.equal(enigma('HELLOWORLD').out, 'ILBDAAMTAZ');
  assert.equal(enigma('A', 'ADU').pos, 'ADV'); assert.equal(enigma('AA', 'ADU').pos, 'AEW'); assert.equal(enigma('AAA', 'ADU').pos, 'BFX');
  let s = 7; const text = Array.from({ length: 2000 }, () => { s = (s * 9301 + 49297) % 233280; return String.fromCharCode(65 + Math.floor(s / 233280 * 26)); }).join('');
  const { out } = enigma(text); assert.ok([...out].every((c, i) => c !== text[i]), 'a letter became itself');
  assert.equal(enigma(out).out, text, 'the same settings read it back');
  assert.equal(enigma('wetter vorhersage!').out.length, 16, 'only letters are typed');
});

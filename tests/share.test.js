// Pages people can share: every known page unfurls as itself, anything else by its address, and only link
// previews are told anything the page doesn't already say. Nothing a preview fetches can write a page.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CARDS, EARLIER, FRONT } from '../lib/front.js';
import { addressMeta, GENERIC, handleShare, images, knownPages, PREVIEW_BOTS } from '../lib/share.js';
import { parseRoute, routeOf, topicKey, trailRouteOf, TRAIL_MAX } from '../src/shared/world.js';

const read = (/** @type {string} */ f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const seeds = JSON.parse(read('lib/seeds/index.json')).pages;
/** what a head says, by property or name @param {string} html */
const tags = html => Object.fromEntries([...html.matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)">/g)].map(m => [m[1], m[2].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')]));
/** a picture's size, from its own header @param {Buffer} b */
function size(b) {
  if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  for (let i = 2; i < b.length;) { const m = b[i + 1]; const len = b.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + len; }
  return [0, 0];
}

test('every page written ahead of time and every placeholder is known, at its own address', async () => {
  const known = await knownPages(); const by = new Map(known.map(p => [p.key, p]));
  for (const [k, s] of Object.entries(seeds)) { const p = by.get(k); assert.ok(p && p.from === 'seed', s.title); assert.equal(p.path, routeOf({ title: s.title, q: !!s.question })); }
  for (const f of FRONT) { const p = by.get(topicKey(f.t)); assert.ok(p, f.t); if (!seeds[topicKey(f.t)]) { assert.equal(p.from, 'placeholder'); assert.equal(p.deck, f.h, 'a placeholder says what its page says under the title'); } }
  assert.equal(known.length, new Set(known.map(p => p.word)).size, 'one address each');
  /* the line that travels on a picture is the one made by hand, for the front page or the door list */
  for (const t of [...FRONT, ...EARLIER]) assert.equal(by.get(topicKey(t.t))?.line, t.h, t.t);
  const ice = by.get('why is ice slippery'); assert.equal(ice?.title, 'Why is ice slippery?', 'a question keeps its words'); assert.equal(ice?.path, '/why-is-ice-slippery');
  const whale = by.get('whale falls'); assert.match(whale?.deck || '', /^A whale that sinks/, 'a written page says its own deck');
});

test('the build gives each known page the head that says what it is, and changes nothing else', async () => {
  const index = read('public/index.html'); const known = await knownPages();
  const cut = (/** @type {string} */ h) => h.replace(/<title>[\s\S]*?<meta name="twitter:card" content="summary_large_image">\n/, '');
  const front = tags(index);
  assert.equal(front['og:title'], GENERIC.title); assert.ok(front['og:image'].endsWith(`/share/${GENERIC.image}`)); assert.equal(front['twitter:card'], 'summary_large_image');
  assert.ok(!front.robots, 'the front page stays findable');
  for (const p of known) {
    const html = read(`public/${p.word}.html`); const t = tags(html);
    assert.equal(cut(html), cut(index), `${p.word}.html is the page itself`);
    assert.equal(t['og:title'], p.title); assert.equal(t['og:description'], (p.deck || p.line).slice(0, 300));
    assert.ok(t['og:url'].endsWith(p.path), p.path); assert.equal(t.robots, 'noindex');
    const im = images().pages[p.word]; assert.ok(t['og:image'].endsWith(`/share/${im ? im.file : GENERIC.image}`), `${p.word}: ${t['og:image']}`);
    assert.match(html, new RegExp(`<title>${p.title.replace(/[?()]/g, '\\$&')}: dorkhub</title>`));
  }
});

test('every known page has its picture: 1200 × 630, made for its title, kind and line as they are now', async () => {
  const idx = images(); const known = await knownPages(); const cards = new Set(CARDS.map(c => topicKey(c.t)));
  const all = [...known.map(p => [p, idx.pages[p.word]]), [null, idx.generic]];
  for (const [p, im] of /** @type {[any, any][]} */ (all)) {
    const name = p ? p.title : 'the front page';
    assert.ok(im, `${name} has no picture yet: node scripts/share.mjs "${name}"`);
    const f = new URL(`../src/static/share/${im.file}`, import.meta.url); assert.ok(existsSync(f), `${im.file} is missing: node scripts/share.mjs`);
    const buf = readFileSync(f); assert.deepEqual(size(buf), [1200, 630], im.file); assert.ok(buf.length < 400 * 1024, `${im.file} is ${(buf.length / 1024).toFixed(0)} KB`);
    if (!p) continue;
    assert.ok(im.title === p.title && im.kind === p.kind && im.line === p.line, `${name}'s picture says something else now: node scripts/share.mjs "${name}"`);
    assert.equal(im.from === 'card', cards.has(p.key), `${name} has ${cards.has(p.key) ? 'a card now' : 'no card now'}: node scripts/share.mjs "${name}"`);
    if (im.from === 'picture') assert.ok(im.credit, `${name}'s picture carries its credit`);
    assert.ok(im.alt && im.alt.startsWith(p.title), `${name}'s picture says what it shows`);
  }
});

test('an address with no file of its own is told by the address alone', () => {
  const m = (/** @type {string} */ path) => addressMeta(parseRoute(path), { titles: new Map([['carrington event', 'The Carrington Event'], ['black holes', 'Black holes']]), pics: { 'black-holes': { file: 'black-holes.jpg', from: 'card', alt: 'Black holes, drawn' } } });
  const typed = m('/octopus-camouflage');
  assert.equal(typed?.title, 'Octopus camouflage'); assert.equal(typed?.description, GENERIC.description); assert.equal(typed?.image, GENERIC.image); assert.equal(typed?.noindex, true);
  assert.equal(m('/connect/tulip-mania/radiocarbon-dating')?.title, 'Tulip mania and Radiocarbon dating');
  const trail = m('/trail/carrington-event/octopus-camouflage/black-holes');
  assert.equal(trail?.title, 'A trail from The Carrington Event to Black holes'); assert.equal(trail?.image, 'black-holes.jpg', 'the first of its pages with a picture lends it one');
  assert.equal(trail?.description, 'The Carrington Event → Octopus camouflage → Black holes: three pages on Dorkhub, in the order they were read.');
  assert.equal(trail?.path, '/trail/carrington-event/octopus-camouflage/black-holes');
  assert.equal(m('/a/b/c'), null); assert.equal(m('/'), null);
});

test('the function answers link previews with a head, never writes, and keeps nothing', async () => {
  const get = (/** @type {string} */ q, method = 'GET') => handleShare(new Request(`https://dorkhub.com/api/share${q}`, { method }), { env: { VERCEL_ENV: 'production' } });
  const r = get('?topic=octopus-camouflage'); const html = await r.text(); const t = tags(html);
  assert.equal(r.status, 200); assert.match(r.headers.get('content-type') || '', /text\/html/); assert.match(r.headers.get('x-robots-tag') || '', /noindex/);
  assert.equal(r.headers.get('set-cookie'), null); assert.match(r.headers.get('cache-control') || '', /private/);
  assert.equal(t['og:title'], 'Octopus camouflage'); assert.equal(t['og:url'], 'https://dorkhub.com/octopus-camouflage'); assert.equal(t['og:image'], `https://dorkhub.com/share/${GENERIC.image}`);
  assert.equal(tags(await get('?topic=black-holes&v=story').text())['og:url'], 'https://dorkhub.com/black-holes?v=story', 'another voice keeps its address');
  assert.equal(tags(await get('?trail=black-holes/supernovas').text())['og:title'], 'A trail from Black holes to Supernovas');
  for (const q of ['?topic=wp-login.php', '?topic=api', '?topic=fonts', '?trail=', '?topic=']) assert.equal(get(q).status, 404, q);
  assert.equal(get('?topic=x', 'POST').status, 405);
  /* it reads the address and what the site knows, and nothing that writes, counts or logs */
  for (const f of ['lib/share.js', 'api/share.js']) { const src = read(f); assert.doesNotMatch(src, /from '\.\/(write|ai|trial|counters|mock)\.js'|from '\.\.\/lib\/(write|ai|trial|counters|mock)\.js'|console\.|fetch\(/, f); }
});

test('only link previews are sent to the function, before the page catches their address', () => {
  const v = JSON.parse(read('vercel.json')); const bots = v.rewrites.filter((/** @type {any} */ r) => r.has);
  assert.equal(bots.length, 3);
  for (const r of bots) { assert.equal(r.has[0].key, 'user-agent'); assert.equal(r.has[0].value.re, PREVIEW_BOTS); assert.match(r.destination, /^\/api\/share/); }
  const firstPlain = v.rewrites.findIndex((/** @type {any} */ r) => !r.has); assert.ok(v.rewrites.slice(firstPlain).every((/** @type {any} */ r) => !r.has && r.destination === '/'), 'the page comes after');
  const bot = new RegExp(PREVIEW_BOTS);
  for (const ua of ['Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)', 'Twitterbot/1.0', 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)', 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)', 'TelegramBot (like TwitterBot)', 'WhatsApp/2.23.20.0 A',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0']) assert.ok(bot.test(ua), ua);
  /* readers, in-app browsers included, always get the page */
  for (const ua of ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0]', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 LinkedInApp/9.30',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0 Mobile Safari/537.36 WhatsApp/2.23', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)']) assert.ok(!bot.test(ua), ua);
});

test('robots.txt lets link previews read a page and keeps every crawler out', () => {
  const groups = read('src/static/robots.txt').split(/\n\s*\n/).map(g => g.split('\n').filter(l => !l.startsWith('#') && l.trim()));
  const all = groups.find(g => g.includes('User-agent: *')); assert.deepEqual(all, ['User-agent: *', 'Allow: /$', 'Disallow: /']);
  const previews = groups.find(g => g.includes('User-agent: Twitterbot'));
  assert.deepEqual(previews?.filter(l => l.startsWith('User-agent:')).map(l => l.slice(12)), ['Slackbot', 'Twitterbot', 'facebookexternalhit', 'Facebot', 'Discordbot', 'LinkedInBot', 'TelegramBot', 'WhatsApp']);
  assert.deepEqual(previews?.filter(l => !l.startsWith('User-agent:')), ['Disallow: /api/', 'Allow: /']);
  assert.ok(!groups.flat().some(l => /Googlebot|bingbot/i.test(l)), 'no search engine is named');
});

test('a trail travels as its pages’ address words, and reads back as the same pages', () => {
  const steps = [{ title: 'Black holes' }, { title: 'Why is ice slippery?', q: true }, { title: 'x', bridge: ['Tulip mania', 'Radiocarbon dating'] }, { title: 'ブラックホール' }, { title: 'Black holes', lens: 'story' }];
  const path = trailRouteOf(steps);
  assert.equal(path, `/trail/black-holes/why-is-ice-slippery/tulip-mania+radiocarbon-dating/${encodeURIComponent('ブラックホール')}`, 'one word each, a voice dropped');
  const r = parseRoute(decodeURI(path)); assert.equal(r.view, 'trail');
  const back = /** @type {any} */ (r).steps; assert.equal(back.length, 4);
  assert.deepEqual(back.map((/** @type {any} */ s) => routeOf(s)), ['/black-holes', '/why-is-ice-slippery', '/connect/tulip-mania/radiocarbon-dating', `/${encodeURIComponent('ブラックホール')}`]);
  assert.ok(back.every((/** @type {any} */ s) => s.lens === 'encyclopedic'), 'in the default voice, where pages written ahead of time are free');
  const long = Array.from({ length: 30 }, (_, i) => ({ title: `Topic ${i}` }));
  assert.equal(parseRoute(trailRouteOf(long)).view, 'trail'); assert.equal(/** @type {any} */ (parseRoute(trailRouteOf(long))).steps.length, TRAIL_MAX);
  assert.ok(trailRouteOf(long).endsWith('/topic-29'), 'the latest pages, the ones that led here');
  assert.equal(parseRoute('/trail/a/a/b').view === 'trail' && /** @type {any} */ (parseRoute('/trail/a/a/b')).steps.length, 2, 'each page once');
  assert.deepEqual(parseRoute('/trail'), { view: 'none' }); assert.equal(trailRouteOf([]), '');
  assert.equal(routeOf({ title: 'Trail' }), '/trail-', 'the word is the site’s own');
});

// api/picture: lead pictures from Wikipedia through our own origin, against a fake Wikimedia.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handlePicture } from '../lib/picture.js';

const OWN = { 'sec-fetch-site': 'same-origin' };
const req = (/** @type {string} */ q, headers = OWN) => new Request(`https://dorkhub.test/api/picture?${q}`, { headers });
const summary = (/** @type {any} */ o) => ({ type: 'standard', title: 'Tulip mania', description: 'Dutch bubble', originalimage: { source: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Satire_on_Tulip_Mania.jpg', width: 1200, height: 767 }, ...o });
const META = { query: { pages: [{ imageinfo: [{ extmetadata: { LicenseShortName: { value: 'Public domain' }, Artist: { value: '<a href="x">Jan Brueghel</a> the Younger' } } }] }] } };

/** A fake Wikimedia: routes are [url fragment, response body or status]. Records what was asked. */
function wiki(/** @type {[string, any][]} */ routes) {
  const asked = /** @type {string[]} */ ([]);
  const get = async (/** @type {any} */ url) => {
    const u = String(url); asked.push(u);
    const hit = routes.find(([frag]) => u.includes(frag));
    if (!hit || typeof hit[1] === 'number') return new Response('nope', { status: hit ? hit[1] : 404 });
    if (hit[1] instanceof Uint8Array) return new Response(hit[1], { status: 200, headers: { 'content-type': 'image/jpeg', 'content-length': String(hit[1].length) } });
    return new Response(JSON.stringify(hit[1]), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return { asked, deps: { env: {}, fetch: /** @type {any} */ (get) } };
}

test('only our own page is answered, and the refusal is never cached', async () => {
  const { deps, asked } = wiki([]);
  for (const h of [{}, { 'sec-fetch-site': 'cross-site' }, { 'sec-fetch-site': 'none' }]) {
    const r = await handlePicture(req('t=Tulip%20mania', h), deps);
    assert.equal(r.status, 403); assert.equal(r.headers.get('cache-control'), 'no-store');
  }
  assert.equal(asked.length, 0, 'nothing was fetched for a crawler');
  assert.equal((await handlePicture(new Request('https://dorkhub.test/api/picture?t=x', { method: 'POST', headers: OWN }), deps)).status, 405);
});

test('inputs are checked before anything is fetched', async () => {
  const { deps, asked } = wiki([]);
  for (const q of ['t=', `t=${'x'.repeat(121)}`, 'f=../../etc/passwd&w=500', 'f=6/6a/A.jpg&w=640', 'f=6/6a/A.exe&w=500', 'f=https://evil.test/a.jpg&w=500']) assert.equal((await handlePicture(req(q), deps)).status, 400, q);
  assert.equal(asked.length, 0);
  assert.equal((await handlePicture(req('t=Tulip'), { env: { DH_PICTURES: 'off' }, fetch: deps.fetch })).status, 204);
});

test('a freely licensed lead picture comes back credited, and cached by the CDN', async () => {
  const { deps } = wiki([['page/summary/Tulip_mania', summary({})], ['commons.wikimedia.org/w/api.php', META]]);
  const r = await handlePicture(req('t=Tulip%20mania'), deps);
  assert.equal(r.status, 200); assert.match(r.headers.get('cache-control') || '', /s-maxage=\d+/);
  const p = await r.json();
  assert.deepEqual(p, { src: '/api/picture?f=6%2F6a%2FSatire_on_Tulip_Mania.jpg&w=960', w: 960, h: 614, alt: 'Dutch bubble', desc: '', credit: 'Jan Brueghel the Younger', license: 'Public domain', file: 'https://commons.wikimedia.org/wiki/File:Satire_on_Tulip_Mania.jpg' });
});

test('a picture says what it shows: the article\'s own caption, or the first sentence of its English description', async () => {
  const media = (/** @type {string} */ caption) => ({ items: [{ title: 'File:Satire_on_Tulip_Mania.jpg', leadImage: true, caption: { text: caption } }] });
  const meta = (/** @type {string} */ d) => ({ query: { pages: [{ imageinfo: [{ extmetadata: { ...META.query.pages[0].imageinfo[0].extmetadata, ImageDescription: { value: d } } }] }] } });
  const desc = async (/** @type {any} */ med, /** @type {any} */ met) => (await (await handlePicture(req('t=Tulip%20mania'), wiki([['page/summary/Tulip_mania', summary({})], ['page/media-list/', med], ['commons.wikimedia.org/w/api.php', met]]).deps)).json()).desc;
  assert.equal(await desc(media('Satire on tulip mania by Jan Brueghel the Younger, c. 1640[3]'), META), 'Satire on tulip mania by Jan Brueghel the Younger, c. 1640', 'the article\'s caption, without its footnote');
  assert.equal(await desc(404, meta('<div lang="en">Monkeys dressed as tulip traders, weighing bulbs. Oil on panel.</div><div lang="nl">Apen</div>')), 'Monkeys dressed as tulip traders, weighing bulbs', 'else the English description\'s first sentence');
  assert.equal(await desc(404, meta('Satire op de tulpenmanie, door Jan Brueghel de Jonge')), '', 'never another language');
  assert.equal(await desc(404, meta('Tulip mania')), '', 'nor one that only repeats the name');
  assert.equal(await desc(media(`A painting of ${'tulip traders in a tavern, '.repeat(6)}with monkeys`), META), `A painting of ${'tulip traders in a tavern, '.repeat(5).slice(0, -2)}`, 'a long one ends at a clause');
});

test('no picture when the image is not on Commons, too small, or unlicensed; misses are cached too', async () => {
  for (const [why, sum, meta] of [
    ['a local, non-free file', summary({ originalimage: { source: 'https://upload.wikimedia.org/wikipedia/en/1/1a/Cover.jpg', width: 400, height: 600 } }), META],
    ['too small', summary({ originalimage: { source: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Tiny.jpg', width: 186, height: 190 } }), META],
    ['no licence', summary({}), { query: { pages: [{ imageinfo: [{ extmetadata: {} }] }] } }],
  ]) {
    const { deps } = wiki([['page/summary/', sum], ['commons.wikimedia.org/w/api.php', meta]]);
    const r = await handlePicture(req('t=Tulip%20mania'), deps);
    assert.equal(r.status, 204, why); assert.match(r.headers.get('cache-control') || '', /s-maxage/, why);
  }
});

test('plurals and questions are tried as titles, and a search only counts when it means the same thing', async () => {
  const plural = wiki([['page/summary/Whale_fall', summary({ title: 'Whale fall' })], ['commons.wikimedia.org/w/api.php', META]]);
  assert.equal((await handlePicture(req('t=Whale%20falls'), plural.deps)).status, 200);
  assert.ok(plural.asked.some(u => u.includes('page/summary/Whale_falls')) && plural.asked.some(u => u.includes('page/summary/Whale_fall')));
  const near = wiki([['search/page', { pages: [{ key: 'Mantis_shrimp' }] }], ['page/summary/Mantis_shrimp', summary({ title: 'Mantis shrimp' })], ['commons.wikimedia.org/w/api.php', META]]);
  assert.equal((await handlePicture(req('t=Mantis%20shrimp%20vision'), near.deps)).status, 200, 'two of three words in common');
  const far = wiki([['search/page', { pages: [{ key: 'Shrimp' }] }], ['page/summary/Shrimp', summary({ title: 'Shrimp' })], ['commons.wikimedia.org/w/api.php', META]]);
  assert.equal((await handlePicture(req('t=Mantis%20shrimp%20vision'), far.deps)).status, 204, 'one word in three is not the same topic');
});

test('the image itself is proxied at a standard width and cached for good', async () => {
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const { deps, asked } = wiki([['/thumb/6/6a/A.jpg/500px-A.jpg', jpg], ['/commons/6/6a/B.jpg', jpg]]);
  const r = await handlePicture(req('f=6%2F6a%2FA.jpg&w=500'), deps);
  assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'image/jpeg'); assert.match(r.headers.get('cache-control') || '', /immutable/);
  assert.deepEqual(new Uint8Array(await r.arrayBuffer()), jpg);
  assert.equal((await handlePicture(req('f=6%2F6a%2FB.jpg&w=330&o=1'), deps)).status, 200, 'a small original is used as is');
  assert.ok(asked.every(u => u.startsWith('https://upload.wikimedia.org/wikipedia/commons/')));
  const html = wiki([['/thumb/', { not: 'an image' }]]);
  assert.equal((await handlePicture(req('f=6%2F6a%2FA.jpg&w=500'), html.deps)).status, 404, 'anything but an image is refused');
});

/* Time travel's lead picture, a PNG scan, is 2.26 MB at 960 px and 649 KB at 500 */
test('a thumbnail over the cap steps down a standard width, once', async () => {
  const fake = (/** @type {Record<string, number>} */ sizes) => {
    const asked = /** @type {string[]} */ ([]);
    const get = async (/** @type {any} */ url) => { const u = String(url); asked.push(u); const k = Object.keys(sizes).find(x => u.includes(x)); return k ? new Response(new Uint8Array(sizes[k]), { status: 200, headers: { 'content-type': 'image/png', 'content-length': String(sizes[k]) } }) : new Response('nope', { status: 404 }); };
    return { asked, deps: { env: {}, fetch: /** @type {any} */ (get) } };
  };
  const big = 2_260_560, small = 648_901;
  const a = fake({ '/960px-': big, '/500px-': small });
  const r = await handlePicture(req('f=6%2F64%2FScan.png&w=960'), a.deps);
  assert.equal(r.status, 200); assert.equal((await r.arrayBuffer()).byteLength, small, 'the 500 px picture instead');
  assert.match(r.headers.get('cache-control') || '', /immutable/);
  assert.deepEqual(a.asked.map(u => u.split('/').pop()), ['960px-Scan.png', '500px-Scan.png']);
  assert.equal((await handlePicture(req('f=6%2F64%2FScan.png&w=1280'), fake({ '/1280px-': big, '/960px-': small }).deps)).status, 200, 'a photograph at 1280 steps down to 960');
  const c = fake({ '/960px-': big, '/500px-': big });
  assert.equal((await handlePicture(req('f=6%2F64%2FScan.png&w=960'), c.deps)).status, 404, 'still over the cap: no picture, as before');
  assert.equal(c.asked.length, 2, 'one step down, never more');
  const d = fake({ '/500px-': big });
  assert.equal((await handlePicture(req('f=6%2F64%2FScan.png&w=500'), d.deps)).status, 404); assert.equal(d.asked.length, 1, 'nothing below 500');
});

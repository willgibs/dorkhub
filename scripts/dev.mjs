// Local development: serves public/ and runs the real /api/write handler in-process.
// Writes with the mock writer (free, offline) unless AI_GATEWAY_API_KEY is set in
// .env.local, or you pass --live. Rebuilds the page whenever src/ or lib/ changes.
//
//   npm run dev            mock writer, http://localhost:3000
//   npm run dev -- --live  your AI Gateway key from .env.local
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, watch } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const envFile = join(root, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const live = process.argv.includes('--live') || (!!process.env.AI_GATEWAY_API_KEY && process.env.DH_MOCK !== '1');
if (!live) process.env.DH_MOCK = '1';
const port = Number(process.env.PORT) || 3000;
/* the pages' heads name this server, so their pictures can be looked at here */
process.env.DH_SITE ||= `http://localhost:${port}`;

const build = () => { const r = spawnSync(process.execPath, [join(root, 'scripts/build.mjs')], { stdio: 'inherit', env: process.env }); return r.status === 0; };
build();
let timer;
/* lib/ too: the front page's cards are drawn there (lib/front.js), and one build at a time keeps public/ whole */
for (const dir of ['src', 'lib']) watch(join(root, dir), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(build, 120); });

const { handleWrite } = await import('../lib/write.js');
const { handlePicture } = await import('../lib/picture.js');
const { handleShare, PREVIEW_BOTS } = await import('../lib/share.js');
const TYPES = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png' };
/* The page's own addresses, as vercel.json rewrites them: a single word without a dot (a topic, or
   /world), /connect/a/b and /trail/a/b/…. Everything else is a file, the API, or the 404 page. A known
   page's address has a file of its own (public/<word>.html, served there as cleanUrls does), and a link
   preview asking for any other gets its head from /api/share. */
const appPath = (/** @type {string} */ p) => /^\/(?!api$|fonts$)[^/.]+$/.test(p) || /^\/connect\/[^/.]+\/[^/.]+$/.test(p) || /^\/trail(\/[^/]+)*\/?$/.test(p);
const bot = new RegExp(PREVIEW_BOTS);

createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || `localhost:${port}`}`);
  try {
    if (url.pathname === '/api/picture') {
      const response = await handlePicture(new Request(url, { method: req.method, headers: /** @type {any} */ (req.headers) }));
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(response.body ? Buffer.from(await response.arrayBuffer()) : undefined); return;
    }
    if (url.pathname === '/api/write') {
      const ac = new AbortController(); res.on('close', () => { if (!res.writableFinished) ac.abort(); });
      const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : Readable.toWeb(req);
      const request = new Request(url, { method: req.method, headers: /** @type {any} */ (req.headers), body, duplex: 'half', signal: ac.signal });
      /* the mock writer's answers are cached in memory like production's, so repeats and prefetches behave the same here */
      const response = await handleWrite(request, process.env.DH_MOCK === '1' ? { textCache: true } : {});
      for (const [k, v] of response.headers) if (k !== 'set-cookie') res.setHeader(k, v);
      const cookies = response.headers.getSetCookie(); if (cookies.length) res.setHeader('set-cookie', cookies);
      res.writeHead(response.status);
      if (!response.body) { res.end(); return; }
      for await (const chunk of /** @type {any} */ (response.body)) res.write(chunk);
      res.end(); return;
    }
    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    let file = join(root, 'public', rel === '/' ? 'index.html' : rel);
    let status = 200; const headers = {};
    /* a topic's address serves the page (a known page's own copy, else the page), the way vercel.json rewrites it, and is
       kept out of search engines; a link preview asking for one with no copy of its own gets its head from /api/share */
    if (rel.endsWith('.html') && rel !== '/404.html') { res.writeHead(308, { location: url.pathname.replace(/(\/index)?\.html$/, '') || '/' }); res.end(); return; }
    if (appPath(url.pathname) && !(existsSync(file) && extname(file))) {
      const own = join(root, 'public', `${rel.slice(1)}.html`);
      if (existsSync(own) && !rel.slice(1).includes('/')) file = own;
      else if (bot.test(req.headers['user-agent'] || '')) {
        const [, a, ...more] = url.pathname.split('/'); const q = new URLSearchParams(url.search);
        if (a === 'trail') q.set('trail', more.join('/')); else if (a === 'connect') { q.set('a', more[0]); q.set('b', more[1]); } else q.set('topic', a);
        const response = handleShare(new Request(new URL(`/api/share?${q}`, url), { headers: /** @type {any} */ (req.headers) }));
        res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(await response.text()); return;
      } else file = join(root, 'public', 'index.html');
      headers['x-robots-tag'] = 'noindex';
    }
    else if (!file.startsWith(join(root, 'public')) || !existsSync(file) || extname(file) === '') { file = join(root, 'public', '404.html'); status = 404; }
    res.writeHead(status, { 'content-type': TYPES[/** @type {keyof typeof TYPES} */ (extname(file))] || 'application/octet-stream', 'cache-control': 'no-store', ...headers });
    res.end(readFileSync(file));
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
}).listen(port, () => console.log(`dorkhub on http://localhost:${port}  (${live ? 'live: AI Gateway' : 'mock writer'})`));

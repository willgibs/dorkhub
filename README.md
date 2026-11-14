# dorkhub

**Get lost learning.** An encyclopedia that writes itself around your curiosity. Start anywhere, and every link opens a page written for the exact path you took to reach it.

## How it works

- **One static page.** `public/index.html` is built from `src/` (plain JavaScript modules bundled into one inline script, no framework) and served from Vercel's CDN. Rabbit holes live in the reader's browser.
- **Three functions.** `POST /api/write` (`api/write.js` → `lib/write.js`) writes every word. The page names a task (`page`, `peek`, `sketch`…) and sends structured context: titles, the path, a passage. The server owns every prompt (`lib/prompts.js`), chooses the writer (`lib/ai.js`) and streams plain text back. `GET /api/picture` (`lib/picture.js`) finds a page's lead picture on Wikipedia and serves it through our own origin; no model is involved. `GET /api/share` (`lib/share.js`) gives a link preview the head of an address that has no file of its own.
- **Pages written ahead of time.** The front page's topics (`lib/front.js`: its hand-drawn cards, the threads between topics, and the pages written before them) are pre-written in `lib/seeds` and served free and instant (`lib/seeds.js`, `lib/library.js`). A topic whose page isn't written yet opens a placeholder (`lib/placeholder.js`).
- **Shared code.** `src/shared/` runs on both sides: the page-format parser (`article.js`), the model catalog (`models.js`), page identity and addresses (`world.js`), Your world's data (`graph.js`), and the drawings a card and its page share (`plates.js`, `enigma.js`). The build inlines what the page uses.

## Who pays for the words

| Reader | Writes with | Billed to |
| --- | --- | --- |
| Anyone, no account | Claude Haiku 5.5 via Dorkhub's AI Gateway | Dorkhub, capped (below) |
| Brings an API key | A vetted model of their choice | Their provider, directly. The key stays in their browser. |
| Pro (planned) | — | A subscription with a page allowance |

The free trial is 10 pages and 50 quick tools per device per 30 days, and at most 100 pages and 500 quick tools for any one network (IP address), so shared networks like schools and offices still work. Each request reserves its unit before the writer starts; it's handed back only if nothing was bought. Protection comes in layers:

- **Rate limit:** a Vercel Firewall rule on `/api/write`.
- **Counters:** per device, per network (IPv4 or IPv6 /64) and per IPv6 /48. These are atomic in Upstash Redis when connected, otherwise kept in Vercel Runtime Cache.
- **Output cap:** every task has its own output budget.
- **Hard ceiling:** the AI Gateway budget.

Finished answers that pass a sanity check are cached by a hash of model and prompt, so popular first pages are instant and free.

## Develop

```sh
npm install                      # Node 24 (see .nvmrc); 22 works too
npm run dev                      # http://localhost:3000, free mock writer, rebuilds on save
npm run verify                   # build + type check + tests: the green gate
npx playwright install chromium  # once, for the browser test
npm run e2e                      # the whole reader flow in Chromium, desktop and phone
```

The mock writer replays real recorded pages (try Lanchester's laws, Bog bodies, Mantis shrimp vision or Lewis gun) at a writer's pace, and streams correctly formatted stand-ins for anything else. Failure drills: put `[fail-early]`, `[fail-mid]`, `[cut]`, `[slow]` or `[garbled]` in a page title; a key containing `bad` is rejected. For live writing locally, put `AI_GATEWAY_API_KEY` in `.env.local`.

## Deploy

Vercel with framework preset "Other": build `npm run build`, output `public`, Node 24 (22 works locally). Pushing `main` deploys production.

Production needs no secrets. The function authenticates to AI Gateway with the deployment's OIDC token, so make sure no `AI_GATEWAY_API_KEY` variable is set there (it would take precedence). Optional settings are listed in `.env.example`. Set `DH_SALT` to a long random string, and connect Upstash Redis (free tier) from the Vercel Marketplace so trial counts are exact. The function logs which counter store it uses (`{"evt":"store"}`).

## Layout

```
api/                 the Vercel Functions, thin wrappers: write, picture, share
lib/write.js         request → trial check → library → stream; the wire protocol
lib/prompts.js       every prompt and task: validation, output budget, caching
lib/ai.js            trial writer vs. reader's key; provider errors → our codes
lib/trial.js         the free allowance: device, network and /48 caps; reserve and refund
lib/counters.js      where counts live: Upstash Redis (atomic) or Runtime Cache
lib/library.js       where finished pages are kept: seeds, cache, durable store
lib/flight.js        one write per page in flight
lib/front.js         the front page by hand: topics, cards and their drawings, threads
lib/placeholder.js   a front-page topic's page before it is written
lib/seeds.js, seeds/ pages written ahead of time
lib/picture.js       a page's lead picture, through our own origin
lib/share.js         what a link to Dorkhub shows where it is pasted
lib/grounding.js     source notes for the writer (the model eval)
lib/mock.js          the mock writer: replays recorded pages, or writes stand-ins
lib/recorded.js      real writer output for the exact prompts (scripts/recorded.mjs adds more)
src/app/*.js         the page, as modules (main.js starts it; 16-router routes)
src/shared/          code the page and the server share
src/static/          404 page, favicon, fonts, robots.txt, link-preview pictures
src/vendor/          vendored code, with its licence
scripts/             build, dev server, browser walk, eval, production check, seeds
tests/               node:test suites
.github/workflows/   CI: verify and the walk on every pull request
docs/                vision, state, backlog, architecture, decisions, eval plan, prototype
```

New here, human or agent? Start with `CLAUDE.md`, then `docs/state.md` and `docs/vision.md`.

## Privacy

No analytics and no accounts. Function logs hold the task, model, token counts and timing, never page content, IP addresses or keys. Trial counters use a random device ID (an HttpOnly cookie) and a salted hash of the network, and expire after 30 days. A reader's key is kept in their browser and sent with each request. It is never stored or logged on the server.

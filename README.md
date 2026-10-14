# dorkhub

**Get lost learning.** An encyclopedia that writes itself around your curiosity. Start anywhere, and every link opens a page written for the exact path you took to reach it.

## How it works

- **One static page.** `public/index.html` is built from `src/` (plain JavaScript, no framework, no bundler) and served from Vercel's CDN. Rabbit holes live in the reader's browser.
- **One function.** `POST /api/write` is the only server code (`api/write.js` → `lib/write.js`). The page names a task (`page`, `peek`, `sketch`…) and sends structured context: titles, the path, a passage. The server owns every prompt (`lib/prompts.js`), chooses the writer (`lib/ai.js`) and streams plain text back.
- **Shared code.** `src/shared/article.js` (the page-format parser) and `src/shared/models.js` (the model catalog) run on both sides. The build inlines them into the page.

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

The mock writer replays real recorded pages (try The Great Emu War, Tulip mania, Mantis shrimp vision or Why is ice slippery?) at a writer's pace, and streams correctly formatted stand-ins for anything else. Failure drills: put `[fail-early]`, `[fail-mid]`, `[cut]`, `[slow]` or `[garbled]` in a page title; a key containing `bad` is rejected. For live writing locally, put `AI_GATEWAY_API_KEY` in `.env.local`.

## Deploy

Vercel with framework preset "Other": build `npm run build`, output `public`, Node 24 (22 works locally). Pushing `main` deploys production.

Production needs no secrets. The function authenticates to AI Gateway with the deployment's OIDC token, so make sure no `AI_GATEWAY_API_KEY` variable is set there (it would take precedence). Optional settings are listed in `.env.example`. Set `DH_SALT` to a long random string, and connect Upstash Redis (free tier) from the Vercel Marketplace so trial counts are exact. The function logs which counter store it uses (`{"evt":"store"}`).

## Layout

```
api/write.js         the Vercel Function (a thin wrapper)
lib/write.js         request → trial check → cache → stream; the wire protocol
lib/prompts.js       every prompt and task: validation, output budget, caching
lib/ai.js            trial writer vs. reader's key; provider errors → our codes
lib/trial.js         the free allowance: device, network and /48 caps; reserve and refund
lib/counters.js      where counts live: Upstash Redis (atomic) or Runtime Cache
lib/mock.js          the mock writer: replays recorded pages, or writes stand-ins
lib/recorded.js      real writer output for the exact prompts (scripts/recorded.mjs adds more)
src/app/NN-*.js      the page, in filename order (16-router boots it)
src/shared/          parser + model catalog, shared with the server
src/static/          404 page, favicon, robots.txt
scripts/             build, dev server, browser test
tests/               node:test suites
docs/                vision, state, backlog, architecture, decisions, eval plan, prototype
```

New here, human or agent? Start with `CLAUDE.md`, then `docs/state.md` and `docs/vision.md`.

## Privacy

No analytics and no accounts. Function logs hold the task, model, token counts and timing, never page content, IP addresses or keys. Trial counters use a random device ID (an HttpOnly cookie) and a salted hash of the network, and expire after 30 days. A reader's key is kept in their browser and sent with each request. It is never stored or logged on the server.

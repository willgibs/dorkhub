# Architecture

_How it works and what must stay true. Read before touching `lib/`, `api/` or the build._

## Shape

- **The page.** `scripts/build.mjs` turns `src/` into one `public/index.html`: the head
  and CSS, then the body, then one inline script. That script is the shared modules plus
  the app modules in a single IIFE. A CSP meta tag pins that script by its SHA-256. There
  is no framework and no bundler; Vercel's CDN serves the page.
  Third-party code is ported into `src/vendor` with its licence notice. The build inlines its
  JS between the shared and app modules (`export` stripped) and its CSS after
  `src/styles.css`, and `/licenses.txt` lists it.
  The orbs port is tested against the library's own golden vectors (`tests/orbs.test.js`).
  The page's growth since 2026-10-15 is budgeted: at most 60 KB raw of CSS and JS for the
  new hero and reading page together, with no new network requests.
- **Two functions.** `api/write.js` → `handleWrite()` in `lib/write.js` (every word Dorkhub
  writes), and `api/picture.js` → `handlePicture()` in `lib/picture.js` (a page's lead picture
  from Wikipedia, proxied through our own origin; no model involved).
- **The page format** (`FORMAT` in `lib/prompts.js`, parsed by `parseArticle` in
  `src/shared/article.js`): `# title`, `> deck`, `~ bridge`, `+++` link plan
  (`[[Topic]] :: kind`), `---` body with `^` margin notes and 0 to 2 panels
  (`::: type [title | headers]`, rows that each hold ` :: `, then `:::`), `>>>` next page,
  `===` branches, `???` questions, `&&&` a hook for every planned link. Kinds come before
  the body so links appear in colour; hooks come last because only hover cards need them.
  The parser still reads v1 pages (head facts, `%%%` timeline, hooks in the plan): their
  facts and timeline become panels below the first paragraph.
- **State in the browser.** Rabbit holes live in localStorage (`dorkhub:holes:v1`). The
  reader's key and last known trial count live in `dorkhub:auth:v1`.
- **State on the server.** Trial counters live in Redis or Runtime Cache. Cached answers
  live in Runtime Cache for 14 days.

## Lifecycle of a write (`lib/write.js`)

1. **Gatekeeping.** POST only, same origin, and a JSON body of at most 64 KB:
   `{ task, input, fresh? }`.
2. **Validation.** `task` must be one of `TASKS` in `lib/prompts.js`. Its validator clips
   and normalizes the input, and a `BadInput` becomes a 400.
3. **Writer** (`lib/ai.js`):
   - A reader's key headers (`x-dh-provider`, `x-dh-model`, `x-dh-key`) go to that provider
     directly, or through their own gateway key. Quick tools use the provider's fast model.
   - Without a key, writing goes to `gateway(DH_TRIAL_MODEL)` over OIDC.
   - The mock writer only answers on a dev machine or a preview deployment. It replays
     recorded real output from `lib/recorded.js` when it has some for the request, at a
     writer's pace (`DH_MOCK_PACE=quick` for the browser test), and writes a synthetic
     stand-in otherwise.
4. **Trial** (no key). Find the device cookie (`dh_id`, HttpOnly, `Path=/api`) and check
   what's left at device, network and IPv6 /48 scope. If an allowance is empty, return 402
   with `trial_over` or `tools_over`.
5. **Cache.** Cacheable tasks look up `sha256([PROMPT_VERSION, model, task, prompt])`
   unless `fresh` is set. Hits are instant and free.
6. **Reserve** one unit at every scope atomically, and roll back if any scope goes over.
7. **Write** with `streamText` and wait for the first word. If none comes, refund the
   unit, unless the reader hung up after the writer started, and return the error status.
8. **Stream** plain text. A mid-stream failure or cut-off appends one trailer:
   `\u0000` + JSON. Only clean stops that pass `task.usable()` are cached. Every write logs
   one line (task, model, tokens, ms, end), never content, IPs, cookies or keys.

## Error codes (`STATUS` in `lib/ai.js`; reader-facing text is `errText()` in `src/app/02-util.js`)

| Code | HTTP | Meaning |
| --- | --- | --- |
| bad_request | 400 | Invalid body, task or input, or an unknown or disabled provider |
| model_unavailable | 400 | That model isn't offered for that key |
| bad_key | 401 | The provider turned the reader's key down |
| trial_over / tools_over | 402 | Free pages, or free quick tools, are used up |
| forbidden | 403 | Cross-origin call |
| method | 405 | Not POST |
| too_large | 413 | Body too big, or the provider's context is exceeded |
| refused | 422 | Content filter |
| rate_limited | 429 | Busy (trial), or the Firewall rule |
| key_limit | 429 | The reader's key is rate-limited or out of credit |
| upstream_error | 502 | Anything else from the provider |
| trial_paused | 503 | Trial switched off, or Dorkhub's gateway refused (credits, budget, auth) |

## Invariants (most are guarded by tests; the security review established them)

- The page never sends prompt text. Tasks are an allowlist.
- A reader's key goes only to their provider and can't fall back to Dorkhub's credits.
  It is never logged, cached or echoed.
- Trial units are reserved before writing and refunded only if nothing was bought.
- Only finished answers are cached: a clean stop, not aborted, passing `usable()`.
  `fresh` never reads the cache.
- `supportsCancellation` is on, so a disconnect can end the function at any moment. Any
  work after one goes through the request-bound deferrer in `lib/write.js`.
- The mock writer never answers in production (`mockAllowed`).
- CSP: scripts are allowed only by hash; no inline handlers; `connect-src 'self'`;
  fonts and images only from our own origin.
- Streaming never shows anything that later changes or vanishes, and nothing appears
  above the reader: half-written lines of the plan, a panel or the hooks are held back;
  a panel never sits above the first paragraph; at most two panels, never two in a row;
  a lead picture shows only if it is ready before the first paragraph is finished.
- No crawlable topic URLs: pages live behind `#` routes in the reader's browser. Writes
  are POST-only and same-origin; `api/picture` answers only `Sec-Fetch-Site: same-origin`
  (a 403 that is never cached otherwise) and every answer is CDN-cached; `/api/*` carries
  `X-Robots-Tag: noindex` and `robots.txt` disallows it.
- Unknown paths get the static 404 page with no rewrite, so stale URLs never cost a
  function call.

## Client side of the protocol

`write(task, input, { signal, onText, fresh, key })` in `src/app/02-util.js` resolves to
`{ text, truncated }` or throws `{ code, text }`. `writeJSON` wraps it with `looseJSON`.
The `x-dh-trial` header (`pages=N; extras=M`) updates the badge and the landing page line.

## Tests

| What | Where |
| --- | --- |
| Parser, including every prefix of every recorded page, hand-written v2 edge cases (`tests/fixtures.js`) and mock pages (nothing shown while streaming may change or vanish) | `tests/article.test.js` |
| Fonts, CSP, cache and crawler headers | `tests/page.test.js` |
| Lead pictures against a fake Wikimedia: crawler refusals, input limits, licences, the image proxy | `tests/picture.test.js` |
| Prompts and input validation | `tests/prompts.test.js` |
| Caps, bursts, expiry, IPv6, both counter stores (Redis via a fake Upstash) | `tests/trial.test.js` |
| The endpoint end to end with the mock writer | `tests/write.test.js` |
| A Chromium walkthrough on desktop and phone | `scripts/e2e.mjs` |

## Operations

**Deploy:** push `main`. The Vercel project uses framework Other, Node 24, Fluid compute,
region iad1 and a 120 s max duration.

**Not in the repo** (dashboard only):
- A Firewall rule rate-limits `/api/write` to 40 requests per minute per IP, then 429.
- The AI Gateway team budget is $5 a month.
- Production has no `AI_GATEWAY_API_KEY`; it uses OIDC.

**Log lines worth knowing:**
- `{"evt":"store"}`: once per instance; says which counter store is in use.
- `{"evt":"write"}`: one per write, with tokens and timing.
- `{"evt":"trial-credentials"}`: the gateway refused Dorkhub's own credentials.

**Settings:** see `.env.example`.

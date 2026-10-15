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
  The page has a size budget (`tests/page.test.js`, 372 KB raw). The page ships without its
  comments: the stylesheet's are stripped by pattern, the script's by TypeScript's own comment
  ranges (`lean()` in the build), so nothing inside a string, template or regex is touched and
  licence notices stay. Anything only one view needs, like the front page's cards, is a separate
  file fetched by that view.
- **The reading page** (`src/app/05-render.js`): one column, centred in the room it has (720 px
  of content). Each paragraph is a block (`.pb`): the paragraph, its expansions and peeks, then
  what belongs to it (`.mcol`): its asides (`^` notes), a facts panel the writer put after it,
  and, after the first paragraph, the lead picture. An aside is written straight after its
  paragraph, so it always arrives at the bottom of what is written. The sidebar is closed by
  default and then takes no room; its toggle (`#sideBtn`, or M) sits before the wordmark. The top
  bar's actions share one shape: search, Your world with its count, keys with the free pages
  left (both counts set alike, digits popping in as they change), voice.
- **Two functions.** `api/write.js` → `handleWrite()` in `lib/write.js` (every word Dorkhub
  writes), and `api/picture.js` → `handlePicture()` in `lib/picture.js` (a page's lead picture
  from Wikipedia, proxied through our own origin; no model involved).
- **The page format, v3** (`FORMAT` in `lib/prompts.js`, parsed by `parseArticle` in
  `src/shared/article.js`): `# Title :: kind`, `> deck`, `+++` link plan
  (`[[Topic]] :: kind`), `---` body with `^` margin notes and 0 to 2 panels
  (`::: type [title | headers]`, rows that each hold ` :: `, then `:::`), `===` exactly six
  topics to open next (`- [[Topic]] :: hook :: kind`), `???` three questions that stand on
  their own, `&&&` a hook for every planned link. Kinds come before the body so links appear
  in colour; hooks come last because only hover cards need them. The page's own kind counts
  once its title line is whole, so it never changes while streaming. `cardsOf()` gives the
  six cards, de-duplicated and never the page itself.
  The parser still reads older pages: v2's `~` bridge, `>>>` next page (shown as the first
  card) and branch directions, and v1's head facts and `%%%` timeline (panels below the
  first paragraph).
- **Page identity** (`src/shared/world.js`, shared by page and server): pages are written for
  their topic, never for the reader's path. `pageId()` is the topic after trivial cleanup
  (`topicKey`: case, accents, punctuation, a leading "the"; other scripts keep their own
  text), the voice, whether it answers a question, the sense of a name chosen inside another
  page (`ctx`), and, for a connecting page, its unordered pair. Similar topics ("whale",
  "blue whale") are different pages; nothing tries to be clever about meaning.
- **State in the browser** (`dorkhub:world:v1` in localStorage; `store` in `src/app/02-util.js`):
  `pages` by `pageId` (request, title, kind, text, links, first/last read, saved, the tools'
  results), `trails` (each sitting: up to 30 of up to 120 steps `[page, when, from, how]`, a new
  one after 30 minutes away or from the front page), `pos` (where each topic sits in Your
  world), `legacy` (old `#/w/` addresses to pages) and settings. A browser with rabbit holes
  (`dorkhub:holes:v1`) moves in once through `migrateHoles` (`src/shared/world.js`); the old
  key stays for one release. Saving drops the oldest unsaved page texts past 200, or when the
  browser is full (`textsToDrop`), never the page on screen; a dropped page refetches when
  opened (free while still cached). The reader's key and last known trial count live in
  `dorkhub:auth:v1`.
- **Addresses** (`routeOf` / `parseRoute` in `src/shared/world.js`): `/` the front page,
  `/world` Your world, `/<topic>` a page (its key with hyphens; `?v=` another voice, `?in=`
  the sense of a name chosen on a page, `?q=1` a question the address can't show),
  `/connect/<a>/<b>` a connecting page. Names the site uses get a trailing hyphen. `vercel.json`
  rewrites single dot-free paths and `/connect/a/b` to the page (files and the API come first)
  with `X-Robots-Tag: noindex`; `robots.txt` allows only `/`; `scripts/dev.mjs` mirrors it.
- **Your world** (`src/shared/graph.js`, drawn by `src/app/11-world.js`): `buildGraph` makes
  one node per topic read (any voice), the moves between them from the trails, and up to 8
  unread invitations per page plus any topic two pages lead to, capped at 500 read and 300
  unread. A small force simulation (springs, Barnes-Hut repulsion, centring) runs only while
  something moves; positions persist. The sidebar shows `localGraph`, the neighbourhood of
  the page on screen. It is drawn like an instrument (`draw()`): a faint grid that moves with the
  map, corner brackets, a read topic as a solid dot in its kind's colour with a ring, an
  invitation as a hollow circle, names in small capitals off a short leader line (placed where
  they fit, faded ones last), hairline links that trace in once when the map is first seen, the
  reader's moves stronger with a chevron the way they went (`from` on the edge), a running dash
  on a pointed-at topic's links, a radar ping for a newcomer and a marker that drives Replay. A `still` view (the front page) never pans, zooms or drags, so a finger
  scrolls the page over it; a tap shows a topic's card and a second opens it.
- **The front page** (`src/app/13-landing.js`, `lib/front.js`): the composer, then ways in.
  `lib/front.js` is the front page made by hand: `FRONT`, the planned topics, each with a kind,
  a hook and a source (the build puts titles, kinds and hooks in the page for the suggestions);
  `CARDS`, each with its size, hook, sources and a drawing in hairline SVG coloured only through
  theme classes (`.vz`); and `THREADS`, pairs of topics with a short label and a source. The
  build writes `public/front.json` (the cards with their drawings, the topics, the threads),
  fetched by the front page only, so reading pages never carry the artwork. The cards sit in a
  dense grid of 6 columns (4 on a tablet, where a card may take another size so nothing leaves
  a hole; a test packs the grid as the browser does; one column on a phone). Three cards do
  something once seen (`data-fx`): the cube's count rolls in, the flytrap counts touches, and
  the Enigma card encrypts as you type with `src/shared/enigma.js`, a real Enigma I (tested).
  Between the two groups of cards, a still map of every planned topic and its threads: the
  topic pointed at shows beside the map (`makeGraph`'s `panel`), and each of its threads is
  tagged at its middle with its label. A reader's world takes the last card's place, at its
  size. Surprise me, and the doors a paused or used-up page offers, draw only on `DOORS`, the
  pages already written: free and instant.
- **State on the server.** Trial counters live in Redis or Runtime Cache. Cached answers
  live in Runtime Cache for 14 days, best effort: it is regional and can be evicted.

## Lifecycle of a write (`lib/write.js`)

1. **Gatekeeping.** POST only, same origin, and a JSON body of at most 64 KB:
   `{ task, input, fresh?, cachedOnly? }`.
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
4. **Written ahead of time** (pages, not `fresh`). `lib/seeds.js` serves a pre-written page
   for its topic to every reader, keys included, in the default voice; never for a
   connecting page or a name chosen inside another page. `x-dh-cache: seed`.
5. **Answered before** (not `fresh`). Cacheable tasks look up
   `<ns>:sha256([PROMPT_VERSION, model, task, pageId or prompt])`, where `<ns>` is `text` in
   production and `text-preview` or `text-local` elsewhere (`textNs`), so preview and mock
   answers never reach production. The model is in the key, so a weaker model never fills a
   stronger one's page. `x-dh-cache: hit`.
   Seeds and hits come before the trial: they are free and instant even when the trial is
   over or paused, and they set no cookie and no trial header.
6. **Prefetch stops here.** `cachedOnly` (pages only) answers 204 with `no-store` when
   there is nothing to serve. It never writes, reserves or sets a cookie.
7. **Trial** (no key). Find the device cookie (`dh_id`, HttpOnly, `Path=/api`) and check
   what's left at device, network and IPv6 /48 scope. If an allowance is empty, return 402
   with `trial_over` or `tools_over`.
8. **Reserve** one unit at every scope atomically, and roll back if any scope goes over.
9. **Write** with `streamText` and wait for the first word. If none comes, refund the
   unit, unless the reader hung up after the writer started, and return the error status.
10. **Stream** plain text. A mid-stream failure or cut-off appends one trailer:
   `\u0000` + JSON. Only clean stops that pass `task.usable()` are cached, and never a
   `fresh` answer. Every write logs one line (task, model, tokens, ms, end, cached), never
   content, IPs, cookies or keys.

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
- A rewrite (`fresh`) is private: it never reads the shared page and is never cached, so
  one reader can't replace everyone's page.
- Nothing about the reader's path reaches a page prompt or its cache key; old browsers
  that still send `path`, `seen` or `ratings` get the same page as everyone else.
- `supportsCancellation` is on, so a disconnect can end the function at any moment. Any
  work after one goes through the request-bound deferrer in `lib/write.js`.
- The mock writer never answers in production (`mockAllowed`).
- CSP: scripts are allowed only by hash; no inline handlers; `connect-src 'self'`;
  fonts and images only from our own origin.
- Streaming never shows anything that later changes or vanishes, and nothing appears
  above the reader: half-written lines of the plan, a panel or the hooks are held back;
  a panel never sits above the first paragraph; at most two panels, never two in a row;
  a lead picture shows only if it is ready before the first paragraph is finished.
- Topic addresses are for readers, not crawlers: `robots.txt` allows only `/`, every topic
  address says `noindex`, and a page arrived at from outside Dorkhub is shown only if it is
  already written (a `cachedOnly` ask); otherwise it waits for the reader to press "Write
  this page", so a shared link or a crawler never spends anything by itself. Writes are
  POST-only and same-origin; `api/picture` answers only `Sec-Fetch-Site: same-origin` (a 403
  that is never cached otherwise) and every answer is CDN-cached; `/api/*` carries
  `X-Robots-Tag: noindex`.
- Unknown paths get the static 404 page with no rewrite, so stale URLs never cost a
  function call.

## Client side of the protocol

`write(task, input, { signal, onText, fresh, cachedOnly, key })` in `src/app/02-util.js`
resolves to `{ text, truncated, seeded, none }` (`none`: a `cachedOnly` ask found nothing) or
throws `{ code, text }`. `writeJSON` wraps it with
`looseJSON`. The `x-dh-trial` header (`pages=N; extras=M`) updates the badge and the landing
page line; seeds and cache hits carry none, so the count stays as it was. `fresh` is sent
only when the reader rewrites a page in the voice it is already in (`page.wlens`); a retry,
another voice, or a page after adding a key may all be served from cache.
Prefetch (`prefetch` in `src/app/07-reading.js`) asks `cachedOnly` on a pause over a link or
card and for the first two cards once the end of a page is in view: one ask at a time, 12 per
page and 30 a minute, none under Save-Data. What it finds opens at once; the page never says
which pages were cached.

## Tests

| What | Where |
| --- | --- |
| Parser, including every prefix of every recorded page, hand-written v2 edge cases (`tests/fixtures.js`) and mock pages (nothing shown while streaming may change or vanish) | `tests/article.test.js` |
| Fonts, CSP, cache and crawler headers, topic addresses and their rewrites, the page's size budget | `tests/page.test.js` |
| Lead pictures against a fake Wikimedia: crawler refusals, input limits, licences, the image proxy | `tests/picture.test.js` |
| Prompts and input validation | `tests/prompts.test.js` |
| Pre-written pages: served by topic, both index shapes, the real seeds complete and each naming its kind | `tests/seeds.test.js` |
| The front page's feed: a card for every page written ahead of time, saying only what its page says | `tests/feed.test.js` |
| Page identity, addresses both ways, trails, the move-in from rabbit holes, what to drop when the browser is full | `tests/world.test.js` |
| Your world: what is drawn and its caps, the neighbourhood map, a layout that settles (and quickly, at 800 topics) | `tests/graph.test.js` |
| Caps, bursts, expiry, IPv6, both counter stores (Redis via a fake Upstash) | `tests/trial.test.js` |
| The endpoint end to end with the mock writer: free repeats, private rewrites, prefetch, cache namespaces | `tests/write.test.js` |
| A Chromium walkthrough on desktop and phone: the front page's feed (it peeks above the fold, shuffles, opens free) and its map, addresses, cards, back and forward, every tool, Save, Your world, the sidebar, the guard, the trial, keys, and a browser moving in | `scripts/e2e.mjs` |

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

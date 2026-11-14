# Architecture

_How it works and what must stay true. Read before touching `lib/`, `api/` or the build._

## Shape

- **The page.** `scripts/build.mjs` turns `src/` into one `public/index.html`: the head
  and CSS, then the body, then one inline script. That script is `src/app/main.js` and everything
  it imports (the app modules, `src/shared`, `src/vendor`), bundled by esbuild into one classic
  script in a scope of its own. A CSP meta tag pins that script by its SHA-256. There is no
  framework; Vercel's CDN serves the page.
  **The modules** (`src/app/*.js`) are ES modules that import each other by name, in circles where
  they need to, so the order they load in is the bundler's business. That is safe because loading a
  module does nothing: its top level only declares functions and values that need nothing else to
  exist, and whatever it does when the page starts is in its `init()`, which `main.js` runs in a
  fixed order. `tests/page.test.js` fails the build if a module does anything on load. A binding
  another module assigns has a setter beside it (`setCUR`, `setSIDE`), since an import can't be
  assigned. What only the build knows (the trial size, the front page's topics) comes from the
  virtual module `dorkhub:build`. `tsconfig.app.json` type-checks the page.
  Third-party code is ported into `src/vendor` with its licence notice; its CSS follows
  `src/styles.css`, and `/licenses.txt` lists it.
  The orbs port is tested against the library's own golden vectors (`tests/orbs.test.js`).
  The page has a size budget (`tests/page.test.js`). The page ships without its comments or spare
  whitespace (names stay as written, so an error in production reads like the source): the
  stylesheet's comments are stripped by pattern, the script's by esbuild, which keeps only licence
  notices (comments opening with `/*!`). Anything only one view needs, like the front page's cards,
  is a separate file fetched by that view.
  Colours come from CSS custom properties, so a theme switch (the top bar's, or the device's) restyles the page by
  itself; what is drawn on a canvas reads its colours once, so `rerenderTheme` (`16-router.js`) tells each of them:
  Your world and the sidebar's map, the front page's two maps, the thinking orbs and a picture still arriving (the
  magnet's filings listen for themselves). The browser's own bar (`theme-color`) follows the reader's pick too.
- **The reading page** (`src/app/05-render.js`): one column, centred in the room it has (580 px
  of content; body text at 17 px sets about 67 characters a line). Each paragraph is a block (`.pb`): the paragraph, its expansions and peeks, then
  what belongs to it (`.mcol`): its asides (`^` notes), a facts panel the writer put after it,
  and, after the first paragraph, the lead picture: a plate across the column (a tall or square picture on a mat),
  captioned with what it shows (`desc` from `api/picture`) and its credit. An aside is written straight after its
  paragraph, so it always arrives at the bottom of what is written. A front-page topic with a card opens with the card's
  drawing as its plate, above the title (`plateSlotHTML`/`mountPlate` in `13-landing.js`): the build gives each card
  topic its size (`c` in `FRONT`), so the slot is kept from the first frame; the drawing and `/front.css` come with
  `/front.json`, fetched only for those topics; from the front page the view transition carries the card's drawing
  (`plate`) into it; its effects are the card's own. A link's card sits in the margin beside its line where there is
  room (`placeCard` in `07-reading.js`). On a phone (the ≤900 px layout of the tools button, with no pointer that
  hovers: `docked()`) a tap shows the same card as a sheet docked at the bottom edge, as wide as the column and above
  the safe area; it is not modal (no scrim, nothing locked), its link stays marked (`hc-on`), the page moves up by the
  least that keeps the link's line above it (`clearOfSheet`, one call to drop), a tap on another link swaps it in place,
  a second tap on the same link opens the page, and it goes on a tap elsewhere, Escape, opening a page, a swipe down, or
  56 px of reading on (`HC_READ_ON`); the tools button steps aside while it is up. Once the title has scrolled away it
  waits in the top bar (`#topT`).
  The head says where you came from (`fromOf`: the trail's step into this page, by a link, card or question). The end
  draws its six ways on as threads out of the page (`fanBlock`/`drawFan` in `06-page-end.js`): an SVG of curves from
  this page's point to each way on's ring, measured from the layout once all six are there and redrawn only when they
  change or the column resizes; drawn in once per visit when first in view; one stem on a phone. The sidebar is closed by
  default and then takes no room; its toggle (`#sideBtn`, or M) sits before the wordmark, and keeps its place unseen
  where there is no sidebar, so the wordmark stands at one x on every page. The top
  bar's actions share one shape: search, Your world with its count, keys with the free pages
  left (both counts set alike, digits popping in as they change), voice.
- **Three functions.** `api/write.js` → `handleWrite()` in `lib/write.js` (every word Dorkhub
  writes), `api/picture.js` → `handlePicture()` in `lib/picture.js` (a page's lead picture
  from Wikipedia, proxied through our own origin; no model involved), and `api/share.js` →
  `handleShare()` in `lib/share.js` (the head a link preview reads, for an address with no file of its own;
  see Sharing; it never writes, so it goes through neither `lib/library.js` nor `lib/flight.js`).
- **The page format, v3.1** (`FORMAT` in `lib/prompts.js`, parsed by `parseArticle` in
  `src/shared/article.js`): `# Title :: kind`, `> deck`, `!!!` three key facts (`Label :: value`, shown under
  the deck once all three are in, side by side or down the column by what fits: `fitFacts` in `05-render.js`), `+++` link plan
  (`[[Topic]] :: kind`), `---` body with `^` margin notes and 0 to 2 panels
  (`::: type [title | headers]`, rows that each hold ` :: `, then `:::`), `===` exactly six
  topics to open next (`- [[Topic]] :: hook :: kind`), `???` three questions that stand on
  their own, `&&&` a hook for every planned link, and, only on a page written ahead of time, `@@@` the sources it
  was checked against (`- Label :: https://…`; a live writer is never asked for them, and the page lists them only
  for a seeded page: today only the placeholders carry any). Kinds come before the body so links appear
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
  `/connect/<a>/<b>` a connecting page, `/trail/<a>/<b>/…` a trail someone shared (`trailRouteOf`). Names the
  site uses get a trailing hyphen. `vercel.json` rewrites single dot-free paths, `/connect/a/b` and `/trail/…` to
  the page (files and the API come first, so a known page's own copy is served at its address) with
  `X-Robots-Tag: noindex`, except that a link preview asking for one with no file goes to `/api/share`;
  `robots.txt` allows only `/`, but for link previews; `scripts/dev.mjs` mirrors it all.
- **Sharing** (`lib/share.js`, `src/app/17-share.js`, `scripts/share.mjs`). A link unfurls as its page. The build
  writes every page known ahead of time (each in `lib/seeds/index.json`, and any front-page topic still a placeholder)
  `public/<word>.html`: the page itself, its head saying the page's title, deck, picture and address (Open Graph
  and X's large card) and noindex. Any other address is named by the address alone, for link previews only
  (`PREVIEW_BOTS`, matched on the User-Agent in vercel.json): `handleShare` reads the address and the known titles
  and pictures, never writes, logs or sets a cookie, and answers `private`. The pictures (1200 × 630: a card's
  drawing, else the page's Wikipedia lead picture, else its words) are rendered in Chromium from the built front
  page by `node scripts/share.mjs` and committed to `src/static/share/` with `index.json`; the build and the
  function read that index, and a page without a picture yet shows the front page's. The share icon among a
  page's tools hands the clean address to the phone's share sheet, else the clipboard, and sends nothing. A trail
  (the "How you got here" sheet shares yours, up to the page you're on) opens as a view of its own (`showTrail`),
  drawn with the page end's threads; each of its pages opens as a link from outside does (`walk`, then
  showPage's guard), joining your trail from the step before. A test names any page whose picture no longer
  matches its title, kind or line, with the command that re-renders it.
- **Your world** (`src/shared/graph.js`, drawn by `src/app/11-graph*.js`, its pages in `src/app/11-world.js`): `buildGraph` makes
  one node per topic read (any voice), the moves between them from the trails, and up to 8
  unread invitations per page plus any topic two pages lead to, capped at 500 read and 300
  unread. A small force simulation (springs, Barnes-Hut repulsion, centring) runs only while
  something moves; positions persist. The sidebar shows `localGraph`, the neighbourhood of
  the page on screen. It is drawn like an instrument (`draw()`, `11-graph-paint.js`): a faint grid that moves with the
  map, corner brackets, a read topic as a solid dot in its kind's colour with a ring, an
  invitation as a hollow circle, names in small capitals off a short leader line (placed where
  they fit, faded ones last), hairline links that trace in once when the map is first seen, the
  reader's moves stronger with a chevron the way they went (`from` on the edge), a running dash
  on a pointed-at topic's links, a radar ping for a newcomer and a marker that drives Replay. A `still` view (the front page) never pans, zooms or drags, so a finger
  scrolls the page over it; a tap shows a topic's card and a second opens it.
  Every map is one `makeGraph` (`11-graph.js`: the data, the loop that runs only while something moves,
  the map's life), its state in one object per map (several live at once), worked on by parts: the
  camera and its flights (`11-graph-camera.js`), the painting (`11-graph-paint.js`), the pointer
  (`11-graph-input.js`), the card (`11-graph-card.js`), Replay (`11-graph-replay.js`) and the picture
  to keep (`11-graph-picture.js`, its own frame and radius at print size). By keyboard
  (`11-graph-keys.js`) each map is one tab stop (`role="application"`, labelled with its counts):
  focused, its corner brackets strengthen instead of a focus ring; arrows move a selection by direction
  among the topics drawn (`keyStep` in `src/shared/graph.js`: the nearest in a quarter-turn cone, no
  wrapping; first the current page's topic, else the most connected), which wears the reticle in its
  kind's colour, shows the card pointing would and is announced through `#srLive`; Enter opens it,
  Escape lets it go and then leaves; on /world + - 0 zoom and fit, and the camera follows only a
  selection about to leave the view. While a map has focus only those keys are its own (it stops them
  reaching the page's handler); the pointer takes the card back by pointing. Positions are kept when
  they move (a settle, a drag let go) and on sleep, destroy and pagehide, never on a timer.
- **The front page** (`src/app/13-landing.js`, `lib/front.js`): the composer, then ways in.
  The hero (`viewStart`): the heading, whose last word steps once through four of `FRONT`'s topics
  in their kinds' colours to "anything" (`livingWord`, the first arrival of a visit only, never
  without motion; screen readers hear the whole heading from hidden text), the composer, and the
  suggestions, led by the page you were last on (`contHTML`, a `door-cont` chip with a play mark,
  which shuffle leaves be). On a phone they keep to one row, and the heading's word takes a line
  of its own. The cards have no heading; their section is labelled for screen readers.
  `lib/front.js` is the front page made by hand: `FRONT`, the planned topics, each with a kind,
  a hook and a source (the build puts titles, kinds and hooks in the page for the suggestions);
  `CARDS`, each with its size, hook, sources, entrance length (`beat`), whether it is night in
  either theme, and its drawing; and `THREADS`, pairs of topics with a short label and a source.
  A card shows only its drawing, edge to edge, with its kind and title in the top corner (Will,
  2026-10-16); its hook goes with its link (the opened page's hint, the placeholder's promise, the
  writer's brief) but not on the card. The build writes `public/front.json` (the cards with their
  drawings, the topics, the threads) and `public/front.css` (`src/front.css`, every rule for the
  cards and the map, plus the few rules `plateCss()` computes from the drawings: the fold's shades
  at rest, how far each cube piece moves), both fetched by the front page only, so reading pages
  carry neither. A wide card's drawing comes twice, `vz-w` and a phone version `vz-n`, switched by
  CSS; ids inside drawings are unique across cards (tested). The cards sit in a dense grid of 6
  columns (`tall` 2×3, `sq`, `wide`, `big`, the hero; 4 on a tablet, where a card may take another
  size so nothing leaves a hole; a test packs the grid as the browser does; one column on a phone,
  each card with a shape of its own).
  - **Drawings, computed:** the black hole is ray-traced at build time as Luminet did in 1979
    (`lib/plates/blackhole.js`: photon paths integrated once per impact parameter, the disk's
    light from Page–Thorne flux and redshift, stippled by error diffusion); Lightning grows from a
    seed as a stepped leader; Atlantis is a model built to Plato's measurements; Pompeii's column
    is to scale. Geometry the page also moves lives in `src/shared/plates.js`, inlined into the
    page: Miura's fold at any angle (`foldView`), the flytrap's lobes at any opening (`trapView`),
    and the bar magnet's field and filings (`barField`, `filings`). A test checks the drawings
    against their subjects (the fold's faces stay unit parallelograms, the shadow is 3√3 M, the gas
    coming toward you is brighter, the cube's count).
  - **One card at a time** (`stage` in `13-landing.js`; Will, 2026-10-16: when everything moves at
    once nothing is seen). Cards are rendered `armed` when motion is allowed. A card plays its
    entrance (gets `seen`, and `playing` while it leads) only once 60% of it has shown for 150 ms
    (`DWELL`: a card a fling only carries past never starts), the page isn't being flung (faster than
    about 1.4 px/ms, and still for 180 ms), and no other card is leading; waiting cards keep a still
    first frame and go in reading order, each starting as the one before it settles (70% of its
    `beat`), or sooner if the reader scrolls that one away (under 25% showing). The map of threads takes its turn too (`makeGraph`'s `hold` and
    `play()`). CSS keyed on `armed`/`seen` draws paths in (`dr`, `pathLength="1"`) and fades parts
    (`fade`, delays `w1`–`w16`); some entrances are the page's (`FX_PLAY`). The finished drawing is
    the default, so reduced motion shows it whole and nothing plays.
  - **Effects** (`startFx`): the cube's count rolls in; the flytrap counts touches on a meter and
    snaps shut by turning its lobes in three dimensions; the Enigma (`src/shared/enigma.js`, a real
    Enigma I, tested) types from its keys or the keyboard, rolls its rotor windows, lights its
    lamps, keeps a paper tape and a tally, and types WETTER once on its turn; the magnet's filings
    are drawn on a canvas (about 1,000, chained along field lines), swing into line on its turn and
    turn toward the pointer; the Miura sheet's faces are laid and moved by the page, opening on its
    turn and folding as the pointer crosses it; and parts with a `data-read` reading show it in a
    small label beside the pointer, found by position (`elementsFromPoint`) since the card's link
    lies over its drawing. Each stops with the page.
  Between the two groups of cards, a still map of every planned topic and its threads: the
  topic pointed at shows beside the map (`makeGraph`'s `panel`), and each of its threads is
  tagged at its middle with its label. A reader's world takes the last card's place, at its
  size, as their map edge to edge. Surprise me, and the ways on a page offers when it can't be
  read (not written yet, paused, out of free pages, failed: a state is a page, `stateOf` in
  `06-page-end.js`), draw on `DOORS`: the front page's topics, then the pages written before them (`EARLIER`), each
  free and instant.
- **Lamps** (`src/app/03-lamps.js`; the law is in `docs/vision.md`, Identity). `MARK` is "dorkhub" as the dot
  face sets it, 41 lamps by 7. `lampBoard(host, { mix, arrive })` draws it on a canvas as a board: every place on
  the grid a lamp, the word's lit and the rest faint. `mix` shares the lit lamps among the kinds by largest
  remainder, dealt along a fixed scatter (a lattice on the plastic number, with the kinds in an order that keeps
  neighbours on the colour wheel apart), so the spectrum never forms a band or a sweep. The board draws only while
  a lamp has somewhere to go: arriving (once a visit, when half of it is seen), warming to the pointer and
  cooling behind it, or hushing every kind but one (`only`). At rest it asks for no frame; reduced motion draws
  the resting board once. `init()` hands the stylesheet the board's shape (`--wordmark-ar`) and the mark as a
  picture (`--wordmark`, an SVG a rule paints through as a mask) for where it stands small and still.
  - **The footer** (`footHTML`, `mountFoot` in `13-landing.js`): the fine print, a key to the eight kinds, and
    the board across the page. Lit in the proportions of what the reader has read (`worldIndex`), each kind in
    the key with its count, most read first; nothing read, every kind in equal measure. Pointing at a kind in
    the key calls out its lamps.
  - **The composer** is an instrument: four corner brackets (`.cbk`), short and faint at rest, drawn out while
    it has focus, and a row of lamps (`.clamps`): unlit at rest, awake while it listens, all lit as a page is
    asked for (`.cbox.go`), all three in the stylesheet. `heard()` flashes the next lamp along for each key and
    gives the box the kind of what is typed once it is known (a topic in `DOORS`, or a page the reader has read);
    the heading's stepping word lends the lamps its colour while nothing is typed.
- **Placeholders** (`lib/placeholder.js`). Until a front-page topic's page is written, it opens a
  placeholder, made when asked from `lib/front.js` alone: the topic's title, kind and hook, a
  real page's shape (an opening, sections, two notes, two panels, six cards, three questions),
  its card's hook, and its threads with their labels; nothing else it says is a claim about the
  topic, and a test holds every number on it to `lib/front.js`. Its links follow the threads
  (then one thread further, then the rest of the map, nearest first), so every link and card
  opens another page written ahead of time. A written page in `lib/seeds` replaces it with no
  other change. `node scripts/seeds.mjs brief "<title>"` gives a writer the page's own prompt
  plus what the front page says about the topic (hooks and drawings) and its threads, each
  with its source, to keep and to link.
- **State on the server.** Trial counters live in Redis or Runtime Cache. Written pages and
  answers are kept by **the library** (`lib/library.js`), three layers read in order: pages
  written ahead of time (`lib/seeds`), the Runtime Cache (14 days, best effort: it is regional
  and can be evicted), and an optional durable layer for finished pages (Redis, only when
  `DH_LIBRARY=redis`; connecting Redis for the counters alone keeps nothing). A durable page
  lives under the page's own key with its prompt version stamped beside the text: a page from an
  older prompt is not served, and the page the new prompt writes takes its place.

## Lifecycle of a write (`lib/write.js`)

1. **Gatekeeping.** POST only, same origin, and a JSON body of at most 64 KB:
   `{ task, input, fresh?, cachedOnly? }`.
2. **Validation.** `task` must be one of `TASKS` in `lib/prompts.js`. Its validator clips
   and normalizes the input, and a `BadInput` becomes a 400.
3. **Writer** (`lib/ai.js`):
   - A reader's key headers (`x-dh-provider`, `x-dh-model`, `x-dh-key`) go to that provider
     directly, or through their own gateway key. Quick tools use the provider's fast model.
   - Without a key, writing goes to `gateway(DH_TRIAL_MODEL)` over OIDC.
   - Every writer is told how long to think before its first word (`writerSettings`): Claude's 5.5 models think
     unless told otherwise, and what they think counts against the output limit, so Haiku is told not to, Sonnet
     only between tool calls (a page makes none), and Opus, which cannot stop, as little as it can, with room
     beyond the task's limit. `tests/thinking.test.js` reads the settings off the requests the SDK sends.
   - The mock writer only answers on a dev machine or a preview deployment. It replays
     recorded real output from `lib/recorded.js` when it has some for the request, at a
     writer's pace (`DH_MOCK_PACE=quick` for the browser test), and writes a synthetic
     stand-in otherwise.
4. **Written ahead of time** (pages, not `fresh`). `lib/seeds.js` serves a pre-written page
   for its topic to every reader, keys included, in the default voice; never for a
   connecting page or a name chosen inside another page. `x-dh-cache: seed`. A front-page
   topic not written yet gets its placeholder the same way, with `x-dh-cache: placeholder`
   (logged as `{ seed: true, placeholder: true }`).
5. **Answered before** (not `fresh`), through the library. Cacheable tasks look up
   `<ns>:sha256([PROMPT_VERSION, model, task, pageId or prompt])`, where `<ns>` is `text` in
   production and `text-preview` or `text-local` elsewhere (`textNs`), so preview and mock
   answers never reach production. The model is in the key, so a weaker model never fills a
   stronger one's page. `x-dh-cache: hit`.
   Seeds and hits come before the trial: they are free and instant even when the trial is
   over or paused, and they set no cookie and no trial header. A miss in the cache falls to
   the durable layer when there is one (`<ns>:page:sha256([model, pageId])`); a hit there
   refills the cache.
6. **Prefetch stops here.** `cachedOnly` (pages only) answers 204 with `no-store` when
   there is nothing to serve. It never writes, reserves or sets a cookie.
7. **Being written right now** (`lib/flight.js`, same instance only). The first request to
   miss claims the write; another asking for the same answer meanwhile takes a seat on it and
   reads along: everything written so far, then the rest, and the same trailer. A joiner
   spends nothing. The writer stops only when the last reader has gone. A write that ends
   before its first word was never joinable, and a `fresh` rewrite never joins or is joined.
8. **Trial** (no key). Find the device cookie (`dh_id`, HttpOnly, `Path=/api`) and check
   what's left at device, network and IPv6 /48 scope. If an allowance is empty, return 402
   with `trial_over` or `tools_over`.
9. **Reserve** one unit at every scope atomically, and roll back if any scope goes over.
10. **Write** with `streamText` and wait for the first word. If none comes, refund the
   unit, unless the reader hung up after the writer started, and return the error status.
11. **Stream** plain text. A mid-stream failure or cut-off appends one trailer:
   `\u0000` + JSON. Only clean stops that pass `task.usable()` are kept, and never a
   `fresh` answer. Every write logs one line (task, model, tokens, ms, end, cached), never
   content, IPs, cookies or keys. `trial_paused` says `why` in the log (`off`, `counters`,
   `gateway_auth`, `no_credit`); a deferred job that fails (a cache write, a refund, a usage
   report) logs `{ evt: 'deferred', what, error }`.

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
- Topic addresses are for readers, not crawlers: `robots.txt` allows only `/` (link previews alone may
  read a page's head, and never `/api/`), every topic address says `noindex`, and a page arrived at from outside Dorkhub is shown only if it is
  already written (a `cachedOnly` ask); otherwise it waits for the reader to press "Write
  this page", so a shared link or a crawler never spends anything by itself. Writes are
  POST-only and same-origin; `api/picture` answers only `Sec-Fetch-Site: same-origin` (a 403
  that is never cached otherwise) and every answer is CDN-cached; `/api/*` carries
  `X-Robots-Tag: noindex`.
- Unknown paths get the static 404 page with no rewrite, so stale URLs never cost a
  function call.

## Client side of the protocol

`write(task, input, { signal, onText, fresh, cachedOnly, key })` in `src/app/02-util.js`
resolves to `{ text, truncated, seeded, none }` (`none`: a `cachedOnly` ask found nothing;
`seeded`: true for a page written ahead of time, `'placeholder'` for a placeholder, which the
page's fine print then names; opened again from the top, a stored placeholder asks `cachedOnly`
for its page and takes the written one in its place) or throws `{ code, text }`. `writeJSON` wraps it with
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
| Parser, including every prefix of every recorded page, hand-written v2 edge cases (`tests/fixtures.js`), mock pages and the outlier page (nothing shown while streaming may change or vanish) | `tests/article.test.js` |
| The outliers: a page with what a writer can send that a prompt asks it not to (a 149-character question for a title, names of 58 and 63 letters in one word, a 150-character heading, wide panel cells, long hooks, an unknown kind). The parser keeps every name whole; the browser walk opens it on desktop and phone and checks nothing runs past its box, the page never scrolls sideways, a link card holds a 58-letter name, and Around this keeps names whole and its map's labels inside the map and apart | `tests/outliers.js`, `tests/article.test.js`, `scripts/e2e.mjs` |
| Fonts, CSP, cache and crawler headers, topic addresses and their rewrites, the page's size budget | `tests/page.test.js` |
| Lead pictures against a fake Wikimedia: crawler refusals, input limits, licences, the image proxy, captions (the article's own, else an English description, never a bare name) | `tests/picture.test.js` |
| Prompts and input validation | `tests/prompts.test.js` |
| Pre-written pages: served by topic, both index shapes, the real seeds complete and each naming its kind; every front-page topic opens free, its placeholder complete, linking only to pages written ahead of time and claiming nothing unchecked; a written page replaces it; the writer's brief | `tests/seeds.test.js` |
| The front page by hand: topics, threads and cards each with a source, drawings labelled and inert (a canvas hidden from assistive tech), no line of prose on a card, an entrance length for each, ids unique across cards, a phone version of each wide drawing, short readings, drawings true to their subjects, the cards' styles in their own sheet with the computed rules, the door list, the grid without holes, the Enigma's cipher | `tests/front.test.js` |
| Page identity, addresses both ways, trails, the move-in from rabbit holes, what to drop when the browser is full | `tests/world.test.js` |
| Sharing: every known page at its own address with its own head (otherwise the page itself), its picture made for it (1200 × 630, its title, kind and line, credited), an address told by itself to link previews only, a function that never writes, robots.txt's one exception, trail addresses both ways | `tests/share.test.js` |
| Your world: what is drawn and its caps, the neighbourhood map, a layout that settles (and quickly, at 800 topics), where an arrow key moves a map's selection | `tests/graph.test.js` |
| Caps, bursts, expiry, IPv6, both counter stores (Redis via a fake Upstash) | `tests/trial.test.js` |
| The endpoint end to end with the mock writer: free repeats, private rewrites, prefetch, cache namespaces | `tests/write.test.js` |
| A Chromium walkthrough on desktop and phone: the front page's cards (they peek above the fold, show only their kind and title, never play two at once after a fling nor play one it only passed, each play on its turn and finish, and the flytrap, the Enigma's keys and tally, the black hole's reading, the filings and the fold answer), its suggestions and its map, addresses, cards, back and forward, every tool, Save, Your world, the sidebar, the guard, the trial, keys, a browser moving in, and sharing (each kind of page's head and picture, the share action on desktop and phone, a trail link walked) | `scripts/e2e.mjs` |

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

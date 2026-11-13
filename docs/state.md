# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-13)
- **Live on dorkhub.com** (merged at Will's word, 2026-11-13, and checked on production): the engine wave below.
  Nothing a reader sees changed. No gateway credits, so typed topics pause; the 44 pages written ahead of time
  open free. `node scripts/prove.mjs https://dorkhub.com` passes its 9 free checks.
- **Will, 2026-11-13:** engine first. Fable 5.2 orchestrates itself and Opus/Sonnet builders; he is product
  visionary and art director. Build without paid credits; build the eval, then ask; test grounding in the eval;
  the writer is open to a full refactor; build toward a durable library; elegant prompts over rule lists.
- **The engine wave** (none of it a reader would notice):
  - willgibs/dorkhub#30 CI: verify and the browser walk on every pull request and on `main`.
  - #34 the server engine: the library (seeds, cache, durable Redis behind `DH_LIBRARY=redis`), one write per
    page in flight, failures visible in logs, `scripts/prove.mjs`. (#34 is #31 without a `node_modules` symlink
    committed by mistake; #31 is closed and its branch deleted, its stray commit still at `refs/pull/31/head`.)
  - #32 the page as real ES modules, bundled by esbuild, type-checked. Identical to `main` at 113 checkpoints of
    a scripted journey; 44 KB lighter. A test fails if a module does anything on load.
  - #33 the writer as variants (`base` pinned for production, `split`, `lean`, `grounded`, `hooks-tight`) and
    the eval harness (`node scripts/eval.mjs plan`); nothing run, nothing spent. 168 tests in all.
- **Costs** (gateway list prices, 2026-11-13): a page is about $0.0011; the eval's first look about $3.70 judged
  by Opus 5.5 or $1.90 by Sonnet 5.5.
- **Data transfer** (found 2026-11-13): 16.7 GB in 30 days, 81% of the Vercel account's, nearly all of it the first
  Dorkhub's Sentry uptime monitor fetching `/` uncompressed once a minute. No charge on Hobby; no fault in this repo.

## Open
- The browser walk fails on a busy Mac at two clock-timed front-page checks (CI retries once). Use CI's run.
- The three reader-visible fixes and the page's structural splits wait for Wave 2 (`docs/backlog.md`, Now 6).

## Blocked on Will
- Delete that Sentry monitor (org `dorkhub`, its own account; his Chrome isn't signed in): `docs/backlog.md`, section 0.
- Credits (about $5), then his go on the eval's first look; the topic set and the `lean` prompt are his to read.
- Connecting Upstash Redis (his click), and whether to switch the library on.
- Still open from October: #24 sharing (his look); the 11 earlier pages; old resources; repo visibility; Pro pricing.

## Next
1. Credits, then `prove.mjs --spend --yes`. 2. The eval's first look and Will's blind picks. 3. Wire the winner
into `lib/write.js`. 4. Wave 2 by preview: sharing, phone link card, Your world. 5. The walk's two clock-timed checks.

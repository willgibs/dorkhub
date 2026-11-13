# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-13)
- **Live on dorkhub.com:** unchanged since 2026-10-20 (#29). No gateway credits, so typed topics pause; the 44
  pages written ahead of time open free. `node scripts/prove.mjs https://dorkhub.com` passes its 9 free checks.
- **Will, 2026-11-13:** engine first. Fable 5.2 orchestrates itself and Opus/Sonnet builders; he is product
  visionary and art director. Build without paid credits; build the eval, then ask; test grounding in the eval;
  the writer is open to a full refactor; build toward a durable library; elegant prompts over rule lists.
- **Built, green in CI, not merged** (none a reader would notice):
  - willgibs/dorkhub#30 CI: verify and the browser walk on every pull request and on `main`.
  - #31 the server engine: the library (seeds, cache, durable Redis behind `DH_LIBRARY=redis`), one write per
    page in flight, failures visible in logs, `scripts/prove.mjs`. 145 tests.
  - #32 the page as real ES modules, bundled by esbuild, type-checked. Identical to `main` at 113 checkpoints of
    a scripted journey; 44 KB lighter. A test fails if a module does anything on load.
  - #33 the writer as variants (`base` pinned for production, `split`, `lean`, `grounded`, `hooks-tight`) and
    the eval harness (`node scripts/eval.mjs plan`); nothing run, nothing spent. 134 tests.
- **Costs** (gateway list prices, 2026-11-13): a page is about $0.0011; the eval's first look about $3.70 judged
  by Opus 5.5 or $1.90 by Sonnet 5.5.

## Open
- The browser walk fails on a busy Mac at two clock-timed front-page checks (CI retries once). Use CI's run.
- The three reader-visible fixes and the page's structural splits wait for Wave 2 (`docs/backlog.md`, Now 6).

## Blocked on Will
- Merging #30 to #33 from the orchestrating session archives it (his auto-archive setting): his word, or his merge.
- Credits (about $5), then his go on the eval's first look; the topic set and the `lean` prompt are his to read.
- Connecting Upstash Redis (his click), and whether to switch the library on.
- Still open from October: #24 sharing (his look); the 11 earlier pages; old resources; repo visibility; Pro pricing.

## Next
1. Merge, then walk production. 2. Credits, then `prove.mjs --spend --yes`. 3. The eval's first look and Will's
blind picks. 4. Wire the winner into `lib/write.js`. 5. Wave 2 by preview: sharing, phone link card, Your world.

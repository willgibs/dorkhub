# dorkhub.com

An encyclopedia that writes itself around your curiosity: every link opens a page written
for the reader's exact path. Solo founder (Will) + AI agents. Will owns product decisions;
agents own execution.

## Start here (every session)
1. `docs/state.md`: where things stand and what's blocked.
2. `docs/vision.md`: the product in Will's terms. Read it before changing anything a reader sees.
3. `docs/backlog.md`: what's next, in order. `(Will)` items need his decision first.
Then, as needed: `docs/architecture.md` before touching `lib/`, `api/` or the build;
`docs/eval-plan.md` for the model eval; `docs/decisions.md` for why things are the way they are.

## Stack
One static page (plain JS modules concatenated by `scripts/build.mjs`, no framework) +
one Vercel Function (`api/write.js`, Node 24, ESM, JSDoc-typed JS) · AI SDK 7 · Vercel AI
Gateway (OIDC, no secrets) · Vercel Runtime Cache · npm.

## Commands
`npm run dev` (mock writer, :3000) · `npm run verify` (build + tsc + tests: THE green gate,
run before calling anything done) · `npm run e2e` (full reader flow in Chromium; run
`npx playwright install chromium` once). Pushing `main` deploys production immediately.

## Map
- `src/app/NN-*.js`: the page, one IIFE in filename order; `16-router.js` boots it.
- `src/shared/`: used by page and server, inlined by the build, so no imports allowed.
- `lib/prompts.js`: every prompt. The page sends a task + structured input, never prompt text.
- `lib/write.js` protocol · `lib/ai.js` writer choice + error codes · `lib/trial.js` free
  allowance (reserve before writing) · `lib/counters.js` Redis (atomic) or Runtime Cache.
- `lib/recorded.js`: real writer output that the mock replays in dev, e2e and previews.
  Judge prompts and rendering against it, not against the synthetic mock.
- Append to `docs/decisions.md` when you decide something real. Rewrite `docs/state.md`
  (≤40 lines) at the end of every session.

## Will's standing product calls (the why is in docs/vision.md)
- One point of focus at a time. Readability first: light, minimal, high information density. Colour carries meaning
  (link-kind and level colours), never decoration, and never rainbow everywhere.
- Streaming order: nothing may ever appear above where the reader already is.
- A clicked topic stays the page title (`titleIsLocked`). Links are specific and
  surprising, not umbrella subjects or a parade of people.
- No tracking of what people click. Only the current path may shape a page.
- Icon-only controls; labels live in tooltips (`data-tip`).
- The brand is Dorkhub; keep dig/dirt/tunnel metaphors out of the copy.
- The landing page stays light: its job is getting a visitor into their first page.

## Rules
- Prompts change only in `lib/prompts.js`; bump `PROMPT_VERSION` when the output format
  changes (it keys the answer cache).
- Offer only models marked `vetted` in `src/shared/models.js`; vetting means passing the
  model eval.
- Reader keys go straight to their provider (or their own gateway key), never through
  Dorkhub's gateway, and are never logged. Logs never hold page content, IPs or cookies:
  the landing footer promises nothing is tracked.
- The mock writer must never answer in production (`lib/ai.js` guards it; a test checks).
- The page runs under a hash-based CSP: no inline event handlers, no external scripts.

## Working with Will
Show, don't describe. For anything a reader would notice, push a branch and send Will the
Vercel preview URL (previews need his Vercel login), with screenshots from `npm run e2e`.
Merge to `main` only when `npm run verify` and `npm run e2e` are green.

## Ask Will first
Pro pricing and launch · the model eval and which models ship · enabling a provider ·
trial size or budget changes · anything that spends money or changes account settings.

# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-14, page v2)
- **Live:** dorkhub.com serves `main`: v1 (PR #1) and self-hosted fonts (PR #2). It still has
  no AI Gateway credits ("Free pages are paused"), and its counters are the Runtime Cache, not
  Redis (logs, 13:37).
- **In review:** PR willgibs/dorkhub#3 (`experience/v2`), preview
  https://dorkhub-git-experience-v2-willgibs.vercel.app (Will's Vercel login; previews
  replay recorded pages). It contains:
  - the v2 format: kinds first, hooks last, Next before branches, and 0–2 of nine panels.
    The body starts after about 165 tokens instead of 526.
  - streaming panels; a soft frontier; a truthful status shimmer; tools in the head row;
    the ask row; floating margin notes; a writer-paced reveal
  - lead pictures from Wikipedia via `api/picture` (no model; only our own page is answered)
  - the serving for pre-written pages (`lib/seeds`, empty until the door pages land)
- **Door pages:** 12 landing doors are being written by Opus and fact-checked, to be added
  to PR #3. Then the pages one click off each door (about 240), in waves.
- **Stand-ins:**
  - `lib/recorded.js` has 27 pages: 14 in v2 (Haiku 5.5, exact prompt) and 13 v1 pages kept
    for compatibility.
  - Haiku, Sonnet and Opus all follow the panel rules (1.33 panels a page on the same three
    topics). No model-specific prompt lines are needed.
- **Checks:** `npm run verify` green (67 tests); `npm run e2e` green on desktop and phone.

## Blocked on Will
- **Review and merge #3** (v2). Merge rights are granted, but a reader-visible change this
  big waits for his look at the preview.
- **AI Gateway credits.** These gate backlog §1 and live page reads.
- **transitions.dev Pro:** run `npx transitions-dev login`, then `npx transitions-dev skill`.
  The free skills are installed. Pro licenses one person; a company needs Business.
- Still open from the handoff: Redis, old resources, repo visibility, Pro pricing
  (`docs/backlog.md` §0).

## Next
1. Add the door pages to #3 when they finish: run `scratchpad seeds.mjs index`, check the
   seeds test, push.
2. Pages one click off the doors, priority order: Next and branches, then body links, then
   questions.
3. Once credits land: prove production (§1), swap the stand-ins for live pages, measure
   time to the first body word.

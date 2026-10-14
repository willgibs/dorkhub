# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-14, first experience pass)
- **Live.** dorkhub.com serves `main` from Vercel project willgibs/dorkhub. Production is
  unchanged since the handoff, and still has no AI Gateway credits ("Free pages are paused").
- **In review:** PR willgibs/dorkhub#1 (`experience/reading`). Preview:
  https://dorkhub-git-experience-reading-willgibs.vercel.app (needs Will's Vercel login, and
  `DH_MOCK=1` on Preview to replay real pages). It contains:
  - a reading-first head: facts beside the opening, or after the first paragraph
  - streaming without flashes, links that point at the planned topic
  - prompt 2026-10-14 (no stock curiosities, wild branches name their thread, `seen`)
  - richer recaps, a readable around-this map, phone fixes, contrast and focus fixes
- **Real pages without credits:** Claude Haiku 5.5 stand-ins, given the exact prompts, are in
  `lib/recorded.js`. They cover 5 rabbit holes and every quick tool for one of them. The mock
  writer replays them in dev, e2e and previews, and a test streams every one.
- **Checks:** `npm run verify` green (45 tests); `npm run e2e` green on desktop and phone.

## Blocked on Will
- **Merge #1** once he's seen the preview (anything a reader notices waits for his go).
- **AI Gateway credits.** These gate backlog §1 (proving production) and live page reads.
- **Vercel access for agents:** sign in as willgibs in the Claude browser pane. The CLI and
  connector on his Mac belong to the Partyreel team. Until then nobody can check logs, the
  counter store (Redis?) or env vars.
- **Preview env:** `DH_MOCK=1` on Preview (he chose the replay writer for previews).
- Still open from the handoff: Upstash Redis, old resources to retire, repo visibility, Pro
  pricing (`docs/backlog.md` §0).

## Next
1. When credits land: prove production (§1). Re-read 5+ live pages, then swap the stand-ins
   in `lib/recorded.js` for live output. Warm the cache for the landing doors (about 5¢;
   ask first).
2. The rest of §2 (`docs/backlog.md`): touch ¶ noise, fonts self-hosting, latency.
3. Then the model eval and Pro, on Will's go.

# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-14, morning)
- **Live on dorkhub.com: the lamps wave (#48)**, deployed 14 Nov from `9d92326` once Vercel's daily limit
  cleared. Production's page matches a local build of `main` byte for byte, and `scripts/prove.mjs` passes (9 ok,
  0 fail; live writing skipped). His answers of 13 Nov are the **Lamps** rules in `docs/vision.md`. In the wave:
  the top bar (counts in the dot face, position as a row of lamps, tap areas of 44 px); the composer's glow,
  rebuilt to cost nothing at rest; the footer's wordmark in lamps, a lamp coloured for each page read; moves both
  ways (cards, links, Your world); five cards redrawn; nothing running at rest; eleven review and sweep fixes.
- **The review desk** (https://claude.ai/artifact/Lg3WC6c8uGrzjMno1rFycp) holds only what is open: what Will
  is being asked and what is being built. Nothing is open now. It belongs to Will's other Claude account: a
  session under this one reads it but cannot update it, so it still lists the lamps wave until that account
  republishes it (`node .e2e/desk/build.mjs` already writes the empty desk) or Will gives this one edit access.
- **Tokens are shared with Will's other agents** (his words, 13 Nov): no optional lanes. Not built, his to ask
  for: Fireworks, Venus flytraps and Pompeii redrawn; Back landing in the composer; the front page's own maps
  joining the moves.
- **The writer** has still never run live: #38 is unproven until a live write. The judged eval has not run.

## Open
- CI's second try for the walk warns when used; drop it after a clean week.
- A local walk failure means little while other projects load this Mac: check `uptime` first, then rerun.
- The page is 382 of the 384 KB `tests/page.test.js` allows; the cards' code could load with `front.json`.
- Left on purpose: a picture whose image never answers keeps its dots moving while on screen; on a phone,
  keyboard focus into the sticky bar scrolls the page (older than the lamps wave).

## Before launch, all of it Will's (production is otherwise ready)
- A few dollars of gateway credit: then `node scripts/prove.mjs https://dorkhub.com --spend --yes` proves live
  writing, the eval takes its first look (`--judge-via claude`), and the winner is wired into `lib/write.js`.
- Connecting Upstash Redis (his click), and whether to switch the library on.
- From October: the 11 earlier pages; old resources; repo visibility; Pro pricing. Also one HTML shell, not 46.

## Next
Will's: gateway credit (then the live proof and the eval's first look), and deleting the merged remote branches.
The orchestrator's working notes are in `.claude/orchestrator-handoff.md` (untracked, on Will's Mac).

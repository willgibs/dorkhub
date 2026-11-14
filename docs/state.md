# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-14, morning)
- **Live on dorkhub.com: the lamps wave (#48)**, deployed 14 Nov from `9d92326` once Vercel's daily limit
  cleared. Production's page matches a local build of `main` byte for byte, and `scripts/prove.mjs` passes (9 ok,
  0 fail; live writing skipped). His answers of 13 Nov are the **Lamps** rules in `docs/vision.md`. In the wave:
  the top bar (counts in the dot face, position as a row of lamps, tap areas of 44 px); the composer's glow,
  rebuilt to cost nothing at rest; the footer's wordmark in lamps, a lamp coloured for each page read; moves both
  ways (cards, links, Your world); five cards redrawn; nothing running at rest; eleven review and sweep fixes.
- **The review desk** is new as of 14 Nov (https://claude.ai/artifact/5H9tMoB19rZjCUkfkHKSLP, on the account Will
  works in now; the old one belongs to his other account). Will answers each ask on it with Approve, Revise or Deny
  and a note (`CLAUDE.md` says how to read them). Three asks wait: build the next five ideas, gateway credit, and
  deleting the 46 merged branches on GitHub.
- **Ideas come to Will built** (his words, 14 Nov): chase ideas, build them, and put each on the desk for his
  Approve, Revise or Deny. Tokens are shared with his other agents, so the next five (Fireworks, Venus flytraps and
  Pompeii redrawn; Back landing in the composer; the front page's maps joining the moves) wait on desk ask 1.
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
Read the desk's answers (`verdicts`) and act on them; gateway credit unlocks the live proof and the eval's first look.
The orchestrator's working notes are in `.claude/orchestrator-handoff.md` (untracked, on Will's Mac).

# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-14, evening): built, live, handed off
- **Live on dorkhub.com, everything through the handoff round** (#49, #50, #51): the front page and its 13 hand-drawn
  cards (Pompeii, Venus flytraps and Fireworks redrawn this day), the reading page, Your world, sharing, moves that
  run both ways (cards, links, the composer, the front page's maps, Your world), the Lamps identity, and a
  performance pass (the composer's glow rests at idle, no layout shift on phones, the cards preload, no stray font).
- **Production is proven except live writing**: the page, `/front.json` and `/front.css` match a local build byte for
  byte, and `node scripts/prove.mjs https://dorkhub.com` passes. The writer has never run live; the eval has not run.
- **The review desk** (https://claude.ai/artifact/5H9tMoB19rZjCUkfkHKSLP) holds Will's current asks; he answers each
  on the page (Approve, Revise, Deny, a note: read `verdicts` with ArtifactData, see `CLAUDE.md`). One ask is open:
  gateway credit.
- **Clean**: GitHub holds only `main`, no open pull requests; no worktrees or branches beyond `main` on this Mac.

## For Will's portfolio
`docs/showcase.md`: what to capture in the order a visitor meets it. Without credit, production serves only the
pages written ahead of time (the 33 front-page topics and 11 earlier pages); film a page being written locally.

## Next, all of it Will's first (`docs/backlog.md` "Now")
1. Gateway credit, then: prove live writing (`prove.mjs … --spend --yes`), the eval's first look, wire the winner
   into `lib/write.js`, replace the writer stand-ins in `lib/recorded.js` (backlog §1–3).
2. Connect Upstash (and whether the library keeps every page); retire the old resources in his accounts; repo
   visibility; Pro pricing.
3. Long-term: one HTML shell instead of 46 copies, a shared feed, analytics, more writers (backlog §5).

## Open, small
- CI's second try for the walk warns when used: drop it after a clean week (from 14 Nov).
- A local walk means little while other projects load this Mac: check `uptime`; CI is the clean gate.
- Room: the page is ~393 KB of its 400 KB budget (`tests/page.test.js`), `front.json` ~198 KB of 200 KB
  (`tests/front.test.js`).
- Left on purpose: a picture whose image never answers keeps its dots moving while on screen; on a phone, keyboard
  focus into the sticky bar scrolls the page.
- Fable hit its account limit on 14 Nov; card builders ran on Opus (300–370k tokens a card).

The orchestrator's working notes: `.claude/orchestrator-handoff.md` (untracked, on Will's Mac).

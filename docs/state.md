# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-18, the week wound down): the split writer in four calls, live
- **Live on dorkhub.com:** the free pages on Will's Anthropic credit (`DH_ANTHROPIC_KEY`, Production only; Console
  workspace "Dorkhub", $50 monthly limit); the parser reading Haiku's slips (#54, #55); Sonnet 5.5's covers (#55,
  #56); Pompeii's town plan (#56); the split writer (#57), its frame as head lines (#58), and since #59 (merged on
  18 Nov on Will's word in chat) the head and topic plan written at once, the ways on as the page's own lines.
- **#59's numbers**, twelve topics against the live API, medians from the click: the first body words at 2.6 s (#58
  2.9, one pass 2.0), the end at 14.5 s (#58 16.6, one pass 12.7), 13 links a page (one pass 1). On 44 pages: all
  whole; the plans judged better than #58's on 29 of 44, blind, by Opus 5.5. Its timing on dorkhub.com is in the
  handoff note, for the next change's records.
- **Being built:** "A delightful wait between articles" (Will's other note on #58), in its own session, worktree
  `feat/first-words-wait`, in progress when the week wound down. It reports to the orchestrator, then the desk.
- **The desk** holds no asks; it shows the wait as in the works.
- **Will's calls (17–18 Nov):** "work in from both ends", everything up for relitigation; Haiku stays the live writer,
  Sonnet writes the covers; cards should feel like "a knowledge tool and not like a toy"; testing on the credit needs
  no ask and no heads-up until $20 in a month (`CLAUDE.md`); "amazing performance will always beat a delightful
  delay" (keep cutting the wait, never at the page's quality). On 18 Nov he wound the week down here so that his
  tokens go to other projects: no new big tasks until next week.
- **Spent this month:** about $3.85 of the $20 for testing.

## Next
The near-term roadmap is `docs/backlog.md`'s "Now", in order: the wait between articles; cutting the first-word wait
further (the body on the head alone, its links tested first); the plans' misses; hooks on hover and readers' keys on
the split writer; then Will's items.

## Open, small
- CI's second try for the walk warns when used: drop it after a clean week (from 14 Nov).
- Never run `npm run verify` beside `npm run e2e`: verify rebuilds `public/` under the walk.
- Room: the page is ~387 KB of its 400 KB budget (`tests/page.test.js`), `front.json` ~215 KB of 220 KB.
- A comment in `lib/write.js` still calls the split writer three calls (four since #59): fix it with the next change.
- On Will's Mac, untracked: `.e2e/desk/tools/` (`timing.mjs`, `live44b.mjs`, `check-split.mjs`, `replay44.mjs`,
  `judge-plans.mjs`, `score.mjs`); #59's 44 test pages in `.seeds-batch/split3-*`.

The orchestrator's working notes: `.claude/orchestrator-handoff.md` (untracked, on Will's Mac).

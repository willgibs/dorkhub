# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-18): no word breaks where a layout can make room for it, on the desk
- **Live on dorkhub.com:** the free pages on Will's Anthropic credit (`DH_ANTHROPIC_KEY`, Production only; Console
  workspace "Dorkhub", $50 monthly limit); the parser reading Haiku's slips (#54, #55); Sonnet 5.5's covers (#55,
  #56); Pompeii's town plan (#56); the split writer (#57), its frame as head lines (#58), its head and topic plan at
  once with the ways on as lines (#59: on dorkhub.com the first body words at 2.7 s, the end at 15.0 s); the wait for
  the first words as a row of lamps lit by the link plan, and pages written ahead showing theirs at 0.42 s (#60).
- **On the desk** (`fix/long-words`): no word breaks where a layout can make room for it (Will's note approving #60,
  on "Tardigrades" breaking at 320 px). The page you came from takes a line of its own under the tools when it can't
  stand whole beside them; titles and names too wide for their box are set smaller, down to two thirds; key facts put
  each label over its value; only past that does a word break, at a syllable. Proven on long-word pages at four widths
  and in WebKit.
- **Will's calls (17–18 Nov):** "work in from both ends", everything up for relitigation; Haiku stays the live writer,
  Sonnet writes the covers; cards should feel like "a knowledge tool and not like a toy"; testing on the credit needs
  no ask and no heads-up until $20 in a month (`CLAUDE.md`); "amazing performance will always beat a delightful
  delay"; for generated words, "elegant considerations across any places where problems like that could occur". On
  18 Nov he wound the week down here so that his tokens go to other projects: no new big tasks until next week.
- **Spent this month:** about $3.90 of the $20 for testing.

## Next
The near-term roadmap is `docs/backlog.md`'s "Now": on Will's Approve, merge the long-words fix; then cut the
first-word wait further (the body on the head alone, its links tested first); the plans' misses; hooks on hover and
readers' keys on the split writer; then Will's items.

## Open, small
- CI's second try for the walk warns when used: drop it after a clean week (from 14 Nov).
- Never run `npm run verify` beside `npm run e2e`: verify rebuilds `public/` under the walk.
- Room: the page is ~392 KB of its 400 KB budget (`tests/page.test.js`), `front.json` ~215 KB of 220 KB.
- Chrome finds no syllable early in a 45-letter word and breaks it once without a hyphen (WebKit hyphenates it).
- On Will's Mac, untracked: `.e2e/desk/tools/` (`timing.mjs`, `live44b.mjs`, `check-split.mjs`, `replay44.mjs`,
  `judge-plans.mjs`, `score.mjs`); #59's 44 test pages in `.seeds-batch/split3-*`.

The orchestrator's working notes: `.claude/orchestrator-handoff.md` (untracked, on Will's Mac).

# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-18): the split writer's frame as head lines, on the desk (#58)
- **Live on dorkhub.com:** the free pages on Will's Anthropic credit (`DH_ANTHROPIC_KEY`, Production only; Console
  workspace "Dorkhub", $50 monthly limit); the parser reading Haiku's pages where it drops its markers (#54, #55);
  Sonnet 5.5's covers (#55, #56); six front-page lines back on their own topic and Pompeii's card as the town's plan
  (#56); npm audit's five advisories cleared (#53); and the split writer (#57): Haiku writes each page in three calls
  (frame, body, ways on; `lib/split.js`), planned topics linked at their first mention.
- **#58, on the desk** (`perf/frame-lines`): the frame written as the page's own head lines instead of JSON. Twelve
  topics, medians from the click: the deck at 0.9 s (JSON 1.6, one pass 0.7), the first body words at 3.0 s (JSON 3.8,
  one pass 2.2), the end at 16.0 s (JSON 17.2, one pass 13.0). On the 44 pages: all whole, 13 links a page (JSON 12),
  none without. On Will's Approve: merge, time it on dorkhub.com (`.e2e/desk/tools/timing.mjs`), take it off the desk.
  - Found on the way, live only: topics written "Wild yeast (creature)" (4 of 24 frames) and facts with one colon or a
    bar (3 of 88). The prompt now shows the topic line (0 of 24 since); `frameOfLines` reads every form seen.
  - What's left of the gap: 0.7 s, the body call's own wait for its first token (~0.6 s) and the plan before it.
- **Will's calls (17–18 Nov):** "work in from both ends", everything up for relitigation; Haiku stays the live writer,
  Sonnet writes the covers; cards should feel like "a knowledge tool and not like a toy" (his note on Pompeii); testing
  on the credit needs no ask and no heads-up until $20 in a month (`CLAUDE.md`).
- **Spent this month:** about $1.95 of the credit (the Console: $198.41 of $200 left at 04:36 UTC on 18 Nov, then
  about $0.35: the live proof and timing, #56's covers at $0.12, and #58's tests at $0.19).

## Next
1. After #58: the ways on as text lines too. They are JSON, which waits 1.2–1.8 s for its first token, so the page's
   end (and every link's hook) would come about a second sooner.
2. Relitigate the rest of the page around what Haiku writes well: hooks on hover rather than written for every link,
   and readers' own keys on the split writer.
3. Asked of Will: bring more cards up to the Pompeii bar, as desk asks?
4. Then, each on his go: re-record `lib/recorded.js` from live output; the trial size; Upstash; old resources; repo
   visibility; Pro pricing; identity federation.

## Open, small
- CI's second try for the walk warns when used: drop it after a clean week (from 14 Nov).
- Never run `npm run verify` beside `npm run e2e`: verify rebuilds `public/` under the walk.
- Room: the page is ~387 KB of its 400 KB budget (`tests/page.test.js`), `front.json` ~215 KB of 220 KB.
- Placeholders still say a page "will be written by the same writer as every page"; none shows today.
- On Will's Mac, untracked: `.e2e/desk/tools/` (`timing.mjs`, `page-end.mjs`); #58's 44 test pages in `.seeds-batch/`.

The orchestrator's working notes: `.claude/orchestrator-handoff.md` (untracked, on Will's Mac).

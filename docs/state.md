# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-18): the split writer is live; its first body words come 1.8 s later
- **Live on dorkhub.com:** the free pages on Will's Anthropic credit (`DH_ANTHROPIC_KEY`, Production only; Console
  workspace "Dorkhub", $50 monthly limit); the parser reading Haiku's pages where it drops its markers (#54, #55);
  Sonnet 5.5's 44 covers (#55); npm audit's five advisories cleared (#53); and the split writer (#57): Haiku writes
  each page in three calls (frame, body, ways on; `lib/split.js`), planned topics linked at their first mention.
- **#56, merging with this file:** six front-page lines back on their own topic, Pompeii's card as the town's plan
  from the survey of its ruins (`front.json`'s budget 200 → 220 KB), and those seven covers rewritten by Sonnet.
- **The split writer, timed (18 Nov; `docs/decisions.md`):** on dorkhub.com the head shows 1.6–2.4 s after the click,
  the first body words at 3.8–4.6 s, the end at 16.5–18 s. Against the single pass the first body words come 1.8 s
  later (median 3.8 s against 2.1 s), not the half second estimated. In exchange: a median of 12 links a page, not 2.
  - Where it goes: the frame as structured output waits 1.2–1.8 s for its first token (plain text: ~0.6 s) and runs
    to ~430 tokens of JSON; then the body waits 0.55–0.7 s for its own first token.
- **Will's calls (17–18 Nov):** "work in from both ends", everything up for relitigation; Haiku stays the live writer,
  Sonnet writes the covers; cards should feel like "a knowledge tool and not like a toy" (his note on Pompeii); testing
  on the credit needs no ask and no heads-up until $20 in a month (`CLAUDE.md`).
- **Spent this month:** about $1.75 of the credit (the Console: $198.41 of $200 left at 04:36 UTC on 18 Nov, then
  about $0.15: the live proof and timing, and #56's covers at $0.12).

## Next
1. Win back the first body words: the frame written as the page's own head lines (no JSON), and the body started as
   soon as it can. Time it against the single pass with `.e2e/desk/tools/timing.mjs`, then the desk.
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
- On Will's Mac, untracked: `.e2e/desk/tools/page-end.mjs` captures a page's end from a saved answer, for free;
  `timing.mjs` times a page's head, first body words and end (live, or the single pass against the split).

The orchestrator's working notes: `.claude/orchestrator-handoff.md` (untracked, on Will's Mac).

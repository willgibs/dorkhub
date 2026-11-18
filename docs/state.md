# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-17, night): two PRs on the desk; the free writer rebuilt around Haiku
- **Live on dorkhub.com:** the free pages write on Will's Anthropic credit (`DH_ANTHROPIC_KEY`, Production only;
  Console workspace "Dorkhub", $50 monthly limit), and #54's parser fixes for the bare title and the "Key facts" label.
- **PR #55 (`fix/unmarked-sections`)**, desk asks "closing-sections" and "covers":
  - the parser reads Haiku's closing sections by their shape and drops copied labels;
  - Sonnet 5.5 rewrote all 44 covers ($0.73), each opening on its topic.
- **The split-writer PR (`feat/split-writer`, stacked on #55)**, desk ask "split-writer": Dorkhub's own writer writes a
  page in three calls (frame, body, ways on; `lib/split.js`), with planned topics linked at their first mention.
  - By batch on the 44 topics: bodies that link nothing fall from 17 to 0, the median rises from 2 links to 12
    (Sonnet 13), and every page is whole (25 today).
  - Merge #55 first, then this one. Each needs Will's Approve.
- **Will's first-principles call (2026-11-17):** "work in from both ends", with everything up for relitigation. Haiku
  does best with one job at a time and mirrors the prompt's words, so its prompts carry no phrases it could copy.
- **Card audit:** a separate session ("Front-page cards that show their own topic") audits the cards that picture a
  neighbouring idea. Changed lines mean those covers are written again (Will's go).
- **Spent on the credit so far:** about $1.65 of the $50 month.

## Next
1. Ship #55 then the split writer after Will's look. Prove it live (`node scripts/prove.mjs https://dorkhub.com
   --spend --yes`, about $0.004) and read `split: true` in the logs, with the time to the first word.
2. Relitigate the rest of the page around what Haiku writes well: hooks on hover rather than written for every link,
   and readers' own keys on the split writer.
3. Then, each on his go: re-record `lib/recorded.js` from live output; the trial size; Upstash; old resources; repo
   visibility; Pro pricing; identity federation.

## Open, small
- The audit PR (#53, `package-lock.json` only) awaits Will's review.
- CI's second try for the walk warns when used: drop it after a clean week (from 14 Nov).
- Never run `npm run verify` beside `npm run e2e`: verify rebuilds `public/` under the walk.
- Room: the page is ~393 KB of its 400 KB budget (`tests/page.test.js`), `front.json` ~198 KB of 200 KB.
- Placeholders still say a page "will be written by the same writer as every page"; none shows today.
- `.e2e/desk/tools/page-end.mjs` captures a page's end from a saved answer, for free.

The orchestrator's working notes: `.claude/orchestrator-handoff.md` (untracked, on Will's Mac).

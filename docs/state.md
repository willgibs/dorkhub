# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-17, night): Haiku writes every live page, Sonnet the covers
- **Live on dorkhub.com:** the free pages write on Will's Anthropic credit (`DH_ANTHROPIC_KEY`, Production only;
  Console workspace "Dorkhub", $50 monthly limit, auto-reload off), and the prompt cache works. #54 shipped the
  parser's first two fixes for Haiku's slips (a bare title line, a copied "Key facts" label).
- **Will's calls (desk, 2026-11-17):** Haiku 5.5 stays the live writer, "its weaknesses accommodated elegantly in
  our own architecture and design", and should write genuinely engaging pages. Sonnet 5.5 writes the pages written
  ahead of time, "a fun entry point". His time travel page opened on one narrow angle (GPS clocks).
- **Branch `fix/unmarked-sections`** (one PR, on the desk as asks "closing-sections" and "covers"):
  - The parser knows Haiku's closing sections by their lines' shape, and drops copied labels. On its 44 pages,
    format lines in the body fall from 18 to 3, and real cards rise from 23 to 37.
  - Sonnet rewrote all 44 covers ($0.73). The cover brief now opens on the whole topic, and Sonnet's limit gets
    1,000 tokens of room.
  - The covers' checks accept a thread as a card or a body link, and leave long facts to the layout.
- **Spent on the credit so far:** about $1.50 of the $50 month (live proof, three writer arms, the covers).

## Next
1. Ship the PR after Will's look (desk asks 1 and 2), then take both off the desk.
2. **(Will)** Engaging Haiku pages: the eval's `lean` prompt on Haiku, 44 topics by batch (about $0.03), in blind
   pairs with today's prompt on the desk.
3. Haiku's early stops: 6 of 44 pages end after the body. Either finish them with a short second call (about
   $0.0003 a page), or keep them with cards made from their links.
4. Then, each on his go: re-record `lib/recorded.js` from live output; the trial size once readers reach it;
   Upstash; old resources to retire; repo visibility; Pro pricing; identity federation instead of the key.

## Open, small
- The audit PR (#53, `package-lock.json` only) awaits Will's review.
- CI's second try for the walk warns when used: drop it after a clean week (from 14 Nov).
- Never run `npm run verify` beside `npm run e2e`: verify rebuilds `public/` under the walk.
- Room: the page is ~393 KB of its 400 KB budget (`tests/page.test.js`), `front.json` ~198 KB of 200 KB.
- Placeholders still say a page "will be written by the same writer as every page"; none shows today.
- `.e2e/desk/tools/page-end.mjs` captures a page's end from a saved answer, for free.

The orchestrator's working notes: `.claude/orchestrator-handoff.md` (untracked, on Will's Mac).

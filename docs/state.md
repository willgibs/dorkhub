# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-17): live writing moves to Will's Anthropic API credit
- **The free writer goes straight to Anthropic** on `DH_ANTHROPIC_KEY` (Production only, Sensitive), a key from the
  Console workspace "Dorkhub", whose $50 monthly spend limit is the free pages' budget; auto-reload stays off, so
  nothing is charged beyond the month's credit. Without the key, the gateway as before. Why not the gateway's
  bring-your-own-key, and the costs: `docs/decisions.md` (2026-11-17).
- **Prompt caching** on a page's fixed instructions (identical for every page, 96% of its input): about 18% off a
  page that starts within five minutes of another. The write log's `cacheRead`/`cacheWrite` tell the hit rate.
- **Will's calls:** Haiku 5.5 stays the free writer and the eval decides any switch; $50 a month; rewrite all 44
  pages written ahead of time through the Batch API (the 11 earlier ones included).
- **Will's part:** the workspace, its limit and two keys (`dorkhub-production` into Vercel as `DH_ANTHROPIC_KEY`,
  `dorkhub-local` into `.env.local`). Keys are his to make and paste; agents never see one.

## Next
1. Merge the writer change once `DH_ANTHROPIC_KEY` is in Vercel, then prove it:
   `node scripts/prove.mjs https://dorkhub.com --spend --yes` (about $0.002), the `writer` and `write` log lines
   in his Chrome, the spend under the Dorkhub workspace in the Console. Take the gateway-credit ask off the desk.
2. `node scripts/seeds.mjs batch`: plan, send, take. Rewrites the 44 pages written ahead of time with production's
   own call (about 3 cents); before and after pictures on the desk; merge on his Approve.
3. Then (each on his go): the eval's first look on the credit, re-recording `lib/recorded.js` from live output,
   the trial size once readers reach it; Upstash, old resources to retire, repo visibility, Pro pricing.

## Open, small
- CI's second try for the walk warns when used: drop it after a clean week (from 14 Nov).
- A local walk means little while other projects load this Mac: check `uptime`; CI is the clean gate.
- Room: the page is ~393 KB of its 400 KB budget (`tests/page.test.js`), `front.json` ~198 KB of 200 KB
  (`tests/front.test.js`).
- Left on purpose: a picture whose image never answers keeps its dots moving while on screen; on a phone, keyboard
  focus into the sticky bar scrolls the page.

The review desk: https://claude.ai/artifact/5H9tMoB19rZjCUkfkHKSLP (verdicts via ArtifactData, see `CLAUDE.md`).
The orchestrator's working notes: `.claude/orchestrator-handoff.md` (untracked, on Will's Mac).

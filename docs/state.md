# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-17, evening): live writing runs on Will's Anthropic credit; the writer needs fixing
- **Live on dorkhub.com since #52:** the free pages go straight to Anthropic on `DH_ANTHROPIC_KEY` (Production only,
  a Secret in Vercel), from the Console workspace "Dorkhub", whose $50 monthly limit is their budget (auto-reload
  off). Each instance logs `{"evt":"writer","via":"anthropic"}`. The prompt cache works: every page after the first
  reads 2,568 of its 2,700 input tokens from it. A page costs about $0.001.
- **The writer breaks the format about half the time** (`docs/decisions.md`, 2026-11-17). Haiku 5.5 with thinking
  off, run live for the first time today, drops the title line's `# ` on about half its pages (no kind, no colour,
  never kept) and stops after the body on about a sixth. Bodies read whole on 43 of 44. Production keeps 20 of 44.
- **The 44 pages written ahead of time are still the Claude Code stand-ins.** The batch tool works (one batch of 44,
  about $0.025, answers in `.seeds-batch/`, untracked), but only 10 of its pages passed, and a tenth chosen by the
  checks would break one bar. Nothing from it shipped.
- **The review desk** (https://claude.ai/artifact/5H9tMoB19rZjCUkfkHKSLP) still shows ask 1 (the Anthropic key
  steps): done. Take it off with the next desk update.
- **Branch `seeds/production-writer`** (local, not pushed): `scripts/prove.mjs` now asks for a real topic, plus these
  records. Push it with the next change.

## Next
1. Read a bare `Title :: kind` first line as the title line (`src/shared/article.js`; mind the streaming rules).
   Production then keeps 35 of 44, not 20. Free.
2. **(Will)** Writer fixes tested on the same 44 topics by batch (cents each): thinking at low effort, Sonnet 5.5,
   the prompt. Then all 44 written ahead of time in one pass with the winner, on the desk before shipping.
3. Then, each on his go: the eval's first look on the credit, re-recording `lib/recorded.js` from live output, the
   trial size once readers reach it; Upstash, old resources to retire, repo visibility, Pro pricing; identity
   federation instead of the key (Vercel's OIDC token, no stored secret).

## Open, small
- The audit session's branch (Vercel packages' `npm audit` flags, `package-lock.json` only) brings its own PR.
- CI's second try for the walk warns when used: drop it after a clean week (from 14 Nov).
- Never run `npm run verify` beside `npm run e2e`: verify rebuilds `public/` under the walk.
- Room: the page is ~393 KB of its 400 KB budget (`tests/page.test.js`), `front.json` ~198 KB of 200 KB.
- Left on purpose: a picture whose image never answers keeps its dots moving while on screen; on a phone, keyboard
  focus into the sticky bar scrolls the page.

The orchestrator's working notes: `.claude/orchestrator-handoff.md` (untracked, on Will's Mac).

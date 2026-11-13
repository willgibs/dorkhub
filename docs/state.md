# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-13, late night)
- **Live on dorkhub.com** (production is byte for byte `main`): the engine wave (#30, #32, #33, #34), the walk's
  checks (#35), `makeGraph` split (#36), the writer told how long to think (#38), the eval's subscription route
  (#41), and Wave 2 (#37 the link card as a sheet on phones, #40 Your world by keyboard, #39 sharing).
- **Will, 2026-11-13:** engine first; Fable 5.2 orchestrates itself and Opus/Sonnet builders; he is product
  visionary and art director. Test on the Claude subscription rather than paid credits. He rates the app 6 or 7
  of 10: "bring it all together to feel like one seamless app under a cohesive, rooted visual identity". He will
  check in after greater strides. Keep the orchestrator's context lean: offer a compaction point at 60 to 75%.
- **The cohesion wave is up for his look: willgibs/dorkhub#42** (`design/cohesion`; preview
  `https://dorkhub-git-design-cohesion-willgibs.vercel.app`; none of it is on `main`). A state is a page; Your
  world's surroundings are readings (the map's pixels are unchanged); the chrome and raised surfaces are one
  family; one label size; one free-pages reading with its dots; the empty Your world is a state page. 188 tests
  and the 66-step walk pass on that tree. The pull request lists seven calls that are his to overrule. He has a
  before-and-after page (`.e2e/cohesion-review/index.html`, local and untracked; its captures are in
  `.claude/worktrees/cohesion/.e2e/cohesion-*/{before,combined}`).
- **Motion is being built on a stacked branch** (`design/motion`, cut from `design/cohesion`): a view changes on
  one clock, what opens closes, a state arrives as text does, durations from the tokens. Its law goes into
  `docs/vision.md`; it is reviewed by filmstrips and gets its own pull request on top of #42.
- **Sentry:** the uptime monitor that fetched the page every minute is disabled, not deleted (2026-11-13).
- **The writer** has still never run live: #38 is unproven until a live write. The judged eval has not run.

## Open
- CI's second try for the walk warns when used; drop it after a clean week.
- Worktrees: `.claude/worktrees/cohesion` (keep until #42 merges) and the motion builder's; `sharing-afdbe3` is older.

## Blocked on Will
- His look at #42's preview, and the seven calls in it.
- A few dollars of gateway credit: proves live writing (#38) and runs the eval's writers; judges need none.
- Connecting Upstash Redis (his click), and whether to switch the library on.
- Still open from October: the 11 earlier pages; old resources (the Sentry project itself, Supabase, tags, keys);
  repo visibility; Pro pricing.

## Next
1. Motion to a stacked pull request. 2. After Will's look at #42: his changes, then merge. 3. Credits, then
`prove.mjs --spend --yes` and the eval's first look (`--judge-via claude`). 4. Wire the winner into `lib/write.js`.

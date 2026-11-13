# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-13, night)
- **Live on dorkhub.com** (production is byte for byte `main`; 188 tests and the 66-step walk green on that tree):
  the engine wave (#30, #32, #33, #34); the walk's checks made deterministic (#35); `makeGraph` split (#36); the
  writer told how long to think (#38); the eval's subscription route (#41); and **Wave 2**, merged at Will's word
  ("I trust these are significant improvements. Please continue"): the link card as a sheet on phones with two
  fixes (#37), Your world by keyboard (#40), sharing (#39; #24 closed), its link previews checked on production.
- **Will, 2026-11-13:** engine first; Fable 5.2 orchestrates itself and Opus/Sonnet builders; he is product
  visionary and art director. Test on the Claude subscription rather than paid credits. He rates the app 6 or 7
  of 10: "bring it all together to feel like one seamless app under a cohesive, rooted visual identity". He will
  check in after greater strides. Keep the orchestrator's context lean: offer a compaction point at 60 to 75%.
- **The cohesion wave** (branch `design/cohesion`, preview only until Will looks): the kit is in (`ea79771`: one
  label, one reading, the dot face for numbers; `docs/vision.md`, Identity). Three Opus builders are on it:
  states become pages (`design/states`), Your world's surroundings as readings (`design/world`), the chrome and
  raised surfaces as one family (`design/chrome`). Then: integrate on `design/cohesion`, a consistency pass, the
  moves between views, one preview and a before-and-after page for Will.
- **Sentry:** the uptime monitor that fetched the page every minute is disabled (not deleted); its pings stopped
  at 17:35 ET on 2026-11-13, so Dorkhub's data transfer should fall to a few megabytes a day.
- **The writer** has still never run live: #38 is unproven until a live write. The judged eval has not run.

## Open
- CI's second try for the walk now warns when used; drop it after a clean week.
- Builders' worktrees sit under `.claude/worktrees/`; remove each once its work is merged.

## Blocked on Will
- His look at the cohesion wave's preview, when it is up.
- A few dollars of gateway credit: proves live writing (#38) and runs the eval's writers; judges need none.
- Connecting Upstash Redis (his click), and whether to switch the library on.
- Still open from October: the 11 earlier pages; old resources (the Sentry project itself, Supabase, tags, keys);
  repo visibility; Pro pricing.

## Next
1. The cohesion wave to a preview. 2. Credits, then `prove.mjs --spend --yes` and the eval's first look
(`--judge-via claude`). 3. Wire the winner into `lib/write.js` (`split` is the early favourite).

# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-11-14, early morning)
- **Live on dorkhub.com:** everything through the trimmed CI (#47). **Merged but not yet deployed: the lamps
  wave (#48)**, merged 14 Nov at Will's word after his look at a preview. Vercel refused its production
  deployment ("Deployment rate limited, retry in 24 hours"): the account had reached Hobby's 100 deployments a
  day, which counts every push of every project, skipped builds included. It goes live with the next push to
  `main` after the limit clears (the commit carrying this file is that push). His answers of 13 Nov became the
  **Lamps** rules in `docs/vision.md`. In the wave: the top bar (counts in the dot face, position as a row of
  lamps, tap areas of 44 px); the composer's glow, rebuilt to cost nothing at rest (corner brackets were tried
  in its place and dropped at his word); the footer's wordmark in lamps, ink at rest, a lamp coloured for each
  page read (his call); moves both ways (cards, links, Your world); five cards redrawn; nothing running at
  rest; eleven fixes from an independent review and a visual sweep.
- **The review desk** (https://claude.ai/artifact/Lg3WC6c8uGrzjMno1rFycp) holds only what is open: what Will
  is being asked and what is being built. It is empty now. A change that goes live comes off it.
- **Tokens are shared with Will's other agents** (his words, 13 Nov): no optional lanes. Not built, his to ask
  for: Fireworks, Venus flytraps and Pompeii redrawn; Back landing in the composer; the front page's own maps
  joining the moves.
- **The writer** has still never run live: #38 is unproven until a live write. The judged eval has not run.

## Open
- CI's second try for the walk warns when used; drop it after a clean week.
- A local walk failure means little while other projects load this Mac: check `uptime` first, then rerun.
- The page is 382 of the 384 KB `tests/page.test.js` allows; the cards' code could load with `front.json`.
- Left on purpose: a picture whose image never answers keeps its dots moving while on screen; on a phone,
  keyboard focus into the sticky bar scrolls the page (older than the lamps wave).

## Before launch, all of it Will's (production is otherwise ready)
- A few dollars of gateway credit: then `node scripts/prove.mjs https://dorkhub.com --spend --yes` proves live
  writing, the eval takes its first look (`--judge-via claude`), and the winner is wired into `lib/write.js`.
- Connecting Upstash Redis (his click), and whether to switch the library on.
- From October: the 11 earlier pages; old resources; repo visibility; Pro pricing. Also one HTML shell, not 46.

## Next
Push `main` once Vercel's limit clears; then check production: `curl -s https://dorkhub.com/ | shasum -a 256`
against a local build, and `node scripts/prove.mjs https://dorkhub.com`. Then credits.

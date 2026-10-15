# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-15)
- **Live on dorkhub.com:** PR A (willgibs/dorkhub#13, pages written for their topic, format v3)
  and PR B (willgibs/dorkhub#14, the world reader, merged as f3e28ea after Will's look and
  checked on production: noindex addresses, robots.txt, the guard, the move-in, clean logs).
- **Up for Will's look: PR C, the front page** (branch `experience/homepage`):
  - the hero with the parked heading sizes and placeholder;
  - today's pages below it, peeking above the fold: the 12 pages written ahead of time as
    cards (today's topic with its picture, big numbers, myths put right, open questions,
    pictures), free and instant, in a daily order with shuffle;
  - between the cards a still map: "A world of topics" for someone new, Your world for a reader;
  - the cards in `/feed.json` (`node scripts/seeds.mjs feed`), fetched by the front page only;
  - the seeds name their kind, so they open in their colour from anywhere.
  - Verify (96 tests) and e2e (44 steps) are green; the page stays under 372 KB.
- **Production today:** no gateway credits, so typed topics pause and seeds open free.

## Blocked on Will
- His look at PR C's preview (and the copy in the PR), then merge.
- AI Gateway credits; connecting Redis (his click); old resources, repo visibility and Pro
  pricing (backlog §0).
- The 32 topics are written only on his go (he has seen PR B). The feed switches to them then.

## Next
1. After PR C: the content step on Will's go (32 topics plus Bioluminescence, then
   `node scripts/seeds.mjs index` and `feed`).
2. Runtime Cache across production deploys: confirm once credits land (a branch's previews keep
   their pages across deploys).
3. Later, each on Will's go: a durable store, one write per page in flight, graph keyboard
   navigation, re-recording the three mock pages that say "your path".

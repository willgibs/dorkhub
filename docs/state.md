# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-15)
- **Live on dorkhub.com**, each merged after Will's look at its preview and checked on production:
  - PR A (willgibs/dorkhub#13): pages written for their topic, format v3, free repeats;
  - PR B (willgibs/dorkhub#14): the world reader: one topic per screen at noindex addresses,
    Your world, trails, the Save star, six cards, the guard on outside links;
  - PR C (willgibs/dorkhub#15, 09ce8e8): the front page: today's pages below the composer as
    cards that peek above the fold, with a still map of where they lead (Your world for a
    reader); the cards come from `/feed.json`; the seeds name their kind.
- **Production today:** no gateway credits, so typed topics pause and seeds open free. Logs clean.
- **Article page design:** still in progress with Will. The 12 seeds are demo placeholders
  meanwhile and can be tweaked as needed (rerun `node scripts/seeds.mjs feed` after a change).

## Blocked on Will
- The article page design (his direction next).
- The 32 new topics: on hold until that design is final, then only on his go.
- AI Gateway credits; connecting Redis (his click); old resources, repo visibility and Pro
  pricing (backlog §0).

## Next
1. The article page design, with Will.
2. Runtime Cache across production deploys: confirm once credits land (a branch's previews keep
   their pages across deploys).
3. Later, each on Will's go: the 32 topics, a durable store, one write per page in flight, graph
   keyboard navigation, re-recording the three mock pages that say "your path".

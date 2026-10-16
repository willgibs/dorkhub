# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-16)
- **Live on dorkhub.com**, each merged after Will's look at its preview and checked on production:
  - PR A (willgibs/dorkhub#13) pages written for their topic; PR B (willgibs/dorkhub#14) the
    world reader; PR D (willgibs/dorkhub#16) every map drawn like an instrument, not glow;
  - PR F (willgibs/dorkhub#18, 3bcb43b): the reading page calmer: one centred column (asides,
    facts and the picture under their paragraph), one rhythm in the top bar, no rail;
  - PR E (willgibs/dorkhub#17, d694248): the front page by hand (`lib/front.js`), replacing PR C's
    feed: 13 cards each drawn its own way, leading into its 33 topics; a map of their threads;
    suggestions from them. Review page with screenshots: claude.ai/artifact/VN7fYsuKtckwLHtDZoxQiM.
- **Up for Will's look: PR G, the cards finished** (branch `experience/cards-finished`): every card
  redrawn with its own material and one entrance story when first seen, a phone version of each
  wide drawing, new sizes (Black holes tall, Pompeii square, Time travel wide), a new hero photo
  where the red shows above the green, and the cards' styles moved to `/front.css`. Verify (107)
  and e2e (46) green. Merge after his look, then the production check.
- **The 32 as placeholders** (Will, 2026-10-15): each of the front page's topics not written yet
  opens a placeholder (`lib/placeholder.js`) at its own address, free and instant, shaped like a
  page, claiming only what `lib/front.js` has checked and linking along the threads. A written
  page in `lib/seeds` replaces one with no other change; a stored one gives way when reopened.
  The writer's brief for each: `node scripts/seeds.mjs brief "<title>"`.
- **One door list**, `DOORS` in `lib/front.js`: the front page's 33 topics, then the 11 pages
  written before them. Surprise me and a paused page's doors draw on all of them.
- **Production today:** no gateway credits, so typed topics pause; the front page's topics and
  the earlier pages open free. Logs clean. The article page design is in progress with Will.

## Blocked on Will
- The article page design (his direction next).
- Writing the 32 (and rewriting Bioluminescence): on hold until that design is final, then only
  on his go (about 8 to 10M tokens). Then settle Mona Lisa's and Fingerprints' pictures.
- AI Gateway credits; connecting Redis (his click); old resources, repo visibility and Pro
  pricing (backlog §0).

## Next
1. Will's look at PR G's preview; then his next priority (the article page design continues from PR F).
2. Runtime Cache across production deploys: confirm once credits land.
3. Later, each on Will's go: PR E's tweaks, writing the 32, a durable store, one write per page
   in flight, graph keyboard navigation, re-recording the three mock pages that say "your path".

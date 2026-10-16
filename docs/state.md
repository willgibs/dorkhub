# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-16)
- **Live on dorkhub.com**, each merged after Will's look at its preview and checked on production:
  - PR A (willgibs/dorkhub#13) pages written for their topic; PR B (willgibs/dorkhub#14) the
    world reader; PR D (willgibs/dorkhub#16) every map drawn like an instrument, not glow;
  - PR F (willgibs/dorkhub#18, 3bcb43b): the reading page calmer: one centred column, one rhythm
    in the top bar, no rail;
  - PR E (willgibs/dorkhub#17, d694248): the front page by hand (`lib/front.js`): 13 cards leading
    into its 33 topics, a map of their threads, suggestions from them;
  - PR G (willgibs/dorkhub#19, 3f5cefd): the cards finished, styles in `/front.css`.
- **Up for Will's look: PR H, the drawing leads** (branch `experience/cards-visual`). Every card
  is its drawing, edge to edge, with only its kind and title; one card plays at a time as you
  scroll; Black holes is the hero (ray-traced as Luminet drew one), Northern lights tall; Origami,
  Atlantis, Magnets and Lightning take the cards of Volcanoes, Time travel, Quicksand and Dreams
  (all still among the 33). Verify (108 tests) and e2e (46 steps) green. Details in decisions.
- **The 32 as placeholders** (Will, 2026-10-15): each front-page topic not written yet opens a
  placeholder (`lib/placeholder.js`) at its own address, free and instant, claiming only what
  `lib/front.js` has checked. The writer's brief: `node scripts/seeds.mjs brief "<title>"`.
- **One door list**, `DOORS` in `lib/front.js`: the front page's 33 topics, then the 11 pages
  written before them. Surprise me and a paused page's doors draw on all of them.
- **Production today:** no gateway credits, so typed topics pause; the front page's topics and
  the earlier pages open free. Logs clean. The article page design is in progress with Will.

## Blocked on Will
- PR H: his look at the preview, then merge and the production check.
- The article page design (his direction next).
- Writing the 32 (and rewriting Bioluminescence): on hold until that design is final, then only
  on his go (about 8 to 10M tokens). Then settle Mona Lisa's and Fingerprints' pictures.
- AI Gateway credits; connecting Redis (his click); old resources, repo visibility and Pro
  pricing (backlog §0).

## Next
1. Will's notes on PR H; the article page design continues from PR F.
2. Runtime Cache across production deploys: confirm once credits land.
3. Later, each on Will's go: a card swap from the runners-up (Diamonds, Supernovas, Apollo 11,
   Stonehenge), writing the 32, a durable store, one write per page in flight, graph keyboard
   navigation, re-recording the three mock pages that say "your path".

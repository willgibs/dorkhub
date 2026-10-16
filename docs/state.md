# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-16)
- **Live on dorkhub.com**, each merged after Will's look at its preview and checked on production:
  - willgibs/dorkhub#13 pages written for their topic; #14 the world reader; #16 maps drawn like
    instruments; #18 the reading page calmer (one column, one rhythm in the top bar);
  - willgibs/dorkhub#17 (d694248) the front page by hand (`lib/front.js`): 13 cards leading into
    its 33 topics, a map of their threads, suggestions from them; #19 (3f5cefd) the cards finished;
  - willgibs/dorkhub#20 (857dfcf) the drawing leads: every card is its drawing with only its kind
    and title, and one plays at a time as you scroll (`stage` in `13-landing.js`). Black holes is
    the hero; Origami, Atlantis, Magnets and Lightning took the cards of Volcanoes, Time travel,
    Quicksand and Dreams (all still among the 33); #21 (8fdd424) numbers read whole to screen readers.
- **The 32 as placeholders** (Will, 2026-10-15): each front-page topic not written yet opens a
  placeholder (`lib/placeholder.js`) at its own address, free and instant, claiming only what
  `lib/front.js` has checked. The writer's brief: `node scripts/seeds.mjs brief "<title>"`.
- **One door list**, `DOORS` in `lib/front.js`: the front page's 33 topics, then the 11 pages
  written before them. Surprise me and a paused page's doors draw on all of them.
- **Production today:** no gateway credits, so typed topics pause; the front page's topics and
  the earlier pages open free. Logs clean. The article page design is in progress with Will.

## Open
- A brisk scroll passes some cards before their turn; they play when scrolled back to. Calm over
  completeness for now; Will may want every card to get a turn (shorter turns when several wait).

## Blocked on Will
- The article page design (his direction next).
- Writing the 32 (and rewriting Bioluminescence): on hold until that design is final, then only
  on his go (about 8 to 10M tokens). Then settle Mona Lisa's and Fingerprints' pictures.
- AI Gateway credits; connecting Redis (his click); old resources, repo visibility, Pro pricing (§0).

## Next
1. The article page design continues from PR F, on Will's direction.
2. Runtime Cache across production deploys: confirm once credits land.
3. Later, each on Will's go: a card swap from the runners-up (Diamonds, Supernovas, Apollo 11,
   Stonehenge), writing the 32, a durable store, one write per page in flight, graph keyboard
   navigation, re-recording the three mock pages that say "your path".

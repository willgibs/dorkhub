# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-15)
- **Live on dorkhub.com**, each merged after Will's look at its preview and checked on production:
  - PR A (willgibs/dorkhub#13): pages written for their topic, format v3, free repeats;
  - PR B (willgibs/dorkhub#14): the world reader: one topic per screen at noindex addresses,
    Your world, trails, the Save star, six cards, the guard on outside links;
  - PR C (willgibs/dorkhub#15): the front page: today's pages below the composer as cards that
    peek above the fold, with a still map of where they lead (Your world for a reader).
- **Up for Will's look** (review page with screenshots: claude.ai/artifact/VN7fYsuKtckwLHtDZoxQiM):
  - PR D (willgibs/dorkhub#16, `experience/map-redrawn`): every map drawn like an instrument,
    not glow, plus a fix (a map whose layout had settled stopped on its first, empty frame).
    Verify and e2e green. Merges on his word, then a production check.
  - PR E (willgibs/dorkhub#17, a draft on PR D): the front page by hand (`lib/front.js`): 13
    cards each drawn its own way, leading into the 32 planned topics; a map of their threads;
    suggestions from them. Ships with the 32 pages; production keeps PR C's page until then.
- **Production today:** no gateway credits, so typed topics pause and seeds open free.
- **Article page design:** still in progress with Will. The 12 seeds are demo placeholders
  meanwhile and can be tweaked as needed (on main, rerun `node scripts/seeds.mjs feed` after).

## Blocked on Will
- PR D: his look, then merge. PR E: his reactions to the cards and their copy.
- The article page design (his direction next).
- The 32 new topics: on hold until that design is final, then only on his go. Each page's
  brief carries its PR E card's hook, so the page covers what the card promises.
- AI Gateway credits; connecting Redis (his click); old resources, repo visibility and Pro
  pricing (backlog §0).

## Next
1. On Will's word: re-run verify and e2e, merge PR D, check production (/world, the sidebar,
   clean logs). GitHub then retargets PR E to main.
2. PR E: fold in Will's notes; it stays a draft until the 32 pages exist.
3. The article page design, with Will.
4. Runtime Cache across production deploys: confirm once credits land.
5. Later, each on Will's go: the 32 topics, a durable store, one write per page in flight, graph
   keyboard navigation, re-recording the three mock pages that say "your path".

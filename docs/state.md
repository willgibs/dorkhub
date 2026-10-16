# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-15)
- **Live on dorkhub.com**, each merged after Will's look at its preview and checked on production:
  - PR A (willgibs/dorkhub#13): pages written for their topic, format v3, free repeats;
  - PR B (willgibs/dorkhub#14): the world reader: one topic per screen at noindex addresses,
    Your world, trails, the Save star, six cards, the guard on outside links;
  - PR C (willgibs/dorkhub#15): the front page: today's pages below the composer as cards that
    peek above the fold, with a still map of where they lead (Your world for a reader);
  - PR D (willgibs/dorkhub#16, 13e1ff5): every map drawn like an instrument, not glow (Your
    world, the sidebar, the front page), with the fix for maps that stopped on an empty frame.
- **Up for Will's look:** PR F (willgibs/dorkhub#18, `experience/reading-calm`), the reading page
  calmer: one centred column (asides, facts and the picture under their paragraph), one rhythm
  in the top bar, no rail (the sidebar's toggle sits before the wordmark). Verify and e2e green.
  Review page: claude.ai/artifact/1wGjZPsEXkC22gYQPrYgAp. Merges on his word.
- **Approved, kept on its branch:** PR E (willgibs/dorkhub#17, a draft), the front page by hand
  (`lib/front.js`): 13 cards each drawn its own way, leading into the 32 planned topics; a map
  of their threads; suggestions from them. Will approved it; it stays branched until the 32
  pages exist (production keeps PR C's page), and gets rebased onto main before it ships.
  Review page with screenshots: claude.ai/artifact/VN7fYsuKtckwLHtDZoxQiM.
- **Production today:** no gateway credits, so typed topics pause and seeds open free. Logs clean.
- **Article page design:** still in progress with Will. The 12 seeds are demo placeholders
  meanwhile and can be tweaked as needed (on main, rerun `node scripts/seeds.mjs feed` after).

## Blocked on Will
- The article page design (his direction next).
- The 32 new topics: on hold until that design is final, then only on his go. Each page's
  brief carries its PR E card's hook, so the page covers what the card promises.
- AI Gateway credits; connecting Redis (his click); old resources, repo visibility and Pro
  pricing (backlog §0).

## Next
1. PR F: Will's look, then merge and a production check; then rebase PR E onto it (both touch
   `lib/picture.js` `WIDTHS` and the top bar's CSS).
2. Runtime Cache across production deploys: confirm once credits land.
3. Later, each on Will's go: PR E's tweaks and its rebase, the 32 topics, a durable store, one write per page in flight, graph
   keyboard navigation, re-recording the three mock pages that say "your path".

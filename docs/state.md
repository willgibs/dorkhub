# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-15)
- **Live on dorkhub.com:** PR A (willgibs/dorkhub#13, pages written for their topic, format v3)
  and PR B (willgibs/dorkhub#14, the world reader, merged as f3e28ea after Will's look):
  - one topic per screen at clean, guarded addresses (`/black-holes`, `/world`, `/connect/a/b`);
  - Your world at `/world` and beside each page, with Replay, Focus, find, filters and a picture;
  - the kind as the page's colour, six "keep exploring" cards, the Save star, trails instead of
    the path, the phone's "…" menu and tools button;
  - rabbit holes move in to `dorkhub:world:v1`.
- **Checked on production:** topic addresses say noindex and robots.txt allows only `/`; a
  pre-written topic opens from an outside link, an unwritten one waits for "Write this page";
  prefetch misses return 204; an old store moves in; the logs show no warnings or errors.
- **Production today:** no gateway credits, so typed topics pause and seeds open free.
- **Known gap:** today's 12 seeds predate v3. Opened straight from an address they show no kind
  (default blue, no label) and four cards. The content step replaces them.
- **Parked:** `experience/new-doors` (heading sizes, the "A topic, question, or idea…"
  placeholder) folds into PR C.

## Blocked on Will
- AI Gateway credits; connecting Redis (his click); old resources, repo visibility and Pro
  pricing (backlog §0).
- The 32 topics are written only on his go (he has now seen PR B).

## Next
1. PR C, the homepage: the hero with more room, teaser cards above the fold, a living feed of
   pre-written topics and their constellation (Your world's engine); preview for Will's look.
2. The content step on Will's go: the 32 topics plus Bioluminescence; the feed then switches over.
3. Runtime Cache across production deploys: confirm once credits land (a branch's previews keep
   their pages across deploys).
4. Later, each on Will's go: a durable store, one write per page in flight, graph keyboard
   navigation, re-recording the three mock pages that say "your path".

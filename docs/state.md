# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-15)
- **Live:** `main` is 7e55679, with PR A of Will's "world of topics, not a tunnel" plan
  (willgibs/dorkhub#13, merged after his look):
  - pages are written for their topic, and exact repeats come from cache, free even when the
    trial is over or paused;
  - format v3 (the kind on the title line, six equal cards, standalone questions);
  - private same-voice rewrites, and `cachedOnly` for prefetch;
  - seeds served by topic from any page.
  - Checked on dorkhub.com: seeds free (including from a link), a prefetch miss 204, a typed
    topic paused with `pages=10`, logs clean apart from the known "no gateway credits" error.
- **In progress: PR B, the world reader** (`docs/backlog.md` §2, plan in `docs/decisions.md`):
  one topic per screen at guarded clean links, six "keep exploring" cards, the Save star,
  Your world, the phone's "…" menu, prefetch, and the store migration.
- **Production today:** with no gateway credits, every typed topic pauses, and the card offers
  free pre-written pages.
- **Parked:** `experience/new-doors` (heading sizes, the "A topic, question, or idea…"
  placeholder) folds into PR C.

## Blocked on Will
- AI Gateway credits; connecting Redis (his click); old resources, repo visibility and Pro
  pricing (backlog §0).
- The 32 topics are written only on his go, after he has seen PR B.

## Next
1. PR B to a preview, with frame-by-frame review pages for Will.
2. On PR B's first preview: open "Sea butterflies", written on PR A's preview. A hit means
   Runtime Cache survives a new deployment, so reuse can be relied on across deploys.
3. PR C, the homepage; then the content step on Will's go.

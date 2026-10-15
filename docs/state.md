# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-15, end of session)
- **Live:** `main` is f2d0c7f: the polish pass (#8), the phone tools above toasts (#9),
  Inter everywhere (#10, #11) and Will's landing notes (#12), each after his look.
- **Will's new direction** (plan approved; the calls are in `docs/decisions.md`): a world of
  topics, not a tunnel. PR A, then B (the world reader), then C (the homepage), then the
  32 new topics on his explicit go.
- **PR A, pages written for the topic, is up for Will's look** (branch `experience/topic-pages`):
  - format v3: the kind on the title line, six equal cards, standalone questions, no bridge
    and no single next page; the recordings and mock converted by script, no model;
  - a page cache by topic (`pageId` in `src/shared/world.js`), with the model and prompt
    version in the key and the deployment in its namespace;
  - seeds and repeats free before the trial gate, private rewrites, and `cachedOnly` for
    PR B's prefetch;
  - seeds served by topic to every reader, including from links on any page.
  - Verify (77 tests) and e2e (36 steps, including a phone repeat opening free) are green.
- **What a reader would notice:** six rows under "Branches" in place of the next page plus
  five; on new pages, no "where it starts" line. Production writes nothing live (no credits),
  so its seeds look as they do today.
- **Parked:** `experience/new-doors` (the heading sizes and the "A topic, question, or idea…"
  placeholder) folds into PR C.

## Blocked on Will
- His look at PR A's preview, then merge.
- AI Gateway credits; connecting Redis (his click); old resources, repo visibility and Pro
  pricing (backlog §0).
- The 32 topics are written only on his go, after he has seen PR B.

## Next
1. After PR A merges, check production: a seed serves with `x-dh-cache: seed`, and a typed
   topic still pauses cleanly. Before relying on reuse, check that Runtime Cache survives a
   redeploy.
2. PR B, the world reader (`docs/backlog.md` §2), with frame-by-frame review pages for Will.

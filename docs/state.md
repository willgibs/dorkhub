# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-14, handoff at the end of a session)
- **Live:** `main` (v1 + self-hosted fonts). No AI Gateway credits, so live pages say
  "Free pages are paused". Trial counters run on the Runtime Cache; no Redis yet.
- **In review:** PR willgibs/dorkhub#3, branch `experience/v2` (checked out here), preview
  https://dorkhub-git-experience-v2-willgibs.vercel.app (Will's Vercel login; previews
  replay `lib/recorded.js`). It holds page v2 (format, nine panels, pictures, page-500
  cleanup) and the 12 landing doors in `lib/seeds`: written by Opus, fact-checked, served
  free (`x-dh-cache: seed`). Verify (67 tests) and e2e were green at 01d7674; later
  commits touch only docs and `scripts/seeds.mjs`.
- **Will's review of #3** (2026-10-14), item by item; details in `docs/backlog.md`:
  1. Panels: the right types, but they need polish to feel beautiful, not generic. Merge
     first or polish first, either is fine with him.
  2. The transitions.dev skills are installed, Pro included (`~/.claude/skills/transitions-*`).
  3. Still no credits. Should we set up Redis now? Our answer: yes (§0).
  4. Landing hero: the H1 is too loud, the entry feels disguised, and the demo card reads
     as site UI instead of a demo visual (§2).
  5. Agree the door list before any more seeds, and is layer 2 worth it? Our advice: stop
     at the doors for now (§2). No seed writing until he decides.
  6. Factual errors in a knowledge tool are "very, very bad": accuracy is the first bar
     (decisions; §2 Accuracy).
  7. He likes the polish so far and wants the transitions.dev ideas to land.

## Blocked on Will
- AI Gateway credits; connecting Redis; the door list and layer 2; then old resources,
  repo visibility and Pro pricing (`docs/backlog.md` §0).

## Next
1. Merge #3 after `npm run verify` and `npm run e2e` pass, then check production: the
   landing, the CSP, a door served free, any other page still "paused".
2. Bring Will a door-list proposal (criteria in §2) and the accuracy plan.
3. Landing hero, then panel polish, on new branches with the transitions.dev skills;
   send preview links with phone and desktop shots.
4. Once credits land: prove production (§1), swap the stand-ins for live pages, measure.

Access, accounts and working with Will: `CLAUDE.md`. Seeds: `scripts/seeds.mjs`.

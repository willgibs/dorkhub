# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-15, end of session)
- **Live:** `main` (ccff65c) is v2 with the new hero and reading page (PRs willgibs/dorkhub#6
  and willgibs/dorkhub#7), checked on dorkhub.com after the merge.
- **In review: the polish pass**, PR willgibs/dorkhub#8 (branch `experience/polish`).
  - Preview: https://dorkhub-git-experience-polish-willgibs.vercel.app (needs Will's login).
  - Before and after: https://claude.ai/artifact/7XnVHxLSVNMgxVS8BXMpQk
  - What's in it:
    - all motion on the token scale, with closes quicker than opens;
    - a paused page that offers three free pages written ahead of time;
    - failed pages that show their status first, with no ask row, reactions or tools;
    - icon-closed sheets over a blurred backdrop;
    - a scrim for the phone's tools and a styled phone voice sheet;
    - the 404 in the identity.
  - Verify (69 tests) and e2e are green; e2e now covers the paused page and the phone voice
    sheet. Checked on the preview in Will's Chrome: the door page, the help sheet and its
    150 ms close.
  - Merge only after Will's look.
- **Production today:** every typed topic gets the paused card, because the gateway has no
  credits. Once #8 merges, that card offers free door pages instead of a dead end.
- **Will's standing call:** grounding, and every model, prompt, fact or performance test,
  waits until the base product settles (`docs/decisions.md`).

## Blocked on Will
- Looking at #8, and merging it.
- AI Gateway credits; connecting Redis (his click); the door list
  (https://claude.ai/artifact/5XpimaCDzuomV5a8V7Aji4).
- For the next prompt round: renaming the recap's "Where to dig next" heading (the brand rule).
- Old resources, repo visibility and Pro pricing (backlog §0).

## Next
1. Act on Will's notes on #8, then merge it and check production.
2. When he picks the doors: write and source-check each one (`scripts/seeds.mjs`), then update
   `DOORS` and `CHAINS`.
3. Once credits land: prove production (backlog §1), and check the orbs and picture reveal
   on live timings.

Access, accounts and working with Will: `CLAUDE.md`. Seeds: `scripts/seeds.mjs`.

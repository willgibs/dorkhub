# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-15, end of session)
- **Live:** `main` is 6fc9c22, which adds the polish pass (PR willgibs/dorkhub#8) on top of the
  v2 hero and reading page (#6, #7). Will looked at the preview and said merge; verify
  (69 tests) and e2e passed on the branch tip.
  - What's in it:
    - all motion on the token scale, with closes quicker than opens;
    - a paused page that offers three free pages written ahead of time;
    - failed pages with their status first and no ask row, reactions or tools;
    - icon-closed sheets over a blurred backdrop;
    - a phone scrim and voice sheet;
    - the 404 in the identity.
  - Before and after: https://claude.ai/artifact/7XnVHxLSVNMgxVS8BXMpQk
- **Checked on dorkhub.com:**
  - a typed topic gets the paused card, and its write came back 503 with `pages=10`;
  - its first door opened free from seeds;
  - the sheets, the scrim, Continue and the new 404 all behave as on the preview.
  - The function logs show only the known "no gateway credits" error, from these checks.
- **Production today:** with no gateway credits, every typed topic still pauses, but now it
  offers free door pages instead of a dead end.
- **Will's standing call:** grounding, and every model, prompt, fact or performance test,
  waits until the base product settles (`docs/decisions.md`).

## Blocked on Will
- AI Gateway credits; connecting Redis (his click); the door list
  (https://claude.ai/artifact/5XpimaCDzuomV5a8V7Aji4).
- For the next prompt round: renaming the recap's "Where to dig next" heading (the brand rule).
- Old resources, repo visibility and Pro pricing (backlog §0).

## Next
1. If Will wants it: lift the open phone tools above toasts, so the one-time Tip toast can't
   cover the droplets (a one-line fix, through a preview).
2. When he picks the doors: write and source-check each one (`scripts/seeds.mjs`), then update
   `DOORS` and `CHAINS`.
3. Once credits land: prove production (backlog §1); check the orbs and pictures on live timings.

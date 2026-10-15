# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-15, end of session)
- **Live:** `main` is 2b9a7af, and Will looked at every preview before it merged:
  - the polish pass (PR willgibs/dorkhub#8): one motion scale, a paused page with free doors,
    calm failed pages, icon-closed sheets, a phone scrim and voice sheet, the 404 in the
    identity. Shots: https://claude.ai/artifact/7XnVHxLSVNMgxVS8BXMpQk
  - his landing notes (#10):
    - Inter for the interface, with Literata kept for article text (his call);
    - a wordmark-only nav and plain preset chips;
    - How it works before Where rabbit holes go, and chains of familiar names.
  - the open phone tools above toasts (#9). Shots for #9 and #10:
    https://claude.ai/artifact/ESExHbGpi2R97bkWDJhVpg
  - Verify (69 tests) and e2e passed on each merged tree.
- **Checked on dorkhub.com after the merges:**
  - Inter, Doto and Literata load;
  - a chain opens its door page free;
  - a typed topic pauses with `pages=10` and plain chips;
  - the phone tools sit above a live toast;
  - the 404 and licences name Inter.
  - The function logs show only the known "no gateway credits" error, from these checks.
- **Production today:** with no gateway credits, every typed topic pauses, and the card offers
  free door pages.
- **Will's standing call:** grounding, and every model, prompt, fact or performance test,
  waits until the base product settles (`docs/decisions.md`).

## Blocked on Will
- AI Gateway credits; connecting Redis (his click); the door list
  (https://claude.ai/artifact/5XpimaCDzuomV5a8V7Aji4). The chains start at today's doors.
- For the next prompt round: renaming the recap's "Where to dig next" heading (the brand rule).
- Old resources, repo visibility and Pro pricing (backlog §0).

## Next
1. When he picks the doors: write and source-check each one (`scripts/seeds.mjs`), then update
   `DOORS` and `CHAINS` (each chain must start at a door).
2. Once credits land: prove production (backlog §1); check the orbs and pictures on live timings.

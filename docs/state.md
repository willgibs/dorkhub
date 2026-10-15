# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-15, end of session)
- **Live:** `main` is v2 with the new hero and reading page. Will looked at both previews,
  and they merged after verify (69 tests) and e2e passed on the combined tree, which `main`
  matches exactly:
  - PR willgibs/dorkhub#6 (ff29739): "What do you want to learn?" above one composer with
    the border beam, Surprise me, shuffling presets, and one fine note at the bottom;
  - PR willgibs/dorkhub#7 (425724e): thinking orbs, pictures that resolve out of dots, the gooey
    tools button on phones, and the new surfaces.
  - Shots: https://claude.ai/artifact/8nqFKG8iUwG7HwjqcfbDTJ
- **Checked on dorkhub.com:**
  - the hero and beam, with our fonts and no CSP errors;
  - the dice opens an unseen door free from seeds, with its orb, picture reveal and fine note;
  - a live page says "Free pages are paused" with nothing spent (`pages=10`);
  - the phone tools button opens the map, and `/licenses.txt` serves.
  The function logs show only the known "no gateway credits" error. Counters are still on
  the Runtime Cache.
- **Will's call today:** grounding, and every model, prompt, fact or performance test, waits
  until the base product settles (`docs/decisions.md`).
- **Access:** libraries.dev is blocked on this Mac's network; read it in Will's Chrome (Claude
  in Chrome), where transitions.dev Pro is signed in too.

## Blocked on Will
- AI Gateway credits; connecting Redis (his click); the door list
  (https://claude.ai/artifact/5XpimaCDzuomV5a8V7Aji4).
- Old resources, repo visibility and Pro pricing (backlog §0).

## Next
1. Act on any notes Will has on the live hero and reading page.
2. When he picks the doors: write and source-check each one (`scripts/seeds.mjs`), then update
   `DOORS` and `CHAINS`.
3. Once credits land: prove production (backlog §1), swap the stand-ins for live pages, and
   check the orbs and picture reveal on live timings.

Access, accounts and working with Will: `CLAUDE.md`. Seeds: `scripts/seeds.mjs`.

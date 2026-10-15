# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-14, end of session)
- **Live:** `main` is v2 plus the landing hero (PR willgibs/dorkhub#4) and the panel polish
  (PR willgibs/dorkhub#5). Will looked at both previews; they were merged as 39dc61b and
  6de47d1 after verify and e2e passed on the combined tree. Checked on dorkhub.com:
  - the new hero, with no CSP errors and self-hosted fonts;
  - the dice opens a door that wasn't on screen, pre-written, with nothing spent;
  - door pages show the new panel frame;
  - every other page says "Free pages are paused" (`503 trial_paused`, nothing spent)
    until AI Gateway has credits.
  Counters are on the Runtime Cache; no Redis yet.
- Before/after shots of the hero and panels: https://claude.ai/artifact/BZM4ArEEgNVq8GKftjzxTN
- **Sent to Will to decide:**
  - Door list: https://claude.ai/artifact/5XpimaCDzuomV5a8V7Aji4. One door per field: keep
    six, add six (art, music, language, maths, the mind, the body). Retired pages join the
    dice, except the Great Emu War, whose lead picture is a dead emu. Numbered so he can
    reply by number. No seeds until he picks.
  - Accuracy plan (backlog §2): test Wikipedia grounding for live pages on stand-ins, with
    and without, before any prompt change.
- Claude in Chrome was not connected this session, so the function logs weren't read.

## Blocked on Will
- AI Gateway credits; connecting Redis (our answer: yes, his click); the door list; the
  grounding test (a proposed session); then old resources, repo visibility and Pro pricing
  (backlog §0).

## Next
1. Once he picks the doors: write and fully source-check each new one (`scripts/seeds.mjs`),
   then update `DOORS` and `CHAINS` in `src/app/13-landing.js` (each chain starts at a door).
2. If he says go: the grounding test (backlog §2, Accuracy).
3. Once credits land: prove production (§1), swap the stand-ins for live pages, measure.

Access, accounts and working with Will: `CLAUDE.md`. Seeds: `scripts/seeds.mjs`.

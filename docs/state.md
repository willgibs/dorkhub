# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-14, end of session)
- **Live:** `main` is v2 (PR willgibs/dorkhub#3, merged as 694ffc2). Checked on dorkhub.com:
  CSP and self-hosted fonts are fine. The 12 doors are served free from `lib/seeds` with
  their pictures. Every other page says "Free pages are paused" (`503 trial_paused`, nothing
  spent) until AI Gateway has credits. Counters are on the Runtime Cache; no Redis yet.
- **Drafts waiting for Will's look** (both pass verify and e2e, and merge cleanly together):
  - PR willgibs/dorkhub#4, `experience/hero`: the hero after his three notes; Surprise me
    opens only pre-written doors; the `.seed` class fix.
    https://dorkhub-git-experience-hero-willgibs.vercel.app
  - PR willgibs/dorkhub#5, `experience/panels`: all nine panels; the build now compiles the
    page script. https://dorkhub-git-experience-panels-willgibs.vercel.app
  - Before/after shots of both: https://claude.ai/artifact/BZM4ArEEgNVq8GKftjzxTN
- **Sent to Will to decide:**
  - Door list: https://claude.ai/artifact/5XpimaCDzuomV5a8V7Aji4. One door per field: keep
    six, add six (art, music, language, maths, the mind, the body). Retired pages join the
    dice, except the Great Emu War, whose lead picture is a dead emu. Numbered so he can
    reply by number. No seeds until he picks.
  - Accuracy plan (backlog §2): test Wikipedia grounding for live pages on stand-ins, with
    and without, before any prompt change.
- Claude in Chrome was not connected this session, so the previews and the function logs
  weren't viewed; previews build green on Vercel.

## Blocked on Will
- His look at #4 and #5; AI Gateway credits; connecting Redis (our answer: yes, his
  click); the door list; then old resources, repo visibility and Pro pricing (backlog §0).

## Next
1. Address Will's notes on #4 and #5, merge (green gates first), check production.
2. Once he picks the doors: write and fully source-check each new one (`scripts/seeds.mjs`),
   then update `DOORS` and `CHAINS` in `src/app/13-landing.js` (each chain starts at a door).
3. If he says go: the grounding test (backlog §2, Accuracy).
4. Once credits land: prove production (§1), swap the stand-ins for live pages, measure.

Access, accounts and working with Will: `CLAUDE.md`. Seeds: `scripts/seeds.mjs`.

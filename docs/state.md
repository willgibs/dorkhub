# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-15, end of session)
- **Live:** `main` is v2 with the hero (PR willgibs/dorkhub#4) and the panels
  (PR willgibs/dorkhub#5). Production is unchanged today: free pages say "paused" until AI
  Gateway has credits, and the counters are on the Runtime Cache.
- **In review (Will's look before merging):**
  - PR willgibs/dorkhub#6, hero v2 (https://dorkhub-f9hvt6ppy-willgibs.vercel.app):
    "What do you want to learn?" above one composer with libraries.dev's border beam; voice
    and key inside it; send is Surprise me until something is typed; presets shuffle; what you
    type morphs into the title. "Get lost learning." moves down with the demo, and one fine
    note at the bottom of the stream says pages can make mistakes.
  - PR willgibs/dorkhub#7, the reading page, stacked on #6
    (https://dorkhub-l25szdeo4-willgibs.vercel.app): thinking orbs during real waits (tested
    against the library's golden vectors), Wikipedia pictures that resolve out of dots, a gooey
    tools button on phones, and the new surfaces.
  - Shots of both: https://claude.ai/artifact/8nqFKG8iUwG7HwjqcfbDTJ. Both pass verify
    (69 tests) and e2e, and add 53 KB raw together (budget 60 KB), with no new requests.
- **Will's call today:** grounding, and every model, prompt, fact or performance test, waits
  until the base product settles (`docs/decisions.md`, in #6).
- **Access:** libraries.dev is blocked on this Mac's network; read it in Will's Chrome (Claude
  in Chrome), where transitions.dev Pro is signed in too.

## Blocked on Will
- His look at #6 and #7; AI Gateway credits; connecting Redis (his click).
- The door list (https://claude.ai/artifact/5XpimaCDzuomV5a8V7Aji4); old resources, repo
  visibility and Pro pricing (backlog §0).

## Next
1. When he approves: merge #6, then #7 (it retargets to `main`); check production (the beam,
   a door page's picture reveal, the orbs, the phone button).
2. Act on his notes on the previews.
3. When he picks the doors: write and source-check each one (`scripts/seeds.mjs`), then update
   `DOORS` and `CHAINS`.
4. Once credits land: prove production (backlog §1), swap the stand-ins for live pages, and
   check the orbs and picture reveal on live timings.

Access, accounts and working with Will: `CLAUDE.md`. Seeds: `scripts/seeds.mjs`.

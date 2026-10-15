# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-15, end of session)
- **Live:** `main` is v2 with the hero (PR willgibs/dorkhub#4) and the panels
  (PR willgibs/dorkhub#5). Production is unchanged today. Free pages still say "paused"
  until AI Gateway has credits, and the counters are on the Runtime Cache.
- **In review (Will's look before merging):**
  - PR willgibs/dorkhub#6, hero v2 (preview https://dorkhub-f9hvt6ppy-willgibs.vercel.app):
    - "What do you want to learn?" above one composer, with libraries.dev's border beam
      ported to CSS;
    - voice and key inside the composer, and send is Surprise me until something is typed;
    - presets that shuffle, and what you type morphs into the page title;
    - "Get lost learning." moves down to a section with the demo;
    - one fine note at the bottom of the stream: pages can make mistakes.
  - PR willgibs/dorkhub#7, the reading page, stacked on #6 (preview
    https://dorkhub-l25szdeo4-willgibs.vercel.app):
    - thinking orbs during real waits, ported and tested against the library's golden vectors;
    - Wikipedia pictures that resolve out of dots;
    - a gooey tools button on phones;
    - menus, cards and sheets on the new surfaces.
  - Shots of both: https://claude.ai/artifact/8nqFKG8iUwG7HwjqcfbDTJ
  - Both pass verify (69 tests) and e2e. Together they add 53 KB raw (budget 60 KB) and no
    new requests.
- **Will's call today:** grounding, and every model, prompt, fact or performance test, waits
  until the base product settles. It's recorded in `docs/decisions.md` in #6.
- **Access:** libraries.dev is blocked on this Mac's network. Read it in Will's Chrome (Claude in
  Chrome), where transitions.dev Pro is signed in too.

## Blocked on Will
- His look at #6 and #7.
- AI Gateway credits; connecting Redis (his click); the door list
  (https://claude.ai/artifact/5XpimaCDzuomV5a8V7Aji4).
- Old resources, repo visibility and Pro pricing (backlog §0).

## Next
1. When he approves:
   - merge #6, then #7, which retargets to `main`;
   - check production: the beam, a door page's picture reveal, the orbs, and the phone button.
2. Act on his notes on the previews.
3. When he picks the doors, write and fully source-check each new one (`scripts/seeds.mjs`), then
   update `DOORS` and `CHAINS`.
4. Once credits land, prove production (backlog §1), swap the stand-ins for live pages, and
   check the orbs and picture reveal on live timings.

Access, accounts and working with Will: `CLAUDE.md`. Seeds: `scripts/seeds.mjs`.

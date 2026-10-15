# Backlog

_Ordered by priority. **(Will)** means it needs his decision or action first: ask, don't
assume. Move finished items into `docs/decisions.md` (when a real decision was made) and
keep `docs/state.md` current._

## 0. Blocked on Will (check each one's status before planning around it)

- **AI Gateway credits.** The free tier can't call Claude Haiku 5.5, so free pages show
  "paused". You'll know it's fixed when a live write logs `{"evt":"write",…,"end":"ok"}`
  rather than `trial_paused`.
- **Upstash Redis** (free, from the Vercel Marketplace) for exact trial counts. You'll
  know it's connected when the function log shows `{"evt":"store","counters":"redis"}`.
  Will asked (2026-10-14) whether to set it up now. Our answer: yes. It's free and not needed
  while live pages are paused (pre-written pages skip the counters), but connecting it now
  lets us check the Redis counters (§5) before credits make them matter. Will connects it
  in the Vercel dashboard (an account change); then redeploy and read the log.
- **Old resources to retire:**
  - Revoke the `dorkhub-imports` gateway key.
  - Delete the 21 old git tags (they keep the old codebase public).
  - Retire the old Supabase and Sentry projects.
  - Remove the GitHub OAuth app, the fine-grained token and the `CRON_SECRET` Actions
    secret.
  - Revoke the Gemini key.
  - Remove the old sitemap in Search Console.
  - Remove the Mac backup agent.
- **Repo visibility.** It's public today, so the prompts are readable. On Hobby, making it
  private may block deploys of commits authored by an agent.
- **Pro pricing.**

## 1. Prove production (as soon as credits exist)

- A live page streams word by word on dorkhub.com (not buffered), `x-dh-trial` counts
  down, and a repeated first page comes back with `x-dh-cache: hit`.
- "Stop writing" really stops the writer: the log ends with `cancelled` and shows fewer
  output tokens.
- The 41st call to `/api/write` in a minute from one IP gets a 429, and the page says
  "Lots of readers at once."
- Measure the real cost per page and per quick tool from `{"evt":"write"}` logs, and
  record it in `docs/decisions.md`.
- Bring-your-own-key works end to end with a real key. Will types his key himself; never
  enter one.

## 2. The experience (Will's priority, before the model eval)

**Now: a world of topics, not a tunnel** (Will's direction and plan, 2026-10-15; the calls are
in `docs/decisions.md`). In order, each through a preview and Will's look:
- **PR A, pages written for the topic** (server and format, almost invisible): format v3, the
  page cache by topic, free repeats before the trial gate, private rewrites, `cachedOnly`.
- **PR B, the world reader:** one topic per screen at clean, guarded links
  (`dorkhub.com/black-holes`), six "keep exploring" cards, the Save star, Your world (the
  graph, its stats and trails, growth moments only where the graph is visible), the phone's
  "…" menu and a new gooey button, prefetch, and the store migration. Levels, the flow-in
  below and reactions go.
- **PR C, the homepage:** the hero with more room, then a living feed of pre-written topics
  that peeks above the fold. The marketing sections go. Folds in the parked heading sizes
  and placeholder from `experience/new-doors`.
- **(Will) The 32 new topics** plus Bioluminescence, written and fact-checked only on his
  explicit go after he has seen PR B (about 8 to 10M tokens).
- Later, each needing Will's go: a durable page store (Runtime Cache is best effort), one
  write per page in flight, graph keyboard navigation, re-recording the three mock pages that
  still say "your path".

Will wants the generative UI and the whole experience solid first. Judge everything
against `docs/vision.md`. v1 shipped in PR willgibs/dorkhub#1, v2 in PR willgibs/dorkhub#3
(merged 2026-10-14). From Will's review of #3:

- **The polish pass is live** (willgibs/dorkhub#8, merged 2026-10-15 as 6fc9c22 after Will's
  look): one motion scale, calm failure states (a paused page offers free pages written ahead
  of time), icon-closed sheets over a blurred backdrop, a scrim for the phone's tools, and the
  404 in the identity. Shots: https://claude.ai/artifact/7XnVHxLSVNMgxVS8BXMpQk
  - Then, live too: the open phone tools above toasts (willgibs/dorkhub#9), and Will's landing
    notes (willgibs/dorkhub#10): Inter for the interface (Literata stays for reading), a
    wordmark-only nav, plain preset chips, How it works first, and chains of familiar names.
    Shots: https://claude.ai/artifact/ESExHbGpi2R97bkWDJhVpg
  - The recap's "Where to dig next" heading is now "Where to go next" (format v3).
- **The new hero and the reading page are live** (willgibs/dorkhub#6 and willgibs/dorkhub#7,
  merged 2026-10-15 after Will's look). Shots: https://claude.ai/artifact/8nqFKG8iUwG7HwjqcfbDTJ
  - Not done: up next dripping out of the tools button, the goo's planned stretch goal (it
    docks beside the button instead).
  - Left out on purpose: libraries.dev's Voice (a mic would send readers' audio to Google or
    Apple), Metal and Bot avatars (decoration).
  - Once live pages exist: check the orbs' pacing and the picture reveal on real timings.
- **The landing hero and the panel polish are live** (PRs willgibs/dorkhub#4 and
  willgibs/dorkhub#5, merged after Will's look at the previews). For later rounds, reinstall
  the transitions.dev skills with `npx skills add Jakubantalik/transitions.dev`; for Pro,
  `npx transitions-dev login`, then `npx transitions-dev skill` (Pro licenses Will
  personally). Keep the page-500 test.
- **The door list, before any more seeds. Proposal sent 2026-10-14** (the artifact in
  `docs/state.md`), waiting for his numbers.
  - Criteria: interesting to any new visitor; a real range of fields; well documented, so
    every claim can be checked; a good Wikipedia lead picture; evergreen and not grim;
    specific, not an umbrella subject.
  - Keep: the Carrington Event, Why is ice slippery?, Whale falls, Tulip mania, Fresnel
    lenses, Umami.
  - New: Ultramarine (art), the theremin (music), Linear B (language), Benford's law (maths),
    Pareidolia (the mind), Why do we yawn? (the body). Each hook was checked against its
    Wikipedia article.
  - Off the landing: Tardigrades and the Antikythera mechanism (stock curiosities our own
    prompt bars as links), the Voynich manuscript (Linear B covers lost scripts), Kessler
    syndrome (a second space door), Bioluminescence (an umbrella subject). Their pages
    stay and join the dice.
  - The Great Emu War's Wikipedia lead picture is a dead emu, shown beside the opening, so
    it leaves the dice too unless its picture is turned off.
  - Surprise me: pre-written pages only (built in #4). Once credits land, a pool of 13 live
    topics, also in the artifact.
  - When he picks: write and fully check each new door, update `DOORS` and `CHAINS` (each
    chain starts at a door), and rebuild the index. The 12 written stay until replaced.
- **Layer 2 (pages one click off the doors) is on hold.** Our advice: stop at the doors
  for now and let credits start at the second page. A live Haiku page should cost about
  a cent (estimate; measure in §1), while each pre-written page needs a full fact-check
  (about 250–300k Claude tokens each for the doors), and all 240 would need redoing if
  the door list or the format changed. Revisit once real costs are known.
- **Accuracy** (Will: factual errors in a knowledge tool are "very, very bad"). Plan sent
  2026-10-14:
  - pre-written pages: a full source check of every number, date, name and attribution
    (done for the 12 doors, and the rule for every new one);
  - live pages: **grounding tested 2026-10-14.** 8 non-door topics; 16 Haiku stand-in pages,
    plain and with the topic's Wikipedia intro as reference notes; a blind Opus fact-check of
    1,087 claims. Wrong or disputed claims fell from 5.8% to 3.9% (32 to 21; 4.0 to 2.6 per
    page), with pages no blander. It is not significant on eight topics (p ≈ 0.14): better on 5,
    tied on 1, worse on 2. On the Ghent Altarpiece, four errors came straight from Wikipedia's
    own outdated intro.
    - Cost: about 500 extra input tokens (about $0.00005 a page), and a 113 ms median fetch
      from a Mac (cache it, and time-box it).
    - Hover hooks are the most error-prone part of a page (9% of their claims), and the notes
      don't cover them.
    - **Parked (Will, 2026-10-15).** No model, prompt, fact or performance testing until the
      base product settles, so nothing has to be tested twice. Grounding waits with the model
      eval (§3). The results above stand for when it's picked up: facts from the notes, not
      their wording; credit and link the article (CC BY-SA); tighten the hooks.
  - factual accuracy is a hard gate in the model eval (`docs/eval-plan.md`), scored by
    fact-checking a sample of real pages per model;
  - if the number-heavy panels (figures, guess, timeline) invite errors, tighten or cut
    them in the prompt;
  - the stand-ins in `lib/recorded.js` are not fact-checked; they replay only in dev,
    e2e and previews, never in production.
- **Live pages.** Re-read at least 5 live pages once credits exist, to confirm what the
  Haiku stand-ins showed. Replace the stand-ins in `lib/recorded.js` with live pages
  (`scripts/recorded.mjs`; the raw text is in the reader's localStorage).
- **Secondary UI.** Sketch, quiz, recap, thread and expand only ever showed mock output.
  Record real outputs for them, then judge their layouts.
- **Phone.** Check paragraph spacing on touch now that ¶ appears only on tap.
- **Flow and weight.** Look at latency (first word, J to next page) once live timings
  exist, and re-measure page weight after v2.

**Ideas to bring to Will** (don't build without his go):
- Shareable pages or the Hub (`docs/prototype/`).
- A Pro waitlist.
- An Open Graph image.
- Privacy-preserving page-view analytics. This would need a change to the footer's "nothing
  you read is tracked."

## 3. The model eval (after section 2; Will gives the go and approves the cost)

See `docs/eval-plan.md`.

## 4. Pro (after Will sets pricing)

- Accounts created at checkout only.
- Stripe.
- A credits ledger, with server-side entitlement that replaces the trial for subscribers.
- Bring-your-own-key stays available.

## 5. Engineering hygiene

- **Real Redis.** Verify `redisCounters` against real Upstash once it's connected; it's
  only been tested against a fake.
- **Prompt caching** for the static instructions once page v2 (instructions + prompt) is
  adopted; measure the saving.
- **Structured outputs** for the JSON tools (part of the eval).
- **`DH_SALT`.** Optional; without it the project ID is the salt.
- **Trial size on the page.** `TRIAL_PAGES` is baked into the page at build time from
  `DH_TRIAL_PAGES`. Changing that setting in Vercel needs a redeploy before the page shows
  the new number; the server enforces it immediately.

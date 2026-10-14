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

Will wants the generative UI and the whole experience solid first. Judge everything
against `docs/vision.md`. v1 shipped in PR willgibs/dorkhub#1; v2 is PR willgibs/dorkhub#3.
From Will's review of #3 (2026-10-14):

- **Merge #3.** Will: "Can rework then merge, or merge then circle back." Our pick: merge
  once verify and e2e are green, check production, then polish on new branches.
- **Landing hero.** The landing's one job is getting a visitor to their first page. Will:
  - the H1 ("Get lost learning.") is too loud;
  - the entry (the input and "Start reading") feels a bit disguised;
  - the demo card "feels like page UI instead of what it is: a visual". It shows the
    product well, but should present as a demo, not as part of the site.
- **Panel polish.** The types are right, but they need refinement "to feel beautiful
  instead of generic". Use the transitions.dev skills (in `~/.claude/skills`; reinstall
  with `npx skills add Jakubantalik/transitions.dev`, and for Pro `npx transitions-dev
  login`, then `npx transitions-dev skill`; Pro licenses Will personally). The README
  names recorded pages that show off the panels. Keep the page-500 test.
- **The door list, before any more seeds.** Will wants this plan right before more pages
  are written. Bring him a proposal (12 doors plus the "Surprise me" topics, each with a
  reason) and wait for his approval. Criteria: interesting to any new visitor; a real
  range of fields (today's 12 lean on space and biology, with nothing on art, music,
  language, maths, the body or the mind); well documented, so every claim can be checked;
  a good Wikipedia lead picture; evergreen and not grim. The 12 written stay until
  replaced.
- **Layer 2 (pages one click off the doors) is on hold.** Our advice: stop at the doors
  for now and let credits start at the second page. A live Haiku page should cost about
  a cent (estimate; measure in §1), while each pre-written page needs a full fact-check
  (about 250–300k Claude tokens each for the doors), and all 240 would need redoing if
  the door list or the format changed. Revisit once real costs are known.
- **Accuracy** (Will: factual errors in a knowledge tool are "very, very bad"). Plan to
  bring him:
  - pre-written pages: a full source check of every number, date, name and attribution;
  - live pages: factual accuracy as a hard gate in the model eval (`docs/eval-plan.md`),
    scored by fact-checking a sample of real pages per model;
  - if the eval shows the number-heavy panels (figures, guess, timeline) invite errors,
    tighten or cut them in the prompt;
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

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
against `docs/vision.md`. Known gaps:

- **Real model output, not just the mock.** Read 15–20 live pages across seeds, levels
  and voices. Check link specificity, the share of people among links, the title lock,
  bridges and streaming smoothness (Will once saw asides glitch as they slid in). Fix
  through `lib/prompts.js`, bumping `PROMPT_VERSION`, or through rendering.
- **Secondary UI.** Peek, expand, sketch, around this, connect, skeptic, quiz, recap,
  thread, the Keys sheet and the paywall should feel as clean as the articles.
- **Flow.** Make the next-page transition, the up-next pill, level-ups and the
  continue-reading path feel "super smooth" on desktop and phone.
- **Mobile.** Check sheets, the map, tap-to-peek, the paragraph menu and long titles.
- **Accessibility.**
  - Focus after navigation, and announcements while text streams.
  - Contrast of the level and link colours in both themes.
  - Keyboard paths, and reduced motion.
- **Performance.**
  - Merge the four Google Fonts requests into one, or self-host the fonts and tighten
    the CSP to match.
  - Check mobile load times and the size of the inline script.
- **Landing.** Keep it light; its job is to get a visitor into their first page. Popular
  doors should become cache hits (instant, free).

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

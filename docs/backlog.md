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
against `docs/vision.md`. First pass done 2026-10-14 (PR willgibs/dorkhub#1, see
`docs/decisions.md`); what's left:

- **Live pages.** Re-read at least 5 live pages once credits exist, to confirm what the
  Haiku stand-ins showed. Replace the stand-ins in `lib/recorded.js` with live pages
  (`scripts/recorded.mjs`; the raw text is in the reader's localStorage).
- **Secondary UI.** Sketch, quiz, recap, thread and expand only ever showed mock output.
  Record real outputs for them, then judge their layouts.
- **Phone.**
  - The ¶ button above every paragraph is noise on touch; consider tap-to-reveal.
  - Paragraph spacing is loose on touch, because of the room kept for that button.
- **Flow.** Look at latency (first word, J to next page) once live timings exist.
- **Performance.** The page is 247 KB, about 61 KB brotli. Self-hosting the fonts would
  drop the render-blocking Google request, and needs a CSP change.
- **Landing.** Keep it light. Warm the cache for the doors once credits land (about 5¢;
  ask Will).

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

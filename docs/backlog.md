# Backlog

_Ordered by priority. **(Will)** means it needs his decision or action first: ask, don't assume. What has shipped
lives in `docs/decisions.md` and on dorkhub.com, not here. Questions for Will go on the review desk (`CLAUDE.md`)._

## Now (2026-11-18): the near-term roadmap, for next week

The product is built: the front page and its 13 cards, the reading page, Your world, sharing, moves both ways, the
Lamps identity. The free pages write live on Will's Anthropic API credit (a $50-a-month Console workspace), by Haiku
5.5 through the split writer: the head and the topic plan at once, then the body, then the ways on (#59), and its wait
is a row of lamps lit by the link plan (#60). No word breaks where a layout can make room for it (#61;
`docs/decisions.md`). What remains, in order:

1. **Cut the first-word wait further** (Will: "amazing performance will always beat a delightful delay", never at
   the page's quality). The first body words come 2.6 s after the click, 0.6 s behind the single pass, which links
   one topic a page. Left: the plan (whole at ~1.8 s; the head at ~1.4 s) and the body's own first token (~0.6 s).
   Test the links first, on the 44 test pages (`.seeds-batch/split3-*`, `.e2e/desk/tools/replay44.mjs`, judged by
   `judge-plans.mjs`), then the timing (`timing.mjs`):
   - The body on the head alone, the plan given only to the linker (up to ~0.4 s sooner). The risk: a body that
     never saw the plan may not name its topics.
   - A faster plan: fewer topics, or shorter lines.
2. **The plans' misses.** Opus judged #59's plans worse than #58's on 11 of 44 pages: near-duplicates, off-topic
   entries, one wrong name (the Great Emu War's minister). Read them before changing the plan prompt; a rule only for
   a failure on two or more pages of different kinds.
3. **The page around what Haiku writes well:** hooks shown on hover rather than written for every link, and readers'
   own keys on the split writer. Those still get the single pass, whose pages can stop after the body (6 of 44) or
   show questions as a paragraph.
4. **(Will) Engaging pages:** the eval's `lean` prompt (half the words, a sixth of the rules) on Haiku, the same 44
   topics by batch (about $0.03), in blind pairs with today's prompt on the desk.
5. **(Will) Connect Upstash Redis** (free, his click in the Vercel Marketplace: an account change), then decide
   whether `DH_LIBRARY=redis` keeps every finished page. The function log shows `{"evt":"store","counters":"redis"}`
   once connected. Then §6's "Real Redis".
6. **(Will) Old resources to retire**, all in his accounts:
   - Revoke the `dorkhub-imports` gateway key, and the Gemini key.
   - Retire the old Supabase and Sentry projects. Sentry's uptime monitor on dorkhub.com is already disabled
     (2026-11-13: it was nearly all of Dorkhub's data transfer); deleting it goes with the project.
   - Remove the GitHub OAuth app, the fine-grained token and the `CRON_SECRET` Actions secret.
   - Remove the old sitemap in Search Console.
   - Remove the Mac backup agent `com.dorkhub.backup` (it still runs on Sundays at 09:00 and fails).
7. **(Will) Repo visibility.** Public today, so the prompts are readable. On Hobby, making it private may block
   deploys of commits authored by an agent.
8. Drop CI's second try for the walk after a week with no "needed a second try" warning (from 2026-11-14).

## 1. Prove production (as soon as credits exist)

`node scripts/prove.mjs https://dorkhub.com --spend --yes` covers the first two; the rest by hand.
- A live page streams word by word on dorkhub.com (not buffered), `x-dh-trial` counts down, and a repeated first
  page comes back with `x-dh-cache: hit`.
- "Stop writing" really stops the writer: the log ends with `cancelled` and shows fewer output tokens.
- The 41st call to `/api/write` in a minute from one IP gets a 429, and the page says "Lots of readers at once."
- Measure the real cost per page and per quick tool from `{"evt":"write"}` logs; record it in `docs/decisions.md`.
- Bring-your-own-key works end to end with a real key. Will types his key himself; never enter one.

## 2. The writer, on real output (after credits)

Will (2026-10-19): get any page right on the first try, quickly. Judge against `docs/vision.md`.
- **Page by page.** Small batches of first tries, scored against what the prompt asks (`node scripts/score.mjs
  <dir>`); a prompt rule only for a failure on two or more pages of different kinds; a regression set unlike the
  front page whenever the prompt changes. Pages written ahead of time are rewritten whenever the prompt or their
  writer changes: all 44, the 11 earlier pages (Tardigrades and the rest) included, in one batch through the Batch
  API, by Sonnet 5.5 with production's own call for it (Will, 2026-11-17: the front page's ways in get the more
  engaging writer; Haiku writes every live page).
- **Replace the stand-ins.** `lib/recorded.js` holds Haiku stand-ins written through a Claude Code subagent, not
  fact-checked; three still say "your path" (the old voice). Re-record them from live output
  (`scripts/recorded.mjs`). They replay only in dev, the walk and previews, never in production.
- **Live pages.** Re-read at least five live pages to confirm what the stand-ins showed.
- **Secondary UI.** Quiz, recap, thread and expand have only ever shown mock output: record real outputs, then
  judge their layouts.
- **Accuracy** (Will: factual errors in a knowledge tool are "very, very bad"). Grounding was tested 2026-10-14 on
  16 stand-in pages and a blind fact-check of 1,087 claims: wrong or disputed claims fell from 5.8% to 3.9%, not
  significant on eight topics; hover hooks were the most error-prone part (9%). Parked with the eval at Will's word
  (2026-10-15); `lib/grounding.js` and `docs/eval-plan.md` carry it. If the number-heavy panels invite errors,
  tighten or cut them in the prompt.
- **Flow and weight.** Live timings exist (`.e2e/desk/tools/timing.mjs`); the first-word wait is "Now" item 2.
  J to the next page is still unmeasured.

## 3. The model eval (Will gives the go and approves the cost)

Built and proven on the mock (2026-11-13): `docs/eval-plan.md`, `node scripts/eval.mjs plan`. Nothing has been run.
Its writers need the gateway (cents), or the Anthropic credit once `scripts/eval.mjs` gains a `--via anthropic` route
on `DH_ANTHROPIC_KEY`; its judges run on the subscription (`--judge-via claude`). Then Will's blind
picks in `review.html`, and the winner wired into `lib/write.js` (`composePage`; `split` is the early favourite)
with `PROMPT_VERSION` bumped. Other models (Sonnet 5.5 as the writer, OpenAI, Gemini) are a `--models` flag on the
same harness, after the first look.

## 4. Pro (after Will sets pricing)

- Accounts created at checkout only. Stripe. A credits ledger, with server-side entitlement that replaces the trial
  for subscribers. Bring-your-own-key stays available.

## 5. Long-term, each needing Will's go

- **One HTML shell instead of 46 copies.** Each deployment stores the ~390 KB page 46 times, so that every address
  has its own link preview. A function that writes the head would cut stored output and build time; it changes how
  previews are served. A product trade.
- **A shared feed** (the prototype's Hub, `docs/prototype/`), and a Pro waitlist.
- **Privacy-preserving page-view analytics.** Would need a change to the footer's "nothing you read is tracked".
- **More writers** (OpenAI, Gemini): wired in, switched off until the eval clears them.

## 6. Engineering hygiene

- **Real Redis.** Verify `redisCounters` and the library's `redisLayer` against real Upstash once it's connected;
  both have only been tested against a fake.
- **Prompt caching** has been on for a page's fixed instructions since 2026-11-17 (5-minute cache). After a week of
  live pages, read the hit rate from the write log's `cacheRead`/`cacheWrite`: a 1-hour cache costs twice as much to
  store, and pays only if pages come at least hourly but rarely within five minutes of each other. A `split` winner
  in the eval moves the mark onto its system message (`pageParts`' test fails until it does).
- **Structured outputs** for the JSON tools (part of the eval).
- **`DH_SALT`.** Optional; without it the project ID is the salt.
- **Trial size on the page.** `TRIAL_PAGES` is baked in at build time from `DH_TRIAL_PAGES`: changing it in Vercel
  needs a redeploy before the page shows it; the server enforces it at once.
- **Room on the page.** The page budget is 400 KB (`tests/page.test.js`), `front.json`'s 200 KB
  (`tests/front.test.js`); both are nearly full. Moving the front cards' behaviour into a file of its own would free ~25 KB from every
  page, but needs the CSP to admit a second script.
- Left on purpose: a picture whose image never answers keeps its dots moving while on screen; on a phone, keyboard
  focus into the sticky bar scrolls the page.

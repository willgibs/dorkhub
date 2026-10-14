# Decisions

One line each, newest last. Why, not just what.

- 2026-10-13 · Fresh start: the old Next.js/Supabase dorkhub (GitHub-project showcase) is archived as a git bundle; this repo and the Vercel project now host the generative encyclopedia.
- 2026-10-13 · Static-first: one prebuilt page on the CDN plus one function. No framework, because nothing renders on the server and every page view should cost nothing.
- 2026-10-13 · Prompts live only on the server (`lib/prompts.js`); the page sends task + structured context. Stops the endpoint being a free general chatbot and lets prompts vary by model later.
- 2026-10-13 · No free accounts. Anonymous trial (6 pages, 30 quick tools per device per 30 days), then bring-your-own-key kept in the browser; accounts only for Pro (planned).
- 2026-10-13 · Trial writes with Claude Haiku 5.5, the fast tier the prototype's default writer used; about $0.001 a page. One env var (`DH_TRIAL_MODEL`) changes it.
- 2026-10-13 · Quick tools (peeks, sketches, quizzes…) always use the provider's fast model, as in the prototype, even when pages use a bigger one.
- 2026-10-13 · BYOK calls the provider directly with the reader's key, never via Dorkhub's gateway, so a bad key can't fall back to Dorkhub's credits.
- 2026-10-13 · BYOK launches with Claude models only (Anthropic key or AI Gateway key): the prompts are proven on Claude. OpenAI and Google are wired in but disabled.
- 2026-10-13 · The model eval (per model, per prompt variant) is deferred until the generative UI settles, so it isn't rerun after every format change (Will's call).
- 2026-10-13 · Finished answers are cached by a hash of model + prompt (Runtime Cache, 14 days). Identical first pages from the front page cost nothing after the first.
- 2026-10-13 · The Hub (shared rabbit holes) is left out of launch.
- 2026-10-13 · Trial units are reserved before the writer starts and refunded only if nothing was bought (writer failed, or the reader left before it started). Hanging up mid-write is charged, so dropped requests can't spend Dorkhub's tokens for free.
- 2026-10-13 · Trial counts are atomic in Upstash Redis (free tier) when connected; Runtime Cache is the fallback and can drift across instances. Redis is a prerequisite for a public launch.
- 2026-10-13 · Network caps are 20 devices' worth (120 pages), not 4, because schools, offices and mobile carriers share addresses; an IPv6 /48 gets 5 networks' worth so tunnelled /48s can't mint networks. Will approved.
- 2026-10-13 · Only answers that finished cleanly and pass a per-task sanity check are cached; aborts, cut-offs and garbled JSON never reach other readers.
- 2026-10-13 · AI Gateway budget starts at $5/month (Will): one runaway mistake can't cost much; raise it slowly as real usage shows what's needed.
- 2026-10-13 · Firewall: one rate-limit rule on /api/write, 40 requests per 60 s per IP, then 429. Old env vars removed; production authenticates to AI Gateway by OIDC only.
- 2026-10-13 · Trial resized (Will): 10 pages a month per device, 100 a month per network (IP); quick tools scale with it (50 per device, 500 per network). Supersedes the 6-page device trial and the 20-devices network factor.
- 2026-10-14 · Until the gateway has credits, "real pages" for judging the product are Claude Haiku 5.5 (the trial's model) given the exact production prompt through a Claude Code subagent. They're kept in `lib/recorded.js`, labelled as stand-ins, and replaced with live pages once those exist. The subagent thinks before answering and the trial doesn't, so live pages may be a little weaker.
- 2026-10-14 · The mock writer replays recorded pages at a writer's pace, so dev, e2e screenshots and previews read like the real thing for free. Previews run it (Will: `DH_MOCK=1` on Preview); production can't.
- 2026-10-14 · Reading first: facts and drift sit in the margin column beside the opening on wide screens, and after the first paragraph on narrow ones; the timeline is a compact strip. Before, the first screen held 13–26% body text on desktop and 0–11% on a phone (now 34–40%).
- 2026-10-14 · The parser points every link at the planned topic, whichever way round the writer wrote it (Haiku mixes `[[Topic|shown]]` and `[[shown|Topic]]`), strips a copied "Deck:" label, and holds back half-written lines. A property test proves nothing on a streaming page changes or disappears.
- 2026-10-14 · Prompt 2026-10-14, from 15 real pages: links must belong to the page's story; wild branches name their thread; stock curiosities (tardigrades, the Antikythera mechanism…) are ruled out; no formula phrases; the page sends what the previous page covered (`seen`) so the next doesn't retell it.
- 2026-10-14 · The up-next pill appears only after 80% of the body has scrolled past; before, it appeared 240 px into a page.
- 2026-10-14 · (Superseded the same day: Will signed in on his Chrome instead, which agents drive with Claude in Chrome.) Agents read Vercel logs and protected previews through Will's own sign-in in the Claude browser pane (read-only); the Vercel CLI and connector on his Mac belong to the Partyreel team.
- 2026-10-14 · Will merged v1 by handing agents merge and deploy rights (PR #1 merged as 9d01683). DH_MOCK=1 is set on Preview only, so previews replay recorded pages; production still answers "paused" (no gateway credits) and its counters are the Runtime Cache, not Redis (logs, 13:37).
- 2026-10-14 · On touch, the ¶ button waits for a tap on its paragraph (Will): recurring UI must stay useful on page 500, not just charming on page 10.
- 2026-10-14 · No crawlable topic URLs, ever (Will: the old product was hammered by crawlers). Pages live behind # routes in the reader's browser; pre-written pages come only from POST /api/write (same-origin check, Firewall rate limit, robots.txt Disallow: /api/); any new GET endpoint answers only same-origin browser requests and is CDN-cached.

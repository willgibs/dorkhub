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

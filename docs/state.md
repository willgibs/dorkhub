# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-13)
- dorkhub.com serves the new app from the existing Vercel project (willgibs/dorkhub,
  Hobby, Fluid, Node 24, framework Other). Production = `main`; each push deploys.
- Old project cleaned: 9 env vars removed, crons gone, project unpaused. Firewall: one
  rate-limit rule, /api/write 40 req / 60 s per IP → 429. AI Gateway team budget $5/month.
- Production auth to AI Gateway is OIDC (verified). Runtime Cache available (verified).
- `npm run verify` green (37 tests); `npm run e2e` passes on desktop and phone.

## Blocked on Will
- AI Gateway credits: the free tier can't call Claude Haiku 5.5 ("Free tier users do not
  have access to this model"), so free pages show "paused" until credits are bought.
- Upstash Redis (free) from the Marketplace, connected to the project, for exact trial
  counts. Until then counters live in Runtime Cache (can drift across instances).
- Revoke the old AI Gateway key "dorkhub-imports"; delete the 21 old git tags (the
  session proxy refused tag deletion); retire Supabase, Sentry, the GitHub OAuth app and
  fine-grained token, the Gemini key, the Actions secret, Search Console's old sitemap and
  the Mac backup agent.

## Next
1. Once credits land: write a live page, check streaming isn't buffered and the trial
   header counts down; read `{"evt":"write"}` logs for token counts and cost.
2. Keep improving the generative UI and the overall experience (Will's priority).
3. Then the model eval (candidates × prompt variants, two judges); pick the trial model
   and which BYOK models/providers ship.
4. Pro: ask Will for pricing first; then auth, Stripe, a credits ledger.

# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-13)
- The generative encyclopedia is ported from the claude.ai prototype into a deployable app:
  static page + `/api/write` on Vercel, AI Gateway via OIDC, trial + bring-your-own-key.
- `npm run verify` green (25 tests); `npm run e2e` passes the full reader flow on desktop
  and phone.

## Next
1. Deploy to the existing Vercel project (willgibs/dorkhub) and point dorkhub.com at it.
   Before sharing publicly: Upstash Redis connected (exact trial counts), Firewall rate
   limit on /api/write, AI Gateway budget set, DH_SALT set.
2. Keep improving the generative UI and the overall experience (Will's priority).
3. Then the model eval: candidates × prompt variants, two judges, choose the trial model
   and which BYOK models/providers ship.
4. Pro: ask Will for pricing first; then auth, Stripe, a credits ledger.

## Watch
- Runtime Cache availability is logged once per instance (`{"evt":"store"}`). If it
  reports false in production, trial counters are per-instance only.
- Cost per write is in the function logs (`{"evt":"write"}` with token counts).

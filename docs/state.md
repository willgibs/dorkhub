# State

_Rewrite this at the end of each session. Keep it under 40 lines._

## Now (2026-10-13, handoff from the porting session)
- **Live.** dorkhub.com serves this repo from Vercel project willgibs/dorkhub (Hobby,
  Fluid, Node 24, framework Other, iad1). Every push to `main` deploys production.
- **Built:** the prototype's full reading experience, ported from the claude.ai artifact
  (`docs/prototype/`), with every prompt now on the server. Also:
  - free trial without an account: 10 pages and 50 quick tools per device per month;
    100 and 500 per network
  - bring your own key (Claude via an Anthropic or AI Gateway key)
  - a 14-day answer cache, hash-based CSP, cancellation on disconnect
  - mock writer for development
- **Infrastructure:** old project cleaned (env vars, crons, Next.js preset). Firewall
  rate-limits `/api/write` to 40 requests per minute per IP. AI Gateway team budget is $5 a
  month; auth is OIDC (verified in production). Runtime Cache is available (verified).
- **Checks:** `npm run verify` green (38 tests); `npm run e2e` green on desktop and phone.
  An independent security review's findings are all fixed (`docs/architecture.md`).

## Blocked on Will (see `docs/backlog.md` §0)
- **AI Gateway credits.** The free tier can't call Claude Haiku 5.5, so free pages show
  "paused" until he buys credits. Nothing has been written live in production yet.
- **Upstash Redis** for exact trial counts (until then, Runtime Cache).
- **Old resources** under his other logins and credentials (agents may not revoke keys
  or permanently delete): gateway key, 21 old git tags, Supabase, Sentry, the OAuth app,
  token and secret, the Gemini key, Search Console, the Mac backup agent.
- **Decisions:** whether the repo stays public (the prompts are readable), and Pro pricing.

## Next
1. When credits land: prove production (`docs/backlog.md` §1).
2. The experience, against `docs/vision.md` (§2). This is Will's priority.
3. Then the model eval (`docs/eval-plan.md`), on Will's go.
4. Then Pro, once Will sets pricing.

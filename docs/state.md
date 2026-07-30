# Current state — 2026-07-30 (P4 late-round; overnight autonomous push done)

## Milestones
- Everything through P3-D ✅ tagged. **P4 launch round ~85% shipped** — full
  record: docs/plans/p4-launch.md (waves L0a/b/c, L1, L2a–e, L3, L4 all
  deployed; 752 tests; both RLS suites green on PURGED prod; 17 commits).
  Purge EXECUTED (Will-approved live): prod has zero fixtures, gallery 207.
  Featured mechanism live (strip renders only when a slot is active — none
  are; /admin/featured manages). CSP report-only burning in. Search limiter
  wire-proven. Sitemap/JSON-LD/error pages/legal drafts shipped.

## Waiting on Will
1. EMAIL (2 min): Cloudflare dash → dorkhub.com → Email → Email Routing →
   destination dorkhub1@gmail.com (verify link lands there) → address
   hi@dorkhub.com → Enable. Then I swap the terms/privacy contact.
2. FEATURED LABEL wording nod ('featured' default) · TERMS/PRIVACY review.
3. Then: DEDICATED L5 PLANNING ROUND (board steer: bar = final-product
   feel; signups-off toggle available; many polish rounds expected after).
DONE since his reply: BIG IMPORT ran (3,792 created; hopper 3,733 pending
≈23h drain — star threshold only gates screening, NOT drain). SENTRY LIVE
(dedicated dorkhub org; DSN in Vercel; CSP carries ingest origin; burn-in
caught vercel.live toolbar [disable on prod at enforce] + an Electron-pane
prefetch artifact [no action]).

## DB access (for agents)
Dedicated account, NOT the MCP. psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD). Prod LIVE — reads free; writes only as
verified ops; migrations `psql --single-transaction -v ON_ERROR_STOP=1`.
Backups: docs/ops-backup.md (snapshot before every destructive op).

## Gotchas (new this round first; older ones live in docs/plans/* + git)
PROFILES: never star-select under API roles (0018; use PROFILE_COLUMNS /
ProfileRow) — and grep app projections BEFORE any grant change. Search
limiter fail-OPEN vs AI budget fail-CLOSED: both deliberate, don't "align".
Robots flip = robots.ts + layout.tsx metadata TOGETHER (comments
cross-reference). /search noindex is page-level and must survive the flip.
SITE_URL: src/lib/site.ts only. Suites self-provision (991…/990…09xx
bands); seed.sql = LOCAL dev only now. Featured: dedupe is page-1 display
only; published-only is enforced twice (create + !inner). CSP: img-src
https:-wide is LOAD-BEARING (README images); flip via CSP_ENFORCE=1 env.
Browser-pane screenshots can return black frames — verify via DOM/read_page
(P3-D tooling note, extended).
Last updated: 2026-07-30 late night (P4 overnight push complete).

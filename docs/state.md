# Current state — 2026-07-30 (P4 IN FLIGHT)

## Milestones
- Everything through P3-D ✅ tagged (p2…p3d). P4 launch round RUNNING
  (plan: ~/.claude/plans/sparkling-herding-star.md; board decisions 2026-07-30:
  featured=mechanism-only, import during P4 behind seed-list gate, Vercel Pro
  at launch window, orchestrator drafts terms/privacy).
- P4 done so far: L0a backup (verified restore; dorkhub-prod-20260730-045500,
  docs/ops-backup.md) · L0b RLS suites SELF-PROVISION (no seed.sql dep) ·
  L2a 0018 is_admin column-restrict (user_id stays — header filters on it)
  · L2c headers + CSP REPORT-ONLY live (CSP_ENFORCE=1 flips) · L2d 0019
  per-IP search limiter (fail-OPEN, wire-proven 60→429) · L2b Sentry code
  (inert until DSN) · L3 sitemap dynamic (1,103 URLs exact) + JSON-LD +
  error pages + /search noindex + /terms + /privacy drafts.

## BLOCKED ON WILL (everything else proceeds)
1. PURGE (L0c): classifier blocked the prod DELETE. Rehearsed + rolled back
   clean (guards green; collateral = his 1 QA like + 1 follow on fixtures).
   Script: scratchpad/purge-fixtures.sql — needs his run or explicit retry-ok.
   L1 featured is HARD-BLOCKED behind it (live fixture slot rows).
2. SENTRY org: dorkhub project in his 'partyreel' org vs dedicated org →
   then NEXT_PUBLIC_SENTRY_DSN into Vercel env.

## Next (after unblock)
L1 featured (admin CRUD + page-1 head; copy wording = Will nod) · L4 polish
(3 list dead-ends, surrogate clip, ReportGroupRow status, P2.7 design set)
· L2e audits · L3 leftover: apple-icon + manifest · content: crawl source
list → seed-list gate · L5 launch checklist (incl. Search Console, uptime,
two-step cron swap, robots flip both-halves).

## DB access (for agents)
Dedicated account, NOT the MCP. psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD). Prod LIVE — reads free; writes only as
verified ops; migrations `psql --single-transaction -v ON_ERROR_STOP=1`.

## Gotchas (new this round first)
PROFILES MAY NEVER BE STAR-SELECTED under API roles (0018; SQL `*` needs
every column; use PROFILE_COLUMNS/ProfileRow from src/lib/profiles/columns
— broke prod pages for ~10min, caught by post-apply probe). Grant changes:
grep app projections BEFORE applying. SITE_URL: src/lib/site.ts (only
source). Robots flip = robots.ts + layout.tsx metadata TOGETHER. Search
limiter fail-OPEN vs AI budget fail-CLOSED — both deliberate. Suites
self-provision (991…/990…09xx github_id bands, outside GitHub's real
space). Seed fixtures remain in supabase/seed.sql for LOCAL dev only.
Plus all prior gotchas in git history + docs/plans/*.
Last updated: 2026-07-30 (P4 L0a/L0b/L2a-L2d/L3 shipped; purge pending Will).

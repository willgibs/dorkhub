# Current state — 2026-07-22

## Milestones (master plan M0–M9)
- M0–M2.5, M7 ✅ — design locked ("quiet dev-native"), 24-component library +
  /design styleguide (5 pages), motion system retrofitted, marketing home +
  manifesto (gate: merged take approved), brand OG, robots noindex-until-M9.
- DB ✅ LIVE — dedicated Supabase org, ref xvorwdvsnbpujyzfowwu (us-east-1).
  Migrations 0001–0004 applied; seeds in; RLS suite 26/26; advisors clean.
- M3 auth+identity ✅ — E2E-proven by first real signup (u/willgibs); 3 prod
  bugs fixed+regression-guarded (service_role grants 0003, server-only module
  split, layout router-cache revalidate) — details in decisions.md.
- M4 projects+GitHub sync ✅ E2E-PROVEN (spec: docs/plans/m4-projects.md) —
  Will added willgibs/linkflow via /new → draft → publish → live page; prod
  cron verified (ETag 304s, errored:0). 244 tests; RLS 26/26. Seed-id
  collision hazard caught+fixed pre-token (ids shifted +9e11).

## Next steps
1. M5 discovery+interactions (feed, tags, likes/saves/follows, caching pass:
   de-dynamize SiteHeaderSession so ISR/revalidatePath do real work).
2. Then M6 (screenshots, updates, edit polish incl. cmdk-row a11y), M8, M9.

## Open blockers
- (none)

## DB access (for agents)
Dedicated account, NOT the MCP (reserved for Will's other agents). Management
API via SUPABASE_ACCESS_TOKEN (curl api.supabase.com/v1) + psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD).

## Infra + gotchas
Repo github.com/willgibs/dorkhub · prod dorkhub-ten.vercel.app · CI green ·
tags m0/m1/m2/m4. proxy MUST be src/proxy.ts (root is silently ignored).
launch.json app has autoPort (3000 often taken). Stale .next dev cache can
replay long-fixed compile errors — rm -rf .next before trusting dev errors.
Last updated: 2026-07-22 (M4 code-complete; awaiting PAT + first-user QA).

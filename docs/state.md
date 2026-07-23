# Current state — 2026-07-22

## Milestones (master plan M0–M9)
- M0–M2.5, M7 ✅ — design locked ("quiet dev-native"), component library +
  /design styleguide, motion system, marketing home + manifesto, brand OG.
- DB ✅ LIVE — dedicated Supabase org, ref xvorwdvsnbpujyzfowwu (us-east-1).
  Migrations 0001–0005 applied; seeds in; RLS suite 26/26; advisors clean.
- M3 auth ✅ · M4 projects/sync ✅ · M5 discovery ✅ — each E2E-proven by
  Will as first user; tags m4/m5; specs in docs/plans/; prod bugs + fixes
  logged in decisions.md (service_role grants, layout cache, seed-id
  collision, PGRST201 embed).
- M5.5 curator round ✅ (search+discoverability; Will's "great work" QA) —
  tag pending alongside p1.
- VISION board-approved (docs/vision.md): curator-first, governance =
  Will board / orchestrator CEO. Roadmap P1→P4 to dorkhub.com launch.
- P1 gallery engine ✅ CODE-COMPLETE (spec: docs/plans/p1-gallery-engine.md)
  — 0006 ingestion schema (live), /settings/import stars flow, /admin
  (dashboard/queue/sources/claims), crawls, consent blocklist, claim flow.
  407 tests; ingestion RLS 7/7 vs live DB; GitHub surfaces live-verified;
  routes gated. Awaiting Will's admin QA, then tags m5.5 + p1.

## Next steps
1. Will: admin QA on prod — import stars, crawl, approve from queue, see
   retroactive saves; claim-flow spot-check.
2. P2 discovery mechanics (related/because-you-starred/something-weird,
   search reframe). 3. P3 rich pages + design sweep. 4. P4 slots + launch.

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

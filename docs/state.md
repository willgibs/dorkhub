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
- M5.5 curator round ✅ CODE-COMPLETE (spec: docs/plans/m5.5-curator.md) —
  saved/following surfaced (dropdown, feed trailing links, empty-state
  exits), REAL ⌘K search (trgm indexes 0005, /api/search paired-ilike,
  root-mounted palette), wrapping mobile header (also fixes prod's clipped
  sign-in at 375px). 336 tests; anon QA green. Awaiting Will's signed-in QA.
- PRODUCT: curator-first strategy locked (decisions.md 2026-07-22) —
  importer platform (ingestion → admin approval) is the NEXT planning round.

## Next steps
1. Will: signed-in M5.5 QA (dropdown items, palette, mobile header feel).
2. Importer platform planning round (reshapes M8; maybe separate admin app).
3. Then M6 (screenshots, updates, edit polish incl. cmdk-row a11y), M9.

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

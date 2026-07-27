# Current state — 2026-07-27 (late)

## Milestones
- M0–P2.5.1 ✅ LIVE (207 published, 0 pending; schedulers self-running).
- P2.6 IMMUNE SYSTEM ✅ live-E2E'd: reports (deny-all, server action,
  ≤5/day) + AI triage (ok/review/flagged, TRIAGE-ONLY) as pipeline pass 3
  (5 enrich + 3 screen = 8 AI calls/run). Admin: reports section, verdict
  chips, flagged-first retro sort. E2E: report screened source=report;
  retro window bug (P2.1 class) fixed with snapshot-stars prefilter;
  4 retro screens live, all verdict ok.
- P3-A LISTS ✅ browser-E2E'd: collections/collection_items (0010, 30
  policies), stable slugs (no UPDATE grant), caps in lib/lists/policy.ts
  ('use server' export constraint — build-caught), reserved slug 'lists',
  add-to-list dropdown + report button on project pages, nav item, profile
  section. Signed-out: public list + items render, private 404s.
- BOTH handoff-plan rounds are COMPLETE (Fable executed them before the
  limit). Post-limit models: only Will-QA follow-ups — nothing structural.

## for fable (re-entry agenda)
Review both rounds in situ · signed-in QA results from Will (report dialog,
lists CRUD/dropdown/auto-add, caps copy) · tags p2/p2.5-w1/p2.6/p3a ·
plan P3-B (search/sort/filter + appears-in-N-lists signal + rich pages +
design QA) · pre-existing dev-console noise: "script tag while rendering
React component" on every page (theme init?) — triage at design-QA time.

## Open blockers
- (none)

## DB access (for agents)
Dedicated account, NOT the MCP (reserved for Will's other agents). Management
API via SUPABASE_ACCESS_TOKEN (curl api.supabase.com/v1) + psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD).

## Infra + gotchas
Repo PUBLIC until near-launch · prod dorkhub-ten.vercel.app · CI green.
proxy MUST be src/proxy.ts. rm -rf .next on stale weirdness. .eq(col,[])
INVALID → .filter(col,'eq','{}'). NO .or(). Prefilter selection windows in
SQL (P2.1, P2.6). BOTH RLS suites after schema changes. 'use server' files:
async exports only. Seed projects are UNPUBLISHED on prod — behavioral tests
resolve published targets at runtime. if-green-then-commit (&&, never ;).
Last updated: 2026-07-27 late (P2.6 + P3-A shipped; Fable limit imminent).

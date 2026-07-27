# Current state — 2026-07-27

## Milestones
- M0–M5.5, P1(+.1), P2(+.1/.2), P2.5 w1(+.5.1) ✅ LIVE. 207 published, 0
  pending — queue fully drained by the schedulers (Actions :04/:19/:34/:49 +
  Vercel daily). Launch content bar (150–300) exceeded.
- P2.6 IMMUNE SYSTEM ✅ code-complete + live-E2E'd (docs/plans/
  p2.6-immune-system.md): user reports (deny-all project_reports, server
  action, ≤5/day, no self/re-reports) + AI triage (moderation_screens,
  ok/review/flagged, TRIAGE-ONLY — no auto-actions) as pipeline pass 3
  (ENRICH 5 + SCREEN 3 = 8 AI calls/run, ceiling unchanged). Admin queue:
  reports section + verdict chips + flagged-first retro sort. E2E: reported
  project screened live (source=report, verdict=ok, model stamped); retro
  window bug (P2.1 class) found+fixed — snapshot-stars prefilter.
- NEXT (executors, from the Fable handoff master plan in the session plan
  file — read it FIRST): P3-A lists (waves B0–B3), then HARD STOP for
  Fable re-entry (no tags, no P3-B search/filter, no launch work).

## Next steps
1. Executors: Round B per master plan (B0 migration 0010 → B1 core → B2
   integration → B3 E2E/docs → STOP with '## for fable' note here).
2. Will QA (needs real session): report dialog e2e, already-reported +
   rate-limit copy; then B: lists flows. 3. Fable: review, tags, P3-B plan.

## Open blockers
- (none)

## DB access (for agents)
Dedicated account, NOT the MCP (reserved for Will's other agents). Management
API via SUPABASE_ACCESS_TOKEN (curl api.supabase.com/v1) + psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD).

## Infra + gotchas
Repo PUBLIC until near-launch · prod dorkhub-ten.vercel.app · CI green.
proxy MUST be src/proxy.ts. rm -rf .next when dev errors/data look stale.
supabase-js .eq(col, []) INVALID — .filter(col,'eq','{}'). NO .or(). Window
bugs: prefilter selection windows in SQL (P2.1 enrich, P2.6 retro screen).
Run BOTH RLS suites after any schema milestone. Gates: if-green-then-commit
(&&, never ;). Regenerated types.ts needs lint:fix. Gemini: pinned
current-gen model. copy.ts may nest one level (voice page flattens).
Last updated: 2026-07-27 (P2.6 live; handoff plan active — Fable limit near).

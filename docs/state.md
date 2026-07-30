# Current state — 2026-07-30

## Milestones
- M0–P2.5.1 ✅ LIVE (216 projects; schedulers self-running) · P2.6 ✅ · P3-A ✅
  · P2.7 ✅ (tagged p2 / p2.5-w1 / p2.6 / p3a) · P3-B parts 1+2 ✅
  (rich pages, lists signal, search + facets — docs/plans/p3b-*.md).
- P3-C SCALE ✅ (docs/plans/p3c-scale.md, migrations 0013–0016, D31–D38):
  feed_page RPC (deep pages now SEEK — were O(offset), 42× at 10k), AI spend
  ledger (fail-closed AI_DAILY_MAX, default 800), cron split ingest/pipeline
  (imports can't starve moderation), deadline-governed sync (10k refresh ~2
  days not 50), narrow card projections (219KB→556B measured), uuid-pivot
  /weird, tag_tally() aggregate, set-based visibility recount. BONUS CATCH:
  0012's generated language_slug broke the counters guard the day it shipped
  (updated_at bumped on every like) — fixed 0016, pinned by T26.
  Tagged p3b + p3c (Will's green light, 2026-07-30).
- P3-D GUARDRAILS ✅ (docs/plans/p3d-guardrails.md, migration 0017, D39–D43):
  DOLLAR-honest AI budget — AI_DAILY_MAX 800 (≈≤$0.48/day) + AI_TOTAL_MAX
  5,000 lifetime (≈≤$3), both kill-switchable at 0, refusals name the
  ceiling; 30s per-call timeout (AI_CALL_TIMEOUT_MS); pipeline reports
  aiCallsToday/aiCallsTotal; viewer-visible list counts; screen/admin order
  divergence documented as intentional; motion sweep verdict Approve (zero
  findings). **Tag p3d awaits Will's green light.**

## Next (not started)
P4 launch round (featured slots, fixture purge, is_admin column-restrict,
Vercel Pro cron swap, robots flip, sitemap+JSON-LD) — carries board gates.
The big import can start any time: pipeline drains ~3,840 materializations/day.

## Deferred, with reasons (read before the next round)
p2.7-hardening.md + p3b-*.md + p3c-scale.md + p3d-guardrails.md "Known /
deferred" sections. Load-bearing: NO search rate limiter (D29 — ai_usage is
the shared-state pattern to reuse); multi-word search is one substring.
RESOLVED by P3-C: admin drain outside budget, pass-3 starvation, sync
50-day refresh. RESOLVED by P3-D: per-call AI timeout, viewer-visible list
counts, screen/admin order divergence (documented intentional, D42).

## Will-QA (needs a real signed-in session)
Report dialog e2e · lists CRUD · the two S4 fixes · private-list revalidation
· lists signal e2e (make a public list) · first real budget-pressure day
exercises the pipeline's 'budget' stopKind live (refusal names the ceiling).

## DB access (for agents)
Dedicated account, NOT the MCP. Management API via SUPABASE_ACCESS_TOKEN
(curl api.supabase.com/v1) + psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD). Prod LIVE — reads free, never write;
schema work only in rolled-back transactions. Migrations:
`psql --single-transaction -v ON_ERROR_STOP=1`. Scale checks: run
supabase/tests/scale_probe.sql (self-rolling-back; NO --single-transaction).

## Infra + gotchas
Repo PUBLIC until near-launch · prod dorkhub-ten.vercel.app · CI green.
proxy MUST be src/proxy.ts. `.eq(col,[])` INVALID → `.filter(col,'eq','{}')`.
NO `.or()` on user input — the feed's is GONE (feed_page RPC, typed args).
PREFILTER SELECTION WINDOWS IN SQL (5 shipped instances of the bug class).
Counts: check `error`, fail CLOSED. Sync 304s write no metadata → new synced
column needs an ETag clear. GENERATED COLUMNS ARE NULL ON `NEW` IN BEFORE
TRIGGERS (D37) — exclude them from to_jsonb guards. plpgsql with `IS NULL OR`
filter guards goes GENERIC and stops seeking — feed_page uses constant
fragments + USING binds instead. postgrest-js infers types only from LITERAL
select strings (a runtime .join() erases them). BOTH RLS suites after schema
changes; new policies need behavioral tests + negative controls. 'use server'
files: async exports only. copy.ts: static strings only. Seed projects are
UNPUBLISHED on prod (fabricated github_repo_ids at 900287465110+ — keep probe
ranges under them). if-green-then-commit (&&, never ;).
Last updated: 2026-07-30 (P3-D shipped).

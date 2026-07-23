# Current state — 2026-07-23 (late)

## Milestones
- M0–M5.5, P1 (+P1.1) ✅. P2 discovery + quality floor ✅ (+P2.1/P2.2
  enrichment fixes: Gemini direct free tier, EnrichRunner, honest stamping).
  Tags through p1 pushed; p2 + p2.5-w1 tags pending Will's green light.
- P2.5 WAVE SET 1 ✅ CODE-COMPLETE + LIVE-E2E'd (docs/plans/
  p2.5-self-running.md): PUBLISH-ALL + retro-mod (board ×3). Pipeline route
  (/api/cron/pipeline: materialize ≤10 + paced enrich ≤8, 50s soft
  deadline) driven by GitHub Actions cron :04/:19/:34/:49 + Vercel daily
  9:07 fallback. Auto-approved = approved + decided_by NULL; retro queue in
  admin (sub-20★). Import runner phase 2 "putting them on the wall".
  Gallery default = trending (/newest, /trending 308s). E2E: 29 live
  materializations, double-fire clean (0 dupes/strandings), 27 published,
  180 pending draining ~10/tick, 0 bare published cards.
- NEXT P2.5 round (not started): user reports + AI moderation screen.
  P3: public collections + rich pages. P4 launch (Pro cron swap). P5
  articles. Board note: comprehensive search/sort/filter slotted P3.

## Next steps
1. Will: gh Actions secret CRON_SECRET (orchestrator attempts via gh CLI
   first); QA — import phase 2, retro queue actions, EnrichRunner geometry/
   auto-resume, trending default. 2. Tags p2 + p2.5-w1 on green light.
3. Plan P2.5 round 2 (reports + AI screen). 4. P3.

## Open blockers
- (none — pipeline self-drains; Actions workflow needs the repo secret to
  start ticking)

## DB access (for agents)
Dedicated account, NOT the MCP (reserved for Will's other agents). Management
API via SUPABASE_ACCESS_TOKEN (curl api.supabase.com/v1) + psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD).

## Infra + gotchas
Repo PUBLIC until near-launch · prod dorkhub-ten.vercel.app · CI green.
proxy MUST be src/proxy.ts. rm -rf .next when dev errors/data look stale
(compile replays + stale unstable_cache rows). CSS aspect-ratio yields to
in-flow content (underlays absolute). GitHub og endpoint never 404s.
supabase-js .eq(col, []) serializes INVALID — use .filter(col,'eq','{}').
Run BOTH RLS suites after any schema milestone. Gate chains: always
if-green-then-commit (&&, never ;). Gemini: pinned current-gen model
(aliases 403, retired models list-but-404 for new keys).
Last updated: 2026-07-23 (P2.5 w1 live-verified; awaiting Will QA).

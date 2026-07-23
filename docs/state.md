# Current state — 2026-07-23

## Milestones
- M0–M5.5 ✅ (design system, auth, projects/sync, discovery, search/curator).
  P1 gallery engine ✅ (0006 ingestion, stars import, /admin, claim; +P1.1
  enrichment mapping + queue filters). Tags through m5.5/p1 pushed.
- VISION amended by board 2026-07-23 (docs/vision.md): quality = FLOOR not
  throttle; roadmap now P2 → P2.5 self-running gallery (publish-all + AI
  mod + reports) → P3 collections + rich pages → P4 slots/launch → P5
  articles zone (post-launch).
- P2 discovery + quality floor ✅ CODE-COMPLETE + orchestrator-QA'd
  (docs/plans/p2-discovery.md): og-image card media (2/1, CardMedia
  fallback), more-like-this, because-you-starred rail (ISR-safe island),
  /weird, search demoted to icon, import CTAs (onboarding funnel), AI
  enrichment lib + admin batch/inline (0007 live, both RLS suites green,
  479 tests). Awaiting Will: AI_GATEWAY_API_KEY + signed-in QA → tag p2.

## Next steps
1. Will: create AI Gateway key (Vercel dash) → .env.local + Vercel envs;
   signed-in QA (recs rail, onboarding→import, admin enrich round-trip).
2. Tag p2. 3. Plan P2.5 self-running gallery. 4. P3 collections+rich pages.

## Open blockers
- Enrichment E2E blocked on AI_GATEWAY_API_KEY (everything else degrades
  gracefully: AiConfigError → quiet admin banner).

## DB access (for agents)
Dedicated account, NOT the MCP (reserved for Will's other agents). Management
API via SUPABASE_ACCESS_TOKEN (curl api.supabase.com/v1) + psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD).

## Infra + gotchas
Repo github.com/willgibs/dorkhub (PUBLIC until near-launch) · prod
dorkhub-ten.vercel.app · CI green. proxy MUST be src/proxy.ts. Stale .next
replays old compile errors AND serves stale unstable_cache rows — rm -rf
.next when dev data looks pre-change. CSS aspect-ratio yields to in-flow
content height (underlays must be absolute). GitHub og endpoint never 404s.
Run BOTH RLS suites after any schema milestone (inventory drift).
Last updated: 2026-07-23 (P2 code-complete, awaiting key + Will QA).

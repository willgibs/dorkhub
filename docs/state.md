# Current state — 2026-07-30 (P4: library at ~17k; README backfill running)

## Milestones
- Through P3-D ✅ tagged. **P4 ~90%**: waves L0–L4 deployed (record:
  docs/plans/p4-launch.md); 756 tests; suites green on purged prod.
- **RAMP EXECUTED** (board directive): 2 sourcing waves (117 topics/lists,
  search bucket) + pipelined bulk drain → **16,951 published / ~14k
  profiles / 0 pending**. Immortal-residue guard added; D51 username
  policy (0020: GitHub's FULL envelope — LingDong-/Rob--W/f legal) shipped,
  19 rejections reversed, 21-row redrain queued behind the rate window.
- **README backfill IN PROGRESS**: scripts/bulk-sync.ts on the 5k/hr core
  budget (15,083 never-synced at start; ~5-7h; monitor re-armed hourly).
  Then: storage checkpoint → Supabase Pro call with MEASURED numbers
  (100MB/500MB pre-READMEs).

## Waiting on Will
1. EMAIL (2 min): Cloudflare dash → dorkhub.com → Email Routing →
   destination dorkhub1@gmail.com → address hi@dorkhub.com → Enable.
   Then I swap the terms/privacy contact.
2. FEATURED LABEL wording nod ('featured' default) · TERMS/PRIVACY review.
3. Then: DEDICATED L5 PLANNING ROUND (bar = final-product feel;
   signups-off toggle available; Pro/domain/robots-flip/cron-swap live
   there). CSP burn-in: enforce step also disables vercel.live toolbar.

## DB access (for agents)
Dedicated account, NOT the MCP. psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD). Prod LIVE — reads free; writes only as
verified ops; migrations `psql --single-transaction -v ON_ERROR_STOP=1`.
Backups: docs/ops-backup.md (snapshot before every destructive op).

## Gotchas (new first; older live in docs/plans/* + git)
Bulk drivers = app libs headless (`NODE_OPTIONS='--conditions
react-server' pnpm dlx tsx`); same-lib rule — never bypass materialize/
sync. `unset GITHUB_TOKEN` before git push (read-only PAT hijacks gh
creds). PROFILES: never star-select under API roles (PROFILE_COLUMNS);
grep projections BEFORE grant changes. Search limiter fail-OPEN vs AI
budget fail-CLOSED — both deliberate. Robots flip = robots.ts + layout.tsx
TOGETHER; /search noindex survives it. SITE_URL: src/lib/site.ts only.
CSP img-src https:-wide is LOAD-BEARING; flip via CSP_ENFORCE=1.
Last updated: 2026-07-30 eve (post-ramp; backfill + redrain in flight).

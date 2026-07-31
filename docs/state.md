# Current state — 2026-07-30 (P4: content thread COMPLETE at 16,972)

## Milestones
- Through P3-D ✅ tagged. **P4 ~90%**: waves L0–L4 deployed (record:
  docs/plans/p4-launch.md); 759 tests; suites green on purged prod.
- **CONTENT THREAD DONE**: 2 sourcing waves + bulk drain + README backfill
  → **16,972 published / 14,020 profiles / 0 pending / 0 never-synced**
  (47 repos legitimately have no README — absence shown). ALL 21 immortals
  resolved: D51 username envelope (0020) freed 19 (LingDong-/Rob--W/f live,
  URLs 200); last 2 were a REAL bug — code-unit tagline clip minted a lone
  surrogate → PGRST102 payload rejection — fixed code-point-safe (same
  idiom as L4 normalizeReason) + 3 regression tests.
- **STORAGE CHECKPOINT (measured)**: db 191 MB / 500 MB free tier (38%);
  projects rel 144 MB; README logical 249 MB → TOAST-compressed; avg 15 kB;
  ~11 kB/project all-in → free tier fits to roughly ~40k projects.
  Recommendation: stay free through launch; Pro trigger = 300 MB (60%) OR
  launch+real users (PITR value). GitHub throttling note: SECONDARY (burst)
  403s never show in core-budget numbers — don't chase "5000/5000 yet
  rate-limited" as a contradiction.

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

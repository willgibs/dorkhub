# Current state — 2026-07-31 (LIVE at $0 · U1 abyss ADOPTED)

## Milestones
- **P4 COMPLETE — dorkhub.com LIVE** at $0 (D54 posture, D55 record): domain
  via grey-cloud CNAMEs (mail untouched), CSP ENFORCED (+HSTS), robots
  flipped + per-route canonicals, sitemap 36,202 URLs on verified GSC
  (dorkhub1 account), auth round-trips both hosts, Sentry uptime green,
  Web Analytics on, weekly backup launchd agent smoke-tested. Tag `p4`.
  Post-launch same-day: wildcard A deleted; DMARC p=none live (tighten
  after clean reports); OAuth app homepage → dorkhub.com.
- **NO Vercel Pro (D54)** — GH Actions PERMANENT */15 scheduler; vercel.json
  daily crons fallback. Pro triggers: first PAID slot (same day), resource
  ceilings, chronic Actions failures. Supabase Pro at 300 MB (~191 MB now).
- **U1 DONE — "Quiet dev-native · abyss" (D56)**: R1 bake-off → R2 finalists
  → R2.5 families → R3 Will picked ABYSS + current type (no font swap).
  Abyss dark+light tokens in globals.css (radius 0.55rem, violet links);
  og-tokens.ts re-sampled; /design/directions = adopted-vs-legacy closer
  (DELETE page + directions.css once Will's done comparing). Motion
  untouched. 761 tests; verify + prod build green.

## Waiting on Will
1. Announce timing + claim invites — his clock entirely.
2. Eyeball the adopted look on prod (live after this deploy); legacy
   before/after at /design/directions. Tag `u1` on his green light.

## Post-launch watch (first month)
GSC coverage as 36k URLs index · Vercel Usage weekly · GH Actions cadence
(~90-min throttled gaps observed; daily fallback covers; chronic = Pro
trigger) · Sentry issues + uptime · dbSizeMb in pipeline responses (warn 400).

## DB access (for agents)
Dedicated account, NOT the MCP. psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD). Prod LIVE — reads free; writes only as
verified ops; migrations `psql --single-transaction -v ON_ERROR_STOP=1`.
Backups: docs/ops-backup.md + scripts/backup-prod.sh (launchd Sun 09:00).

## Gotchas (new first; older live in docs/plans/* + git)
Theme changes: RE-SAMPLE src/lib/og-tokens.ts (Satori can't parse oklch).
PostgREST 1,000-row cap: un-ranged selects TRUNCATE SILENTLY; .range()
walks end on short page ONLY without embed filters. Layout-relative
canonical ('./') → '/index' on root in PROD builds — home pages pin '/'.
`unset GITHUB_TOKEN` before git push. Last updated: 2026-07-31 (U1 R3).

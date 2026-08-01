# Current state — 2026-07-31 (LIVE at $0 · U1 abyss ADOPTED · U2 R1 built)

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
- **U1 DONE — "Quiet dev-native · abyss" (D56)**: abyss tokens product-wide,
  type unchanged; /design/directions = adopted-vs-legacy closer (delete when
  done). **U2 IN FLIGHT (docs/plans/u2-rework.md)**: full atoms→pages rework;
  GO WIDE product round; LIKES STAY PRIVATE (board). R0 migrations 0021-0023
  LIVE (active sort, rising_makers aggregate RPC, platform_stats, daily
  weird pick, tags.description). R1 exemplar BUILT + deployed noindexed:
  /preview-home + /preview-feed — hero shelf/ticker fork, discovery band
  (weird spotlight, rising makers, tag rails), feed v2 (sliding-pill chips,
  3 live sorts incl. 'active', rhythm clusters/spans fork), is-isnt v2,
  how-it-works v2, footer v2, following rail. 762 tests green.

## Waiting on Will
1. **U2 R2.5 final look**: /preview-home + /preview-feed updated per his R2
   review (hero both+entrance, quick-hits re-homed, spotlight vertical,
   sticky nav sm+, weird→random, is/isnt+capture, 'list my project', H1
   reframe A/B discover-vs-count) → pick headline + green-light R3
   adoption + autonomous W-waves.
2. Announce timing + claim invites — his clock entirely. Tag `u1`/`u2` on
   green lights.

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

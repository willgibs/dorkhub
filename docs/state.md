# Current state — 2026-07-31 (LAUNCHED: dorkhub.com live, P4 COMPLETE)

## Milestones
- **P4 COMPLETE — dorkhub.com IS LIVE** at $0 (D54 posture, D55 execution
  record): domain attached (Cloudflare grey-cloud CNAMEs → Vercel, mail
  MX/SPF/DKIM untouched), CSP ENFORCED (+HSTS), robots flipped + per-route
  canonicals, sitemap 36,202 URLs submitted on a VERIFIED GSC domain
  property (dorkhub1@gmail.com account), auth round-trips on both hosts,
  Sentry uptime monitor green (1-min), Web Analytics on (free Hobby tier),
  weekly backup launchd agent smoke-tested. 761 tests; content: 16,972
  published / 14,020 profiles / 5,199 sitemap-worthy tags.
- **NO Vercel Pro (D54)** — GH Actions is the PERMANENT */15 scheduler;
  vercel.json daily crons = fallback. Pro triggers: first PAID slot (same
  day — Hobby ToS), resource ceilings, chronic Actions failures. Supabase
  Pro separately at 300 MB (now ~191 MB) or PITR-worthy UGC.
- **Tag `p4` pushed** (Will's green light 2026-07-31). Post-launch cleanups
  DONE same day: stale wildcard A deleted; DMARC live (_dmarc p=none,
  rua→hi@dorkhub.com — tighten to quarantine/reject after clean reports);
  GitHub OAuth app homepage → dorkhub.com. **Next round: UI upgrade (Will).**

## Waiting on Will
1. Announce timing + claim invites — his clock entirely.
2. **U1 pick (R2)**: https://dorkhub.com/design/directions is LIVE —
   warm-terminal / paper-zine / electric-depth vs current, real content,
   noindexed (docs/plans/u1-ui-refresh.md). His pick (or hybrid, or keep
   current) → R3 adoption wave.

## Post-launch watch (first month)
GSC coverage as 36k URLs index · Vercel Usage weekly (bandwidth/analytics
events) · GitHub Actions cadence (observed ~90-min throttled gaps 07-31;
daily fallback covers; chronic = Pro trigger) · Sentry issues + uptime ·
dbSizeMb in pipeline responses (warn 400).

## DB access (for agents)
Dedicated account, NOT the MCP. psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD). Prod LIVE — reads free; writes only as
verified ops; migrations `psql --single-transaction -v ON_ERROR_STOP=1`.
Backups: docs/ops-backup.md + scripts/backup-prod.sh (launchd Sun 09:00).

## Gotchas (new first; older live in docs/plans/* + git)
PostgREST 1,000-row cap: un-ranged selects TRUNCATE SILENTLY (sitemap hit
it at 3,011); .range() walks terminate on short page ONLY without embed
filters — an inner-embed filter makes pages short mid-set (walk to zero, or
derive from already-fetched rows). Layout-relative canonical ('./') resolves
to '/index' on the root route in PROD builds only — home pages pin '/'.
SITE_URL: src/lib/site.ts only. Robots flip DONE; /search noindex survives.
`unset GITHUB_TOKEN` before git push. Bulk drivers = app libs headless.
Last updated: 2026-07-31 (launch session).

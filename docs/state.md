# Current state — 2026-08-01 (LIVE at $0 · U2 adopted · W3 destination pages shipped)

## Milestones
- **P4 COMPLETE — dorkhub.com LIVE** at $0 (D54 posture, D55 record): domain
  via grey-cloud CNAMEs (mail untouched), CSP ENFORCED (+HSTS), robots
  flipped + per-route canonicals, sitemap on verified GSC (dorkhub1
  account), Sentry uptime green, Web Analytics on, weekly backup launchd
  agent. Tag `p4`. DMARC p=none live (tighten after clean reports).
- **NO Vercel Pro (D54)** — GH Actions PERMANENT */15 scheduler; vercel.json
  daily crons fallback. Pro triggers: first PAID slot (same day), resource
  ceilings, chronic Actions failures. Supabase Pro at 300 MB (~191 MB now).
- **U1 DONE (D56)** — "Quiet dev-native · abyss": abyss tokens product-wide,
  type unchanged. `/design/directions` still holds the legacy before/after
  (delete it and `src/styles/directions.css` when Will's done comparing).
- **U2 DONE (D57)** — full UI rework adopted: `/` and `/home` are the
  approved composition (hero → discovery band → gallery → how-it-works +
  capture), `/active` is a real sort, mobile header is one row + Sheet menu
  sticky at every width, motion backlog shipped.
- **W3 DONE (2026-08-01)** — the two destination pages. Project page:
  masthead + 780px README beside a sticky maker/contents rail, and README
  navigability fixed for all 16,925 stored READMEs (ids harvested from
  GitHub's own autolink artifact; dead empty anchors removed). Profile page:
  maker masthead with derived languages + total stars. Component dedupe:
  one SectionHead, one formatCount, one ListRow, shared StatBlock.

## Waiting on Will
1. **Live look** — dorkhub.com (home, /active, a phone for the nav) plus a
   project page and a maker page → `u2` + `w3` tags on his green light.
2. Announce timing + claim invites — his clock entirely. `u1` tag too.

## Tabled with board agreement (next rounds)
- **List-any-repo-by-URL** — high value, needs the safety pass first: route
  through the existing ingest + moderation pipeline (never direct publish),
  rate limits/quotas, ownership-vs-third-party semantics.
- **Nav IA expansion** — browse/active/tags/random reads smaller than the
  site is; do it alongside the pages that deserve nav weight.
- W-wave remainder: /search v2, tags curation, flows with occasion
  (new/onboarding/claim/import), per-route loading.tsx states, admin
  coherence, /sponsor. ScreenshotGallery + UpdatePost are BUILT and unwired
  — both need owner-authored data (0 rows, 1 claimed profile), so they wait
  on claims, not on design.

## Post-launch watch (first month)
GSC coverage as 36k URLs index · Vercel Usage weekly · GH Actions cadence
(~90-min throttled gaps observed; daily fallback covers) · Sentry issues +
uptime · dbSizeMb in pipeline responses (warn 400).

## DB access (for agents)
Dedicated account, NOT the MCP. psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD). Prod LIVE — reads free; writes only as
verified ops; migrations `psql --single-transaction -v ON_ERROR_STOP=1`.
Backups: docs/ops-backup.md + scripts/backup-prod.sh (launchd Sun 09:00).

## Gotchas (new first; older live in docs/plans/* + git)
The embedded browser pane runs pages as a HIDDEN document: IntersectionObserver
never fires and CSS transitions freeze at their start value there — measure
with `transition:none` before believing a computed colour, and verify
scroll-driven UI another way. GitHub's `primary_language` has CASE VARIANTS
("Vim script"/"Vim Script", Matlab/MATLAB) — group case-insensitively before
tallying. A `<script>` under a client component server-renders fine but warns
on every client render — keep JSON-LD outside providers. Deleting a route
leaves STALE .next route types. A root not-found ALSO renders inside a route
group's layout. Feed cursors: encoding one from an absent timestamp decodes
to null and silently re-serves page 1. Theme changes: RE-SAMPLE
src/lib/og-tokens.ts (Satori can't parse oklch). PostgREST 1,000-row cap
truncates un-ranged selects. `unset GITHUB_TOKEN` before git push.
Last updated: 2026-08-01 (W3).

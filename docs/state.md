# Current state — 2026-08-01 (LIVE at $0 · U2 + W3 + W4 shipped)

## Milestones
- **P4 COMPLETE — dorkhub.com LIVE** at $0 (D54 posture, D55 record): domain
  via grey-cloud CNAMEs (mail untouched), CSP ENFORCED (+HSTS), robots
  flipped + per-route canonicals, sitemap on verified GSC (dorkhub1
  account), Sentry uptime green, Web Analytics on, weekly backup launchd
  agent. Tag `p4`. DMARC p=none live (tighten after clean reports).
- **NO Vercel Pro (D54)** — GH Actions PERMANENT */15 scheduler; vercel.json
  daily crons fallback. Pro triggers: first PAID slot (same day), resource
  ceilings, chronic Actions failures. Supabase Pro at 300 MB (~191 MB now).
- **U1 (D56, tag `u1`)** — "Quiet dev-native · abyss" tokens product-wide.
  `/design/directions` still holds the legacy before/after (delete it and
  `src/styles/directions.css` when Will's done comparing).
- **U2 (D57, tag `u2`)** — the browse path: composed home + feed, `/active`,
  mobile navbar, motion pass.
- **W3 (tag `w3`)** — the destinations: project masthead + reading rail +
  README navigability for all 16,925 stored READMEs; maker page. Stat reels
  spin in on load (W3.1, board request).
- **W4 (2026-08-01)** — the intent path. Tag pages got a masthead,
  descriptions (migration 0024) and co-occurring tags; `/tags` became a real
  directory (see gotcha below); `/search` results carry language/stars/tags
  and both zero-states offer a way onward; route-level `loading.tsx` renders
  layout shapes, closing the last U2 bar item.

## Waiting on Will
1. **Live look** — home, a project page, a maker page, `/tags`, `/t/rust`,
   `/search` → `w4` tag on his green light.
2. **The 22 curated tag descriptions** (migration 0024) are public
   voice-bearing copy on indexable pages — his to edit freely.
3. Announce timing + claim invites — his clock entirely.

## Tabled with board agreement (next rounds)
- **List-any-repo-by-URL** — needs the safety pass first: route through the
  existing ingest + moderation pipeline (never direct publish), rate
  limits/quotas, ownership-vs-third-party semantics.
- **Nav IA expansion** — do it alongside the pages that deserve nav weight.
- **Claim / onboarding flow** — W3 pointed a lot of traffic at `/claim`; its
  value is set by when invites go out, so it waits on Will's clock.
- Remainder: tags curation (a content project — 21,678 tags have <5
  projects; distinct-name language aliases like VimL vs Vim script likewise),
  admin coherence, /sponsor. ScreenshotGallery + UpdatePost stay unwired —
  0 rows, 1 claimed profile; they wait on claims, not design.

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
**Route `loading.tsx` INHERITS DOWNWARD** — one beside a page also covers
every route nested under it, so check the shape per subtree (a profile
skeleton was flashing on project and lists pages; fixed with a `(profile)`
route group). A group-root `loading.tsx` would cover /settings and /admin.
**An unordered, unranged PostgREST call is a silent arbitrary slice** — the
1,000-row cap truncated a 24,678-row tally with no ORDER BY and nothing said
so. **Sanity-check derived figures against the corpus**: summing a tag tally
produced "35k tagged projects" for a 16,972-project site. The embedded
browser pane runs pages as a HIDDEN document: IntersectionObserver never
fires, CSS transitions freeze at their start value, and timer loops stall —
measure with `transition:none`, and don't trust a first cold-render
measurement (compiling a route renders it more than once). GitHub's
`primary_language` has CASE VARIANTS ("Vim script"/"Vim Script"). A
`<script>` under a client component warns on every client render — keep
JSON-LD outside providers. Deleting or MOVING a route leaves STALE .next
route types (and changes generated OG filename hashes). A root not-found
ALSO renders inside a route group's layout. Feed cursors: encoding one from
an absent timestamp decodes to null and silently re-serves page 1. Theme
changes: RE-SAMPLE src/lib/og-tokens.ts (Satori can't parse oklch).
`unset GITHUB_TOKEN` before git push. Last updated: 2026-08-01 (W4).

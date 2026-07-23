# P2 — Discovery mechanics + quality floor (execution plan)

Status: **in progress** (2026-07-23). Board approved the roadmap resynthesis
(publish-all → P2.5, public collections → P3, articles → P5 post-launch);
P2 ships as designed — it is the prerequisite quality floor for P2.5.

## Locked decisions (validated against code — do not re-litigate)

1. **og-image aspect: natural `aspect-[1200/630]`, object-cover, no crop** —
   GitHub's og layout puts title/stats near edges; filling the old 16/10
   slot would crop ~8% per side and clip text. Card media block +
   skeleton-card change aspect together. `MediaPlaceholder` SVG stays as
   underlay (letterbox bands are `--surface-2`, invisible).
2. **Plain lazy `<img>` hotlink, never next/image** (cost rule, biome-ignore
   convention). Broken-image fallback via a tiny `'use client'` CardMedia
   wrapper: onError hides the img, revealing the placeholder underlay. URL
   built from our own DB `repo_full_name` (NOT NULL on projects) — no
   user-supplied URLs, no allowlist needed.
3. **Fixtures get `repoFullName?: string` on the TYPE only** — fixture data
   untouched so /design never hotlinks nonexistent repos. One dedicated og
   demo (`vercel/next.js`) added to /design/components.
4. **`FEED_COLUMNS` becomes the single exported projection** — add
   `repo_full_name` to both the `FeedRow` Pick AND the select string (IO-cast
   means a miss is a runtime undefined, not a type error); delete /saved's
   hand-mirrored `SAVED_PROJECT_COLUMNS` (documented drift hazard).
5. **More-like-this reads via supabaseAnon + unstable_cache** (project page
   tree is dynamic — cookie-bound reads; caching must live below it).
   `.overlaps('tags', …)` rides the partial GIN index (must keep
   `.eq('status','published')`). Gate on published (no rail under drafts);
   merge related ids into the page's EngagementProvider.
6. **Recs rail = client island + server action returning pre-rendered cards**
   (loadMoreFeed precedent) — /home stays ISR-60; the island's SSR shell is
   identical for all users, personalization arrives client-side (same
   contract as site-header-auth). Server-action-on-mount is a deliberate,
   documented rule-bend to reuse renderFeedCards' server markup. One island,
   two states: cards, or an import-CTA card when the user has no signal.
7. **/weird = route handler, `force-dynamic`, one-off random OFFSET pick**
   (documented exception to the no-OFFSET *feed* rule) → 307 to the project
   page (which stays ISR-cached). Nav link MUST be `prefetch={false}`.
8. **Enrich condition is OR, not AND**: `!description || topics.length === 0`
   — a described-but-untagged repo is invisible to every tag-driven surface.
   Approve-time precedence keeps human data first: real description beats
   ai_tagline, real topics beat ai_tags. Enriched tags deliberately feed the
   discovery graph (more-like-this, recs, /tags connectivity).
9. **Queue-time batch enrichment is the primary path** (admin reviews
   ai_tagline/ai_tags on the pending row BEFORE approving). Approve-time
   inline fallback (both fields still empty) is best-effort: publish proceeds
   on AI failure (og image + name still carry the card); generated tagline is
   echoed in the success banner. In P2.5 this same lib becomes the automatic
   pre-publish floor.
10. **AI Gateway via plain fetch, no SDK** (matches no-octokit):
    `POST https://ai-gateway.vercel.sh/v1/chat/completions`, Bearer
    `AI_GATEWAY_API_KEY`, default model `google/gemini-2.5-flash-lite`
    (override `AI_GATEWAY_MODEL`). Lazy env read + `AiConfigError` + injected
    `fetchImpl`, mirroring src/lib/github/client.ts. $5/mo recurring free
    credit, zero markup — volume is pennies → no new spend, no board gate.
11. **Onboarding funnels to import on the fresh-insert path only** —
    `redirect('/settings/import?from=onboarding&next=…')` with a quiet
    skip link (`safeNextPath`-validated). Double-submit path keeps
    `redirect(next)`.

## Migration 0007_enrichment.sql (orchestrator, pre-wave)

ai_tagline text (≤120 check) + ai_tags text[] default '{}' + enriched_at
timestamptz on ingest_candidates. Zero-grant table → columns inherit
deny-all. After apply: regenerate types.ts (Management API, NOT the MCP) —
hard dependency for Wave 2D; extend rls_checks_ingestion.sql section I8;
run both suites vs live DB.

## Waves

### Wave 1 (4 parallel, no shared files)
- **1A card imagery**: NEW src/lib/projects/github-og.ts
  (`githubOgImageUrl` + test); repo_full_name into FeedRow/FEED_COLUMNS
  (export it) + ProjectCardSourceRow/map (+ test); saved/page.tsx imports the
  export (delete SAVED_PROJECT_COLUMNS); fixtures type-only field; NEW
  src/components/card-media.tsx ('use client', onError fallback); project-
  card.tsx media slot aspect-[1200/630] + showMedia rule; skeleton-card
  aspect; /design og demo.
- **1B AI lib**: NEW src/lib/ai/gateway.ts (AiConfigError, chatCompletion
  result-objects); NEW src/lib/ai/enrich.ts (buildEnrichmentPrompt,
  parseEnrichmentResult, needsEnrichment); getReadmeRaw in github client;
  tests for all (real Response objects, fetchImpl injection).
- **1C search/weird/nav**: search-trigger icon-only all widths; NEW
  src/app/weird/route.ts (force-dynamic random pick → 307); NAV_LINKS
  browse · tags · weird (prefetch false); feed-section empty state links the
  "go find something weird" phrase to /weird.
- **1D import CTAs**: onboarding fresh-insert → /settings/import?from=
  onboarding&next=…; import page skip link (safeNextPath); import-runner
  done always shows browse CTA; /following empty state gains import link.

### Wave 2 (parallel, after Wave 1 + 0007 + types regen)
- **2A more-like-this**: NEW src/lib/related/queries.ts (unstable_cache
  ['related', id] 300s; overlaps limit 4 + language backfill; mergeRelatedRows
  + test); render-cards.tsx {variant} opt; NEW related-projects.tsx section;
  project page mount (published only) + EngagementProvider id merge.
- **2B recs rail**: NEW src/lib/recs/derive.ts (topTags via tallyProjectTags,
  exclusion cap 100, tests); NEW home/actions.ts loadHomeRecs() (import-cta |
  cards | none); NEW home/recs-rail.tsx client island; home/page.tsx mount
  above FeedSection.
- **2D enrichment admin**: enrichCandidates action (≤20 sequential, readme
  best-effort, ?enriched=N&aifailed=M); approveCandidate ai_* precedence +
  inline fallback + banner echo; queue page needs-content badge, ai field
  display, enrich button, banners.

### Wave 3 (orchestrator)
Copy keys (relatedTitle/recsTitle/recsImportNudge/importSkip/emptyFeedLead+
Link — pre-added in pre-wave); docs sweep; gates per wave (if-green-then-
commit); RLS suites vs live DB; live E2E checklist (og imagery incl. blocked-
URL fallback, related on published/absent on drafts, /weird thrice, icon-only
search + ⌘K, onboarding→import→skip, /following import link, recs rail both
states, enrich→review→approve round-trip, AI Gateway usage ≪ $5); tag p2.

## Env
`AI_GATEWAY_API_KEY` (Will creates in Vercel dashboard → .env.local + Vercel
envs). Optional `AI_GATEWAY_MODEL` override. Absence degrades loud-in-logs,
quiet admin banner — everything else in P2 works without it.

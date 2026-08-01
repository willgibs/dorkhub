# U2 — Full UI/product rework (board-directed, 2026-07-31)

Will's verdict after U1: abyss was "a nice style change," but the ask was a
**full UI rework — atoms → molecules → organisms → pages**; today reads like
"how a junior designer would first approach each page." Full plan + audit
evidence: the approved plan (2026-07-31) — condensed here as the living
round doc.

**Board calls:** (1) GO WIDE — product round, new discovery/social modules.
(2) Exemplar = home + feed, defines the bar. (3) Exemplar bake-off → board
pick → fully autonomous wave. (4) **LIKES STAY PRIVATE** — counts public,
identities never; social proof uses public-graph fabrics only (follows,
lists, aggregated rising-makers). project_likers REJECTED.

## The bar (every reworked surface must pass)

1. Bespoke composition — no page ships as `h1 + grid`.
2. Density with calm (linear/resend/basehub/paper reference).
3. Wire the social + media fabric (galleries, updates, hover cards, stacks).
4. States are designed (loading/empty/error/404).
5. Motion completes it (emil first; review-animations gates motion waves).
6. Sacred constraints (14 micro-details, copy.ts, absence-not-zero,
   tokens-only, RSC/island split, sanitize paths, RLS invariants).
7. $0 posture (ISR-cached anon modules, rails capped, no new paid infra).

## R0 — foundations (EXECUTED 2026-07-31, commit 7617ec2)

Migrations 0021–0023 live on prod (snapshot first; --single-transaction;
probed at 17k rows; RLS assert: anon on likes still permission-denied):
- 0021 `idx_projects_pushed_at` + `feed_page` `'active'` branch (INVOKER
  stays, D32; nulls excluded from the sort's domain).
- 0022 likes/saves created_at indexes + `rising_makers(days, limit)`
  DEFINER RPC — returns (maker, score) aggregates ONLY.
- 0023 `platform_stats()`, `weird_pick_for_date(date)` (deterministic
  daily, cacheable; /weird stays force-dynamic random), `tags.description`.
Deferred: `is_pinned` (sort_order-as-pin MVP first), `profiles.projects_count`
(on-demand mini route first), `project_likers` (rejected).
types.ts synced by hand. Probes: active sort 42ms; stats 16,972/14,020/24,678
exact; weird pick deterministic across calls.

## R1 — exemplar (EXECUTED 2026-07-31; awaiting R2 pick)

`/preview-home` (signed-out) + `/preview-feed` (signed-in) — (app) group so
real chrome renders; `robots:{index:false,follow:true}`; NOT in sitemap.ts;
real data via the same cached anon lib prod uses; live pages untouched.

Built (all real data): **Hero v2** (word-rise kept, left-anchored; live
platform proof line; contested fork A/B: drifting card SHELF vs linear
TICKER). **Discovery band**: weird spotlight (deterministic daily pick,
bespoke stage), rising makers (AvatarStack's first production seat +
ranked rows, aggregates only), 3 curated tag rails (generative-art / cli /
homelab; horizontal snap-scroll, edge fade). **Feed v2**: sliding-pill sort
chips (emil's duplicated-row clip-path technique — GPU-only, interruptible,
200ms ease-quiet-in-out; deferred motion backlog item shipped), THREE live
sorts (trending / newest / ACTIVE — the 0021 sort's debut), rhythm fork
A/B: lead-card 2-col span + mid-stream compact "quick hits" cluster
(clusters) vs span-only (spans); featured slots stay inline-labeled.
**Is/Isn't v2** (one split panel, ghost ✓/✗ ordinals), **How-it-works v2**
(connected step nodes + abstract UI vignettes), **Footer v2** (brand +
live counts + 3 nav columns + ✦ legal row). **preview-feed**: RecsRail
(kept) + NEW FollowingRail (loadHomeRecs pattern verbatim, zero new RPCs)
+ tighter discovery + feed v2. ONE EngagementProvider per page, unioned ids.

Harness: PreviewFrame banner (u2 preview badge + note) with chip toggles
for the two contested forks (hero shelf/ticker; rhythm clusters/spans) —
the U1 switcher idiom applied to composition.

Gate: verify + 762 tests + prod build green; sitemap diff empty; noindex
rendered; console clean; dark+light QA; sort-swap + pill verified in DOM.
Dev-pane caveat: the embedded pane black-tiles very tall composited pages
at desktop width (raster limit, DOM verified healthy; mobile width paints
fully) — re-verified on prod in real Chrome.

## R2 — board verdict (Will, 2026-07-31/08-01)

"Seriously great push in a beautiful direction… engaging and creatively
correct." Forks: hero = **BOTH** (shelf beside headline + ticker beneath,
shelf animates out on load — transitions.dev card-stack reference — with
breathing room); rhythm = quick-hits strip loved but broke the gallery →
**re-home it, gallery goes spans-only**. Also directed: og-image/card
combos always stack VERTICALLY (2:1 never crops); navbar fixed; 'weird' →
'random' nav name; is/isn't folds under how-it-works as a /new conversion
capture; nav CTA → 'list my project'; H1 reframed discovery-first (creator
framing is the minority audience); shimmer word treatment dropped (its
baseline bug too); card v2 designs + more discovery pages encouraged
(deep-discoverability platform is the goal); feed page inherits all.

## R2.5 — revisions (EXECUTED 2026-08-01)

All R2 items applied: hero composes shelf (stacked→fan entrance chained
into drift, u2-shelf-enter on motion tokens) + ticker; H1 A/B harness
('discover the things devs build for fun' vs live-count '17k things devs
built for fun — find yours') over shared discovery sub; quick hits → 
DiscoveryBand module fed by the 'active' sort; FeedRhythm = lead-span +
uniform only; spotlight restacked media-top (og uncropped); sticky navbar
product-wide at sm+ (mobile header too tall to pin — compact mobile header
is a W-wave item) with backdrop veil; /random route + /weird 308 alias +
nav/footer/empty-state hrefs; how-it-works v2.1 = steps + is/isn't panel +
'made something for fun?' capture → /new; ctaPrimary = 'list my project'.
Product-wide bits shipped live (sticky, renames) per explicit direction.
Voice-flavor "weird" strings kept (nav-name clarity, not vocabulary purge)
— board can override. Gates: verify + 762 tests + build green; QA matrix
per the R2.5 plan.

## R3-rev — second review pass (Will, 2026-08-01; EXECUTED same day)

14 items: entrance slowed (300ms settle + 700ms travel + 160ms stagger;
word-rise 60ms/120ms base — marketing-surface budget); shelf picks CURATED
(pickShelfRows: ascii names, real taglines, distinct languages, stars-desc
— no hand-pinning); H1 board-final 'discover the best tools for your next
project' (text-balance; harness toggles all retired); tone de-exclusived
sitewide (sub 'a curated gallery of developer projects…', capture 'built
something worth sharing?' — playful register stays, side-project-only
framing does not); ctaPrimary 'list a project'; ticker pauses on hover +
items are real project links; SectionHead v2 (kicker + display title +
note) on discover/gallery/quick-hits/how-it-works + section py 16/20;
**ProjectCard product-wide fixes**: real avatars finally render (mapper
dropped avatar_url — the "never loaded" bug), featured label = floating
chip ON media (top-alignment restored; bar survives only media-less),
whole card clickable via stretched title link (tags/author/like elevated
z-10); how-it-works redesigned (labels below nodes — the line no longer
strikes text; halo nodes, bigger vignettes); feed page reordered
(discover → gallery → quick hits → following → starred); "weird"
vocabulary retired sitewide (random/new per fit).

## R3 — ADOPTION (EXECUTED 2026-08-01, board: "both approved")

Shipped as four gated sub-waves (A1 feed platform · A2 composition ·
A3 mobile nav · A4 motion), each verified and pushed on its own; full
record in decisions.md **D57**. Headlines: 'active' is a real sort with a
real `/active` route and verified keyset seeking; the preview composition
IS `/` and `/home` (previews + harness deleted); the header collapses to
one row under `sm` behind a Sheet menu, so sticky nav works at every
width; the deferred motion backlog shipped (counter reel, skeleton
reveal, error shake, text swap, clear dissolve, menu stagger) adapted from
the transitions.dev skill onto our tokens.

Three bugs surfaced and fixed on the way: card avatars had NEVER loaded
(the row mapper dropped `avatar_url`); every in-app 404 rendered the whole
shell twice; and `toFeedPage` could encode a cursor that decodes to null,
silently re-serving page 1.

**TABLED for W-waves (board-flagged, agreed):**
- **List-any-repo-by-URL** ('list a project' names it already): route the
  existing admin manual-add/ingest pipeline through a user-facing form →
  ingest_candidates + moderation queue (NOT direct publish). Safety pass
  first: spam/abuse rate limits (search-limiter idiom), per-user quotas,
  AI-triage budget, ownership vs third-party listing semantics
  (curated-unclaimed consent rules apply), blocklist checks.
- **Nav IA expansion**: browse/tags/random reads smaller than the site is;
  design comprehensive nav (+ future pages: /active, makers, lists
  discovery) as part of W3+ when those pages exist.

## R3 + W-waves (post-pick, each independently shippable)

R3 adopt exemplar into real `/` + `/home` + feed variants (watch: canonical
pins + webSiteJsonLd survive the swap; no cookies in RSC trees; provider
chunk math; featured inline structure) → W1 atoms/primitives propagation →
W2 cards+molecules (wire UserHoverCard via /api/profiles/[username]/mini,
ScreenshotGallery on the pre-provisioned bucket+column, UpdatePost on
project_updates; body_md via per-request sanitize path ONLY) → W3 organisms
per page (project detail → profile → tags → saved/following → search
[static-shell+noindex contract preserved] → new/onboarding/claim/import →
settings) → W4 marketing/utility (/sponsor conversion page) → W5 states
layer (loading.tsx architecture, per-segment error.tsx, richer 404, sticky
header decision) → W6 admin coherence → W7 motion completion
(review-animations gate) → W8 docs (+design-system v2, /design catalog,
ADR, og-tokens re-sample if tokens move, `u2` tag on green light).

Risk register lives in the approved plan; top lines: rails ≤5/page on own
cache keys; one provider per page; RecsRail island pattern for anything
personalized; sitemap.ts thresholds FROZEN; pnpm test per sub-wave; no new
CSP origins; PostgREST 1k cap; likes-privacy invariant in every new RPC.

# Current state — 2026-07-27 (latest)

## Milestones
- M0–P2.5.1 ✅ LIVE (207 published; schedulers self-running).
- P2.6 IMMUNE SYSTEM ✅ — reports (deny-all, ≤5/day) + AI triage
  (ok/review/flagged, TRIAGE-ONLY) as pipeline pass 3 (5 enrich + 3 screen).
- P3-A LISTS ✅ — collections/collection_items (0010, 30 policies), stable
  slugs, caps, reserved slug 'lists', dropdown + profile section.
- P2.7 HARDENING ✅ (Opus 5; docs/plans/p2.7-hardening.md). Defect-only round
  off an adversarial audit of cf6a0e0..e23c286. NO migration. Fixed: moderation
  prompt injection (description_md/tagline are in the authenticated UPDATE
  grant — a forged 'ok' verdict was permanent); retro-screen stall (THIRD
  strike of the window-vs-population class — window now walks via .range());
  feed cursor validators (isString → uuid + ISO; they feed a PostgREST .or()
  on the public /api/feed); private lists staying visible on the ISR-cached
  profile page for 300s. Plus optimistic-revert-on-throw, draft gating, a11y,
  force-dynamic on both lists pages. New meta-guards catch the two build-only
  bug classes.
- TAGGED: p2 (3c99992) · p2.5-w1 (5e07e38) · p2.6 (503d516) · p3a (e23c286).

## for fable (re-entry agenda)
Review P2.6 + P3-A + P2.7 in situ · plan P3-B (search/sort/filter +
appears-in-N-lists signal + rich pages + design QA). Deferred INTO P3-B by
P2.7 as polish/taste rather than defects: verdict-chip type treatment
(flagged vs review render in different fonts); profile lists section's `//`
kicker not aria-hidden + hand-rolled instead of SectionHeader; "N items"
hardcoded and pluralized in 3 places with font drift; item counts disagree
between index and detail when a member project is unpublished; lists-index
`<title>` doesn't name its owner; EditListForm has no pending/success feedback
and reports partial multi-action failure as whole-form failure; emoji
surrogate-pair clip in parseScreenResult; deleteList's failure path redirects
to `/`. Also: the PROJECT page is per-viewer but keeps `revalidate = 300`
(inert — supabaseServer's cookies() forces dynamic); P2.7 corrected the stale
comment but left the caching decision to you. Pre-existing dev-console noise:
"script tag while rendering React component" on every page.

## Open blockers
- (none)

## Will-QA (needs a real signed-in session)
Report dialog e2e + already-reported + rate-limit copy · lists CRUD ·
add-to-list dropdown + auto-add-on-create · H1-d private-list revalidation
(revalidatePath only fires from the server action, so psql can't exercise it).

## DB access (for agents)
Dedicated account, NOT the MCP (reserved for Will's other agents). Management
API via SUPABASE_ACCESS_TOKEN (curl api.supabase.com/v1) + psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD).

## Infra + gotchas
Repo PUBLIC until near-launch · prod dorkhub-ten.vercel.app · CI green.
proxy MUST be src/proxy.ts. rm -rf .next on stale weirdness. .eq(col,[])
INVALID → .filter(col,'eq','{}'). NO .or() on user input (feed keyset is the
one internal exception — and only safe because P2.7 made the cursor validators
real). PREFILTER SELECTION WINDOWS IN SQL — this class has now bitten 3× (P2.1,
P2.6, P2.7); a JS filter applied after a fixed window is the tell. BOTH RLS
suites after schema changes. 'use server' files: async exports only (meta-test
guards it). Seed projects are UNPUBLISHED on prod — behavioral tests resolve
published targets at runtime. if-green-then-commit (&&, never ;).
Last updated: 2026-07-27 (P2.7 hardening shipped + tagged; P3-B awaits Fable).

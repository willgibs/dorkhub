# Current state — 2026-07-27 (latest)

## Milestones
- M0–P2.5.1 ✅ LIVE (207 published; schedulers self-running).
- P2.6 IMMUNE SYSTEM ✅ — reports (deny-all, ≤5/day) + AI triage
  (ok/review/flagged, TRIAGE-ONLY) as pipeline pass 3 (5 enrich + 3 screen).
- P3-A LISTS ✅ — collections/collection_items (0010, 30 policies), stable
  slugs, caps, reserved slug 'lists', dropdown + profile section.
- P2.7 HARDENING ✅ (Opus 5; docs/plans/p2.7-hardening.md). Defect-only, NO
  migration, off a 46-finding adversarially-verified audit of cf6a0e0..e23c286.
  H1 moderation prompt injection (description_md/tagline are in the
  authenticated UPDATE grant — a forged 'ok' was permanent) · retro-screen
  stall · feed cursor validators (public /api/feed reached a PostgREST .or())
  · private lists visible on the ISR profile page for 300s. H2
  optimistic-revert-on-throw, draft gating, a11y, force-dynamic lists pages.
  H3 meta-guards for the two build-only bug classes. H5 admin retro window
  (FOURTH window-then-filter — was ~4 auto-publishes from the safety net
  reading "none" forever) · fail-closed caps · RLS T23/T24 + un-vacuumed T21 ·
  ON_ERROR_STOP (both suites had been able to print ALL CHECKS PASSED after a
  failure) · OPEN_REPORTS_WINDOW · engagement overlay chunking.
- TAGGED: p2 (3c99992) · p2.5-w1 (5e07e38) · p2.6 (503d516) · p3a (e23c286).

## for fable (re-entry agenda)
Review P2.6 + P3-A + P2.7 in situ · plan P3-B (search/sort/filter +
appears-in-N-lists + rich pages + design QA).
**Deferred WITH REASONS in docs/plans/p2.7-hardening.md — read that section
before P3-B.** Load-bearing ones: a later report can silently clear an earlier
`flagged` verdict (upsert-overwrite is locked D5 — should flagged be sticky?);
admin manual enrich drain sits outside the AI budget (D3); pass 3 starves
behind passes 1–2 and no AI call has a timeout (D3 ordering); the screen engine
walks decided_at ASC while the admin retro section walks DESC, so the P2.6
ADR's "match exactly" claim is false; home recs rail is another
window-then-filter (low impact). Plus the design/copy polish set and the
project page's per-viewer `revalidate = 300` (inert; comment corrected, caching
decision left to you). Pre-existing dev-console noise: "script tag while
rendering React component" on every page.

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
(PGPASSWORD=$SUPABASE_DB_PASSWORD). Prod is LIVE data — reads are fine, never
write; schema experiments only inside a transaction you roll back.

## Infra + gotchas
Repo PUBLIC until near-launch · prod dorkhub-ten.vercel.app · CI green.
proxy MUST be src/proxy.ts. rm -rf .next on stale weirdness. .eq(col,[])
INVALID → .filter(col,'eq','{}'). NO .or() on user input (the feed keyset is
the one internal exception, safe only because P2.7 made the cursor validators
real). PREFILTER SELECTION WINDOWS IN SQL — this class has bitten 4× (P2.1,
P2.6, P2.7 screen, P2.7 admin); a JS filter after a fixed window is the tell,
and PostgREST CAN filter an `!inner` embed's columns before the LIMIT. Counts:
always check `error` and fail CLOSED — `count ?? 0` reads a failed query as
zero. BOTH RLS suites after schema changes; new policies need a BEHAVIORAL
test (§3a only compares name+cmd) and negative-control it by widening the
policy inside the suite's own rolled-back transaction. 'use server' files:
async exports only (meta-test guards it). Seed projects are UNPUBLISHED on
prod. if-green-then-commit (&&, never ;).
Last updated: 2026-07-27 (P2.7 H5 shipped; P3-B awaits Fable).

# Current state — 2026-07-29

## Milestones
- M0–P2.5.1 ✅ LIVE (207 published; schedulers self-running).
- P2.6 IMMUNE SYSTEM ✅ · P3-A LISTS ✅ · P2.7 HARDENING ✅
  (tagged p2 / p2.5-w1 / p2.6 / p3a).
- P3-B PART 1 ✅ rich pages + lists signal (docs/plans/p3b-rich-pages.md,
  migration 0011). `projects.lists_count` (PUBLIC membership only, D18;
  display-only, no trending input, no index) + `projects.github_pushed_at`
  (real repo activity — `updated_at` bumped on our own sync writes, so all 207
  read "updated hours ago"). README fidelity: h3–h6 were unstyled on every
  page, tables now scroll, badges unboxed, images lazy, reading column at the
  reference's 780px (~122 → ~87 chars/line). 196 unclaimed profiles backfilled
  with real GitHub avatars; unclaimed badge de-duplicated into copy.ts and
  paired with an "is this you?" claim link. Plus the two P2.7 deferrals I owed:
  `flagged` never auto-downgrades (D22) and the home recs window (5th
  window-then-filter sighting).

## Next (P3-B remainder — not started)
Search + `/search` (palette-only today; no results page, no relevance ranking —
ranking is popularity, so an exact name match loses to a popular incidental
tagline match) · faceted filter / `/browse` (NB: `resolveFeedFilterSpec`
lowercases `language` then does an exact-case `.eq()`, so that axis is dead
code today and must be fixed before anything is built on it) · design/motion QA
sweep. Full research (4 areas, probed live) is in the P2.7 audit output; the
plan file is ~/.claude/plans/sparkling-herding-star.md.

## Deferred, with reasons (read before P3-B remainder)
docs/plans/p2.7-hardening.md "Deliberately deferred" + p3b-rich-pages.md
"Known / deferred". Load-bearing: admin manual enrich drain sits outside the AI
budget (D3); pass 3 starves behind passes 1–2 and no AI call has a timeout;
screen engine walks decided_at ASC while the admin retro section walks DESC, so
the P2.6 ADR's "match exactly" claim is false; list item counts include
projects that are no longer visible. Plus the design/copy polish set
(verdict-chip typography, `//` kicker not aria-hidden, lists-index `<title>`,
profile list link's unique hover) and the pre-existing "script tag while
rendering React component" console warning.

## Open blockers
- (none)

## Will-QA (needs a real signed-in session)
Report dialog e2e + already-reported + rate-limit copy · lists CRUD ·
add-to-list dropdown + auto-add-on-create · private-list revalidation ·
**the lists signal end-to-end** (make a list, add a project, confirm "in 1
list" appears, flip it private, confirm it disappears — prod still has 0
collections, so the signal renders absence everywhere until you make one).

## DB access (for agents)
Dedicated account, NOT the MCP (reserved for Will's other agents). Management
API via SUPABASE_ACCESS_TOKEN (curl api.supabase.com/v1) + psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD). Prod is LIVE — reads free, never write;
schema work only inside a transaction you roll back. Apply migrations with
`psql --single-transaction -v ON_ERROR_STOP=1` so a partway failure reverts.

## Infra + gotchas
Repo PUBLIC until near-launch · prod dorkhub-ten.vercel.app · CI green.
proxy MUST be src/proxy.ts. rm -rf .next on stale weirdness. .eq(col,[])
INVALID → .filter(col,'eq','{}'). NO .or() on user input (feed keyset is the
one internal exception, safe only because the cursor validators are real).
PREFILTER SELECTION WINDOWS IN SQL — 5 sightings now (P2.1, P2.6, P2.7 screen,
P2.7 admin, P3-B recs); a JS filter after a fixed window is the tell, and
PostgREST CAN filter an `!inner` embed's columns before the LIMIT. Counts:
check `error` and fail CLOSED — `count ?? 0` reads a failed query as zero.
Sync 304s write NO metadata, so a new synced column needs an ETag clear to
populate. BOTH RLS suites after schema changes; a new policy needs a
BEHAVIORAL test (§3a only compares name+cmd) AND a negative control. 'use
server' files: async exports only (meta-test guards it). copy.ts values are
static strings only — /design/voice can't flatten a function. Seed projects
are UNPUBLISHED on prod. if-green-then-commit (&&, never ;).
Last updated: 2026-07-29 (P3-B part 1 shipped).

# Current state — 2026-07-29

## Milestones
- M0–P2.5.1 ✅ LIVE (207 published; schedulers self-running).
- P2.6 IMMUNE SYSTEM ✅ · P3-A LISTS ✅ · P2.7 HARDENING ✅
  (tagged p2 / p2.5-w1 / p2.6 / p3a).
- P3-B PART 1 ✅ rich pages + lists signal (docs/plans/p3b-rich-pages.md,
  migration 0011): lists_count (PUBLIC membership only, display-only) +
  github_pushed_at (real repo activity — updated_at bumped on our own sync
  writes, so all 207 read "updated hours ago"; now 70 pushed this week, 65
  dormant over a year). README h3–h6/tables/badges/lazy-loading, 780px reading
  measure, 196 unclaimed avatars backfilled, consent badge + claim link.
- P3-B PART 2 ✅ search (docs/plans/p3b-search.md, migration 0012): relevance
  ranking (was popularity — an exact name match lost to a popular incidental
  tagline match), repo_full_name + exact-tag legs, /search results page
  (static shell + client island), language/tag/stars/demo facets applied IN
  SQL, and Will's two QA fixes (visibility switch label, personal list count
  on the add-to-list trigger). **Fixed the language filter, dead since M5** —
  0 rows for every casing, now 48/20/11.

## Next (not started)
Design/motion QA sweep · P4 launch round (featured slots, fixture purge,
is_admin column-restrict, Vercel Pro cron swap, robots flip, dynamic sitemap +
JSON-LD — all inert until then).

## Deferred, with reasons (read before the next round)
docs/plans/p2.7-hardening.md "Deliberately deferred" · p3b-rich-pages.md and
p3b-search.md "Known / deferred". Load-bearing: NO search rate limiter (D29 —
/api/search is public and now runs 8 legs; a real one needs shared state =
new spend); admin manual enrich drain sits outside the AI budget; pass 3
starves behind passes 1–2 and no AI call has a timeout; the screen engine
walks decided_at ASC while the admin retro section walks DESC, so the P2.6
ADR's "match exactly" claim is false; list item counts include projects no
longer visible; multi-word search queries are one substring pattern. Plus the
design/copy polish set and the pre-existing "script tag while rendering React
component" console warning.

## Open blockers
- (none)

## Will-QA (needs a real signed-in session)
Report dialog e2e · lists CRUD · **the two fixes from your last pass**
(visibility switch now reads one stable `public` label; add-to-list trigger
shows your own membership count) · private-list revalidation · **the lists
signal end-to-end** — prod still has 0 collections, so "in N lists" renders
absence everywhere until you make one.

## DB access (for agents)
Dedicated account, NOT the MCP (reserved for Will's other agents). Management
API via SUPABASE_ACCESS_TOKEN (curl api.supabase.com/v1) + psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD). Prod is LIVE — reads free, never write;
schema work only inside a transaction you roll back. Apply migrations with
`psql --single-transaction -v ON_ERROR_STOP=1` so a partway failure reverts
(this caught a wrong column name in 0011 and reverted cleanly).

## Infra + gotchas
Repo PUBLIC until near-launch · prod dorkhub-ten.vercel.app · CI green.
proxy MUST be src/proxy.ts. rm -rf .next on stale weirdness. .eq(col,[])
INVALID → .filter(col,'eq','{}'). NO .or() on user input (feed keyset is the
one internal exception, safe only because the cursor validators are real).
PREFILTER SELECTION WINDOWS IN SQL — 5 shipped instances of the bug (P2.1,
P2.6, P2.7 screen, P2.7 admin, P3-B recs) plus search facets designed to avoid
it; a JS filter after a fixed window is the tell, and PostgREST CAN filter an
`!inner` embed's columns before the LIMIT. Counts: check `error` and fail
CLOSED — `count ?? 0` reads a failed query as zero. Sync 304s write NO
metadata, so a new synced column needs an ETag clear to populate. A filter
that silently returns nothing is the hardest bug class here — the language
filter was dead for two milestones. BOTH RLS suites after schema changes; a
new policy needs a BEHAVIORAL test (§3a only compares name+cmd) AND a negative
control. 'use server' files: async exports only (meta-test guards it). copy.ts
values are static strings only — /design/voice can't flatten a function.
`import type` from a server-only module is fine in a client component (erased);
a value import is not. Seed projects are UNPUBLISHED on prod.
if-green-then-commit (&&, never ;).
Last updated: 2026-07-29 (P3-B part 2 shipped).

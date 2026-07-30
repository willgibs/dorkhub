# Architecture map

The DDL source of truth is `supabase/migrations/0001_init.sql` (thoroughly commented).
This doc is the map, not a copy. Full rationale: docs/plan-master.md Part 2.

## Ownership model
`profiles.id` = standalone uuid (NOT an FK to auth.users). Nullable `user_id uuid
UNIQUE → auth.users`; `user_id IS NULL` = unclaimed seeded profile. Claiming is one
atomic conditional UPDATE matching the immutable numeric `github_id` from the
verified OAuth identity — never the username (mutable, re-registerable). Pre-claim
likes/follows transfer automatically. No `handle_new_user` trigger — profile
creation/claiming happens in server code via service role.

## RLS conventions (the load-bearing details)
- Two gates: column grants first (`REVOKE … then GRANT UPDATE (cols)` — users can
  never write is_admin/github_id/user_id/counters/readme_html), policies second.
- Helper `current_profile_id()` (STABLE, SECURITY DEFINER); always call as
  `(select current_profile_id())` in policies for per-statement evaluation.
- Admin has NO RLS policies — all admin/seed/sync/claim writes go through the
  service-role client behind `requireAdmin()` app checks.
- Counter/trending triggers are SECURITY DEFINER and recount from scratch (self-healing).
- likes/saves SELECT own-rows-only (public counts come from projects columns).
- claim_invites: zero policies (service-role only). featured_slots: public SELECT
  only within its time range.

## GitHub integration
One fine-grained server PAT (`GITHUB_TOKEN`, public-repos read-only) powers ALL
reads via a singleton Octokit: onboarding repo listing, seeding, sync. Supabase
GitHub OAuth is identity-only (zero extra scopes); provider_token is never used.
`syncProject(id)` entry points: on add/claim/seed · manual refresh (5-min throttle
via last_synced_at) · daily Vercel cron `/api/cron/sync` (CRON_SECRET), deadline-
governed since P3-C (50s soft deadline over a 1000-cap queue slice, not a fixed
200) · a 50-item slice per 15-min `/api/cron/ingest` tick (P3-C D34) so fresh
materializations get READMEs in minutes and a 10k gallery refreshes in ~2 days,
not 50. ETags stored per repo/readme; 304s don't count against rate limits. README = GitHub-rendered HTML (`Accept: application/vnd.github.html`)
→ sanitize-at-write with `sanitize-html` (strict allowlist, https-only img,
rel="nofollow ugc noopener", relative URLs rewritten to raw.githubusercontent.com,
~200KB cap) → stored in service-role-only `readme_html`. User-authored markdown
(description/updates) renders per-request via unified + remark-gfm + rehype-sanitize.

## Feed & caching
Keyset pagination everywhere (page 24, cursor = base64url tuple over the ordering
index), served by the `feed_page` RPC since P3-C (migration 0014, D31/D32): the
PostgREST `.or()` emulation could not emit a row comparison, so deep pages
scanned-and-discarded from the top of the index (O(offset)); the RPC seeks via
`(sort_key, id) < (cursor)` — `Index Cond: ROW(...)`, flat with depth. SECURITY
INVOKER on purpose (RLS applies as the caller; must never become DEFINER).
Dynamic SQL from constant fragments + USING binds — typed args are the filter
boundary, nothing user-shaped reaches SQL text (cursor validators in
`src/lib/feed/cursor.ts` stay as defense in depth). Trending is a stored,
indexed, write-time score — never recomputed by cron. Public reads use the
cookie-LESS anon client (`supabaseAnon()` in `src/lib/supabase/clients.ts`) so
RSCs stay cacheable; per-user liked/saved state is a separate client-island
overlay (`/api/me/engagement?ids=…`). Project/profile pages: ISR revalidate 300 +
revalidatePath on owner writes. /saved, /following: dynamic. Card-only surfaces
select `PROJECT_CARD_COLUMNS` (src/lib/projects/map.ts), never `*` — measured
219,774 B → 556 B for one profile's list.

## Routes & auth flow
Route map + first-sign-in/claim/onboarding flow: docs/plan-master.md Part 2
"Routes & auth". Key invariants: `/u/` username prefix (kills reserved-name
collisions); `proxy.ts` (Next 16 middleware) does session refresh + presence
gating only — NO DB calls; admin checks live in the /admin layout (server).

## Clients (src/lib/supabase/clients.ts)
`supabaseBrowser` (client components) · `supabaseServer` (cookie-bound, RLS as user)
· `supabaseAnon` (cookie-less, cacheable public reads) · `supabaseService`
(bypasses RLS — only behind admin/cron/system guards).

## Cost rules (verified July 2026)
Screenshots: client-resize → WebP 1600w+400w → Supabase public bucket → serve
unoptimized (never Vercel image optimization). GitHub avatars hotlinked. Card
imagery: opengraph.githubassets.com/{token}/{owner}/{repo} hotlinked at 2/1
(GitHub serves 1200×600; 200 + generic card even for missing repos — never a
404). Vercel Hobby cron = daily only (sufficient by design). Supabase Storage
transforms are Pro-only — never depend on them.

## AI enrichment (P2)
Plain-fetch OpenAI-compatible client (`src/lib/ai/gateway.ts`), provider by
key precedence: `GEMINI_API_KEY` (Google AI Studio direct — free tier ~1k
req/day, $0, default model gemini-2.5-flash-lite) beats `AI_GATEWAY_API_KEY`
(Vercel AI Gateway — needs PAID credits; its free tier 429s every model,
probed 2026-07-23). `AI_GATEWAY_MODEL` overrides either. Lazy fail-loud
AiConfigError. Candidates missing description OR topics get ai_tagline/ai_tags
(0007; deny-all inherited) via admin batch on /admin/queue or a best-effort
inline fallback at approval; real GitHub data always wins at publish.
`/weird` = force-dynamic route handler, random single-row OFFSET pick
(documented exception to the no-OFFSET feed rule) → 307 to the project page.

## Search (P3-B part 2, 0012)
Eight independent legs (`searchAll`, src/lib/search/queries.ts) — project
name/tagline/repo_full_name/exact-tag, profile username/display_name, tag
slug/label — never PostgREST `.or()` on user text. Ranking is RELEVANCE, not
popularity: `relevanceTier` scores a row against the query and
`buildProjectRanker` adds `trending_score` normalized to [0,1], so popularity
orders within a tier and never across one (raw trending is ~39,661 with a
spread under 2 — un-normalized it swamps everything).

`/search` is a STATIC shell + client island reading `useSearchParams()` under
Suspense (build emits `○ /search`); reading searchParams server-side would make
every distinct query its own function invocation. It is reached from the
palette's "see all results" row — search stays demoted, with no nav entry.

Facets (language/tag/stars/demo) apply IN SQL inside each leg before the LIMIT,
never to the returned set. Pure facet helpers live in
src/lib/search/facets.ts — NOT queries.ts, which is `server-only` while the
island needs them as values. `language_slug` is a generated
`lower(primary_language)`: a slugify would collide (`C#`/`C++` → `c-`).
Results are capped top-N by relevance, not keyset-paginated (a set merged from
independently-ranked legs has no cursor key). NOT searched: `readme_html` has
no anon grant and averages 25KB/row.

## Lists signal + recency (P3-B, 0011)
`projects.lists_count` counts PUBLIC list membership only (D18 — private
membership would disclose a single curator at this scale, and the number has
to match the reachable set). Denormalized, not a query-time aggregate: PostgREST
returns PGRST118 for `order=collection_items(count)`, so an aggregate can never
order or keyset-paginate a feed, and it is RLS-scoped to the viewer.
`recount_project_signals()` recounts likes + saves + public lists from scratch
(SECURITY DEFINER, search_path pinned, EXECUTE revoked); `bump_project_engagement()`
delegates to it so the three counters can't diverge. Triggers fire on
`collection_items` membership AND on `collections.is_public` — the latter has
no likes/saves analogue and is what makes the public-only rule self-healing.
`lists_count` is in `projects_before_update()`'s counters guard, so membership
changes never bump `updated_at`. Display-only: it does NOT feed
`compute_trending` (D20) and has no index (D23).

`projects.github_pushed_at` is real upstream activity and is what the UI shows
as recency. `projects.updated_at` is NOT that — it bumps on our own sync
writes, so every project used to read "updated hours ago". Sync writes
pushed_at via `repoMetadataPatch`; note that a 304 writes no metadata at all,
which is why 0011 had to clear `repo_etag` to force one full re-fetch.

## Lists (P3-A)
`collections`/`collection_items` (0010) — RLS-first user-owned (saves
pattern): select `is_public OR own`; items require owner-of-parent AND a
published target project. Slugs are stable: suffixed once at creation
(src/lib/lists/slug.ts), renames never re-slug, and `slug` is deliberately
absent from the UPDATE column grant. Caps (50 lists / 400 items) live in
src/lib/lists/policy.ts — NOT in the `'use server'` actions file (Next only
allows async-function exports there). Routes `/u/[username]/lists[/slug]`
use the cookie-bound client + revalidate 300 (project-page pattern — RLS
does the owner/visitor split); the profile page's public-lists section stays
on the anon client with an explicit `is_public` filter. `lists` is a
reserved project slug (route shadowing). Membership overlay: GET
/api/me/lists. PostgREST count embeds return `[{count: N}]`.

## Moderation (P2.6)
Two deny-all tables (0009; zero policies/grants — service role behind
`reportProject()` / `requireAdmin()` / cron only): `project_reports` (user
reports; unique (project, reporter) for life; ≤5/profile/24h enforced in the
action) and `moderation_screens` (one AI triage verdict per project,
`ok`/`review`/`flagged` + reason, upsert-overwrite). `screenNextBatch`
(src/lib/enrich/screen.ts) runs as pipeline pass 3 — reported projects first,
then the sub-threshold retro backlog — sharing enrichment's pacing, deadline,
and stamping discipline (systemic failures stop WITHOUT writing; unusable
replies stamp `review`, never silent-ok). TRIAGE-ONLY: verdicts label/order
the admin queues; AI never unpublishes (vision permits reversible automation
— deliberately unused until verdict quality is proven on real data).

## Scale (P3-C, 0013–0016)
`supabase/tests/scale_probe.sql` re-measures every hot path at 10k projects /
100k candidates in one rolled-back command — run it before trusting any perf
change; pass/fail tells in its header. AI spend: `ai_usage` ledger + atomic
`claim_ai_call(p_max, p_total_max)` (D33/D39) — every `chatCompletion` path
claims first, fails CLOSED, dollar-honest ceilings: `AI_DAILY_MAX` (default
800 ≈ ≤$0.48/day) and `AI_TOTAL_MAX` lifetime (default 5,000 ≈ ≤$3), `0` =
kill-switch on either; execute revoked from API roles (budget-DoS surface).
Per-call `AbortSignal.timeout` 30s (`AI_CALL_TIMEOUT_MS`, D40). Pipeline
reports `aiCallsToday`/`aiCallsTotal`. Cron split (D34): GH Actions pings
`/api/cron/pipeline` (enrich+screen, safety) then `/api/cron/ingest`
(materialize demand-first per D38 + sync slice); Vercel's 2 Hobby fallback
crons stay on sync + pipeline. Storage: `db_size_bytes()` in every pipeline
response (`dbSizeMb`), warn at 400 MB; read trends, not single samples (bloat
counts until autovacuum). `/weird` picks via uuid pivot (D35) — no OFFSET
exception anymore. `/tags` counts via `tag_tally()` aggregate. TRIGGER RULE
(D37): generated columns are NULL on NEW in BEFORE UPDATE triggers — any
to_jsonb row-comparison guard must exclude them, or every update of a row with
a populated generated column reads as an edit (this bit `language_slug` the day
0012 shipped; T26 pins it).

## Untrusted input boundaries (P2.7)
Two places where user-controlled text reaches an interpreter, both hardened
after shipping loose:
- **Model prompts** (`src/lib/ai/moderate.ts`): `description_md` and `tagline`
  are in 0001's `authenticated` UPDATE grant — writable over the REST API even
  where no dorkhub UI exposes them. Every untrusted field is whitespace-
  collapsed + clipped, and the block is fenced with a per-call random nonce the
  system prompt names as data (a fixed marker is forgeable — the repo is
  public). A forged verdict would be permanent: screened rows never re-enter
  the retro queue.
- **PostgREST filter grammar** (`src/lib/feed/cursor.ts` → `buildFeedQuery`):
  `,` `(` `)` are syntax, which is why `searchAll` refuses `.or()` entirely.
  The feed's keyset `.or()` is the one internal exception, and it is only safe
  because the cursor decoders validate uuid + ISO-8601 — character sets that
  contain no delimiters. `?cursor=` is attacker-reachable and unauthenticated.

Related standing rule: **prefilter selection windows in SQL.** A fixed window
plus a JS filter applied afterwards has produced the same silent-stall bug
three times (P2.1 enrichment, P2.6 retro, P2.7 retro). `collectRetroPages`
(src/lib/enrich/screen.ts) is the corrected shape — it pages until it has what
it needs, with an injected loader so the advance rule is unit-testable.

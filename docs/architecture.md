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
via last_synced_at) · daily Vercel cron `/api/cron/sync` (CRON_SECRET) syncing the
~200 stalest published projects. ETags stored per repo/readme; 304s don't count
against rate limits. README = GitHub-rendered HTML (`Accept: application/vnd.github.html`)
→ sanitize-at-write with `sanitize-html` (strict allowlist, https-only img,
rel="nofollow ugc noopener", relative URLs rewritten to raw.githubusercontent.com,
~200KB cap) → stored in service-role-only `readme_html`. User-authored markdown
(description/updates) renders per-request via unified + remark-gfm + rehype-sanitize.

## Feed & caching
Keyset pagination everywhere (page 24, cursor = base64url tuple over the ordering
index). Trending is a stored, indexed, write-time score — never recomputed by cron.
Public reads use the cookie-LESS anon client (`supabaseAnon()` in
`src/lib/supabase/clients.ts`) so RSCs stay cacheable; per-user liked/saved state
is a separate client-island overlay (`/api/me/engagement?ids=…`). Project/profile
pages: ISR revalidate 300 + revalidatePath on owner writes. /saved, /following: dynamic.

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
Vercel AI Gateway via plain fetch (`src/lib/ai/gateway.ts`): `AI_GATEWAY_API_KEY`
(lazy, fail-loud AiConfigError), default model google/gemini-2.5-flash-lite
(`AI_GATEWAY_MODEL` override). Usage rides the $5/mo recurring free credit —
$0 actual. Candidates missing description OR topics get ai_tagline/ai_tags
(0007; deny-all inherited) via admin batch on /admin/queue or a best-effort
inline fallback at approval; real GitHub data always wins at publish.
`/weird` = force-dynamic route handler, random single-row OFFSET pick
(documented exception to the no-OFFSET feed rule) → 307 to the project page.

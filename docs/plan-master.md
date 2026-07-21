# Master plan (frozen copy — historical reference only)

> Checked in so a fresh clone needs no local memory. Corrections and current
> status live in docs/architecture.md and docs/state.md — NOT here.

# MASTER PLAN (approved 2026-07-21, unchanged below)

## Context

Greenfield build of **dorkhub.com**: a social discovery platform for hobbyist developers to showcase GitHub projects — generosity over sales, "I built a thing, take it, fork it, enjoy it." Not Product Hunt (no launch windows, no upvote ranking), not a marketplace, not a hiring portfolio. No DMs/comments/forums at launch. Monetization later = featured slots in the discovery feed only.

Deliverables: (1) design system & language, (2) the app, (3) marketing site + content. Division of labor: Will owns product-shaping; Claude owns tooling/system strategy and works autonomously between product gates.

**Decisions from Will:** v1 = full shaped scope (monetization infra deferred, schema anticipates it) · cold start = seed + open launch (admin-seeded claimable profiles) · dorkhub.com owned, zero brand assets · **aesthetic direction chosen via 4 HTML explorations before the design system is locked**.

**Budget:** $0/mo during build; first infra bill ≈ $20/mo (Vercel Pro) at public launch; Supabase Pro ($25) only when limits force it.

## Verified facts that shaped decisions (researched July 2026)

- **Next.js 16.2** stable: Turbopack default; **`proxy.ts` replaces `middleware.ts`**; async request APIs; opt-in caching via Cache Components/`"use cache"`; `next lint` removed → **Biome** (v2.5, `next` domain) is the recommended linter. React 19.2. **Tailwind v4.3** CSS-first `@theme`. shadcn/ui supports both; Base UI is the new default primitive base.
- **Supabase Auth:** `@supabase/ssr` 0.12.x only (auth-helpers deprecated); PKCE hardcoded; `getClaims()` over `getSession()`; `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` naming.
- **Supabase Free:** 500MB DB, 50k MAU, 1GB storage, 5+5GB egress, 2 projects, pauses after 1 week inactivity. Pro $25. pg_cron free. **Storage image transforms Pro-only → never depend on them.**
- **Vercel:** Hobby explicitly non-commercial → upgrade to Pro ($20, includes $20 usage credit) at public launch; enable Spend Management day one. **Image optimization is the #1 UGC cost trap** (no included Pro quota; per-transformation + cache-write billing) → avoided entirely by design. Hobby cron = daily only (sufficient).
- **GitHub API:** zero-scope token reads public repos; 5k req/hr per token; ETag 304s don't count against rate limit; README available as GitHub-rendered HTML in one call (`Accept: application/vnd.github.html`); GraphQL ≈1 point per 100 repos. Supabase never stores/refreshes `provider_token` → we don't use it at all.

### Cost-driven design rules
1. **User screenshots never touch Vercel image optimization**: client-side resize at upload → WebP renditions (1600w + 400w) → Supabase public bucket → plain `<img>`/unoptimized, explicit w/h for CLS.
2. Hotlink GitHub avatars (`avatars.githubusercontent.com/u/{id}?s=…`), unoptimized.
3. Daily Vercel cron sync + ETags ≈ zero marginal cost.
4. Build on local `supabase start` + Vercel previews; Supabase cloud project at seed time; Vercel Pro at launch.

---

# PART 1 — Design system & explorations (first deliverable)

## Governing decision: one skeleton, four skins
All 4 exploration files share **byte-identical HTML bodies**; only the embedded `<style>` token block + font links differ. Semantic classes (`.project-card`, `.tag-chip`) map 1:1 to future React components via `<!-- ProjectCard -->` comment boundaries. Every color/font/radius/shadow references CSS custom properties using the **exact names of the production Tailwind v4 theme** → winner's token block pastes into `app/globals.css`; a hybrid = a fifth token block (~1 hr), not a redesign.

## Files
```
explorations/
  compare.html                  — 2×2 iframe grid for side-by-side review
  01-playful-dev-native.html    02-modern-minimal.html
  03-warm-indie-craft.html      04-utilitarian-brutalist.html
```
Each: self-contained single scrolling page; inline SVG placeholder screenshots; Google Fonts `<link>`s; tiny `data-theme` toggle script.

## Page anatomy (identical order, all 4)
1. Direction banner (name, thesis, dark/light toggle, sticky) 2. Token panel (auto-swatches via `getComputedStyle`, radius/shadow demos) 3. Type specimen 4. Nav 5. Feed slice (4 cards) 6. **Rich project page** (gallery, demo/repo buttons, `git clone` copy, tags, stats, rendered README, update post) 7. **Minimal project page** (README + repo link only — must look loved, not broken) 8. Profile header 9. Marketing hero slice 10. **State zoo** (all button/chip/like/follow/focus states, empty state, error, skeleton — non-negotiable).

## Fixtures (identical across files → later `lib/fixtures.ts`)
- **tinysynth** — 2KB web synth (TS, 3 screenshots, demo, 214★) → rich page
- **gitgoblin** — passive-aggressive commit-message cron (Go CLI, **no image**, 67★) → image-less card
- **plantdad** — e-ink monstera guilt dashboard (Python/RPi, **7 tags**, 1.2k★) → tag wrap, count formatting
- **untitled-maze-thing** — "i made a maze generator. it makes mazes." (**0★/0 likes**) → zero-social-proof test; show absence, never "0 likes"
- Profile **@mollybuilds**; README fixture covers h1/h2, code block, inline code, list, link, table, blockquote.
- Only the **voice zone** varies per direction (CTAs, empty states, errors, 404, fork nudge) → becomes `lib/copy.ts`.

## Token architecture (Tailwind v4)
shadcn variable vocabulary as base (`--background --foreground --card --primary --muted --radius`…, registered `@theme inline`) + dorkhub extensions: `--surface-2 --primary-soft --positive(-soft) --code-bg --code-text --link --shadow-card --shadow-overlay --font-display/-sans/-mono`. Documented gotcha: **shadcn `--accent` = hover tint; brand = `--primary`**. `:root` = direction's primary mode (dark for dev-native, light for others), other mode via `[data-theme]`; production uses `next-themes`. Spacing/type scales stay Tailwind-default; density via utilities. Components never hardcode radius/color/shadow/font.

Direction dials — radius: 0.5rem / 0.375rem / 1rem / 0 · shadows: accent glow / soft / chunky offset (4px 4px 0) / none+2px borders · palettes: near-black+loud accent / restrained neutral / cream+candy / white-black-blue.

## Typography (free, `next/font`)
1. Dev-native: Space Grotesk / Inter / JetBrains Mono (mono used liberally: stats, tags, timestamps) 2. Minimal: Geist ×3 3. Indie: Fraunces / Karla / Fira Code 4. Brutalist: Mona Sans / Mona Sans / Monaspace Neon (GitHub's own OFL faces).

## Components
- **shadcn pull (~20):** button badge avatar dropdown-menu dialog sheet tabs input textarea select label skeleton tooltip separator switch toggle-group sonner hover-card command carousel collapsible.
- **skip:** card, navigation-menu, table, accordion, pagination, form+RHF.
- **Custom:** ProjectCard (feed/compact/featured; image-optional) · TagChip · StatButton (optimistic) · FollowButton · ProfileHeader · FeedFilters · EmptyState · MarkdownProse · ScreenshotGallery · UpdatePost · Nav · Footer · RepoStatsRow · LanguageDot · CopyButton (`git clone`) · SignInWithGitHub · ThemeToggle · TimeAgo · AvatarStack · UserHoverCard · PageShell · SectionHeader · SkeletonCard · Callout · OG templates.
- **Markdown, reconciled:** READMEs = GitHub-rendered HTML, sanitized once at write (see Part 2 §GitHub) and styled by the same bespoke `.prose` token rules; user-authored `description_md`/updates rendered at request in RSC via unified + remark-gfm + rehype-sanitize. No @tailwindcss/typography.

## Voice
Generosity verbs: share, fork, take, borrow, tinker. Banned: buy/sell/hire/🚀/growth-speak. Errors take the blame; empty states are invitations.

## Marketing IA
Signed-out `/` = marketing hero + is/isn't strip **above the live feed** (the featured strip IS real cards); signed-in `/` = feed directly. `/manifesto` = 5–7 numbered tenets, typographically indulgent, + colophon (stack/fonts). OG: static brand PNG + dynamic `next/og` per project/profile (satori: flexbox-only, font buffers, ~10 token hexes mirrored in `lib/og-tokens.ts`).

## Living styleguide `/design` (public)
tokens page · typography specimen · components-in-every-state fed by `lib/fixtures.ts` · voice table. Rule: every new component lands in the styleguide in its creating PR.

---

# PART 2 — App architecture

## Ownership model: auth-decoupled profiles
`profiles.id` = standalone uuid (**not** an FK to auth.users); nullable `user_id uuid UNIQUE → auth.users`. Unclaimed = `user_id IS NULL`. Every project always has an owner profile (no null-owner special cases); claiming = one atomic UPDATE; pre-claim likes/follows transfer free. RLS uses helper `current_profile_id()` (STABLE, SECURITY DEFINER, wrapped in `(select …)` in policies). No `handle_new_user` trigger — profile creation/claiming happens in server code (service role) to support the claim UX.

## Schema (migration `supabase/migrations/0001_init.sql`)
Tables (full DDL designed — see agent output distilled here):
- **profiles**: id, user_id (nullable unique FK), username citext unique (GitHub-style regex check), display_name, avatar_url, bio, links jsonb, **github_id bigint unique (immutable claim key)**, github_username (display only), is_admin, followers_count, claimed_at, created_at.
- **projects**: id, profile_id FK, **slug** (unique per profile), **github_repo_id bigint unique (one showcase per repo globally)**, repo_full_name, repo_url, name, tagline ≤120, description_md ≤10k, **readme_html (sanitized, service-role-write-only)**, repo_etag, readme_etag, primary_language, topics text[] (raw GitHub), **tags text[] (single curated mechanism — no separate stack column; kind lives on `tags.kind`)**, demo_url, stars_count, forks_count, license, screenshots jsonb (CHECK ≤6), sort_order, status enum draft|published, likes_count, saves_count, trending_score, published_at, last_synced_at, timestamps.
- **project_updates** (title ≤120, body_md ≤5k) · **likes/saves** ((profile_id, project_id) PK) · **follows** (PK pair, no self-follow) · **tags** (slug PK, label, kind stack|topic) · **featured_slots** (project_id, sponsor_label, starts_at/ends_at; active derived from range — schema now, feature later) · **claim_invites** (token PK, profile_id, expires_at, used_at — invitation UX/conversion tracking, **never authorization**).
- Partial indexes on `status='published'`: (published_at desc, id desc), (trending_score desc, id desc), GIN(tags), (primary_language, published_at desc), plus (profile_id, sort_order) and (last_synced_at asc nulls first) for sync staleness.

**Counters/trending via triggers, not count queries.** SECURITY DEFINER trigger on likes/saves recounts (self-healing) and recomputes trending; same pattern for followers_count. **Trending is write-time Reddit-style** — `log10(1 + likes + 2*saves) + epoch(published_at)/45000` — decay encoded as recency boost so the score is indexable and needs **no cron ever**. BEFORE UPDATE trigger on projects handles updated_at + sets published_at and score on draft→published.

## RLS matrix (+ the load-bearing detail: column grants)
- profiles: SELECT public · UPDATE own row, **column-granted to username/display_name/bio/links/avatar_url only** · INSERT/DELETE service-role-only.
- projects: SELECT published OR own · UPDATE own, column-granted to tagline/description_md/tags/demo_url/screenshots/sort_order/status · INSERT service-role-only (repo ownership verified against GitHub server-side) · DELETE own.
- project_updates: parent-based. likes/saves: SELECT own only (counts public via projects), INSERT own + WITH CHECK target published, DELETE own. follows: SELECT public, INSERT/DELETE own. tags/featured_slots: public read (featured only within time range), service-role writes. claim_invites: service-role only.
- Storage `screenshots` bucket: public read; write restricted to path prefix = own profile_id; 2MB limit, image mimetypes.
- `REVOKE UPDATE … FROM authenticated` then `GRANT UPDATE (cols)` prevents setting is_admin/github_id/user_id/counters/**readme_html**. Admin has **no RLS policies** — all admin/seed/sync/claim writes via service-role client behind `requireAdmin()`.
- **No RLS path sets `profiles.user_id`** — only the claim statement (below).

## GitHub integration
- **Identity only** from Supabase GitHub OAuth (no extra scopes). **Don't use `provider_token`.** One fine-grained server PAT (public-repos read-only) in `GITHUB_TOKEN`, singleton Octokit for all reads: onboarding repo listing (`GET /users/{login}/repos`), seeding, sync. Upgrade path: GitHub App (deferred).
- `syncProject(id)` with 3 entry points: on add/claim/seed (immediate); manual "Refresh from GitHub" (throttled 5 min via last_synced_at); **daily Vercel cron** `GET /api/cron/sync` guarded by `CRON_SECRET`, syncing ~200 stalest published projects (pg_cron rejected: sync needs Node + network I/O). ETags stored per repo/readme; 304s free.
- **README/XSS (top security surface):** fetch GitHub-rendered HTML → server-side `sanitize-html` (pure JS; strict allowlist, no script/style/iframe/form; https-only img; links get `rel="nofollow ugc noopener"`), rewrite relative URLs to `raw.githubusercontent.com/{repo}/{branch}/…`, cap ~200KB → store in `readme_html` (service-role-write-only, so sanitize-once-at-write is sound). User markdown rendered per-request with rehype-sanitize. CSP headers as backstop. Test with a hostile-README fixture.
- Rate budget: daily cron at 500 projects ≤1,000 mostly-304 requests vs 5,000/hr → ~10× headroom.

## Feed & discovery
- **Keyset pagination everywhere**, page 24, cursor = base64url tuple. Recent: `(published_at, id) < cursor`; Trending: `(trending_score, id) < cursor`; tag filter `tags @> array[$tag]` (a "stack" filter IS a tag filter); language via its index; Following: `profile_id IN (select followee_id …)`, always dynamic.
- **Caching trick: public data via a cookie-less anon Supabase client** (cacheable), per-user liked/saved state as a separate overlay (`/api/me/engagement?ids=…` client island). Feed: `unstable_cache(…, { revalidate: 60 })`. Project & profile pages: ISR `revalidate: 300` + `revalidatePath` on owner edits/sync. `/saved`, `/following`: fully dynamic. `/api/feed`: `s-maxage=60, stale-while-revalidate=300` on anonymous payload.
- Featured later = a `union` head over active featured_slots with "Sponsored" label — zero schema change at that time.

## Routes & auth
```
app/
  (marketing)/manifesto /terms /privacy
  (app)/  /            feed (signed-out: hero+is/isn't above feed)
    /t/[tag]  /tags    /u/[username]  /u/[username]/[slug]
    /saved  /following /new (repo picker)  /onboarding
    /settings/profile  /settings/projects
    /claim  /claim/[token]
    /admin  /admin/seed  /admin/tags  /admin/featured (stub)
  /design (styleguide)
  auth/callback  auth/signout
  api/feed  api/cron/sync  api/me/engagement
proxy.ts        ← Next 16 name for middleware; standard @supabase/ssr updateSession
```
`/u/` prefix kills the reserved-username collision class. No DB calls in proxy — gate on session presence; profile-completeness/admin checks in layouts.

**First sign-in (`/auth/callback`, service role):** exchange code → read **numeric `provider_id`** (never username — mutable/re-registerable). Existing profile → in. Unclaimed profile with matching github_id → `/claim` ("We hand-picked your work. This page is yours if you want it — or we'll remove it") → Claim = one atomic `UPDATE profiles SET user_id=$uid, claimed_at=now() WHERE github_id=$verified AND user_id IS NULL`; Decline = unpublish/delete. Else → `/onboarding` (username pre-filled, availability check, unclaimed github_usernames reserved) → `/new` picker → drafts → publish.

**Unclaimed honesty:** persistent badge "Curated by dorkhub from public GitHub data · not yet claimed by @login" + "Is this you?" + removal mailto. Seeded content = public GitHub data only, no invented copy. Derived from `claimed_at IS NULL`.

## Admin/seed minimal cut
`/admin/seed`: paste username/repo URL → PAT fetch → upsert unclaimed profile → pick-and-publish repo checkboxes → syncProject each. Invite link generator (`/claim/{token}`) — Will sends personally; **no email infra in v1**. `/admin`: seeded-profile table w/ claimed/invited status. `/admin/tags`: tag CRUD.

## Screenshots
Client-side canvas resize → WebP 1600w + 400w → direct upload to public bucket `{profile_id}/{project_id}/{uuid}_{full|thumb}.webp` (storage RLS path check, `cacheControl: 31536000`) → server action validates & appends `{path,w,h}` to screenshots jsonb. Serve plain unoptimized. Vercel image-optimization usage stays ~zero.

---

# PART 3 — Execution

## Tooling (locked)
pnpm · TypeScript · **Biome** (lint+format; `next` domain) · Vitest (logic: trending, cursor codecs, sanitizer) · Playwright (smoke; auth-dependent flows verified via browser pane) · GitHub Actions CI (biome + tsc + vitest) · Sentry free tier at hardening (MCP connected) · Vercel Web Analytics (free 50k events) initially · local `supabase start` for dev; Supabase cloud project created at seed phase; `supabase gen types` for typed client.
Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `GITHUB_TOKEN`, `CRON_SECRET`.

## Milestones
- **M0 — Explorations** (no scaffold needed): shared HTML skeleton once → 4 skins + compare.html → deliver to Will. **⛔ PRODUCT GATE: Will picks/hybridizes the direction.**
- **M1 — Foundation**: Next 16 + Tailwind v4 + shadcn init + Biome scaffold; migration 0001 (schema/triggers/grants/RLS); winning tokens → `globals.css`; `next/font`; typed clients (browser / cookie server / cookie-less anon / service); local seed script; RLS policy tests.
- **M2 — Design system in code**: `/design` styleguide first; components born there against fixtures.
- **M3 — Auth + identity**: proxy.ts, callback (sans claim branch), onboarding, read-only profile.
- **M4 — Projects + GitHub**: octokit module, syncProject (ETags + sanitize), `/new`, project CRUD, project page, curation/ordering.
- **M5 — Discovery + interactions**: feed + cursors + api/feed, tag pages, likes/saves/follows + triggers, engagement overlay, /saved /following.
- **M6 — Rich pages**: screenshots pipeline, update posts, editing polish.
- **M7 — Marketing + brand**: signed-out home, /manifesto, OG images (static + dynamic), sitemap.
- **M8 — Seed + claim**: /admin/seed, claim branch, /claim(/[token]), unclaimed badging. (Late because it exercises everything.)
- **M9 — Hardening + launch**: Vercel cron, CSP, rate throttles, Sentry, `get_advisors` security/RLS audit, hostile-README test, Lighthouse pass; create cloud Supabase project + Vercel project, DNS for dorkhub.com; seed 30–50 hand-curated repos; invite wave; **Vercel Pro upgrade + Spend Management**; open signups.

Product gates where Will decides: M0 aesthetic pick · manifesto copy approval (M7) · seed list approval (M9) · launch go.

## Top risks
1. **README XSS** → sanitize-at-write + service-role-only readme_html + rehype-sanitize for user md + CSP; hostile fixture test.
2. **Claim account takeover** → authorization = immutable numeric github_id match in one conditional atomic UPDATE; tokens decorative; UNIQUE constraints as belt-and-braces.
3. **Free-tier ceilings** → pre-sized unoptimized images, daily-sync design, README size caps, local-first dev.
4. **RLS footguns** → `(select current_profile_id())` pattern, SECURITY DEFINER triggers, column grants, policy tests in M1 not after.
5. **Seeded-content backlash** → honest badging, public-data-only, one-click decline/removal, small defensible seed batch.

## Verification
- Per milestone: `pnpm biome check && tsc && vitest` in CI; browser-pane walkthrough of the new flow (auth → connect → curate → project page → feed → like/save/follow).
- RLS: SQL policy tests (attempt forbidden writes as authenticated/anon; assert failure) + Supabase `get_advisors` before launch.
- Security: hostile-README fixture repo (script tags, javascript: links, relative-path tricks) must render inert.
- E2E: Playwright smoke on public surfaces (feed, project page, profile, styleguide); OAuth flows verified manually in browser pane.
- Cost check pre-launch: confirm zero Vercel image-optimization usage in dashboard; Supabase egress within free tier.

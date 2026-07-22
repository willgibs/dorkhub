# M5 — Discovery + interactions (execution plan)

Status: **in progress** (started 2026-07-22). Subagents onboard: CLAUDE.md →
docs/state.md → THIS file → the doc modules your slice touches.

## Goal

Real feed on `/` (marketing sections above it when signed out, feed-only when
signed in — same URL, proxy rewrite), `/trending`, tag pages, `/tags` index,
`/saved`, `/following`, `/api/feed` + `/api/me/engagement`, live like/save/
follow wiring, and the caching pass (header stops reading cookies → (app)/
(marketing) trees go static/ISR).

## Scope cuts (do not re-litigate)

- Language filter: query-layer + `/api/feed?language=` only, NO UI/route.
- Featured-slots feed head → M9+. `generateStaticParams` on tags → later.
- `/u/[username]/[slug]` STAYS cookie-bound/dynamic (M4 decision — owner draft
  visibility). Do not "fix" it. Profile page stays anon/ISR as-is.
- Cards keep like-only; save UI lives on the project detail page only.
- `/saved` unpaginated v1 (bounded by one user's activity).

## Locked design decisions

1. **Sort/tag in the URL path, never query strings** (searchParams would force
   dynamic): `/` + `/home` (recent), `/trending`, `/t/[tag]`,
   `/t/[tag]/trending`, `/tags`. All `revalidate = 60` (tags index 300).
2. **Proxy rewrite for the home split**: signed-in `/` rewrites to `/home`
   (URL bar stays `/`); signed-out direct-hit `/home` redirects to `/`.
   Reuses the claims check proxy already makes — zero new work per request.
3. **Header de-dynamized**: `site-header-session.tsx` (server, cookie-read) is
   replaced by `site-header-auth.tsx` ('use client'): getClaims via
   supabaseBrowser on mount + on pathname change (kills the M3 stale-header
   bug class by construction), profile fetch under RLS, same-footprint 32px
   skeleton while resolving (never flash the sign-in button). Layouts become
   sync, cookie-free.
4. **Load more = server action returning rendered ReactNode** (client island
   appends): ProjectCard stays a server component; no markup duplication.
   `/api/feed` is built as the public JSON endpoint (s-maxage=60, SWR 300),
   not the in-page mechanism.
5. **ProjectCard: `liked`/`onLikeToggle` → `likeSlot?: ReactNode`** with the
   current disabled StatButton look as default (zero visual change for
   non-opted callers).
6. **Interactions write DIRECTLY from the browser client under RLS** (grants
   verified: insert(profile_id, project_id)/delete own on likes/saves; follows
   insert/delete own). Optimistic flip → write → 23505 = silent success, other
   errors revert; per-id pending guard blocks double-click races; signed-out
   toggle → router.push('/auth/signin?next='+pathname). Counts self-heal via
   DB triggers; public counts refresh via the 60s feed / 300s page ISR —
   NO revalidatePath from the writer.
7. **Islands live in `src/app/(app)/_engagement/` + `_feed/`** (conventions
   ban Supabase imports in src/components/). Design-system atoms
   (StatButton/FollowButton) unmodified.
8. **One overlay endpoint**: GET `/api/me/engagement?ids=a,b,…&followee=id?`
   → `{liked, saved, following: boolean|null, isOwnProfile}` — always 200,
   anon gets empty overlay. Cookie-bound.
9. Count displays in islands collapse to null (absence) at zero — never "0".
10. TagChip default href bug: `/tags/${tag}` → `/t/${tag}` (fix in Wave 3).
11. nav: 'browse' → `/` (dead `/browse` removed).

## Copy keys (pre-added by orchestrator before waves)

sortRecent 'recent' · sortTrending 'trending' · loadMore 'load more' ·
loadingMore 'loading…' · savedTitle 'saved' · savedEmpty 'nothing saved yet —
go find something worth keeping' · followingTitle 'following' · followingEmpty
"you're not following anyone yet — go find your people" · tagsTitle 'browse by
tag' · tagsStackLabel 'stacks' · tagsTopicLabel 'topics' · signInPrompt 'sign
in to join in'. Reuse emptyFeed for zero-result feed/tag pages.

## Waves

### Wave 1 (3 parallel, disjoint)
- **1A header**: NEW src/components/site-header-auth.tsx ('use client', per
  decision 3); DELETE site-header-session.tsx; MODIFY site-header.tsx
  (NAV_LINKS browse→'/'), (app)/layout.tsx + (marketing)/layout.tsx (mount
  `<SiteHeader><SiteHeaderAuth/></SiteHeader>`, drop async/cookies).
- **1B feed lib**: NEW src/lib/feed/queries.ts — FeedSort, FEED_PAGE_SIZE 24
  (max 48), resolveFeedFilterSpec(params) pure (clamp limit, normalize
  tag/language, decode cursor per sort via cursor.ts, garbage→null→page 1);
  FeedRow (LEAN explicit column select + joined profile — NEVER select('*'),
  readme_html is huge); fetchFeedPage(spec, client) keyset via PostgREST
  `.or('published_at.lt.T,and(published_at.eq.T,id.lt.ID)')` + matching
  .order pair, limit+1 → nextCursor; fetchFollowingFeedPage(spec, followeeIds,
  client) (empty ids → empty page, no query); getFeedPage(params) =
  supabaseAnon + unstable_cache(revalidate 60, tags ['feed']).
  NEW src/lib/feed/hrefs.ts — feedHrefFor(current, kind, value) pure,
  path-based, active-tag re-click toggles off. Tests for both.
  MODIFY src/lib/projects/map.ts — profileRowToAuthor(...) → FixtureAuthor
  (+ test).
- **1C engagement API/context**: NEW src/lib/engagement/parse-ids.ts (+test,
  cap 100); NEW src/app/api/me/engagement/route.ts (decision 8); NEW
  src/app/(app)/_engagement/engagement-context.tsx (EngagementProvider
  {projectIds, followeeId?, children} + useEngagement(): ready/signedIn/
  isLiked/isSaved/isFollowing/isOwnProfile/pending*/toggle*/registerIds —
  decision 6 semantics).

### Wave 2 (solo — coupled files, after Wave 1)
- MODIFY src/components/project-card.tsx (decision 5).
- NEW _engagement/{like,save,follow}-button-island.tsx ('use client' thin
  wrappers over StatButton/FollowButton; localCount ±1 with null-at-zero;
  FollowButtonIsland renders null when isOwnProfile).
- NEW src/app/(app)/_feed/feed-grid.tsx ('use client': ReactNode[] state,
  useTransition, registerIds on append, load-more button hidden when cursor
  null); _feed/actions.ts ('use server' loadMoreFeed → {cards, ids,
  nextCursor}); _feed/feed-section.tsx (server: page 1 via getFeedPage,
  FeedFilters via feedHrefFor, EngagementProvider + FeedGrid, EmptyState).
- DELETE _sections/feed-preview.tsx.

### Wave 3 (4 parallel, after Wave 2)
- **3A home+proxy**: MODIFY (app)/page.tsx (hero/is-isnt + FeedSection recent
  + how-it-works/teaser, revalidate 60); NEW (app)/home/page.tsx (FeedSection
  only, revalidate 60); MODIFY src/proxy.ts (decision 2 rewrite block).
- **3B discovery routes**: NEW trending/page.tsx, t/[tag]/page.tsx,
  t/[tag]/trending/page.tsx (FeedSection wrappers, revalidate 60,
  generateMetadata from tags.label); NEW tags/page.tsx (revalidate 300) +
  src/lib/tags/tally.ts (+test); NEW src/app/api/feed/route.ts (public JSON
  on the same query core; s-maxage=60 SWR 300; garbage cursor → 200 page 1);
  MODIFY components/tag-chip.tsx default href → /t/.
- **3C page wiring**: MODIFY u/[username]/[slug]/page.tsx (EngagementProvider
  + LikeButtonIsland + NEW SaveButtonIsland beside it); MODIFY
  u/[username]/page.tsx (provider w/ followeeId, FollowButtonIsland, real
  likeSlot per card).
- **3D authed lists**: NEW saved/page.tsx (force-dynamic, saves⋈projects desc,
  savedEmpty); NEW following/page.tsx + following/actions.ts (force-dynamic,
  followee ids → fetchFollowingFeedPage + FeedGrid loadMore).

## Verification gates

Per wave: pnpm verify + test (+ build waves 2–3). Anon QA: routes render
seeds; tag chip → /t/; /api/feed pagination via curl limit=3 + cursor chain;
garbage cursor → 200; build output shows ISR (○/revalidate) on discovery
routes and ƒ only on saved/following/u-slug/new/settings. Session QA (Will):
signed-in / = feed (URL stays /), header skeleton→avatar with no sign-in
flash, like persists + burst + no double-count on rapid click, save →
/saved, follow mollybuilds + no follow button on own profile, empty states.
RLS: extend rls_checks.sql if anon like/save/follow INSERT denial uncovered.
Wrap: state.md rewrite, decisions.md append, tag m5.

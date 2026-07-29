# P3-B part 2 — Search, filters, and two QA fixes (shipped 2026-07-29)

Second slice of P3-B. Part 1 (rich pages + the lists signal) is
docs/plans/p3b-rich-pages.md.

## Why

Search was palette-only and ranked by **popularity, not relevance**: the legs
were merged and re-sorted by `trending_score` alone, so an exact name match
sorted below a popular project whose tagline merely contained the substring.
There was no results page, so a query with 40 matches showed 8 with no next
step. And the language filter had been **dead since M5** — silently, because it
fails by returning an empty page rather than an error.

Will's QA on P3-A also surfaced two UX bugs, folded into this round.

## Locked decisions

- **D24 — `language_slug` = `lower(primary_language)`, generated.** A naive
  slugify **collides** (probed live: `C#` and `C++` both → `c-`); `lower()` is
  collision-free across all 23 live languages and is exactly what the dead
  filter already expected.
- **D25 — search results are capped top-N by relevance, not keyset-paginated.**
  The no-OFFSET rule governs *feeds*; a set merged from independently-ranked
  legs has no single ordering key to cursor on.
- **D26 — relevance is scored in TS**, via `mergeSearchHits`'s existing
  injectable `rankOf`. Pushing `similarity()`/`ts_rank` into PostgREST would
  need an RPC and re-open the surface the `.or()` ban exists to close.
- **D27 — `/search` is a static shell + client island.** Reading
  `searchParams` in an RSC forces per-request dynamic rendering forever on a
  public route with unbounded distinct query strings. Confirmed: the build
  emits `○ /search`.
- **D28 — search stays demoted** (vision principle 1). Icon-only ⌘K trigger, no
  home search bar, no nav entry; `/search` is reached from the palette's "see
  all results" row.
- **D29 — no rate limiter this round.** A real one needs shared state
  (new spend = board gate). Mitigations instead: `q` bounded 2–64, fixed leg
  count, `limit` clamped server-side, CDN cache retained. Recorded as a known
  gap.
- **D30 — one stable switch label.** The visibility control reads `public`
  always; the switch position carries the state.

## What shipped

**S0 — migration 0012.** `language_slug` generated column + partial index
(replacing `idx_projects_language`, which only served the removed exact-case
filter), and a `repo_full_name` trigram index. `buildFeedQuery` now filters
`language_slug`.

**S1 — relevance.** `relevanceTier` scores a row against the query (name exact
> prefix > contains > exact tag > repo/owner > tagline); `buildProjectRanker`
adds popularity **normalized to [0,1]** across the candidate set. Normalizing is
load-bearing — raw `trending_score` is ~39,661 with a spread under 2, so an
un-normalized term would swamp every tier and reproduce the original bug. Tiers
are spaced 5 apart, so popularity orders *within* a tier and provably never
across one. Two new legs: `repo_full_name`, and an exact-tag leg gated on
`resolveTagSlug` (rides the existing tags GIN index).

**S2 — `/search`.** Static shell; a client island under Suspense reads `?q=`,
lifting the palette's debounce + AbortController + `settled` loop. `/api/search`
accepts a clamped `limit`. The palette gained a "see all results" row.

**S3 — facets.** language / tag / min-stars / has-demo, applied **inside each
leg in SQL** before the LIMIT. Refinements are derived from the *unfaceted*
response and remembered, so selecting one doesn't delete the others.

**S4 — Will's two QA fixes.** See below.

## Verified

- `pnpm verify`, 712 tests, clean `pnpm build` (`○ /search`); both RLS suites
  green, policy count unchanged at 30.
- **The dead filter, on prod**: `/api/feed?language=` returned **0 rows for
  every casing** before (against 76 published TypeScript projects) and now
  returns 48 / 20 / 11 for typescript / python / rust.
- **Relevance, on real data**: `q=cli` returns all four projects literally
  *named* "cli" ahead of `simple-shadcn-cli`, which has a **higher**
  `trending_score` and would have won under the old ordering. `q=urfave` finds
  `urfave/cli` via the new repo leg.
- **Facets narrow in SQL, proven**: for `q=cli`, Java has **zero** rows in the
  unfaceted top-48, yet `?lang=java` returns one. A post-filter cannot produce a
  row that was never in the window.
- **Hostile facet input**: `../../etc`, `a,or(1.eq.1)`, `NaN`, `<script>`, and
  `limit=999999` all return 200 and degrade to unfiltered/clamped.
- Browser: desktop + 375px, chips wrap, no horizontal overflow.

## The two QA fixes

- **Visibility switch** was ambiguous *by construction*: `checked={isPublic}`
  with a label that swapped between "public" and "private". A switch label
  should name what the switch CONTROLS; this one named current state, so
  "off / private" read as "private is off, therefore public". Now a fixed
  `public` label, with a helper line when off that also states the D18
  guarantee (private lists don't count toward a project's list total) — said
  where the choice is made, not only in an ADR.
- **Add-to-list trigger** shows the viewer's own membership count, at zero
  extra cost: the control already fetched `/api/me/lists?projectId=` on mount
  to render the checkmarks. The **global** `lists_count` was removed from the
  project page action row (Will's call) — two similar counts side by side read
  as a contradiction. The global signal still ships on `ProjectCard`.

## Known / deferred

- No search rate limiter (D29) — `/api/search` is public and now runs eight
  legs. Needs shared state, i.e. new spend.
- No facet counts, no keyset pagination of results (D25), no `/browse`.
- README/full-text search is out of reach without a service-role-written
  derived column: `readme_html` has no anon grant and averages 25KB/row. The
  UI copy says "searches names, owners, taglines and tags" precisely so it
  doesn't promise otherwise.
- Multi-word queries are still one substring pattern — "react router" cannot
  match "router for react".
- Still open from earlier rounds: the admin manual enrich drain sitting outside
  the AI budget, pass-3 starvation + no per-call AI timeout, the
  screen-vs-admin ASC/DESC divergence, list item counts including unpublished
  projects, and the design/motion QA sweep.

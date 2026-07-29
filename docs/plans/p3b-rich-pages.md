# P3-B part 1 — Rich pages + the lists signal (shipped 2026-07-29)

First and largest slice of the P3-B bundle. Search, faceted filter/`/browse`,
and the design/motion QA sweep are deliberately NOT in this round.

## Why this scope

A live content census decided it (probed read-only before planning):

| | |
| --- | --- |
| published projects | 207 — all with READMEs (avg 25KB, max 210KB) |
| collections / items | **0 / 0** |
| claimed profiles | **1 of 197** |
| distinct publish dates | **2** (bulk ingest — `published_at` is not recency) |

That splits "rich pages" in half. **Author-supplied** richness (screenshot
uploads, changelogs, `description_md`) has nobody to author it — 196 of 197
owners have never signed in. **Derived** richness applies to all 207 pages
today. This round is almost entirely the derived half.

Board decisions (Will): lead with rich pages + the lists signal, ship the
signal **display-only**, and backfill GitHub avatars onto unclaimed profiles.

## Locked decisions

- **D17 — `lists_count` is a denormalized column, not a query-time aggregate.**
  Settled by a live probe: `order=collection_items(count).desc` returns
  **PGRST118**, so an aggregate can be displayed but can never order or
  keyset-paginate a feed. It is also RLS-scoped to the viewer, which would put
  a different number in the anon-cached card than on the project page.
- **D18 — only PUBLIC list membership counts.** At 207 projects, "in 1 list"
  with no visible list discloses that exactly one person privately curated it,
  and the count must be backed by clickable evidence or it permanently
  disagrees with the reachable set. The `saves_count` precedent doesn't
  transfer: a save is one anonymous bit; one account can hold 50 lists × 400
  items. Including private later is additive; excluding later is a visible drop.
- **D19 — count rows, not distinct curators, in v1.** Keeps "appears in N
  lists" literally true. If it ever feeds trending, compute
  `count(distinct profile_id)` as a separate local value — never change what
  the column stores.
- **D20 — no `compute_trending` signature change.** Display-only avoids the
  4-arg overload, the re-grant, the `search_path` re-pin, a 207-row rescore
  that invalidates in-flight keyset cursors, and amending `materialize.ts`'s
  hand-mirrored formula. Revisit when there is real list data to tune against.
- **D21 — recency is `github_pushed_at`; `updated_at` is no longer displayed.**
- **D22 — `flagged` verdicts never auto-downgrade** (resolves a P2.7 deferral).
- **D23 — no index on `lists_count`** until a "most listed" surface exists.

## What shipped

**R0 — migration 0011.** Two additive columns; `recount_project_signals()`
generalizes `bump_project_engagement()` to recount likes, saves and
public-list memberships from scratch, and the old function now delegates to it
so the three can never diverge. Triggers on `collection_items` (membership) and
on `collections.is_public` — the latter is the piece the likes/saves pattern
has no analogue for, and it is what makes D18 self-healing rather than a
one-way door. `projects_before_update()`'s counters array gains `lists_count`
**before** the backfill, or the backfill stamps `updated_at` across the gallery.

**R1 — README fidelity + reading measure.** `prose.css` styled h1/h2 only, and
Tailwind preflight resets h3–h6 to inherit, so `### Install` rendered as body
text on all 207 pages. Now h3–h6, `details`/`summary`, `kbd`, `sup`/`sub`;
tables became their own scroll container; badges are marked at sanitize time so
CSS can drop the screenshot card border; every README image is `loading="lazy"`.
The reading column moved from the 1120px shell to the reference's 780px —
measured 1002px → 710px of text, ~122 → ~87 characters per line.

**R2 — the signal + honest recency.** `FEED_COLUMNS`/`FeedRow` gain both
columns (six consumers inherit them). The card shows "in N lists" as a third
peer after stars, spelled out rather than glyphed. The project page puts it in
the action row, not `RepoStatsRow` (every field there is a GitHub fact).

**R3 — unclaimed substance + consent.** 196 avatars backfilled. The unclaimed
badge was hardcoded and duplicated in two files; it moved to `copy.ts` with
wording unchanged and gained the "is this you?" → `/claim` link the master plan
specifies — a badge with no route to act on it is disclosure without agency.

**R4 — the two P2.7 deferrals.** `flagged` is sticky until a human acts (the
cheapest way to trigger a re-screen was to *report* the project you wanted
de-flagged). The home recs rail's window is now `RECS_LIMIT + EXCLUSION_CAP`
expressed as arithmetic — fifth sighting of window-then-filter.

## Verified

- `pnpm verify` + 688 tests + clean `pnpm build`; both RLS suites green;
  policy inventory unchanged at 30 (0011 adds no policies).
- Triggers proven end to end in a rolled-back transaction: public membership
  counts, private drops to 0, public restores it, item removal drops it,
  deleting the whole list cascades.
- **T25 negative-controlled**: removing the `is_public` leg inside the suite's
  own rolled-back transaction makes it fail with `lists_count = 2`.
- Live: `github_pushed_at` filled 207/207 after the ETag clear — range
  2018-09-09 → 2026-07-29, where every row previously claimed to be hours old.
  Spread: 70 this week, 46 last 3 months, 26 last year, **65 over a year ago**.
  The follow-up sync returned `notModified: 191`, so ETags are back and syncs
  are cheap again — the re-fetch cost was one-time.
- Browser: desktop + 375px across the two hardest README archetypes (60 h3s;
  190 images + 11 tables), no horizontal overflow at either width.

## Known / deferred

- The migration's ETag clear bumped `updated_at` on 213 rows (it is not in the
  counters guard). Harmless: `updated_at` was already sync-noise and is no
  longer displayed anywhere. Adding sync-bookkeeping columns to the guard would
  make it meaningful again — a separate, subtler change.
- Badge marking and lazy-loading are sanitize-at-WRITE, so they apply only to
  READMEs re-synced after 0011. The daily sync has now re-synced all 207.
- Still open from P2.7's deferred list: the admin manual drain sitting outside
  the AI budget, pass-3 starvation + no per-call AI timeout, the screen-vs-admin
  ASC/DESC divergence, list item counts including unpublished projects, and the
  design/copy polish set (verdict-chip typography, the `//` kicker,
  lists-index `<title>`, the profile list link's unique hover).

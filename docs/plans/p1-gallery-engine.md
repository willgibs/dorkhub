# P1 — The gallery engine (execution plan)

Status: **in progress** (2026-07-22). Onboard: CLAUDE.md → docs/state.md →
docs/vision.md → THIS file → modules your slice touches. Vision context:
board-approved curator-first roadmap; P1 = ingestion + stars import + claim.

## Locked architecture (from the approved design — do not re-litigate)

1. **Numeric ids only**: ingest_candidates PK = github_repo_id bigint;
   owner matching by owner_github_id; renames self-heal (syncProject rule).
2. **Never trust snapshots at write time**: approval re-fetches getRepoById
   fresh (createProject rule). Candidate rows are disposable metadata.
3. **Admin = service-role behind requireAdmin()**, deny-all RLS on admin
   tables (claim_invites pattern). star_imports is the exception: real
   user data, own-rows RLS like saves. CORRECTION (1C fact-check, verified
   live): profiles.is_admin IS readable by authenticated (table-wide SELECT
   grant in 0001) — requireAdmin() reads via supabaseService() as posture,
   not necessity. P4 hardening TODO: column-restrict the profiles SELECT
   grant so is_admin stops being publicly enumerable.
4. **Approval = publish** (no draft step). Upsert profile by owner_github_id
   (N repos/owner → 1 profile). 23505 on projects.github_repo_id → recover by
   re-pointing (createProject's branch). Retroactive saves: star_imports rows
   for that repo → saves ON CONFLICT DO NOTHING (triggers recount).
5. **Import = chunked client-driven page loop** (one page per server action
   call; idempotent upserts; resumable; no timeout/queue infra). Zero extra
   GitHub calls: starred payload embeds full repo objects.
6. **Import decision order** per item: own unlisted repo → nudge-/new tally;
   blocklisted → skip; already a project → star_imports + saves upsert
   (instant gratification); fork → filtered tally; else candidate upsert
   (guarded WHERE status='pending') THEN star_imports upsert (trigger order).
7. **Rejected is sticky**: only admin action reopens. demand_count accrues
   regardless (trigger) — "rejected by demand" view can resurface.
8. **Crawls are admin-triggered v1** (no cron): topic_crawl via
   /search/repositories = SEPARATE 30/min bucket → sequential ~2.5s delay
   loop, NEVER the concurrency-5 pool; awesome_list via getReadmeHtml +
   pure link extractor + getRepoByOwnerName (core 5k/hr budget, pool OK).
9. **Consent**: ingest_blocklist checked by EVERY candidate-creating path.
   Admin delete-project action (service role — no RLS path exists for
   deleting others' rows) + blocklist write together.
10. **Claim** (M8 design verbatim): callback branch on unclaimed github_id
    match → /claim; accept = atomic UPDATE profiles SET user_id=$uid,
    claimed_at=now() WHERE github_id=$verified AND user_id IS NULL; decline
    = unpublish projects (keep rows) + stays unclaimed; claim_invites stays
    decorative/deny-all.

## Migration 0006_ingestion.sql (applied by orchestrator pre-wave)

Tables: ingest_candidates (github_repo_id PK, owner_github_id, owner_login,
repo_full_name, repo_url, name, description ≤500, primary_language, topics,
license, stars_count, forks_count, fetched_at, source enum, demand_count,
status enum + rejection_reason, decided_by → profiles null-on-delete,
decided_at, materialized_project_id → projects null-on-delete, created_at;
partial queue index (demand desc, stars desc) WHERE pending; owner index) ·
star_imports ((profile_id, github_repo_id) PK, starred_at, imported_at; repo
index; NO FK on github_repo_id — dual-target by design) · ingest_blocklist
(scope repo|owner + shape check + unique partial indexes) · ingest_crawl_runs
(source, params jsonb, triggered_by, timestamps, status, tallies).
Functions/triggers: bump_candidate_demand (recount, SECURITY DEFINER, EXECUTE
revoked); supersede_pending_candidate AFTER INSERT ON projects. Grants: all
four revoked from anon/authenticated; star_imports gets select/insert(cols)/
delete to authenticated + own-rows policies; others deny-all (zero policies).
service_role covered by 0003 default privileges — assert in rls_checks.

## Waves

### Wave 1 (3 parallel)
- **1A client**: src/lib/github/client.ts + client.test.ts — add
  `listStarredRepos(login, {page})` single-page fetch (per_page 100,
  Accept application/vnd.github.star+json → items {starred_at, repo});
  returns {kind ok, data: {items, hasMore}} (hasMore from Link rel=next);
  `getRepoByOwnerName(owner, name, {etag?})` → /repos/{owner}/{name}.
  Tests: star+json parsing, hasMore, header assertions.
- **1B pure logic**: NEW src/lib/ingest/decide.ts —
  `decideStarImport(item, ctx: {isOwnRepo, isBlocklisted, existingProjectId
  |null})` → discriminated action {kind: 'own'|'blocked'|'save'|
  'filtered_fork'|'candidate'} (+tally key); NEW src/lib/ingest/links.ts —
  `extractGithubRepoRefs(html)` → deduped [{owner, name}] (skip anchors,
  fragments, non-repo paths, github.com subpaths like /topics /sponsors);
  NEW src/lib/ingest/throttle.ts — `searchBucketDelayMs` const + pure
  backoff helper. Tests for all three (decide matrix, hostile/fixture HTML,
  edge URLs).
- **1C admin shell**: NEW src/lib/auth/admin.ts — `requireAdmin()` server
  helper: getUser → supabaseService read is_admin+profile → redirect('/')
  when not admin (comment WHY service role: is_admin column has no
  authenticated grant); NEW src/app/(app)/admin/layout.tsx (calls
  requireAdmin, renders children + quiet admin nav: queue · sources ·
  claims); NEW src/app/(app)/admin/page.tsx dashboard (service-role counts:
  pending/approved/rejected candidates, crawl runs, unclaimed profiles,
  blocklist size — plain stat rows, mono, absence-not-zero).

### Wave 2 (3 parallel, after Wave 1)
- **2A import**: NEW src/app/(app)/settings/import/{page.tsx,import-runner.tsx
  ('use client'),actions.ts} — page: auth+profile guard, intro copy + start;
  runner: loop `importStarsPage(page)` until !hasMore, live tallies;
  action: listStarredRepos page → per item decideStarImport →
  service-role candidate upserts + cookie-client star_imports/saves upserts
  (saves via RLS as the user; candidates via service — comment the split) →
  return tallies + hasMore. Result copy per plan. Link from
  /settings/projects + /saved empty state ('bring your stars').
- **2B queue**: NEW src/app/(app)/admin/queue/{page.tsx,actions.ts,
  row-actions.tsx} — pending list (demand-sorted, candidate metadata,
  source badge, demand count), approve/reject per locked arch 4/7;
  'rejected by demand' secondary list (collapsed).
- **2C sources**: NEW src/app/(app)/admin/sources/{page.tsx,actions.ts} —
  topic crawl form (topic, min_stars, language, max_results ≤100) →
  sequential search loop → candidates via shared ingestCandidateUpsert
  helper (NEW src/lib/ingest/upsert.ts, service-role, blocklist-checked —
  used by 2A/2B/2C identically); awesome-list form (owner/repo) →
  getReadmeHtml → extractGithubRepoRefs → getRepoByOwnerName pool →
  candidates; crawl_runs audit list; manual-add form (URL or owner/name);
  delete-and-block action (project → delete + owner-or-repo blocklist row +
  revalidatePaths).

### Wave 3 (solo, after Wave 2)
- **claim**: MODIFY src/app/auth/callback/route.ts — insert the unclaimed-
  match branch (service-role lookup by github_id where user_id null →
  redirect /claim) BEFORE the existing has-profile/onboarding branches;
  NEW src/app/(app)/claim/{page.tsx,actions.ts} — "we hand-picked your work"
  page (plan-master copy: 'This page is yours if you want it — or we'll
  remove it'), shows the unclaimed profile + its projects; accept action:
  atomic claim UPDATE (github_id verified from session identity, never
  form), revalidate profile paths, redirect /u/{username}; decline action:
  unpublish all projects (status draft via service role) + record in
  decisions… no — decline = unpublish + leave unclaimed + redirect / with
  a quiet done state. /admin/claims: NEW page listing unclaimed profiles +
  claim_invites generator (service insert, copy link) per M8 minimal cut.
- proxy: /claim already in AUTHED_PREFIXES ✓ (verify only).

## Copy keys (pre-added): importTitle 'bring your stars', importSubtitle
'we'll match your public github stars against the gallery — the rest queue
for review', importStart 'import my stars', importRunning 'reading your
stars…', importDoneHere '{n} of your stars are already here', importDoneQueued
'{n} queued for review — we pick quality over volume', importDoneOwn '{n} of
your own repos aren't listed yet — show your thing', importNudgeNew 'show
your thing', importEmpty 'no public stars found — go wander github first',
claimTitle 'we hand-picked your work', claimBody 'this page is yours if you
want it — or we'll remove it. no strings.', claimAccept 'claim my page',
claimDecline 'remove my stuff', claimDeclined 'done — your pages are
unpublished. change your mind anytime by signing back in.', adminQueueTitle
'review queue', adminSourcesTitle 'sources', adminClaimsTitle 'claims'.
(Interpolations rendered in JSX around the string, not template literals —
match existing countLabel patterns.)

## Verification gates
Per wave verify/test/build. rls_checks: extend with deny-all (candidates/
blocklist/crawl_runs), own-rows (star_imports), service DML on all four,
demand-trigger + supersede-trigger behavioral tests; run vs live DB. Live
E2E (orchestrator): import against a real public account, approve/reject
round-trip incl. retroactive saves + counters, topic + awesome crawls,
block → re-import skips, claim with seeded profile. Then Will's look; tag p1.

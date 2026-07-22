# M4 — Projects + GitHub sync (execution plan)

Status: **SHIPPED — E2E-proven** (2026-07-22). Will published willgibs/linkflow
through the full /new → draft → publish flow on prod; cron verified with real
PAT (ETag 304s). Kept for reference; subagents onboard from CLAUDE.md →
docs/state.md → the active milestone plan.

## Goal

Make projects real: `/new` repo picker → service-role creation after GitHub
ownership verification → `syncProject` (ETags + existing sanitizer) → live
project page at `/u/[username]/[slug]` (README is the centerpiece) → owner
curation at `/settings/projects` → daily sync cron → dynamic OG images.

## Scope cuts (decided — do not re-litigate)

- `description_md` authoring/rendering → M6 (no unified/rehype in M4; column stays untouched).
- Screenshots, update posts, editing polish → M6. Feed/tag pages/likes/saves UI → M5.
- Repo deleted/gone-private: keep last-known-good display data, no owner-facing
  indicator yet (schema frozen) → M8/M9 candidate migration.

## Design decisions (locked)

1. **No octokit — plain `fetch` thin client** (3 endpoints; injectable `fetchImpl`
   for tests; zero new deps). Every request sends `Authorization: Bearer $GITHUB_TOKEN`,
   `X-GitHub-Api-Version: 2022-11-28`, `User-Agent: dorkhub` (GitHub 403s without UA).
2. **Sync fetches by numeric id** (`GET /repositories/{id}`) so renames self-heal.
   `slug` is NEVER rewritten by sync — dorkhub URLs are permanent.
3. **`last_synced_at` bumps on every completed attempt** (`ok`/`not_modified`/`not_found`),
   never on `rate_limited`/`error` — else 304s/dead repos pin the cron queue front.
4. **Project page uses cookie-bound `supabaseServer()`**: tree is dynamic anyway
   (SiteHeaderSession), and RLS `published-or-own` shows owners their fresh drafts
   for free. Still `export const revalidate = 300` + `revalidatePath` on writes —
   inert today, correct after the M5 caching pass.
5. **Owner edits go through RLS** (cookie-bound `supabaseServer()`): exactly the
   granted columns `tagline/tags/demo_url/status/sort_order`. Creation + ALL sync
   writes are `supabaseService()` (INSERT has no RLS path; sync columns unranted).
6. **Ownership check**: fresh `getRepoById`, compare `repo.owner.id === profile.github_id`
   (numeric immutable ids, never logins). Insert 23505 on global `github_repo_id`:
   caller's own row → idempotent redirect to it; someone else's → `copy.newRepoTaken`.
7. **`demo_url`**: prefilled from GitHub `homepage` at creation only; sync never touches it.

## File map + signatures

### Wave 1A — `src/lib/github/client.ts` (+ `client.test.ts`)
- `import 'server-only'`. Fail-loud `GithubConfigError` if `GITHUB_TOKEN` unset
  (checked at call time, not import time — mirrors `supabaseService()`).
- `type GithubRepo = { id, name, full_name, html_url, description, homepage,
  language, stargazers_count, forks_count, license: {spdx_id}|null, topics,
  default_branch, fork, archived, private, updated_at, owner: {id, login} }`
- `type GithubResult<T> = {kind:'ok', data, etag} | {kind:'not_modified', etag}
  | {kind:'not_found'} | {kind:'rate_limited', retryAfterSeconds, resetAt}
  | {kind:'error', status, message}`
  (403/429 → `rate_limited`; a genuinely bad token looks rate_limited on EVERY
  call — accepted conflation, note in a comment.)
- `listPublicRepos(login, opts?)` — `/users/{login}/repos?type=owner&sort=updated&per_page=100`,
  Link-header pagination, cap 5 pages (500 repos). No ETag use for lists.
- `getRepoById(repoId, {etag?, fetchImpl?})` — `/repositories/{repoId}`, sends If-None-Match.
- `getReadmeHtml(owner, repo, {etag?, fetchImpl?})` — `/repos/{owner}/{repo}/readme`
  with `Accept: application/vnd.github.html`; body is HTML text.
- Tests: inject `fetchImpl` returning real `new Response(...)` objects; cover
  200/304/404/403(+Retry-After)/5xx classification, ETag extraction, pagination,
  page cap, missing-token error. Set/delete `process.env.GITHUB_TOKEN` per test.

### Wave 1B — `src/lib/projects/{slug,fields,throttle}.ts` (+ tests)
- `generateProjectSlug(repoName, existingSlugs: ReadonlySet<string>): string` —
  lowercase, non-alnum→`-`, collapse/trim `-`, fallback `'project'` if empty,
  `-2`/`-3`… suffix on collision; output always matches DB check
  `^[a-z0-9]+(?:-[a-z0-9]+)*$` (fuzz-assert in tests).
- `parseTagsInput(raw: string): string[]` — split commas, trim, lowercase,
  slugify-lite, dedupe, cap 8, drop empties.
- `isValidDemoUrl(raw: string): boolean` — https only, parseable.
- `canRefreshNow(lastSyncedAt: string|null, now: Date): boolean` — 5-min throttle.

### Wave 1C — `src/app/(app)/u/[username]/[slug]/page.tsx`
- `cache()`d `getPageData(username, slug)` via `supabaseServer()`: getClaims,
  profile by username (`maybeSingle`), project by `(profile_id, slug)`
  (`maybeSingle` — RLS hides others' drafts), `isOwner = claims.sub === profile.user_id`.
  `notFound()` on any miss. `generateMetadata` from name/tagline via same fn.
- Compose EXISTING components (no new design-system components): h1 name +
  tagline, author byline → `/u/{username}`, `RepoStatsRow` (0 stars → null:
  absence never "0"; `formatUpdatedAgo` from `src/lib/projects/map.ts`),
  `TagChip` row, demo CTA if `demo_url`, `CopyButton` `git clone {repo_url}.git`,
  README via `MarkdownProse {html, label:'README.md', forkHref:`${repo_url}/fork`}`
  or `EmptyState copy.projectNoReadme` when null, disabled `StatButton` like
  (M5 pattern, count 0→null), owner bar (only `isOwner`): draft `Badge` when
  status='draft' + link to `/settings/projects` (real action forms arrive in 3F).

### Wave 2D — `src/lib/github/sync.ts` (+ `sync.test.ts`) — after 1A
- Pure core: `computeSyncUpdate(current: SyncInput, repoResult, readmeResult)`
  → `{patch: Partial<ProjectRow>, bumpSyncedAt: boolean}`; table-driven tests over
  the repo×readme result matrix. README `not_found` ⇒ `readme_html: null,
  readme_etag: null` (graceful, not an error).
- IO shell: `syncProject(projectId, opts?)` → service-role read
  (`id, github_repo_id, repo_etag, readme_etag, repo_full_name`), `getRepoById`
  by id, README via fresh `full_name` (or last-known-good on 304), pipe through
  `sanitizeReadmeHtml(raw, {repoFullName, branch: default_branch})`, service-role
  patch. Returns `{status: 'synced'|'not_modified'|'not_found'|'rate_limited'|'error'}`.

### Wave 3E — `src/app/(app)/new/{page.tsx,repo-picker.tsx,actions.ts}` — after 1B+2D
- Page (server): auth → own profile (service lookup, onboarding-page pattern) →
  `listPublicRepos(githubIdentity(user).login)` → annotate taken repos (query
  projects by `github_repo_id in (...)`, distinguish own vs others') → graceful
  `EmptyState` on rate_limited/error/empty; truncation note at page cap.
- Picker (client): cmdk `Command` filter over name/description/topics; forks +
  archived hidden by default (toggle); per-row `<form action={createProject}>`
  + `useFormStatus` pending state.
- `createProject`: parse repo_id → auth+profile → fresh `getRepoById` → numeric
  ownership check → `generateProjectSlug` vs own existing slugs → `sort_order = max+1`
  → service insert (status 'draft', demo_url from homepage) → 23505 handling per
  decision 6 → best-effort `await syncProject(id)` (failure never blocks) →
  `redirect('/u/{username}/{slug}')`.

### Wave 3F — `src/app/(app)/settings/projects/{page.tsx,actions.ts,delete-button.tsx}` — after 1B+2D
- Page: own drafts+published via `supabaseServer()` (RLS own-branch), order
  `sort_order`; per-project card: status badge, inline single-save form
  (tagline / tags comma-input / demo_url), publish/unpublish, up/down reorder
  (adjacent `sort_order` swap), refresh (throttle → `copy.projectRefreshThrottled`),
  delete behind native `confirm()` in a tiny client wrapper. Empty →
  `copy.settingsEmptyProjects` + link `/new`.
- Actions (`{error}|null` returns, onboarding pattern): `updateProjectFields`,
  `setProjectStatus`, `deleteProject`, `reorderProject`, `refreshProjectFromGithub`
  (ownership + `canRefreshNow` via cookie client, then `syncProject`).
  All non-sync writes cookie-bound under RLS — NOT service role.
- Also: wire the project-page owner bar (from 1C) to these actions.

### Wave 3G — `src/app/api/cron/sync/route.ts` + `vercel.json` — after 2D
- `GET`: `authorization === 'Bearer '+CRON_SECRET` else 401. Select `id` of
  ~200 stalest published (`order last_synced_at asc nullsFirst limit 200`).
  Bounded pool concurrency 5 (hand-rolled), per-project try/catch, short-circuit
  batch on first `rate_limited`. Return JSON `{synced, notModified, notFound,
  rateLimited, errored}`, 200 on partial failure. `export const maxDuration = 60`.
- `vercel.json`: `{"crons":[{"path":"/api/cron/sync","schedule":"0 9 * * *"}]}`.

### Wave 4 — OG images — after 1C
- `src/app/(app)/u/[username]/[slug]/opengraph-image.tsx` (+ profile OG if
  trivial): `ImageResponse` + `src/lib/og-tokens.ts` hex mirrors, pattern from
  `src/app/opengraph-image.tsx`. Anon client fetch, published-only.

## Shared contracts

- **revalidatePath map**: status/fields/delete/sync → `/u/{username}` +
  `/u/{username}/{slug}`; reorder → profile only; create → none (draft).
- **New copy keys** (`src/lib/copy.ts`, house voice — lowercase, warm, absence
  never "0"): `newTitle`, `newNoRepos`, `newRepoListTruncated`,
  `newRepoUnavailable`, `newRepoNotYours`, `newRepoTaken`, `projectNoReadme`,
  `projectRefreshThrottled`, `settingsEmptyProjects`, `settingsDeleteConfirm`,
  plus draft-badge / publish / unpublish / refresh labels.
- **Env**: `GITHUB_TOKEN` (fine-grained PAT, public-repo read-only — Will) and
  `CRON_SECRET` — both in `.env.example`; must be mirrored to Vercel env.

## Verification gates

Per wave: `pnpm verify` + `pnpm test`; `pnpm build` before each commit.
End of milestone: live E2E via browser pane (`/new` → draft+README → publish →
public page/profile card → throttle msg → reorder/delete), cron curl with
Bearer secret (second run mostly 304), RLS spot-check (authenticated cannot
INSERT projects nor write `readme_html`/`stars_count` — extend
`supabase/tests/rls_checks.sql` if uncovered), then tag `m4`.

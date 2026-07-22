# Current state — 2026-07-22

## Milestones (master plan M0–M9)
- M0–M2.5, M7 ✅ — design locked ("quiet dev-native"), 24-component library +
  /design styleguide (5 pages), motion system retrofitted, marketing home +
  manifesto (gate: merged take approved), brand OG, robots noindex-until-M9.
- DB ✅ LIVE — dedicated Supabase org, ref xvorwdvsnbpujyzfowwu (us-east-1).
  Migrations 0001–0004 applied; seeds in; RLS suite 26/26; advisors clean.
- M3 auth+identity ✅ — E2E-PROVEN by first real signup (u/willgibs). Three
  prod bugs found+fixed+regression-guarded: service_role grants (0003),
  client/server module split (browser.ts + server-only), layout router-cache
  staleness (revalidatePath('/','layout') post-onboarding).
- M4 projects+GitHub sync ✅ CODE-COMPLETE (plan: docs/plans/m4-projects.md) —
  GitHub fetch client (PAT, ETags, numeric-id fetches), syncProject (pure
  computeSyncUpdate core, 46 matrix tests), /new repo picker (ownership
  re-verified by numeric id, idempotent 23505), live /u/[username]/[slug]
  (README centerpiece, owner bar), /settings/projects (RLS-bound CRUD,
  reorder, throttled refresh), /api/cron/sync (bearer-gated, 200-stalest,
  rate-limit short-circuit) + vercel.json daily cron, dynamic OG cards with
  brand fallback. 244 tests; verify/test/build green; RLS re-run 26/26.
  NOT yet user-QA'd signed-in (needs GITHUB_TOKEN — see blockers).

## Next steps
1. Will: create fine-grained PAT (Public repos, read-only) → GITHUB_TOKEN in
   .env.local + Vercel env; mirror CRON_SECRET (in .env.local) to Vercel.
2. Will: first-user QA of /new → draft → publish → project page (M4 E2E).
3. M5 discovery+interactions (feed, tags, likes/saves/follows, caching pass:
   de-dynamize SiteHeaderSession so ISR/revalidatePath do real work).
4. Then M6 (screenshots, updates, edit polish incl. cmdk-row a11y), M8, M9.

## Open blockers
- GITHUB_TOKEN unset (local+prod): /new shows quiet empty state, cron tallies
  errors — degrades gracefully, but M4 is unusable-by-design until the PAT.

## DB access (for agents)
Dedicated account, NOT the MCP (reserved for Will's other agents). Management
API via SUPABASE_ACCESS_TOKEN (curl api.supabase.com/v1) + psql session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(PGPASSWORD=$SUPABASE_DB_PASSWORD).

## Infra + gotchas
Repo github.com/willgibs/dorkhub · prod dorkhub-ten.vercel.app · CI green ·
tags m0/m1/m2/m4. proxy MUST be src/proxy.ts (root is silently ignored).
launch.json app has autoPort (3000 often taken). Stale .next dev cache can
replay long-fixed compile errors — rm -rf .next before trusting dev errors.

Last updated: 2026-07-22 (M4 code-complete; awaiting PAT + first-user QA).

# Current state — 2026-07-21

## Milestones (master plan M0–M9)
- M0 explorations ✅ (design locked: "quiet dev-native" — Instrument Sans · ice cyan · charcoal · rounded)
- M1 foundation ✅ (scaffold green; Supabase SQL written but **unapplied**)
- M2 components ✅ — 24 components + shadcn primitives compile green; `/design`
  styleguide (overview/components/typography/voice) built and verified
- M7 marketing+brand ✅ — signed-out home (staggered hero, is/isn't, fixture
  feed preview, how-it-works, teaser), /manifesto (TWO draft tenet takes behind
  a switcher — ⛔ GATE: Will picks; loser deleted), brand OG card + favicon,
  robots noindex-until-M9 + sitemap, footer link fixes. M4-prep landed: vitest
  in CI, sanitizeReadmeHtml (19 hostile-fixture tests), cursor codec (47 tests).
- M2.5 motion retrofit ✅ — 6 overlay primitives retuned to tokens (dialog/
  dropdown/tooltip/sheet/select/hover-card); ui/collapsible grid-rows height
  animation; StatButton/CopyButton/ThemeToggle/AvatarStack/SkeletonCard/
  RepoStatsRow+ProjectCard/Switch/ProjectCard-hover retrofitted; `/design/motion`
  page shipped (tokens, reduced-motion simulator, every adopted transition,
  rejected list); ⌘K command palette confirmed animation-free. `pnpm verify &&
  pnpm build` green.
- DB ✅ LIVE — dedicated Supabase org ("Dorkhub Team", free tier), project ref
  xvorwdvsnbpujyzfowwu (us-east-1). 0001+0002 applied; seed in; ALL RLS checks
  pass; advisors clean (4 accepted-by-design, documented in 0002 header).
- M3+ (auth/projects/feed) ▶ UNBLOCKED

## Next steps
1. M3 auth + identity: proxy.ts (@supabase/ssr updateSession), /auth/callback
   (identity via numeric provider_id; claim branch deferred to M8), /onboarding
   username flow, read-only /u/[username] profile. NEEDS from Will first: a
   GitHub OAuth App (github.com/settings/developers → New OAuth App; callback
   URL https://xvorwdvsnbpujyzfowwu.supabase.co/auth/v1/callback) — then the
   orchestrator sets the provider config via Management API.
2. Will: mirror the 3 app vars from .env.local into Vercel dashboard env.
3. Then M4 (projects+GitHub sync — sanitizer already shipped+tested), M5, M6, M8.

## Open blockers
- (none for M3 beyond the GitHub OAuth App above)

## DB access (for agents)
Dedicated Supabase account, NOT the MCP (that stays on Will's main org for
other agents). Channels: Management API via SUPABASE_ACCESS_TOKEN in .env.local
(curl api.supabase.com/v1) + psql via session pooler
postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres
with PGPASSWORD=$SUPABASE_DB_PASSWORD. updated_at guard: counter-only updates
(likes/saves/trending) do NOT bump projects.updated_at (verified).

## Notes for next session
- `/design` now has 5 pages: overview, components, motion, typography, voice.
  All content sourced from `@/lib/fixtures` + `@/lib/copy` — no invented copy.
- Motion retrofit judgment calls (full rationale in docs/decisions.md): Dialog
  gained an `animated` prop (default true, `false` on CommandDialog) so ⌘K can
  opt out of overlay animation entirely; ui/collapsible's grid-rows technique
  needs `forceMount` + the animating element's className must never merge with
  a consumer's layout classes (a bare `flex` silently killed `grid-rows` — this
  shipped broken until caught by live browser verification, then fixed).
- Follow-up spotted but out of this task's scope: `ui/button.tsx` and
  `ui/tabs.tsx` still use `transition-all` (motion.md hard-rule violation,
  pre-existing) — worth its own pass.
- `.claude/launch.json`'s `app` config got `"autoPort": true` — port 3000 is
  often held by a sibling project's (qrcdn) dev server on this machine.

## Infra
Repo: github.com/willgibs/dorkhub (private, pre-existing — origin was already
wired). CI green on main (verify + build). Tags m0/m1/m2 pushed. Dev server:
`.claude/launch.json` "app" (autoPort — 3000 often taken by qrcdn).

Last updated: 2026-07-22 (DB live: migrations+seed+RLS verified; M3 unblocked).

# Current state — 2026-07-22

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
- M3 auth + identity ✅ — proxy.ts (@supabase/ssr session refresh, presence-only
  gating), GitHub OAuth App configured + /auth/{signin,callback,signout},
  identity/username/redirect helpers, /onboarding username flow, live
  `/u/[username]` profile page (supabaseAnon, ISR revalidate 300, unclaimed
  badge, projectRowToCard + lang-colors mapping), session-aware
  SiteHeaderSession (avatar dropdown: your page / sign out) swapped into both
  (app) and (marketing) layouts, hero CTA wired to /auth/signin. Verified live
  against the real DB in-browser (mollybuilds, citext-insensitive lookup, 404
  for unknown usernames, OAuth redirect to github.com all confirmed working).
- M3+ (projects/feed) ▶ IN PROGRESS — M4 waves 1A/1B/1C/2D landed (GitHub
  fetch client, slug/tags/demo-url/throttle utils, live `/u/[username]/[slug]`
  project page, `syncProject`). Wave 3E landed: `/new` repo picker —
  server page annotates the caller's public repos as available/yours/taken
  (service-role query so OTHER users' drafts are visible for the taken-check),
  cmdk-based client picker (forks/archived hidden by default behind a Switch
  toggle, per-row `<form action={createProject}>` + `useFormStatus` "adding…"
  state), `createProject` server action (fresh ownership re-check via
  `getRepoById`, slug/sort_order derivation, 23505 idempotent-redirect
  handling, best-effort initial `syncProject`). `pnpm verify && pnpm test &&
  pnpm build` green; live-verified the unauthenticated gate in-browser
  (`/new` → `/auth/signin?next=%2Fnew` → GitHub OAuth, no server errors).
  Waves 3F (settings/projects) and 3G (cron) have in-progress uncommitted
  files from parallel sessions as of this writing — not reviewed here.

## Next steps
1. Will: mirror the 3 app vars from .env.local into Vercel dashboard env.
2. M4 remaining: confirm 3F/3G land clean, then Wave 4 (OG images), M5, M6, M8.

## Open blockers
- (none)

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
- `SiteHeaderSession` (src/components/site-header-session.tsx) reads cookies
  (supabase.auth.getClaims()) to render the per-user avatar/dropdown, and it's
  now used by both (app) and (marketing) layouts — so every page under either
  layout is forced dynamic (build output: `/`, `/manifesto`, `/u/[username]`
  all `ƒ` now, confirmed via `pnpm build`). Accepted for M3; revisit at the M5
  caching pass (e.g. hoist the header's auth read into a client-island overlay
  so the page shells themselves can stay static/ISR again).
- `.claude/launch.json`'s `app` config got `"autoPort": true` — port 3000 is
  often held by a sibling project's (qrcdn) dev server on this machine.

## Infra
Repo: github.com/willgibs/dorkhub (private, pre-existing — origin was already
wired). CI green on main (verify + build). Tags m0/m1/m2 pushed. Dev server:
`.claude/launch.json` "app" (autoPort — 3000 often taken by qrcdn).

Note: proxy MUST live at src/proxy.ts (src-dir project) — at repo root Next silently ignores it and route gating vanishes; caught in browser QA when /settings 404d instead of redirecting.

Last updated: 2026-07-22 (M3 shipped: live profile page, session-aware header, auth wiring — verified in-browser against the live DB; `pnpm verify && pnpm test && pnpm build` green).

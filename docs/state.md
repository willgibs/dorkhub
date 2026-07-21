# Current state — 2026-07-21

## Milestones (master plan M0–M9)
- M0 explorations ✅ (design locked: "quiet dev-native" — Instrument Sans · ice cyan · charcoal · rounded)
- M1 foundation ✅ (scaffold green; Supabase SQL written but **unapplied**)
- M2 components ✅ — 24 components + shadcn primitives compile green; `/design`
  styleguide (overview/components/typography/voice) built and verified
- M2.5 motion retrofit ✅ — 6 overlay primitives retuned to tokens (dialog/
  dropdown/tooltip/sheet/select/hover-card); ui/collapsible grid-rows height
  animation; StatButton/CopyButton/ThemeToggle/AvatarStack/SkeletonCard/
  RepoStatsRow+ProjectCard/Switch/ProjectCard-hover retrofitted; `/design/motion`
  page shipped (tokens, reduced-motion simulator, every adopted transition,
  rejected list); ⌘K command palette confirmed animation-free. `pnpm verify &&
  pnpm build` green.
- M3+ (auth/projects/feed) ⏸ blocked on DB

## Next steps
1. M7 marketing surfaces (manifesto → Will gate, signed-out home) — no DB.
2. When a Supabase slot frees: unblock M3+ (see blockers).

## Open blockers
- **Supabase**: org free-tier slots 2/2 used (hopper, qrcdn). Will chose to hold
  DB work. When a slot frees: create project "dorkhub" (us-east-1), apply
  `supabase/migrations/0001_init.sql` + seed, run `supabase/tests/rls_checks.sql`.
  Known pre-apply fix: guard `projects_before_update()` so counter-only updates
  don't bump `updated_at`.
- No Docker / supabase CLI locally — DB work goes through Supabase MCP.

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

Last updated: 2026-07-21 (session 3 close: M2.5 motion retrofit complete, CI green).

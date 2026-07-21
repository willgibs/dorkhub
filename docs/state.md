# Current state — 2026-07-21

## Milestones (master plan M0–M9)
- M0 explorations ✅ (design locked: "quiet dev-native" — Instrument Sans · ice cyan · charcoal · rounded)
- M1 foundation ✅ (scaffold green; Supabase SQL written but **unapplied**)
- M2 components ✅ — 24 components + shadcn primitives compile green; `/design`
  styleguide (overview/components/typography/voice) built and verified
- M3+ (auth/projects/feed) ⏸ blocked on DB

## Next steps
1. CI workflow `.github/workflows/ci.yml` + GitHub repo + push (orchestrator).
2. Then: M7 marketing surfaces (manifesto, signed-out home) — no DB needed.

## Open blockers
- **Supabase**: org free-tier slots 2/2 used (hopper, qrcdn). Will chose to hold
  DB work. When a slot frees: create project "dorkhub" (us-east-1), apply
  `supabase/migrations/0001_init.sql` + seed, run `supabase/tests/rls_checks.sql`.
  Known pre-apply fix: guard `projects_before_update()` so counter-only updates
  don't bump `updated_at`.
- No Docker / supabase CLI locally — DB work goes through Supabase MCP.

## Notes for next session
- `/design` is now live: `layout.tsx`+`design-nav.tsx` (sticky side nav),
  `page.tsx` (tokens+radius+shadow), `components/page.tsx` (catalog of all 24
  components + a representative sweep of shadcn primitives, `components/
  demo-widgets.tsx` for the few controlled-prop components that need client
  state), `typography/page.tsx`, `voice/page.tsx`. All content sourced from
  `@/lib/fixtures` + `@/lib/copy` — no invented product copy.
- `.claude/launch.json`'s `app` config got `"autoPort": true` — port 3000 is
  often held by a sibling project's (qrcdn) dev server on this machine.

Last updated: 2026-07-21 by orchestrator (session 3, /design styleguide).

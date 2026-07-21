# Conventions (what Biome can't enforce)

## Components
- Kebab-case filenames; named exports; exported `XxxProps` type per component.
- One component per file (tiny internal helpers OK).
- `'use client'` ONLY for interactivity/hooks/browser APIs. Confirmed pattern:
  theme-provider, theme-toggle, stat-button, follow-button, copy-button,
  user-hover-card are client; tag-chip, time-ago, sign-in-github, project-card,
  and everything presentational are server.
- Design-system components take state + callbacks via props — NO data fetching,
  NO Supabase imports in src/components/.
- Every interactive element gets a focus-visible ring (ring-ring pattern) and
  active:translate-y-px.
- Optional `className` prop merged via `cn()` from `@/lib/utils`.

## Imports & files
- `@/*` alias only — never `../../..` relative climbing.
- shadcn primitives live in `src/components/ui/` — composed and restyled via
  className, never edited (biome override relaxes a11y pedantry there only).

## Motion
- `motion`/`m` imports only inside files that are already `'use client'` leaf
  islands — never inside a currently-server component in src/components/.
  Timing/easing/springs come from docs/motion.md tokens; no bespoke physics.

## Styling
- Tokens only (see docs/design-system.md). Arbitrary values allowed only when they
  wrap a token (`hover:border-[color-mix(in_oklab,var(--foreground)_22%,var(--border))]`)
  or match a locked pixel value from the reference (e.g. text-[12.5px] mono metadata).

## Security split (relevant from M4 on)
- GitHub READMEs: sanitized ONCE at write time server-side (`sanitize-html`),
  stored in service-role-only `readme_html`, rendered via MarkdownProse `html` prop.
- User-authored markdown (descriptions, updates): raw in DB, sanitized at every
  render (unified + remark-gfm + rehype-sanitize). Never mix the two paths.

## Process
- `pnpm verify` green before any task is "done"; conventional commits
  (feat/fix/chore/docs/refactor/test, optional scope); milestone git tags m0, m1, …
- Subagents: sonnet default, haiku for trivial sweeps, Fable = orchestrator only.

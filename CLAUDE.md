# dorkhub.com

Social discovery platform for hobbyist devs to showcase GitHub projects —
generosity over sales; not a marketplace, launch platform, or hiring portfolio.
Solo founder (Will) + AI agents. Will owns product decisions; agents own execution.

## Stack
Next.js 16 (App Router, Turbopack, `proxy.ts`) · React 19 · TypeScript 5 (NOT 7 —
breaks Next build) · Tailwind v4 (CSS-first `@theme`) · shadcn/ui · Supabase
(Postgres/Auth/Storage) · Vercel · Biome · pnpm.

## Commands
`pnpm dev` · `pnpm build` · `pnpm verify` (biome + tsc — THE green gate) ·
`pnpm lint:fix` · `pnpm test` (vitest run) · `pnpm test:watch`. Run `pnpm verify`
before calling any task done.

## Load a doc module before touching its area
- `docs/state.md` — milestone status, next steps, blockers. **Load first, always.**
- `docs/vision.md` — board-approved product vision + governance; the north star.
- `docs/architecture.md` — DB schema/RLS/GitHub-sync/routes/auth. Load for
  supabase/**, src/lib/supabase/**, api/, auth work.
- `docs/design-system.md` — tokens, fonts, voice, micro-details, component index.
  Load for src/components/**, globals.css, src/app/design, copy.
- `docs/conventions.md` — code patterns Biome can't enforce. Load for any new file.
- `docs/motion.md` — motion tokens, CSS-vs-motion rule, reduced-motion policy,
  adoption map. Load for ANY animation/transition work.
- `docs/decisions.md` — dated one-line ADRs; append when you decide something real.
- `docs/plans/` — per-milestone execution plans (mN-*.md); load for that milestone's work.
- `docs/plan-master.md` — full original plan; deep rationale only.

## Hard rules
- Design tokens only — never hardcode color/radius/shadow/font (docs/design-system.md).
- Preserve the intentional micro-details listed in docs/design-system.md — they are
  not cruft to clean up.
- Voice strings come from `src/lib/copy.ts`; zero-stat content shows absence, never "0".
- RLS on every table; column grants + policies; `(select current_profile_id())`.
- READMEs: sanitize-at-write, service-role-only column. User markdown: rehype-sanitize
  at render.
- Animation work: read `.agents/skills/emil-design-eng/SKILL.md` first;
  `review-animations` skill is the QA gate before motion-heavy milestone tags.
- Model policy: orchestrator thinks (Fable); execution subagents run sonnet
  (haiku for trivial sweeps).
- Update `docs/state.md` (rolling rewrite, ≤40 lines) at every session/milestone end.

## Product gates — pause and ask Will
Manifesto copy · seed list · launch go. Everything else: proceed autonomously.

## Subagent onboarding preamble (canonical)
1. Read CLAUDE.md. 2. Read docs/state.md, then the module(s) your task touches.
3. Follow the model policy + verification gate; run `pnpm verify` before finishing
and update docs/state.md (+ docs/decisions.md if you made a real decision).

This file stays under ~55 lines. Everything else lives in docs/.

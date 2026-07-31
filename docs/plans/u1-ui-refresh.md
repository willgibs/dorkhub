# U1 — UI refresh round (board-directed, 2026-07-31)

Will, post-launch: **"Explore new looks as a base to see if a similar yet
distinctively new direction would work better, else evolve the current look
if no new looks work."** Same method that picked the original system (the
M0 `explorations/` bake-off), upgraded: v2 renders REAL components with REAL
prod content instead of static mocks, so "works better" is judged on the
actual product.

## Shape

- **R1 (build, autonomous):** `/design/directions` — a noindexed page that
  renders the live trending slice + representative surfaces (cards, hero
  type, chips, buttons) under a client-side skin switcher. Each direction =
  a `[data-skin="…"]` CSS variable block (dark AND light) in
  `src/styles/directions.css` + optional font remaps loaded route-locally.
  The app itself is untouched — directions override vars only on this page.
- **R2 (board):** Will clicks through on prod, picks: a new direction, a
  hybrid ("this base + that accent"), or the incumbent → evolve-in-place.
- **R3 (adoption):** winner's tokens land in globals.css + follow-through
  wave (component accents, /design docs, motion check via review-animations,
  design-system.md rewrite). If incumbent wins: targeted evolution round
  instead (density/hierarchy/micro-detail sharpening).

## Directions (candidates — "similar yet distinctively new")

All keep: dark-first, mono metadata, restraint-with-glow thesis, EVERY
micro-detail (hard rule — details re-tune, never disappear), voice.

1. **`warm-terminal`** — temperature shift: warm graphite neutrals, amber/
   phosphor-green accent, heavier mono presence. The gallery as a beloved
   old terminal, not a cold one.
2. **`paper-zine`** — light-first inversion: cream/paper surfaces, ink
   foreground, deep cobalt accent, more characterful display type. Dev-zine
   editorial energy; dark variant = "zine at night."
3. **`electric-depth`** — keeps near-black, raises chroma: blue-black
   depths, cyan+violet dual glow, subtly translucent card surfaces,
   stronger blooms. The 2026 glow direction at dorkhub volume.
4. **`current`** — quiet-dev-native, unchanged (control).

## Mechanism notes

- Tokens all flow through `:root`/`[data-theme="light"]` vars →
  `@theme inline` (globals.css) — so `[data-skin="x"]` and
  `[data-skin="x"][data-theme="light"]` blocks restyle every utility with
  zero component changes. Shadows/blooms/halftone read vars too.
- Fonts: `--font-*` owned by next/font in the root layout; alternate faces
  load in `src/app/design/directions/layout.tsx` only, exposed as
  `--font-display-<skin>` and remapped inside the skin block.
- Page is `robots: { index: false }` (like /search) and NOT in the sitemap —
  it is a transient comparison surface, not product.
- Real data: trending slice via the cached anon feed fetch; ProjectCard
  rendered WITHOUT engagement slots (static preview of a live thing).

## Verification

Switcher flips all four skins in dev (DOM-checked); both themes per skin;
`pnpm verify` + tests; deployed page noindexed (meta present) and absent
from sitemap; prod screenshots of each direction attached to the board
report.

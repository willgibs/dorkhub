# Motion system

Policy source for all animation. Before ANY animation work: read
`.agents/skills/emil-design-eng/SKILL.md`. Before tagging a motion-heavy
milestone: run the `review-animations` skill as the QA gate.

## Tokens (source: src/app/globals.css)
`--motion-fast` 150ms (hover/press/color) · `--motion-base` 200ms (tooltips,
dropdowns, modal enter/exit) · `--motion-slow` 300ms (larger reveals, sheet exit)
· `--motion-enter` 500ms (sheet open only). Easings: `ease-quiet`
(cubic-bezier(.16,1,.3,1), strong ease-out — all enters/exits) and
`ease-quiet-in-out` (on-screen moves). Tailwind classes: native `duration-150/
200/300/500` + `ease-quiet(-in-out)`. Springs (JS/`motion` only, never CSS):
`snappy = { stiffness: 420, damping: 32 }` · `soft = { stiffness: 260, damping: 20 }`.
No component invents its own timing or physics.

## Hard rules
- **Never `ease-in`. Never `transition: all`.** Compositor properties only
  (transform/opacity/filter) for animation; no width/height/top tweens
  (accordion uses grid-rows 0fr→1fr).
- **Never animate high-frequency actions**: ⌘K palette open/close, keyboard-
  initiated navigation. UI animation stays under 300ms (exception: sheet enter).
- Every pressable: press feedback (`active:translate-y-px` is the system's).
  Popovers/dropdowns scale from their trigger origin; modals stay centered.
- Reduced motion: global kill switch in globals.css (spinner carve-out keeps
  `.animate-spin` running). `motion` islands read
  `matchMedia('(prefers-reduced-motion: reduce)')` and go instant — decorative
  motion is skipped entirely, never "played shorter."

## CSS vs `motion` decision rule
CSS first, always. `motion` (`LazyMotion` + `domAnimation` + `m`, ~6kb) ONLY in
`'use client'` leaf islands, NEVER imported by a server component — extract a
tiny client child instead (pattern: feed-filters-indicator). Use `motion` only
for: shared-layout measurement (sliding pill), real spring overshoot, continuous
pointer tracking, numeric interpolation (spinning counter).

## Sourcing (decided by Will, 2026-07-21)
transitions.dev free tier, **adapt don't vendor**: re-implement the technique on
our tokens/class names; never copy `.t-*` files verbatim (their terms forbid
redistributing the library; adaptation keeps one design language). Pro not
purchased; Pro-gated effects get built from scratch if ever wanted.

## Adoption map
Live catalog: `/design/motion` (each demo captions its tokens + source note).
- **Shipped (M2.5)**: overlay enter/exits for dialog/dropdown-menu/tooltip/sheet/
  select/hover-card (via tw-animate-css, retuned to tokens) · Collapsible
  grid-rows height animation · StatButton like-pop + primary-tinted micro-burst ·
  CopyButton icon-swap + stroke-draw check · ThemeToggle icon-swap (scale+blur) ·
  AvatarStack hover lift/bouncy return · SkeletonCard shimmer sweep ·
  number pop-in (RepoStatsRow/ProjectCard counts) · Switch thumb retune ·
  ProjectCard hover on tokens.
- **M7 marketing**: staggered hero text reveal, shimmer accent.
- **App-later (M3+)**: FeedFilters sliding pill, spinning counter on live deltas,
  error shake (forms), claim success check, publish celebration = bg-bloom pulse,
  skeleton→content cross-fade at real fetch boundaries.
- **Rejected** (rendered in /design/motion §04): card stack hover (no surface),
  3D tilt (contradicts locked hover), literal confetti (bloom pulse instead),
  Pro gradient text (no gradient type; Pro-gated).

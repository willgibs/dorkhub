# Design system — "Quiet dev-native · abyss" (M0 locked 2026-07-21 · abyss adopted 2026-07-31)

Thesis: playful dev-native soul at modern-minimal volume — deep blue-black
restraint, mono metadata, one electric-cyan accent with a violet undertow in
links and glow; the interface whispers, the projects glow. U1 (D56) deepened the
palette without touching the soul: same details, same voice, same type, lower
lights. References Will loves: paper.design, resend.com, basehub.com,
cosmos.network. He explicitly wants "subtle complexity and polish," NOT minimalism.

## Locked config
Instrument Sans (display) · Geist (body) · JetBrains Mono (mono) — via next/font in
`src/app/layout.tsx`, exposed as `--font-display/-sans/-mono`. Type survived U1
UNCHANGED on purpose (Will: "with our current typography"). Electric-cyan primary
(oklch 0.87 0.14 198 dark / 0.49 0.13 212 light) · violet link accent (0.8 0.12 292
dark) · blue-black neutrals (hue ≈267–268) · 0.55rem radius · dark-first
(`next-themes`, `data-theme`, default dark, no system).

## Tokens
Source of truth: `src/app/globals.css` (`:root` dark, `[data-theme="light"]`,
registered via `@theme inline`). Lineage: M0 winner `explorations/src/directions/
05-quiet-dev-native.mjs` → U1 R3 electric-abyss adoption (pre-U1 values live as
the `legacy` skin in `src/styles/directions.css` until /design/directions retires).
Satori can't parse oklch — `src/lib/og-tokens.ts` holds hex mirrors for OG images/
icons/manifest; RE-SAMPLE it from live computed styles whenever tokens change.
Tailwind classes: bg-background, text-foreground,
bg-card, text-muted-foreground, bg-secondary, bg-accent, text-primary,
bg-primary-soft, text-positive, bg-positive-soft, bg-surface-2, text-link,
text-destructive, rounded-sm/md/lg/xl, shadow-card, shadow-overlay,
font-display/sans/mono + utilities bg-bloom, bg-halftone, edge-highlight, tabular-nums.

**Gotchas:** shadcn `--accent` = hover tint; the BRAND accent is `--primary`.
`--positive` (green) = saved state; `--primary` (cyan) = liked state — distinct on
purpose. Code blocks stay dark "terminal windows" in BOTH themes.

## Micro-details (intentional — never "clean up")
`//` mono section labels (muted) · `dorkhub_` logo cursor in primary · #hashtag
prefix on project tag chips (55% opacity; NOT on filter chips/profile links) ·
`++` as the like verb · registration `+` marks at section corners · halftone dot
field behind heroes · 1px inner top card highlight (edge-highlight) · ✦ footer
link separators · tabular-nums on all metadata · buttons translate-y-px on :active
· faint top-of-page primary bloom (bg-bloom) · ::selection tinted primary ·
phosphor halo on primary CTAs · card hover sharpens border + lifts 1px (no jumps).

## Voice (source: src/lib/copy.ts — never hardcode)
Generosity verbs: share, fork, take, borrow, tinker. Banned: buy, sell, hire, 🚀,
growth-speak. Errors take the blame ("something broke on our end — not you, us").
Empty states are invitations. **Absence, not zero**: null stars/likes render
nothing, never "0". Lowercase-calm playful register.

## Composition patterns (U2 — how pages are built, not just what they're made of)
A page states what it is FOR and carries one designed moment; no surface ships
as `h1 + grid`. The home/feed exemplar is the reference: **hero** (headline +
a live product moment) → **discovery band** (SectionHead + spotlight/rising
makers/quick hits/tag rails) → **gallery** (SectionHead + FeedSection, page 1
opening on a lead-span card) → **closing section** (steps + expectations +
one conversion capture). Section rhythm: `py-16 sm:py-20` with a `border-t`
between movements. Every section head is `SectionHead` (mono kicker + display
title + optional note) — a bare mono kicker gets lost beside card-heavy
content. Absence rule applies at MODULE level too: a module with no data
renders nothing rather than an empty frame.

**Destination pages (W3) share one spine** so a project and the person who made
it read as one product: a full-width **masthead band** (halftone atmosphere,
`border-b`) with identity on the left, a **StatBlock** of labeled figures in a
260px right column, and the actions on a hairline row below — then a body whose
left column lines up under the identity and whose 260px rail lines up under the
figures. A reading surface (README) keeps its 780px measure and spends the
leftover width on a sticky rail instead of empty margin. W4 extended the same
spine to tags, the tag directory and search.

**Route-level loading states render the LAYOUT** (masthead band, filter row,
card grid) so a page assembles in place rather than swapping wholesale.
Boundaries INHERIT DOWNWARD, so the shape has to be checked per subtree: a
`loading.tsx` beside a page also covers everything nested under it, which is
why the profile page lives in a `(profile)` route group.

## Components
Props are documented by the source + `/design` styleguide, deliberately not here
(prevents doc drift). Categories:
- atoms: tag-chip, language-dot, repo-stats-row, time-ago, copy-button,
  theme-toggle, avatar-badge (image with a zero-JS layered initial fallback —
  covers slow loads AND dead URLs), counter-reel (rolling digits), stat-block
  (labeled figures for a masthead column), list-row (one list, shared by the
  lists index and the profile), section-head (mono kicker + display title;
  the ONLY section header — `SectionHeader` was retired in W3), masthead-band
  (the shared halftone opening band; pages differ in what goes INSIDE it),
  page-skeletons (route-level loading SHAPES — never spinners)
- social: stat-button, follow-button, avatar-stack, user-hover-card, sign-in-github
- cards: project-card (feed/compact/featured), card-media (og hotlink +
  placeholder underlay, 2/1), skeleton-card, empty-state
- shell: site-header (responsive; collapses to one row under `sm`, with
  _shell/mobile-menu's sheet), site-footer (multi-column close, optional live
  stats), page-shell, callout, not-found-content
- discovery (route-scoped, `(app)/_discovery/`): section-head, discovery-band,
  weird-spotlight, rising-makers, tag-rail, quick-hits
- project: markdown-prose (+ src/styles/prose.css), screenshot-gallery, update-post,
  feed-filters, profile-header (the COMPACT identity block, for showing a
  profile inside another page — /claim; the profile page itself uses
  ProfileMasthead)
- destination organisms (route-scoped): `u/[username]/profile-masthead`,
  `u/[username]/[slug]/` project-masthead · project-vitals · maker-card ·
  readme-contents (the reading rail; its active mark is a tested pure
  function over scroll positions, not an observer band)
- discovery organisms (route-scoped, W4): `t/[tag]/tag-masthead`,
  `search/search-result-row` (+ its skeleton — search stays ROWS, not cards:
  results are ranked, and a grid destroys rank)
- primitives: src/components/ui/* (shadcn; restyle via className, never edit)
Fixtures for all demos: `src/lib/fixtures.ts` (tinysynth/gitgoblin/plantdad/
untitled-maze-thing — each stresses a layout failure mode; keep stable).

## Styleguide rule
Every new component lands in `/design` in the same PR that creates it.

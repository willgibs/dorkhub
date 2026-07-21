# Design system — "Quiet dev-native" (locked 2026-07-21)

Thesis: playful dev-native soul at modern-minimal volume — near-black restraint,
mono metadata, one soft ice accent; the interface whispers, the projects glow.
References Will loves: paper.design, resend.com, basehub.com, cosmos.network.
He explicitly wants "subtle complexity and polish," NOT minimalism.

## Locked config
Instrument Sans (display) · Geist (body) · JetBrains Mono (mono) — via next/font in
`src/app/layout.tsx`, exposed as `--font-display/-sans/-mono`. Ice-cyan accent ·
charcoal neutral · 0.45rem radius · dark-first (`next-themes`, `data-theme`,
default dark, no system).

## Tokens
Source of truth: `src/app/globals.css` (`:root` dark, `[data-theme="light"]`,
registered via `@theme inline`). Historical origin: `explorations/src/directions/
05-quiet-dev-native.mjs`. Tailwind classes: bg-background, text-foreground,
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

## Components
Props are documented by the source + `/design` styleguide, deliberately not here
(prevents doc drift). Categories:
- atoms: tag-chip, language-dot, repo-stats-row, time-ago, copy-button, theme-toggle
- social: stat-button, follow-button, avatar-stack, user-hover-card, sign-in-github
- cards: project-card (feed/compact/featured), skeleton-card, empty-state
- shell: site-header, site-footer, page-shell, section-header, callout
- project: markdown-prose (+ src/styles/prose.css), screenshot-gallery, update-post,
  profile-header, feed-filters
- primitives: src/components/ui/* (shadcn; restyle via className, never edit)
Fixtures for all demos: `src/lib/fixtures.ts` (tinysynth/gitgoblin/plantdad/
untitled-maze-thing — each stresses a layout failure mode; keep stable).

## Styleguide rule
Every new component lands in `/design` in the same PR that creates it.

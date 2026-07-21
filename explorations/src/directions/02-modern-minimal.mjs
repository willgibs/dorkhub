export default {
  slug: '02-modern-minimal',
  name: 'Modern minimal',
  thesis: 'Immaculate neutral hierarchy with one deep-indigo accent — the content is the interface.',
  defaultTheme: 'light',
  fontLinks: `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400..800&family=Geist+Mono:wght@400..600&display=swap" rel="stylesheet">`,
  voice: {
    cta_primary: 'Share a project',
    like: 'Like',
    save: 'Save',
    saved: 'Saved',
    follow: 'Follow',
    following: 'Following',
    empty_feed: "Nothing here yet. Share something you've built.",
    error: 'Something went wrong on our end. Try again.',
    e404: "404\nThis page doesn't exist.",
    fork_nudge: 'Fork on GitHub',
    hero_headline: 'Where hobbyist projects live.',
    hero_sub: 'Show what you built. Fork what you like. No metrics, no noise.',
    footer_line: 'Free to fork, forever.',
  },
  themeCss: `
/* ---- default: light ---- */
:root {
  --background: oklch(0.985 0.002 260);
  --foreground: oklch(0.205 0.01 260);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.205 0.01 260);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.205 0.01 260);
  --primary: oklch(0.44 0.17 268);
  --primary-foreground: oklch(0.99 0.002 260);
  --secondary: oklch(0.965 0.003 260);
  --secondary-foreground: oklch(0.3 0.012 260);
  --muted: oklch(0.955 0.003 260);
  --muted-foreground: oklch(0.5 0.014 260);
  --accent: oklch(0.952 0.005 260);
  --accent-foreground: oklch(0.21 0.01 260);
  --destructive: oklch(0.55 0.19 25);
  --border: oklch(0.925 0.004 260);
  --input: oklch(0.9 0.005 260);
  --ring: oklch(0.55 0.16 268);
  --radius: 0.375rem;
  --border-w: 1px;
  --surface-2: oklch(0.97 0.003 260);
  --primary-soft: oklch(0.945 0.028 268);
  --positive: oklch(0.53 0.13 155);
  --positive-soft: oklch(0.95 0.04 155);
  --code-bg: oklch(0.965 0.004 260);
  --code-text: oklch(0.35 0.02 268);
  --link: oklch(0.44 0.15 268);
  --shadow-card: 0 1px 2px oklch(0 0 0 / 0.04), 0 2px 4px oklch(0 0 0 / 0.04);
  --shadow-overlay: 0 4px 12px oklch(0 0 0 / 0.06), 0 16px 32px -8px oklch(0 0 0 / 0.12);
  --font-display: "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-sans: "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* ---- secondary: dark ---- */
[data-theme="dark"] {
  --background: oklch(0.165 0.005 260);
  --foreground: oklch(0.93 0.005 260);
  --card: oklch(0.205 0.006 260);
  --card-foreground: oklch(0.93 0.005 260);
  --popover: oklch(0.225 0.007 260);
  --popover-foreground: oklch(0.93 0.005 260);
  --primary: oklch(0.68 0.15 270);
  --primary-foreground: oklch(0.14 0.03 270);
  --secondary: oklch(0.245 0.008 260);
  --secondary-foreground: oklch(0.88 0.005 260);
  --muted: oklch(0.24 0.007 260);
  --muted-foreground: oklch(0.68 0.012 260);
  --accent: oklch(0.265 0.009 260);
  --accent-foreground: oklch(0.95 0.005 260);
  --destructive: oklch(0.66 0.19 25);
  --border: oklch(0.27 0.008 260);
  --input: oklch(0.305 0.01 260);
  --ring: oklch(0.68 0.15 270);
  --surface-2: oklch(0.235 0.007 260);
  --primary-soft: oklch(0.275 0.05 270);
  --positive: oklch(0.72 0.13 155);
  --positive-soft: oklch(0.27 0.045 155);
  --code-bg: oklch(0.22 0.006 260);
  --code-text: oklch(0.82 0.025 270);
  --link: oklch(0.73 0.12 270);
  --shadow-card: 0 1px 2px oklch(0 0 0 / 0.45);
  --shadow-overlay: 0 8px 24px oklch(0 0 0 / 0.5), 0 24px 48px -12px oklch(0 0 0 / 0.6);
}

/* ================================================================
   Seasoning — hierarchy through spacing and hairlines, not boxes.
   ================================================================ */

/* precise negative tracking on display type, scaled by size */
.type-display, .hero-headline { letter-spacing: -0.035em; }
.type-h1, .project-title, .section-title { letter-spacing: -0.025em; }
.type-h2, .profile-display-name, .card-title, .nav-logo { letter-spacing: -0.015em; }

/* hairline solid dividers instead of dashed scaffolding */
.section { border-bottom-style: solid; }

/* buttons: medium weight, no brightness tricks — one deliberate hover tone */
.btn { font-weight: 500; }
.btn-primary:hover, .btn-primary.is-hover {
  filter: none;
  background: color-mix(in oklab, var(--primary) 88%, var(--primary-foreground));
}

/* cards hold still; the border sharpens instead of the card jumping */
.project-card { transition: border-color .15s ease, box-shadow .15s ease; }
.project-card:hover {
  transform: none;
  border-color: color-mix(in oklab, var(--foreground) 18%, var(--border));
}

/* tag chips go transparent — hairline outline, fill only on hover/active */
.tag-chip { background: transparent; transition: border-color .15s ease, color .15s ease, background .15s ease; }
.tag-chip:hover { border-color: color-mix(in oklab, var(--foreground) 22%, var(--border)); }

/* quiet, offset underlines on prose links */
.prose a, .type-small a {
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
  text-decoration-color: color-mix(in oklab, var(--link) 35%, transparent);
}
.prose a:hover, .type-small a:hover { text-decoration-color: var(--link); }

/* barely-there interaction timing everywhere else */
.stat-btn, .btn, .copy-btn { transition: background .15s ease, color .15s ease, border-color .15s ease; }

/* empty state: hairline, not heavy dashes */
.empty-state { border-width: 1px; }

/* selection carries the accent, softly */
::selection { background: var(--primary-soft); color: var(--foreground); }
`,
}

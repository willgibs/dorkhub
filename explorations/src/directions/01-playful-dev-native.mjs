export default {
  slug: '01-playful-dev-native',
  name: 'Playful dev-native',
  thesis: 'Leans into the dork: terminal-green accents, mono metadata everywhere, jokes in the microcopy — with grown-up layout discipline underneath.',
  defaultTheme: 'dark',
  fontLinks: `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">`,
  voice: {
    cta_primary: 'show your thing',
    like: '++',
    save: 'stash',
    saved: 'stashed',
    follow: 'follow',
    following: 'following',
    empty_feed: '~/feed is empty — go find something weird',
    error: '500: we broke it. not you.',
    e404: "Error: ENOENT '/this-page'\n  at dorkhub.router (feed.ts:404)\n  at our.fault (not.yours:1:1)\npage not found",
    fork_nudge: "fork it, it's yours now",
    hero_headline: 'a home for the weird stuff you build at 2am',
    hero_sub: "show the repo, share the demo, let strangers fork it. that's it. that's the site.",
    footer_line: 'made by dorks, for dorks',
  },
  themeCss: `
/* ---------- dark (default): phosphor terminal, one loud green ---------- */
:root {
  color-scheme: dark;

  --background: oklch(0.16 0.012 155);
  --foreground: oklch(0.93 0.012 150);

  --card: oklch(0.195 0.014 155);
  --card-foreground: oklch(0.93 0.012 150);
  --popover: oklch(0.21 0.015 155);
  --popover-foreground: oklch(0.93 0.012 150);

  --primary: oklch(0.87 0.26 148);
  --primary-foreground: oklch(0.17 0.03 152);
  --primary-soft: oklch(0.30 0.075 151);

  --secondary: oklch(0.235 0.015 155);
  --secondary-foreground: oklch(0.90 0.015 150);
  --muted: oklch(0.22 0.012 155);
  --muted-foreground: oklch(0.72 0.02 152);
  --accent: oklch(0.27 0.028 152);
  --accent-foreground: oklch(0.95 0.02 150);

  --destructive: oklch(0.69 0.19 25);
  --positive: oklch(0.82 0.13 195);
  --positive-soft: oklch(0.30 0.05 200);

  --border: oklch(0.285 0.018 152);
  --input: oklch(0.32 0.02 152);
  --ring: oklch(0.87 0.26 148);

  --surface-2: oklch(0.135 0.012 155);
  --code-bg: oklch(0.125 0.012 155);
  --code-text: oklch(0.85 0.09 151);
  --link: oklch(0.84 0.19 150);

  --radius: 0.5rem;
  --border-w: 1px;
  --shadow-card: 0 0 0 1px oklch(0.87 0.26 148 / 0.04), 0 4px 24px -12px oklch(0.87 0.26 148 / 0.28);
  --shadow-overlay: 0 16px 48px -12px oklch(0 0 0 / 0.6), 0 0 32px -8px oklch(0.87 0.26 148 / 0.22);

  --font-display: "Space Grotesk", "Inter", system-ui, sans-serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* ---------- light: green-tinted paper, same green pulled down to ink strength ---------- */
[data-theme="light"] {
  color-scheme: light;

  --background: oklch(0.985 0.005 150);
  --foreground: oklch(0.21 0.02 155);

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.21 0.02 155);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.21 0.02 155);

  --primary: oklch(0.48 0.15 150);
  --primary-foreground: oklch(0.99 0.004 150);
  --primary-soft: oklch(0.95 0.05 150);

  --secondary: oklch(0.96 0.008 150);
  --secondary-foreground: oklch(0.25 0.02 155);
  --muted: oklch(0.945 0.007 150);
  --muted-foreground: oklch(0.45 0.022 153);
  --accent: oklch(0.93 0.032 150);
  --accent-foreground: oklch(0.21 0.03 153);

  --destructive: oklch(0.53 0.20 27);
  --positive: oklch(0.45 0.10 210);
  --positive-soft: oklch(0.94 0.035 205);

  --border: oklch(0.885 0.012 150);
  --input: oklch(0.86 0.015 150);
  --ring: oklch(0.55 0.17 150);

  --surface-2: oklch(0.955 0.007 150);
  --code-bg: oklch(0.21 0.02 155);
  --code-text: oklch(0.86 0.09 151);
  --link: oklch(0.46 0.13 151);

  --shadow-card: 0 1px 2px oklch(0.2 0.04 155 / 0.05), 0 6px 22px -14px oklch(0.48 0.15 150 / 0.30);
  --shadow-overlay: 0 16px 40px -8px oklch(0.2 0.04 155 / 0.22), 0 0 28px -10px oklch(0.48 0.15 150 / 0.18);
}

/* ---------- seasoning: terminal tics, kept on a leash ---------- */

::selection { background: var(--primary); color: var(--primary-foreground); }

/* prompt prefixes on mono labels */
.section-label::before { content: "$ "; opacity: 0.65; }
.readme-label > span:first-child::before { content: "$ cat "; color: var(--primary); }

/* the logo carries a cursor; the hero's one blinks */
.nav-logo::after { content: "_"; color: var(--primary); font-family: var(--font-mono); }
.hero-headline::after {
  content: "\\258C";
  color: var(--primary);
  margin-left: 0.06em;
  animation: dh-blink 1.1s steps(2, start) infinite;
}
@keyframes dh-blink { to { visibility: hidden; } }
@media (prefers-reduced-motion: reduce) { .hero-headline::after { animation: none; } }

/* primary actions glow, gently */
.btn-primary { box-shadow: 0 0 16px -5px color-mix(in oklab, var(--primary) 60%, transparent); }
.btn-primary:hover, .btn-primary.is-hover { box-shadow: 0 0 22px -4px color-mix(in oklab, var(--primary) 75%, transparent); }
.btn-primary[disabled] { box-shadow: none; }
.stat-btn.liked { box-shadow: 0 0 12px -5px color-mix(in oklab, var(--primary) 55%, transparent); }

/* cards pick up a charge on hover */
.project-card:hover {
  border-color: color-mix(in oklab, var(--primary) 40%, var(--border));
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--primary) 22%, transparent),
              0 8px 30px -12px color-mix(in oklab, var(--primary) 45%, transparent);
}

/* project tags read as hashtags; nav chips stay clean */
.card-tags .tag-chip::before, .tag-row .tag-chip::before { content: "#"; opacity: 0.55; }

/* empty state talks like a shell */
.empty-state { font-family: var(--font-mono); font-size: 13px; }

/* prose links: real underlines, dev-docs style */
.prose a { text-decoration: underline; text-decoration-color: color-mix(in oklab, var(--link) 45%, transparent); text-underline-offset: 3px; }
.prose a:hover { text-decoration-color: var(--link); }
`,
}

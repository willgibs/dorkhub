export default {
  slug: '04-utilitarian-brutalist',
  name: 'Utilitarian brutalist',
  thesis: 'the projects are the interface: white, black, two-pixel borders — nothing decorative survives.',
  defaultTheme: 'light',

  fontLinks: `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Mona+Sans:wdth,wght@75..125,200..900&display=swap" rel="stylesheet">
<style>
/* Monaspace Neon — GitHub's OFL mono face. Not on Google Fonts; served
   straight from the githubnext/monaspace repo (tag v1.101) via jsDelivr. */
@font-face {
  font-family: "Monaspace Neon";
  src: url("https://cdn.jsdelivr.net/gh/githubnext/monaspace@v1.101/fonts/webfonts/MonaspaceNeon-Regular.woff2") format("woff2");
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "Monaspace Neon";
  src: url("https://cdn.jsdelivr.net/gh/githubnext/monaspace@v1.101/fonts/webfonts/MonaspaceNeon-Bold.woff2") format("woff2");
  font-weight: 700; font-style: normal; font-display: swap;
}
</style>`,

  voice: {
    cta_primary: 'submit project',
    like: 'like',
    save: 'save',
    saved: 'saved.',
    follow: 'follow',
    following: 'following.',
    empty_feed: 'no projects yet. yours goes here.',
    error: 'error. our fault. retry.',
    e404: '404\nno such page. our fault.',
    fork_nudge: 'fork this.',
    hero_headline: 'projects. shared. forked. free.',
    hero_sub: "show the thing. link the repo. let anyone fork it. that's the whole site.",
    footer_line: '© nobody. fork everything.',
  },

  themeCss: `/* ----------------------------------------------------------------
   default mode: LIGHT — paper white, ink black, hyperlink blue.
   color only ever means something: blue = interactive,
   orange = focus, red = danger, green = good. everything else
   is drawn with 2px ink lines. radius 0. shadows: none.
   ---------------------------------------------------------------- */
:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --card: #ffffff;
  --card-foreground: #0a0a0a;
  --popover: #ffffff;
  --popover-foreground: #0a0a0a;

  --primary: #0000ee;            /* browser-default link blue. the web, undecorated. */
  --primary-foreground: #ffffff;
  --secondary: #ffffff;          /* quiet button = white plate, 2px ink border */
  --secondary-foreground: #0a0a0a;
  --muted: #f2f2f2;
  --muted-foreground: #4d4d4d;   /* 8.4:1 on white */
  --accent: #f2f2f2;             /* subtle tint; loud hovers are handled below */
  --accent-foreground: #0a0a0a;
  --destructive: #b30000;

  --border: #0a0a0a;             /* the borders ARE the design */
  --input: #0a0a0a;
  --ring: #ff4d00;               /* safety orange: focus is a hazard marking */

  --radius: 0px;
  --border-w: 2px;

  --surface-2: #f2f2f2;
  --primary-soft: #e6ebff;
  --positive: #156e30;
  --positive-soft: #dafbe1;

  --code-bg: #0a0a0a;            /* every code surface is a terminal, even on paper */
  --code-text: #f2f2f2;
  --link: #0000ee;

  --shadow-card: none;
  --shadow-overlay: 8px 8px 0 0 #0a0a0a;  /* overlays get a hard offset slab, not a blur */

  --font-display: "Mona Sans", "Helvetica Neue", Arial, sans-serif;
  --font-sans: "Mona Sans", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  --font-mono: "Monaspace Neon", "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}

/* ----------------------------------------------------------------
   second mode: DARK — blueprint negative. near-black paper,
   near-white ink lines, the same four meanings; link blue lifted
   to stay legible, terminals go true black (terminals have no
   light mode, so here they read as the deepest layer).
   ---------------------------------------------------------------- */
[data-theme="dark"] {
  --background: #0a0a0a;
  --foreground: #f2f2f2;
  --card: #0a0a0a;
  --card-foreground: #f2f2f2;
  --popover: #141414;
  --popover-foreground: #f2f2f2;

  --primary: #6ea8ff;
  --primary-foreground: #000000;
  --secondary: #0a0a0a;
  --secondary-foreground: #f2f2f2;
  --muted: #1a1a1a;
  --muted-foreground: #b0b0b0;   /* 9:1 on near-black */
  --accent: #1f1f1f;
  --accent-foreground: #f2f2f2;
  --destructive: #ff8f8f;

  --border: #f2f2f2;             /* white ink on black paper */
  --input: #f2f2f2;
  --ring: #ff4d00;               /* safety orange reads even better on black */

  --radius: 0px;
  --border-w: 2px;

  --surface-2: #171717;
  --primary-soft: #101c33;
  --positive: #3fb950;
  --positive-soft: #0f2417;

  --code-bg: #000000;
  --code-text: #f2f2f2;
  --link: #6ea8ff;

  --shadow-card: none;
  --shadow-overlay: 8px 8px 0 0 #f2f2f2;
}

/* ----------------------------------------------------------------
   overrides — seasoning only. structure over decoration.
   ---------------------------------------------------------------- */

/* nothing animates. nothing floats. */
.btn, .stat-btn, .tag-chip, .project-card, .theme-toggle { transition: none; }
.project-card:hover { transform: none; }
.project-card:hover .card-title a { text-decoration: underline; }

/* display voice: Mona Sans pushed heavy and wide (wdth axis) */
.type-display, .type-h1, .hero-headline, .project-title,
.profile-display-name, .section-title, .nav-logo, .banner-name {
  font-stretch: 125%;
  font-weight: 800;
}
.type-display, .hero-headline { font-weight: 900; }
.btn { font-weight: 700; }

/* honest links where you actually read */
.prose a, .type-small a { text-decoration: underline; text-underline-offset: 2px; }

/* hover = inverse video */
.btn-secondary:hover, .btn-secondary.is-hover,
.btn-ghost:hover, .btn-ghost.is-hover,
.stat-btn:hover, .stat-btn.is-hover,
.tag-chip:hover,
.copy-btn:hover,
.theme-toggle:hover {
  background: var(--foreground);
  color: var(--background);
  border-color: var(--foreground);
}

/* focus = thick hazard-orange offset outline, everywhere */
.btn:focus-visible, .btn.is-focus,
.stat-btn:focus-visible, .stat-btn.is-focus,
.input:focus, .input.is-focus,
.theme-toggle:focus-visible, .tag-chip:focus-visible, .copy-btn:focus-visible {
  outline: 3px solid var(--ring);
  outline-offset: 2px;
}

/* the feed is a table: adjacent cards share one 2px rule */
.card-grid { gap: 0; }
.card-grid .project-card { margin: 0 -2px -2px 0; }
.mini-row { gap: 0; }
.mini-card { margin: 0 -2px -2px 0; }

/* section dividers drawn solid, like a spec sheet */
.section { border-bottom-style: solid; }
`,
}

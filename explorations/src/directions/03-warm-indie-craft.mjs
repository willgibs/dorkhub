export default {
  slug: '03-warm-indie-craft',
  name: 'Warm indie craft',
  thesis: 'Glitch-era generosity: cream paper, candy-but-grown-up color, chunky ink shadows — a hand-touched shelf for things you made.',
  defaultTheme: 'light',

  fontLinks: `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400..900,100,0&family=Karla:ital,wght@0,400..700;1,400..700&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet">`,

  voice: {
    cta_primary: 'Show us what you made!',
    like: 'Love it',
    save: 'Tuck away',
    saved: 'Tucked away',
    follow: 'Follow along',
    following: 'Following along',
    empty_feed: 'This shelf is waiting for its first project. Got one?',
    error: "That broke on our end — let's try again.",
    e404: '404\nHmm, nothing lives here.',
    fork_nudge: 'Take a copy home',
    hero_headline: 'Made something? Show everyone!',
    hero_sub: 'A cozy corner of the internet for the stuff you build for fun. Free to fork, forever.',
    footer_line: 'made with care · yours to fork',
  },

  themeCss: `/* ---------- WARM INDIE CRAFT · light (default) ---------- */
:root {
  --background: oklch(0.97 0.018 84);            /* warm cream paper */
  --foreground: oklch(0.31 0.045 40);            /* espresso ink */
  --card: oklch(0.99 0.012 90);
  --card-foreground: oklch(0.31 0.045 40);
  --popover: oklch(0.995 0.01 90);
  --popover-foreground: oklch(0.31 0.045 40);
  --primary: oklch(0.585 0.175 31);              /* ripe coral */
  --primary-foreground: oklch(0.99 0.012 80);
  --secondary: oklch(0.945 0.03 80);             /* warm sand fill */
  --secondary-foreground: oklch(0.34 0.05 40);
  --muted: oklch(0.94 0.025 82);
  --muted-foreground: oklch(0.46 0.045 42);
  --accent: oklch(0.925 0.045 62);               /* peach hover tint */
  --accent-foreground: oklch(0.31 0.05 40);
  --destructive: oklch(0.54 0.19 27);
  --border: oklch(0.37 0.04 42);                 /* drawn ink line */
  --input: oklch(0.52 0.04 48);
  --ring: oklch(0.5 0.1 195);                    /* deep teal focus */
  --radius: 1rem;
  --border-w: 2px;
  --surface-2: oklch(0.945 0.025 83);
  --primary-soft: oklch(0.93 0.05 40);
  --positive: oklch(0.48 0.09 180);              /* grown-up teal */
  --positive-soft: oklch(0.93 0.045 178);
  --code-bg: oklch(0.30 0.035 40);               /* espresso chalkboard */
  --code-text: oklch(0.93 0.03 80);
  --link: oklch(0.47 0.1 195);
  --ink: oklch(0.37 0.04 42);                    /* the shadow ink */
  --marigold: oklch(0.78 0.14 78);               /* flourish hue */
  --marigold-soft: oklch(0.92 0.07 85);
  --shadow-card: 4px 4px 0 var(--ink);
  --shadow-overlay: 9px 9px 0 var(--ink);
  --font-display: "Fraunces", "Iowan Old Style", Georgia, serif;
  --font-sans: "Karla", "Avenir Next", "Segoe UI", sans-serif;
  --font-mono: "Fira Code", ui-monospace, "SF Mono", Menlo, monospace;
}

/* ---------- dark: deep plum & espresso, still warm ---------- */
[data-theme="dark"] {
  --background: oklch(0.245 0.035 325);          /* deep plum */
  --foreground: oklch(0.93 0.02 80);             /* warm cream text */
  --card: oklch(0.29 0.04 328);
  --card-foreground: oklch(0.93 0.02 80);
  --popover: oklch(0.31 0.042 328);
  --popover-foreground: oklch(0.93 0.02 80);
  --primary: oklch(0.72 0.16 35);                /* glowing coral */
  --primary-foreground: oklch(0.22 0.05 30);
  --secondary: oklch(0.34 0.045 330);
  --secondary-foreground: oklch(0.92 0.025 60);
  --muted: oklch(0.3 0.035 328);
  --muted-foreground: oklch(0.75 0.035 345);     /* warm mauve */
  --accent: oklch(0.37 0.05 335);
  --accent-foreground: oklch(0.95 0.02 80);
  --destructive: oklch(0.71 0.17 22);
  --border: oklch(0.42 0.05 330);
  --input: oklch(0.47 0.05 332);
  --ring: oklch(0.8 0.13 80);                    /* marigold focus */
  --surface-2: oklch(0.215 0.032 322);
  --primary-soft: oklch(0.35 0.07 33);
  --positive: oklch(0.78 0.1 178);
  --positive-soft: oklch(0.33 0.05 185);
  --code-bg: oklch(0.195 0.03 320);
  --code-text: oklch(0.9 0.035 85);
  --link: oklch(0.78 0.1 190);
  --ink: oklch(0.14 0.02 320);                   /* near-black plum */
  --marigold: oklch(0.8 0.13 80);
  --marigold-soft: oklch(0.44 0.08 78);
  --shadow-card: 4px 4px 0 var(--ink);
  --shadow-overlay: 9px 9px 0 var(--ink);
}

/* ================= seasoning (scoped overrides) ================= */

::selection { background: var(--marigold-soft); color: var(--foreground); }

/* wavy marigold flourish under headings */
.section-title,
.hero-headline {
  text-decoration-line: underline;
  text-decoration-style: wavy;
  text-decoration-color: var(--marigold);
  text-decoration-thickness: 2px;
  text-underline-offset: 7px;
}
.hero-headline { text-decoration-thickness: 3px; text-underline-offset: 12px; }

/* chunky offset buttons that press down on hover */
.btn-primary, .btn-secondary {
  border-color: var(--ink);
  box-shadow: 3px 3px 0 var(--ink);
}
.btn-primary:hover, .btn-primary.is-hover,
.btn-secondary:hover, .btn-secondary.is-hover {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--ink);
}
.btn[disabled] { box-shadow: none; transform: none; }

/* cards lift against their ink shadow */
.project-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--ink);
}

/* a little hand-placed tilt — sparingly */
.tag-chip.active { transform: rotate(-1deg); }
.mini-card:nth-child(2) { transform: rotate(0.6deg); }
.empty-state {
  transform: rotate(-0.35deg);
  border: 2px dashed var(--input);
  background: color-mix(in oklab, var(--marigold) 6%, var(--card));
}

/* washi-tape strip on update posts */
.update-post { position: relative; }
.update-post::before {
  content: ""; position: absolute; top: -9px; left: 28px;
  width: 72px; height: 18px; border-radius: 2px;
  background: var(--marigold-soft); opacity: 0.9;
  transform: rotate(-2deg);
}

/* fork nudge reads as a friendly pill */
.readme-label a {
  background: var(--primary-soft); color: var(--primary);
  padding: 3px 10px; border-radius: 999px;
  font-weight: 600; letter-spacing: 0; text-transform: none;
}
.readme-label a:hover { text-decoration: none; background: var(--primary); color: var(--primary-foreground); }

/* soft underlines that wiggle on hover */
.prose a, .type-small a {
  text-decoration-line: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
  text-decoration-color: color-mix(in oklab, var(--link) 45%, transparent);
}
.prose a:hover, .type-small a:hover {
  text-decoration-style: wavy;
  text-decoration-color: var(--link);
}
`,
}

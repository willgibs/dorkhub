// Hybrid of 01 (playful dev-native) + 02 (modern minimal), tuned to the reference
// set Will gave: paper.design, resend.com, basehub.com, cosmos.network.
// Thesis: 01's dev-native soul at 02's volume — the interface whispers, the projects glow.
export default {
  slug: '05-quiet-dev-native',
  name: 'Quiet dev-native (01+02 hybrid)',
  thesis: "01's soul at 02's volume: near-black restraint, mono metadata, one soft ice accent — the projects do the glowing.",
  defaultTheme: 'dark',
  fontLinks: `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Geist:wght@400;500;600;700;800&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">`,
  voice: {
    cta_primary: 'show your thing',
    like: '++',
    save: 'save',
    saved: 'saved',
    follow: 'follow',
    following: 'following',
    empty_feed: 'nothing here yet — go find something weird',
    error: 'something broke on our end — not you, us. try again?',
    e404: '404: page not found\n// maybe it shipped, maybe it never existed',
    fork_nudge: 'fork it — it’s yours',
    hero_headline: 'a home for the things you build for fun',
    hero_sub: 'connect github, pick the repos you love, give each one a page. free to browse, free to fork.',
    footer_line: 'made by dorks, for dorks',
  },
  themeCss: `
/* ── dark (default): near-black neutral, one soft mint accent ── */
:root {
  --background: oklch(0.145 0.005 250);
  --foreground: oklch(0.93 0.005 250);
  --card: oklch(0.175 0.006 250);
  --card-foreground: oklch(0.93 0.005 250);
  --popover: oklch(0.19 0.006 250);
  --popover-foreground: oklch(0.93 0.005 250);
  --primary: oklch(0.82 0.10 210);
  --primary-foreground: oklch(0.16 0.03 210);
  --secondary: oklch(0.22 0.006 250);
  --secondary-foreground: oklch(0.90 0.005 250);
  --muted: oklch(0.21 0.006 250);
  --muted-foreground: oklch(0.64 0.008 250);
  --accent: oklch(0.235 0.008 250);
  --accent-foreground: oklch(0.95 0.005 250);
  --destructive: oklch(0.68 0.19 25);
  --border: oklch(0.255 0.008 250);
  --input: oklch(0.30 0.008 250);
  --ring: oklch(0.82 0.10 210);
  --radius: 0.45rem;
  --border-w: 1px;
  --surface-2: oklch(0.125 0.005 250);
  --primary-soft: oklch(0.27 0.045 210);
  --positive: oklch(0.80 0.12 160);
  --positive-soft: oklch(0.26 0.045 160);
  --code-bg: oklch(0.12 0.005 250);
  --code-text: oklch(0.87 0.05 200);
  --link: oklch(0.84 0.08 210);
  --shadow-card: 0 1px 2px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(1 0 0 / 0.02);
  --shadow-overlay: 0 16px 40px oklch(0 0 0 / 0.55);
  --font-display: 'Instrument Sans', 'Geist', ui-sans-serif, sans-serif;
  --font-sans: 'Geist', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', monospace;
}

/* ── light: quiet paper; code blocks stay tiny terminals ── */
[data-theme="light"] {
  --background: oklch(0.985 0.002 250);
  --foreground: oklch(0.21 0.006 250);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.21 0.006 250);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.21 0.006 250);
  --primary: oklch(0.50 0.11 220);
  --primary-foreground: oklch(0.99 0.005 220);
  --secondary: oklch(0.955 0.003 250);
  --secondary-foreground: oklch(0.30 0.006 250);
  --muted: oklch(0.955 0.003 250);
  --muted-foreground: oklch(0.50 0.008 250);
  --accent: oklch(0.945 0.005 250);
  --accent-foreground: oklch(0.20 0.006 250);
  --destructive: oklch(0.55 0.20 25);
  --border: oklch(0.915 0.004 250);
  --input: oklch(0.87 0.005 250);
  --ring: oklch(0.54 0.11 220);
  --surface-2: oklch(0.965 0.003 250);
  --primary-soft: oklch(0.94 0.03 215);
  --positive: oklch(0.50 0.11 160);
  --positive-soft: oklch(0.94 0.03 160);
  --code-bg: oklch(0.22 0.01 250);
  --code-text: oklch(0.87 0.05 200);
  --link: oklch(0.49 0.11 220);
  --shadow-card: 0 1px 2px oklch(0.2 0.01 250 / 0.06);
  --shadow-overlay: 0 16px 40px oklch(0.2 0.01 250 / 0.16);
}

/* ── seasoning: playfulness at whisper volume ── */
::selection { background: color-mix(in oklab, var(--primary) 30%, transparent); }

/* faint resend-style bloom at the top of the page; projects stay the brightest thing */
body {
  background-image: radial-gradient(900px 420px at 50% -80px,
    color-mix(in oklab, var(--primary) 5%, transparent), transparent 70%);
  background-repeat: no-repeat;
}

/* the one loud-ish thing: the logo keeps its cursor */
.nav-logo::after { content: "_"; color: var(--primary); }

/* paper-style quiet mono labels: // instead of $ */
.section-label { color: var(--muted-foreground); }
.section-label::before { content: "// "; }

/* primary buttons get a soft phosphor halo, nothing else glows */
.btn-primary {
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--primary) 45%, transparent),
              0 4px 18px color-mix(in oklab, var(--primary) 20%, transparent);
}

/* cards: hover sharpens the border instead of jumping */
.project-card { transition: border-color 0.15s ease, transform 0.15s ease; }
.project-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in oklab, var(--foreground) 22%, var(--border));
}

/* project tags read as #hashtags — filter chips and profile links stay clean */
.card-tags .tag-chip::before, .tag-row .tag-chip::before {
  content: "#"; opacity: 0.55; margin-right: 1px;
}

/* quiet link underlines that resolve on hover */
a { text-underline-offset: 3px; }
.prose a {
  text-decoration: underline;
  text-decoration-color: color-mix(in oklab, var(--link) 40%, transparent);
}
.prose a:hover { text-decoration-color: var(--link); }

.hero-headline { letter-spacing: -0.02em; }
.type-display { letter-spacing: -0.02em; }

/* ── micro-polish: the details that make it feel crafted ── */

/* paper-style registration marks at section corners */
.section { position: relative; }
.section::before, .section::after {
  content: "+"; position: absolute; top: -0.62em;
  font-family: var(--font-mono); font-size: 11px; line-height: 1;
  color: color-mix(in oklab, var(--foreground) 22%, transparent);
}
.section::before { left: 0; }
.section::after { right: 0; }

/* 1px inner top highlight gives cards a machined edge in dark mode */
.project-card, .readme, .update-post, .nav, .mini-card, .isnt-col {
  box-shadow: var(--shadow-card),
    inset 0 1px 0 color-mix(in oklab, var(--foreground) 4.5%, transparent);
}

/* cosmos-style halftone dot field behind the hero */
.hero { position: relative; }
.hero::before {
  content: ""; position: absolute; inset: -10px 0 auto 0; height: 320px;
  background-image: radial-gradient(color-mix(in oklab, var(--foreground) 15%, transparent) 1px, transparent 1px);
  background-size: 14px 14px;
  mask-image: radial-gradient(460px 230px at 50% 30%, black, transparent 72%);
  -webkit-mask-image: radial-gradient(460px 230px at 50% 30%, black, transparent 72%);
  pointer-events: none;
}

/* ornament separators between footer links */
.footer-links a + a::before {
  content: "✦"; font-size: 8px; vertical-align: 2px;
  color: color-mix(in oklab, var(--foreground) 28%, transparent);
  margin-right: 18px;
}

/* numbers align like instruments */
.card-meta, .repo-stats, .profile-stats, .mini-meta, .update-date { font-variant-numeric: tabular-nums; }

/* buttons physically respond */
.btn:active, .stat-btn:active { transform: translateY(1px); }
`,
}

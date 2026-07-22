/**
 * Hex mirrors of the dark-theme oklch tokens in src/app/globals.css, sampled
 * from the live computed theme for Satori (used by opengraph-image.tsx and
 * icon.tsx), which can't parse oklch()/color-mix() — only hex/rgb/named
 * colors and CSS gradients. Do NOT hand-adjust these; re-sample from the
 * computed styles if the theme changes.
 */
export const ogTokens = {
  background: '#090a0c',
  foreground: '#e5e8eb',
  card: '#0f1113',
  primary: '#6dd6e8',
  primaryForeground: '#001114',
  mutedForeground: '#898d91',
  border: '#202327',
  surface2: '#050708',
  primarySoft: '#022c33',
  codeBg: '#050607',
  positive: '#71d6a3',
  link: '#8ad9e7',
} as const;

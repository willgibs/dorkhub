/**
 * Hex mirrors of the dark-theme oklch tokens in src/app/globals.css, sampled
 * from the live computed theme for Satori (used by opengraph-image.tsx and
 * icon.tsx), which can't parse oklch()/color-mix() — only hex/rgb/named
 * colors and CSS gradients. Do NOT hand-adjust these; re-sample from the
 * computed styles if the theme changes.
 */
export const ogTokens = {
  // Re-sampled 2026-07-31 after the U1 R3 abyss adoption (D56).
  background: '#02040c',
  foreground: '#e4e8ef',
  card: '#050915',
  primary: '#33f0f5',
  primaryForeground: '#000f14',
  mutedForeground: '#7f8694',
  border: '#171d2e',
  surface2: '#010208',
  primarySoft: '#002937',
  codeBg: '#010207',
  positive: '#71d6a3',
  link: '#bfafff',
} as const;

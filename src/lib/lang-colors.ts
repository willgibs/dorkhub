/**
 * GitHub linguist swatch colors for common languages — mirrors GitHub's own
 * fixed per-language palette (see fixtures.ts, which hand-codes the same
 * hexes for tinysynth/gitgoblin/plantdad/untitled-maze-thing). Keyed
 * lowercase; lookups are case-insensitive. Unknown/missing languages fall
 * back to a theme token (never a hardcoded gray) so dark/light both work.
 */
export const LANGUAGE_COLORS: Record<string, string> = {
  javascript: '#f1e05a',
  typescript: '#3178c6',
  python: '#3572A5',
  java: '#b07219',
  go: '#00ADD8',
  rust: '#dea584',
  c: '#555555',
  'c++': '#f34b7d',
  'c#': '#178600',
  ruby: '#701516',
  php: '#4F5D95',
  swift: '#F05138',
  kotlin: '#A97BFF',
  shell: '#89e051',
  html: '#e34c26',
  css: '#563d7c',
  dart: '#00B4AB',
  elixir: '#6e4a7e',
  haskell: '#5e5086',
  lua: '#000080',
  'objective-c': '#438eff',
  scala: '#c22d40',
  vue: '#41b883',
  zig: '#ec915c',
};

/** Fallback swatch for languages outside the map — a theme token, not a hardcoded gray. */
export const FALLBACK_LANGUAGE_COLOR = 'var(--muted-foreground)';

/** Case-insensitive GitHub-linguist-style color lookup; falls back for unknown/absent languages. */
export function languageColor(language: string | null | undefined): string {
  if (!language) return FALLBACK_LANGUAGE_COLOR;
  return LANGUAGE_COLORS[language.toLowerCase()] ?? FALLBACK_LANGUAGE_COLOR;
}

// Builds the four exploration files from one shared skeleton + per-direction modules.
// Usage: node build.mjs [--only <slug-prefix>]
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, 'src');

const REQUIRED_TOKENS = [
  '--background', '--foreground', '--card', '--card-foreground', '--popover', '--popover-foreground',
  '--primary', '--primary-foreground', '--secondary', '--secondary-foreground',
  '--muted', '--muted-foreground', '--accent', '--accent-foreground',
  '--destructive', '--border', '--input', '--ring', '--radius', '--border-w',
  '--surface-2', '--primary-soft', '--positive', '--positive-soft',
  '--code-bg', '--code-text', '--link', '--shadow-card', '--shadow-overlay',
  '--font-display', '--font-sans', '--font-mono',
];
const REQUIRED_VOICE = [
  'cta_primary', 'like', 'save', 'saved', 'follow', 'following',
  'empty_feed', 'error', 'e404', 'fork_nudge', 'hero_headline', 'hero_sub', 'footer_line',
];

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const skeleton = await readFile(join(SRC, 'skeleton.html'), 'utf8');
const files = (await readdir(join(SRC, 'directions'))).filter((f) => f.endsWith('.mjs')).sort();

const built = [];
for (const file of files) {
  if (only && !file.startsWith(only)) continue;
  const d = (await import(pathToFileURL(join(SRC, 'directions', file)).href)).default;
  const problems = [];

  for (const t of REQUIRED_TOKENS) if (!d.themeCss.includes(t)) problems.push(`themeCss missing token ${t}`);
  for (const k of REQUIRED_VOICE) if (!(k in d.voice)) problems.push(`voice missing key "${k}"`);
  if (!['dark', 'light'].includes(d.defaultTheme)) problems.push('defaultTheme must be "dark" or "light"');
  if (!d.themeCss.includes('[data-theme=')) problems.push('themeCss must define the second mode via [data-theme="…"]');

  let html = skeleton
    .replaceAll('{{INDEX}}', d.slug.slice(0, 2))
    .replaceAll('{{NAME}}', d.name)
    .replaceAll('{{THESIS}}', d.thesis)
    .replaceAll('{{DEFAULT_THEME}}', d.defaultTheme)
    .replace('{{FONT_LINKS}}', d.fontLinks)
    .replace('{{THEME_CSS}}', d.themeCss)
    .replace(/\{\{V\.([a-z0-9_]+)\}\}/g, (_, k) => d.voice[k] ?? `⟦missing:${k}⟧`);

  const leftover = html.match(/\{\{[^}]+\}\}/g);
  if (leftover) problems.push(`unreplaced placeholders: ${[...new Set(leftover)].join(', ')}`);

  if (problems.length) {
    console.error(`✗ ${file}\n  - ${problems.join('\n  - ')}`);
    process.exitCode = 1;
    continue;
  }
  const out = `${d.slug}.html`;
  await writeFile(join(HERE, out), html);
  built.push({ out, name: d.name, thesis: d.thesis });
  console.log(`✓ ${out}`);
}

if (!only && built.length >= 4) {
  const cells = built
    .map(
      (b) => `    <figure>
      <figcaption><strong>${b.name}</strong> — ${b.thesis} <a href="${b.out}" target="_blank">open ↗</a></figcaption>
      <iframe src="${b.out}" loading="lazy" title="${b.name}"></iframe>
    </figure>`
    )
    .join('\n');
  const compare = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>dorkhub · direction comparison</title>
<style>
  body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #111; color: #eee; }
  header { padding: 14px 20px; font-size: 14px; border-bottom: 1px solid #333; }
  header span { color: #999; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 14px; }
  figure { margin: 0; display: flex; flex-direction: column; gap: 8px; }
  figcaption { font-size: 12.5px; color: #ccc; }
  figcaption a { color: #7ab7ff; text-decoration: none; margin-left: 6px; }
  iframe { width: 100%; height: 78vh; border: 1px solid #333; border-radius: 6px; background: #fff; }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
</style></head>
<body>
<header><strong>dorkhub</strong> · design-language explorations <span>— same skeleton and content in every frame; only tokens, fonts, and voice differ. Use each frame's theme toggle for dark/light.</span></header>
<div class="grid">
${cells}
</div>
</body></html>
`;
  await writeFile(join(HERE, 'compare.html'), compare);
  console.log('✓ compare.html');
}

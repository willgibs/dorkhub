import { slugify } from './slug';

/** Max number of tags a project may carry (mirrors the settings-page input). */
const MAX_TAGS = 8;

/** Max characters per tag, applied after normalization. */
const MAX_TAG_LENGTH = 30;

/**
 * Parses the comma-separated tags input from the settings form into a clean
 * tag list: split on commas, trim, lowercase, slugify-lite (same char rules
 * as project slugs so tags are safe to use in `/tags/[tag]` routes later),
 * drop anything that normalizes to empty, dedupe preserving first-seen order,
 * cap at `MAX_TAGS` entries of at most `MAX_TAG_LENGTH` chars each.
 */
export function parseTagsInput(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const piece of raw.split(',')) {
    const trimmed = piece.trim();
    if (trimmed.length === 0) continue;

    const normalized = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, MAX_TAG_LENGTH)
      .replace(/-+$/g, '');

    if (normalized.length === 0 || seen.has(normalized)) continue;

    seen.add(normalized);
    tags.push(normalized);
    if (tags.length >= MAX_TAGS) break;
  }

  return tags;
}

/**
 * Validates a demo URL: must be a parseable absolute URL AND use `https:`.
 * `http:`, `javascript:`, `data:`, and every other scheme are rejected —
 * this field renders as a plain `<a href>` CTA, so we don't trust anything
 * that could execute or that downgrades the connection.
 *
 * An empty string is NOT valid — callers treat an empty input as "clear the
 * field" (a separate branch from "set an invalid URL") rather than routing
 * it through this validator.
 */
export function isValidDemoUrl(raw: string): boolean {
  if (raw.length === 0) return false;

  try {
    return new URL(raw).protocol === 'https:';
  } catch {
    return false;
  }
}

// Re-exported so callers who only need the fields module don't also need to
// reach into `./slug` for the shared normalization primitive.
export { slugify };

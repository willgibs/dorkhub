/**
 * README outline — a render-time pass over the already-sanitized `readme_html`
 * that makes a stored README navigable.
 *
 * Why this exists (three defects in one place, all invisible until you look at
 * the stored HTML):
 *
 * 1. GitHub's markdown API emits `<h2 id="slug">Title</h2>` plus an autolink
 *    anchor. Our write-time sanitizer (src/lib/github/sanitize.ts) allows no
 *    `id` attribute anywhere — deliberately, since an author-controlled `id` is
 *    a DOM-clobbering surface — so every heading id is stripped. Result: 0 of
 *    16,925 stored READMEs have a single addressable heading, and every
 *    in-README table of contents is dead.
 * 2. The autolink anchor survives that strip as `<a href="#slug"></a>` — an
 *    empty, focusable, unlabeled link before every heading ("link has no
 *    discernible name"), which the sanitizer's blanket `target="_blank"` also
 *    makes open a NEW TAB to a fragment that doesn't exist.
 * 3. Nothing knows the shape of a README, so a 15 KB average document renders
 *    as an unnavigable wall.
 *
 * The fix has to work on HTML that is already written (re-rendering 16.9k
 * READMEs means re-fetching them from GitHub), so it runs at render time and
 * costs one regex pass over ~15 KB.
 *
 * **The ids come from GitHub, not from us, whenever possible.** The empty
 * anchor that follows each heading still carries GitHub's own slug for that
 * heading, so we harvest it and hand it back to the heading it belongs to.
 * That guarantees the README's own "#installation" links resolve rather than
 * hoping our slugifier and GitHub's agree. Headings with no such anchor fall
 * back to a slug derived from their text.
 *
 * SECURITY: every id and fragment this module emits is re-built from a strict
 * `[a-z0-9_-]` allowlist and length cap, never interpolated from README text.
 * A heading of `" onmouseover=alert(1) x="` cannot produce an attribute — the
 * quote and space characters are not in the allowlist. See outline.test.ts.
 */

/** One entry in the rendered table of contents. */
export type ReadmeHeading = {
  /** Slug id, present on the heading element in the returned html. */
  id: string;
  /** Plain-text label (tags stripped, entities decoded, whitespace collapsed). */
  text: string;
  /** Normalized nesting: 0 = top level in THIS document, 1 = one step in. */
  depth: 0 | 1;
};

export type ReadmeOutline = {
  /** The same html, with heading ids added and anchor artifacts repaired. */
  html: string;
  /** Top two heading levels present, in document order. Empty when there's nothing to navigate. */
  headings: ReadmeHeading[];
};

/** Longest id we emit — long enough for real headings, bounded for sanity. */
const MAX_ID_LENGTH = 64;
/** A table of contents past this length is a wall of its own. */
const MAX_HEADINGS = 40;

const HEADING_RE = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
/**
 * GitHub's autolink artifact, immediately after its heading: `<a href="#slug"></a>`.
 * Sticky rather than anchored so it can be tested at a position without
 * slicing a fresh copy of the document per heading.
 */
const TRAILING_ANCHOR_RE = /\s*<a\b[^>]*?href="#([^"]*)"[^>]*>\s*<\/a>/iy;
/** An id we already added on a previous pass (keeps this transform idempotent). */
const EXISTING_ID_RE = /\sid="([^"]*)"/i;
/**
 * Any anchor with nothing inside it. Two sources, both worth deleting: stray
 * autolink artifacts, and outbound links whose only child was an `<svg>` icon
 * the sanitizer discarded (observed on real rows). Either way it is a
 * focusable link with no accessible name and nothing to click.
 */
const EMPTY_ANCHOR_RE = /<a\b[^>]*>\s*<\/a>/gi;
const ANCHOR_OPEN_RE = /<a\b([^>]*)>/gi;
const HREF_RE = /href="([^"]*)"/i;
const TAG_RE = /<[^>]*>/g;

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&nbsp;': ' ',
};

/** Heading innerHTML → plain label. */
function headingText(inner: string): string {
  return inner
    .replace(TAG_RE, '')
    .replace(/&[a-z]+;|&#x?[0-9a-f]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strict slug filter — the ONLY path from README text to an emitted attribute
 * value. Mirrors GitHub's slugger (lowercase, drop punctuation, spaces to
 * hyphens) so harvested and derived ids agree, then hard-filters the result.
 */
export function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    // NFKD splits "é" into "e" + a combining mark, which the allowlist below
    // then drops on its own — so "Café setup" slugs to "cafe-setup" instead of
    // losing the word.
    .normalize('NFKD')
    .replace(/[^a-z0-9 _-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return sanitizeFragment(slug);
}

/** Re-builds a fragment from the allowlist alone; returns '' if nothing survives. */
function sanitizeFragment(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/^-+/, '')
    .slice(0, MAX_ID_LENGTH);
}

/** Appends -1, -2 … the way GitHub does for repeated headings. */
function uniqueId(base: string, seen: Map<string, number>): string {
  const root = base || 'section';
  const hits = seen.get(root) ?? 0;
  seen.set(root, hits + 1);
  return hits === 0 ? root : `${root}-${hits}`;
}

/**
 * Rewrites fragment links so they behave like in-page links again: the
 * sanitizer stamps `target="_blank" rel="nofollow ugc noopener"` on every
 * anchor, which is right for outbound README links and wrong for "#install".
 * Emits a fresh tag rather than editing attributes in place, so nothing
 * author-controlled survives into the output.
 */
function repairFragmentLinks(html: string): string {
  return html.replace(ANCHOR_OPEN_RE, (tag, attrs: string) => {
    const href = HREF_RE.exec(attrs)?.[1];
    if (href === undefined || !href.startsWith('#')) return tag;
    const fragment = sanitizeFragment(href.slice(1));
    // No usable fragment left: keep the text, drop the (dead) link.
    return fragment ? `<a href="#${fragment}" class="prose-jump">` : '<a>';
  });
}

/**
 * Adds ids to a stored README's headings and returns its outline.
 *
 * @param html  sanitized readme_html (never raw markdown)
 * @param titleHint  the project's name; a leading heading that just restates it
 *   is dropped from the outline (the page's own h1 already says it).
 */
export function buildReadmeOutline(
  html: string,
  opts?: { titleHint?: string | null },
): ReadmeOutline {
  if (!html) return { html, headings: [] };

  const seen = new Map<string, number>();
  const found: Array<{ id: string; text: string; level: number }> = [];
  const out: string[] = [];
  let cursor = 0;

  HEADING_RE.lastIndex = 0;
  let match = HEADING_RE.exec(html);
  while (match !== null) {
    const [full, levelRaw, attrs, inner] = match;
    const level = Number(levelRaw);
    const text = headingText(inner);
    const headingEnd = match.index + full.length;

    // Harvest GitHub's own slug from the artifact anchor that trails this
    // heading — using it keeps the README's internal links working.
    TRAILING_ANCHOR_RE.lastIndex = headingEnd;
    const trailing = TRAILING_ANCHOR_RE.exec(html);
    const harvested = trailing ? sanitizeFragment(trailing[1]) : '';
    // An id already here is one of ours from a previous pass — reuse it so
    // this transform is idempotent rather than doubling the attribute.
    const carried = sanitizeFragment(EXISTING_ID_RE.exec(attrs)?.[1] ?? '');
    const id = carried || uniqueId(harvested || slugifyHeading(text), seen);
    if (carried) seen.set(carried, (seen.get(carried) ?? 0) + 1);
    const keptAttrs = attrs.replace(EXISTING_ID_RE, '');

    out.push(html.slice(cursor, match.index));
    out.push(`<h${level} id="${id}"${keptAttrs}>${inner}</h${level}>`);

    // Swallow the artifact anchor: its whole job was to carry the slug we
    // just moved onto the heading.
    cursor = headingEnd + (trailing ? trailing[0].length : 0);
    HEADING_RE.lastIndex = cursor;

    if (text) found.push({ id, text, level });
    match = HEADING_RE.exec(html);
  }
  out.push(html.slice(cursor));

  const repaired = repairFragmentLinks(out.join('').replace(EMPTY_ANCHOR_RE, ''));

  return { html: repaired, headings: selectOutline(found, opts?.titleHint) };
}

/**
 * READMEs are wildly inconsistent about heading levels (plenty open at h2, or
 * use h1 for sections and h2 for subsections), so nesting is derived from what
 * the document actually uses: the shallowest level present becomes depth 0 and
 * the next one down becomes depth 1. Anything deeper is detail, not structure.
 */
function selectOutline(
  found: Array<{ id: string; text: string; level: number }>,
  titleHint?: string | null,
): ReadmeHeading[] {
  let structural = found.filter((h) => h.level <= 3);
  const hint = titleHint ? comparable(titleHint) : '';

  // Two title shapes to shed before measuring depth, or the whole outline ends
  // up indented one step under a heading that was never a section:
  //   `# Project` + `## …`  → a lone top-level heading in first position
  //   `# project-name`      → a heading that just restates the page's own h1
  for (let pass = 0; pass < 2 && structural.length > 1; pass++) {
    const top = Math.min(...structural.map((h) => h.level));
    const isTitle =
      structural[0].level === top &&
      (structural.filter((h) => h.level === top).length === 1 ||
        (hint !== '' && comparable(structural[0].text) === hint));
    if (!isTitle) break;
    structural = structural.slice(1);
  }
  if (structural.length === 0) return [];

  const top = Math.min(...structural.map((h) => h.level));
  return structural
    .filter((h) => h.level <= top + 1)
    .map((h): ReadmeHeading => ({ id: h.id, text: h.text, depth: h.level === top ? 0 : 1 }))
    .slice(0, MAX_HEADINGS);
}

function comparable(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

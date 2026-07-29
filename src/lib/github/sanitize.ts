import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes GitHub-rendered README HTML for storage in the service-role-only
 * `readme_html` column (sanitize-at-write — see docs/architecture.md "GitHub
 * integration" and docs/conventions.md "Security split"). Pure function, no IO.
 *
 * Threat model: the input is attacker-controlled (any public repo's README,
 * rendered by GitHub's markdown API). This must be safe to store and later
 * render as raw HTML with zero further sanitization.
 */

export type SanitizeReadmeOptions = {
  /** e.g. "owner/repo" — used to rewrite relative asset paths. */
  repoFullName: string;
  /** default branch, used as the ref segment in the raw.githubusercontent.com rewrite. */
  branch: string;
};

/** Hard cap applied BEFORE parsing — bounds sanitizer CPU/memory on huge READMEs. */
const MAX_INPUT_LENGTH = 200_000;

/**
 * Explicit tag allowlist — the shape of GitHub's rendered README HTML we
 * intend to support. Deliberately excludes script/style/iframe/form/svg and
 * anything else capable of executing script or loading arbitrary sub-documents.
 */
const ALLOWED_TAGS = [
  // headings
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  // text blocks
  'p',
  'blockquote',
  // lists
  'ul',
  'ol',
  'li',
  // tables
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'colgroup',
  'col',
  // code
  'pre',
  'code',
  // inline / misc
  'a',
  'img',
  'strong',
  'em',
  'del',
  'hr',
  'br',
  'details',
  'summary',
  'sup',
  'sub',
  'kbd',
];

/**
 * Explicit attribute allowlist. Any tag NOT listed here (e.g. p, blockquote, ul,
 * li, pre, code, strong, em, del, hr, br, details, summary, sup, sub, kbd) gets
 * ALL of its attributes stripped — including `style`, everywhere, always.
 *
 * `rel`/`target` on `a` are populated by `transformTags` below (not author-
 * controlled) but must still be declared here or sanitize-html strips them
 * post-transform.
 */
const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'rel', 'target'],
  // `loading`/`decoding` are OURS, not the author's — transformTags below
  // overwrites them unconditionally. They're listed here only because the
  // allowlist is applied after transformTags and would otherwise strip them.
  img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding', 'data-badge'],
  // Harmless structural attributes for merged table cells — GitHub markdown
  // tables occasionally need these; never carries executable content.
  th: ['colspan', 'rowspan'],
  td: ['colspan', 'rowspan'],
};

/**
 * True if `value` has no URL scheme, is not protocol-relative (`//`), and is
 * not a same-page fragment (`#`) — i.e. it is a same-repo relative path that
 * should be rewritten to raw.githubusercontent.com.
 *
 * Deliberately broader than the four prefixes called out in the spec
 * (http(s)://, //, #, mailto:): ANY recognizable URI scheme (javascript:,
 * data:, vbscript:, tel:, ftp:, …) is excluded from rewriting too, so a
 * `javascript:` payload never gets concatenated into a raw.githubusercontent.com
 * path — it instead falls through to the `allowedSchemes: ['https']` filter
 * below and gets stripped outright.
 */
function isRewritableRelativePath(value: string): boolean {
  if (!value) return false;
  if (value.startsWith('#')) return false;
  if (value.startsWith('//')) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return false;
  return true;
}

function rewriteRelativeUrl(value: string, opts: SanitizeReadmeOptions): string {
  let path = value;
  if (path.startsWith('./')) {
    path = path.slice(2);
  } else if (path.startsWith('/')) {
    path = path.slice(1);
  }
  return `https://raw.githubusercontent.com/${opts.repoFullName}/${opts.branch}/${path}`;
}

/**
 * Status-badge hosts, plus the `.svg` heuristic. Badges are the overwhelming
 * majority of images in a README and they are ~20px tall, so the card border
 * and radius `.prose img` applies to screenshots draws a box around each one.
 * CSS cannot select on rendered size, so we mark them at WRITE time — where
 * the URL is already in hand — and let CSS key off `[data-badge]`.
 *
 * `.svg` catches the long tail (self-hosted badges, project logos, which also
 * look wrong boxed); raster screenshots are png/jpg/gif/webp and keep the
 * card treatment. False positives cost only a missing border.
 */
const BADGE_HOSTS = [
  'img.shields.io',
  'shields.io',
  'badgen.net',
  'badge.fury.io',
  'codecov.io',
  'coveralls.io',
  'travis-ci.org',
  'travis-ci.com',
  'circleci.com',
  'app.netlify.com',
  'api.netlify.com',
  'forthebadge.com',
  'badges.gitter.im',
];

function isBadgeSrc(src: unknown): boolean {
  if (typeof src !== 'string') return false;
  try {
    const url = new URL(src, 'https://github.com');
    if (BADGE_HOSTS.includes(url.hostname)) return true;
    if (url.pathname.toLowerCase().endsWith('.svg')) return true;
    // GitHub Actions workflow badges: /owner/repo/actions/workflows/x/badge.svg
    // and the older /owner/repo/workflows/name/badge.svg — both covered by the
    // .svg check above, but keep the intent explicit for readers.
    return false;
  } catch {
    return false;
  }
}

function transformUrlAttribute(
  attribs: sanitizeHtml.Attributes,
  attrName: 'href' | 'src',
  opts: SanitizeReadmeOptions,
): sanitizeHtml.Attributes {
  const value = attribs[attrName];
  if (typeof value !== 'string' || !isRewritableRelativePath(value)) {
    return attribs;
  }
  return { ...attribs, [attrName]: rewriteRelativeUrl(value, opts) };
}

/**
 * Sanitizes raw GitHub README HTML into a safe-to-store, safe-to-render string.
 *
 * - Truncates to 200_000 chars BEFORE parsing (cost/DoS guard).
 * - Explicit tag/attribute allowlist (no script/style/iframe/form/svg; no
 *   `style` attribute anywhere).
 * - `allowedSchemes: ['https']` globally — kills javascript:/data:/mailto:
 *   (mailto hrefs are stripped, not preserved — see sanitize.test.ts).
 * - Relative `href`/`src` paths (not http(s)://, not `//`, not `#`, not any
 *   other URI-scheme-prefixed value) get rewritten to
 *   `https://raw.githubusercontent.com/{repoFullName}/{branch}/{path}`.
 * - Every `<a>` gets `rel="nofollow ugc noopener" target="_blank"`.
 */
export function sanitizeReadmeHtml(rawHtml: string, opts: SanitizeReadmeOptions): string {
  const truncated =
    rawHtml.length > MAX_INPUT_LENGTH ? rawHtml.slice(0, MAX_INPUT_LENGTH) : rawHtml;

  return sanitizeHtml(truncated, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['https'],
    allowedSchemesByTag: {},
    allowProtocolRelative: true,
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...transformUrlAttribute(attribs, 'href', opts),
          rel: 'nofollow ugc noopener',
          target: '_blank',
        },
      }),
      // A 25KB-average README (max 210KB observed) can carry dozens of
      // badges and screenshots; without these every one of them loaded
      // eagerly on first paint. Set here rather than in CSS because the
      // README is sanitized ONCE at write time, so this costs nothing per
      // render. Author-supplied values are deliberately overwritten.
      img: (_tagName, attribs) => {
        // Drop any author-supplied data-badge before deciding — it is in the
        // allowlist (so OUR value survives) and would otherwise let a README
        // opt its own screenshots out of the card treatment.
        const { 'data-badge': _authorBadge, ...rest } = transformUrlAttribute(attribs, 'src', opts);
        return {
          tagName: 'img',
          attribs: {
            ...rest,
            loading: 'lazy',
            decoding: 'async',
            ...(isBadgeSrc(rest.src) ? { 'data-badge': '1' } : {}),
          },
        };
      },
    },
  });
}

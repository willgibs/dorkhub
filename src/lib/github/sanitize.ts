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
  img: ['src', 'alt', 'title', 'width', 'height'],
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
      img: (_tagName, attribs) => ({
        tagName: 'img',
        attribs: transformUrlAttribute(attribs, 'src', opts),
      }),
    },
  });
}

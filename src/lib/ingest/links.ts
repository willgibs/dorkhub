/**
 * Pure GitHub-repo-link extractor for awesome-list README HTML (see
 * docs/plans/p1-gallery-engine.md, "Locked architecture" #8, awesome-list
 * crawl path: getReadmeHtml → this extractor → getRepoByOwnerName). Parses
 * `href="..."` attribute values directly with a regex rather than a full
 * HTML parser — acceptable here because the input is GitHub-rendered README
 * HTML, and badge markup (`<a href="..."><img src="badge.svg" /></a>`)
 * doesn't affect extraction since we only ever look at href values, never
 * tag structure or nesting.
 */

const HREF_ATTR_PATTERN = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

/** Matches `http(s)://` or protocol-relative `//`, optional `www.`, then `github.com/`. */
const GITHUB_HOST_PATTERN = /^(?:https?:)?\/\/(?:www\.)?github\.com\/(.+)$/i;

/** GitHub reserved top-level paths that are never a real owner/org login. */
const RESERVED_FIRST_SEGMENTS = new Set([
  'topics',
  'sponsors',
  'orgs',
  'about',
  'features',
  'marketplace',
  'apps',
  'collections',
  'events',
  'settings',
  'site',
  'contact',
  'pricing',
  'trending',
  'login',
  'join',
  'explore',
]);

/** GitHub owner/org login charset — alnum + hyphen, no leading hyphen. */
const OWNER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]*$/;

/** GitHub repo name charset — alnum, dot, underscore, hyphen. */
const REPO_PATTERN = /^[A-Za-z0-9._-]+$/;

/** Hard cap on refs returned per call — an awesome-list README is never legitimately bigger than this. */
const MAX_REFS = 500;

export type GithubRepoRef = { owner: string; name: string };

/**
 * Extracts every distinct `github.com/{owner}/{repo}` reference from a blob
 * of README HTML.
 *
 * Rejects: anything deeper than exactly owner/repo (`/blob/...`, `/tree/...`,
 * `/issues`, etc.), reserved first segments (topics, sponsors, orgs, about,
 * features, marketplace, apps, collections, events, settings, site, contact,
 * pricing, trending, login, join, explore), and owner/repo values outside
 * GitHub's name charset.
 *
 * Normalizes: strips a trailing slash, any `?query` or `#fragment`, and a
 * trailing `.git`. Dedupes case-insensitively, keeping the first-seen
 * casing. Capped at 500 refs.
 */
export function extractGithubRepoRefs(html: string): GithubRepoRef[] {
  const seen = new Set<string>();
  const refs: GithubRepoRef[] = [];

  for (const match of html.matchAll(HREF_ATTR_PATTERN)) {
    if (refs.length >= MAX_REFS) break;

    const href = match[1] ?? match[2] ?? '';
    const hostMatch = href.match(GITHUB_HOST_PATTERN);
    if (!hostMatch) continue;

    // Drop query/fragment, then a single trailing slash.
    const pathOnly = hostMatch[1].split(/[?#]/)[0];
    const trimmed = pathOnly.endsWith('/') ? pathOnly.slice(0, -1) : pathOnly;

    // Path must be EXACTLY two segments — anything shallower (just an owner)
    // or deeper (blob/tree/issues/...) is rejected here.
    const segments = trimmed.split('/');
    if (segments.length !== 2) continue;

    const [ownerRaw, repoRaw] = segments;
    if (!ownerRaw || !repoRaw) continue;
    if (RESERVED_FIRST_SEGMENTS.has(ownerRaw.toLowerCase())) continue;

    const name = repoRaw.replace(/\.git$/i, '');
    if (!OWNER_PATTERN.test(ownerRaw) || !REPO_PATTERN.test(name)) continue;

    const key = `${ownerRaw.toLowerCase()}/${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ owner: ownerRaw, name });
  }

  return refs;
}

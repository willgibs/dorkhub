import 'server-only';

/**
 * Thin plain-`fetch` GitHub REST client — no octokit (see
 * docs/plans/m4-projects.md, design decision #1: 3 endpoints don't justify a
 * dependency). Every exported function accepts an injectable `fetchImpl` so
 * callers (and tests) never touch the real network or mock a module.
 *
 * Covers: listing a user's public repos, fetching one repo by its immutable
 * numeric id, and fetching a repo's rendered README as HTML.
 */

const GITHUB_API_BASE = 'https://api.github.com';
const API_VERSION = '2022-11-28';

// GitHub returns 403 for ANY request — authenticated or not — that omits a
// User-Agent header. Always send one.
const USER_AGENT = 'dorkhub';

/** Hard cap on Link-header pagination pages for `listPublicRepos` (500 repos at per_page=100). */
export const MAX_LIST_PAGES = 5;

/** Error message bodies are truncated to this many characters before being surfaced. */
const ERROR_MESSAGE_CAP = 200;

/**
 * Thrown when `GITHUB_TOKEN` is missing/empty. Read lazily at call time (not
 * import time) so this module can be imported anywhere without requiring the
 * env var to already be configured — mirrors `supabaseService()`'s fail-loud,
 * call-time-checked pattern in src/lib/supabase/clients.ts.
 */
export class GithubConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GithubConfigError';
  }
}

/**
 * Fields we actually read from GitHub's repo payload, picked explicitly
 * rather than spreading the raw response — the real payload carries 80+
 * fields we don't use and don't want this codebase to accidentally depend on.
 */
export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  license: { spdx_id: string } | null;
  topics: string[];
  default_branch: string;
  fork: boolean;
  archived: boolean;
  private: boolean;
  updated_at: string;
  owner: { id: number; login: string };
};

/** Options accepted by every fetch function below. */
export type GithubFetchOpts = {
  /**
   * Sent as `If-None-Match` when present. `listPublicRepos` ignores this —
   * a list response doesn't have a single stable ETag to compare against.
   */
  etag?: string | null;
  /** Injectable for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
};

type GithubOk<T> = { kind: 'ok'; data: T; etag: string | null };

type GithubNotOk =
  | { kind: 'not_modified'; etag: string | null }
  | { kind: 'not_found' }
  | { kind: 'rate_limited'; retryAfterSeconds: number | null; resetAt: Date | null }
  | { kind: 'error'; status: number; message: string };

export type GithubResult<T> = GithubOk<T> | GithubNotOk;

/** The subset of GitHub's repo payload we read fields from — see `pickRepoFields`. */
type RawGithubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  license: { spdx_id: string } | null;
  topics?: string[];
  default_branch: string;
  fork: boolean;
  archived: boolean;
  private: boolean;
  updated_at: string;
  owner: { id: number; login: string };
};

/**
 * Reads `GITHUB_TOKEN` lazily so import-time failures never happen — only a
 * call that actually needs the token can fail, and it fails loudly.
 */
function githubToken(): string {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    throw new GithubConfigError(
      'GITHUB_TOKEN is not set — required for all GitHub reads (repo listing, sync, README fetch)',
    );
  }
  return token;
}

function buildHeaders(accept: string, etag?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${githubToken()}`,
    'X-GitHub-Api-Version': API_VERSION,
    Accept: accept,
    // See USER_AGENT above — GitHub 403s requests without this.
    'User-Agent': USER_AGENT,
  };
  if (etag) {
    headers['If-None-Match'] = etag;
  }
  return headers;
}

function networkErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function parseHeaderInt(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseRateLimit(res: Response): {
  retryAfterSeconds: number | null;
  resetAt: Date | null;
} {
  const retryAfterSeconds = parseHeaderInt(res.headers.get('retry-after'));
  const resetEpochSeconds = parseHeaderInt(res.headers.get('x-ratelimit-reset'));
  return {
    retryAfterSeconds,
    resetAt: resetEpochSeconds !== null ? new Date(resetEpochSeconds * 1000) : null,
  };
}

async function shortBodySnippet(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.length > ERROR_MESSAGE_CAP ? `${text.slice(0, ERROR_MESSAGE_CAP)}…` : text;
  } catch {
    return `GitHub API responded ${res.status} with an unreadable body`;
  }
}

/**
 * Classifies a response by status, WITHOUT parsing the success body (callers
 * parse it differently — array for lists, object for a single repo, raw text
 * for README html). 403 and 429 are both bucketed as `rate_limited`: a
 * genuinely invalid/expired token also returns 403 on every call, and we
 * can't tell the two apart without an extra request — the conflation is
 * accepted (see docs/plans/m4-projects.md).
 */
async function classifyResponse(
  res: Response,
): Promise<{ kind: 'ok'; etag: string | null } | GithubNotOk> {
  if (res.status === 200) {
    return { kind: 'ok', etag: res.headers.get('etag') };
  }
  if (res.status === 304) {
    return { kind: 'not_modified', etag: res.headers.get('etag') };
  }
  if (res.status === 404) {
    return { kind: 'not_found' };
  }
  if (res.status === 403 || res.status === 429) {
    return { kind: 'rate_limited', ...parseRateLimit(res) };
  }
  return { kind: 'error', status: res.status, message: await shortBodySnippet(res) };
}

/** Picks only the fields declared on `GithubRepo` — never spreads the raw payload. */
function pickRepoFields(raw: unknown): GithubRepo {
  const r = raw as RawGithubRepo;
  return {
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    description: r.description,
    homepage: r.homepage,
    language: r.language,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    license: r.license,
    topics: r.topics ?? [],
    default_branch: r.default_branch,
    fork: r.fork,
    archived: r.archived,
    private: r.private,
    updated_at: r.updated_at,
    owner: { id: r.owner.id, login: r.owner.login },
  };
}

/** Extracts the `rel="next"` URL from an RFC 5988 `Link` header, or null past the last page. */
function nextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(',')) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

/**
 * Lists a user's own public, non-fork-excluding repos (forks/archived are
 * filtered by callers, not here — this is a thin transport layer). Follows
 * `Link: rel="next"` pagination up to `MAX_LIST_PAGES`; beyond the cap it
 * simply stops and returns what it has rather than erroring — 500 repos is
 * already far more than any dorkhub project picker needs to show.
 *
 * Any non-200 page short-circuits the whole call and returns that page's
 * classified result — there's no meaningful "partial list" result to give a
 * caller when e.g. page 3 hits a rate limit.
 */
export async function listPublicRepos(
  login: string,
  opts: GithubFetchOpts = {},
): Promise<GithubResult<GithubRepo[]>> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const headers = buildHeaders('application/vnd.github+json'); // no etag — see GithubFetchOpts

  let url: string | null =
    `${GITHUB_API_BASE}/users/${encodeURIComponent(login)}/repos?type=owner&sort=updated&per_page=100`;
  const repos: GithubRepo[] = [];

  for (let page = 0; page < MAX_LIST_PAGES && url; page++) {
    let res: Response;
    try {
      res = await fetchImpl(url, { headers });
    } catch (err) {
      return { kind: 'error', status: 0, message: networkErrorMessage(err) };
    }

    const status = await classifyResponse(res);
    if (status.kind !== 'ok') {
      return status;
    }

    const body = (await res.json()) as unknown[];
    for (const item of body) {
      repos.push(pickRepoFields(item));
    }

    url = nextPageUrl(res.headers.get('link'));
  }

  return { kind: 'ok', data: repos, etag: null };
}

/**
 * Fetches one repo by its immutable numeric id rather than `owner/name` —
 * renames change `full_name` but never `id`, so sync jobs keyed on this
 * endpoint self-heal after an owner renames a repo (see decision #2).
 */
export async function getRepoById(
  repoId: number,
  opts: GithubFetchOpts = {},
): Promise<GithubResult<GithubRepo>> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const url = `${GITHUB_API_BASE}/repositories/${repoId}`;
  const headers = buildHeaders('application/vnd.github+json', opts.etag);

  let res: Response;
  try {
    res = await fetchImpl(url, { headers });
  } catch (err) {
    return { kind: 'error', status: 0, message: networkErrorMessage(err) };
  }

  const status = await classifyResponse(res);
  if (status.kind !== 'ok') {
    return status;
  }

  const data = pickRepoFields(await res.json());
  return { kind: 'ok', data, etag: status.etag };
}

/**
 * Fetches a repo's README already rendered to HTML by GitHub (the
 * `vnd.github.html` media type) — dorkhub sanitizes and stores this HTML
 * directly rather than rendering markdown itself (see sanitize.ts).
 */
export async function getReadmeHtml(
  owner: string,
  repo: string,
  opts: GithubFetchOpts = {},
): Promise<GithubResult<string>> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`;
  const headers = buildHeaders('application/vnd.github.html', opts.etag);

  let res: Response;
  try {
    res = await fetchImpl(url, { headers });
  } catch (err) {
    return { kind: 'error', status: 0, message: networkErrorMessage(err) };
  }

  const status = await classifyResponse(res);
  if (status.kind !== 'ok') {
    return status;
  }

  const html = await res.text();
  return { kind: 'ok', data: html, etag: status.etag };
}

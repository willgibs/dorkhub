import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GithubConfigError,
  getReadmeHtml,
  getReadmeRaw,
  getRepoById,
  getRepoByOwnerName,
  listPublicRepos,
  listStarredRepos,
  MAX_LIST_PAGES,
  searchRepositories,
} from './client';

/** A realistic raw GitHub repo payload — includes fields GithubRepo does NOT declare
 * (ssh_url, clone_url, node_id, …) to prove pickRepoFields drops them. */
function makeRawRepo(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 12345,
    node_id: 'R_kgDOabcdef',
    name: 'my-repo',
    full_name: 'octocat/my-repo',
    ssh_url: 'git@github.com:octocat/my-repo.git',
    clone_url: 'https://github.com/octocat/my-repo.git',
    html_url: 'https://github.com/octocat/my-repo',
    description: 'A repo',
    homepage: 'https://example.com',
    language: 'TypeScript',
    stargazers_count: 42,
    forks_count: 3,
    license: { spdx_id: 'MIT' },
    topics: ['cli', 'tools'],
    default_branch: 'main',
    fork: false,
    archived: false,
    private: false,
    updated_at: '2026-01-01T00:00:00Z',
    owner: { id: 999, login: 'octocat', avatar_url: 'https://example.com/a.png' },
    ...overrides,
  };
}

/** A raw `star+json` list item — `{starred_at, repo}` — with an unknown top-level
 * field (`user`) to prove the starred-item mapper only reads `starred_at`/`repo`. */
function makeRawStarredItem(
  starredAt: string,
  repoOverrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    starred_at: starredAt,
    repo: makeRawRepo(repoOverrides),
    user: { login: 'someone-else' },
  };
}

const EXPECTED_REPO_KEYS = [
  'id',
  'name',
  'full_name',
  'html_url',
  'description',
  'homepage',
  'language',
  'stargazers_count',
  'forks_count',
  'license',
  'topics',
  'default_branch',
  'fork',
  'archived',
  'private',
  'updated_at',
  'owner',
].sort();

beforeEach(() => {
  process.env.GITHUB_TOKEN = 'test-token';
});

afterEach(() => {
  delete process.env.GITHUB_TOKEN;
});

describe('getRepoById — status classification', () => {
  it('returns ok with the ETag from the response header on 200', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(makeRawRepo(), { status: 200, headers: { etag: '"abc123"' } }),
    );

    const result = await getRepoById(12345, { fetchImpl });

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') throw new Error('expected ok');
    expect(result.etag).toBe('"abc123"');
    expect(result.data.id).toBe(12345);
    expect(result.data.full_name).toBe('octocat/my-repo');
    expect(result.data.owner).toEqual({ id: 999, login: 'octocat' });
  });

  it('drops unknown fields from the raw payload (picks only declared GithubRepo fields)', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(makeRawRepo(), { status: 200 }),
    );

    const result = await getRepoById(12345, { fetchImpl });

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') throw new Error('expected ok');
    expect(Object.keys(result.data).sort()).toEqual(EXPECTED_REPO_KEYS);
    expect(result.data).not.toHaveProperty('ssh_url');
    expect(result.data).not.toHaveProperty('node_id');
  });

  it('sends If-None-Match when an etag is provided', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(makeRawRepo(), { status: 304 }),
    );

    await getRepoById(12345, { etag: '"abc123"', fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = fetchImpl.mock.calls[0];
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('if-none-match')).toBe('"abc123"');
  });

  it('sends the required auth/version/UA headers on every request', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(makeRawRepo(), { status: 200 }),
    );

    await getRepoById(12345, { fetchImpl });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.github.com/repositories/12345');
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('authorization')).toBe('Bearer test-token');
    expect(headers.get('x-github-api-version')).toBe('2022-11-28');
    expect(headers.get('user-agent')).toBe('dorkhub');
    expect(headers.get('accept')).toBe('application/vnd.github+json');
  });

  it('returns not_modified with the ETag on 304', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 304, headers: { etag: '"same"' } }),
    );

    const result = await getRepoById(12345, { etag: '"same"', fetchImpl });

    expect(result).toEqual({ kind: 'not_modified', etag: '"same"' });
  });

  it('returns not_found on 404', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response('{"message":"Not Found"}', { status: 404 }),
    );

    const result = await getRepoById(999999, { fetchImpl });

    expect(result).toEqual({ kind: 'not_found' });
  });

  it('returns rate_limited with parsed Retry-After and reset time on 403', async () => {
    const resetEpoch = Math.floor(Date.now() / 1000) + 3600;
    const fetchImpl = vi.fn<typeof fetch>(
      async () =>
        new Response('{"message":"rate limited"}', {
          status: 403,
          headers: { 'retry-after': '30', 'x-ratelimit-reset': String(resetEpoch) },
        }),
    );

    const result = await getRepoById(12345, { fetchImpl });

    expect(result.kind).toBe('rate_limited');
    if (result.kind !== 'rate_limited') throw new Error('expected rate_limited');
    expect(result.retryAfterSeconds).toBe(30);
    expect(result.resetAt).toEqual(new Date(resetEpoch * 1000));
  });

  it('returns rate_limited on 429, with nulls when rate-limit headers are absent', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response('{"message":"too many"}', { status: 429 }),
    );

    const result = await getRepoById(12345, { fetchImpl });

    expect(result).toEqual({ kind: 'rate_limited', retryAfterSeconds: null, resetAt: null });
  });

  it('returns error with status and a body snippet capped to ~200 chars on other statuses', async () => {
    const longBody = 'x'.repeat(500);
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(longBody, { status: 500 }));

    const result = await getRepoById(12345, { fetchImpl });

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') throw new Error('expected error');
    expect(result.status).toBe(500);
    expect(result.message.length).toBeLessThanOrEqual(201);
    expect(result.message.startsWith('x'.repeat(200))).toBe(true);
  });

  it('returns an error kind with status 0 when the fetch itself throws (e.g. DNS failure)', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error('getaddrinfo ENOTFOUND api.github.com');
    });

    const result = await getRepoById(12345, { fetchImpl });

    expect(result).toEqual({
      kind: 'error',
      status: 0,
      message: 'getaddrinfo ENOTFOUND api.github.com',
    });
  });

  it('throws GithubConfigError when GITHUB_TOKEN is missing', async () => {
    delete process.env.GITHUB_TOKEN;
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(makeRawRepo(), { status: 200 }),
    );

    await expect(getRepoById(12345, { fetchImpl })).rejects.toThrow(GithubConfigError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('listPublicRepos', () => {
  it('requests the owner-repos endpoint and does not send If-None-Match, even if an etag is passed', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json([makeRawRepo()], { status: 200 }),
    );

    const result = await listPublicRepos('octocat', { etag: '"ignored"', fetchImpl });

    expect(result.kind).toBe('ok');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      'https://api.github.com/users/octocat/repos?type=owner&sort=updated&per_page=100',
    );
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('if-none-match')).toBeNull();
  });

  it('encodes the login into the URL', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json([], { status: 200 }));

    await listPublicRepos('weird/login', { fetchImpl });

    const [url] = fetchImpl.mock.calls[0];
    expect(url).toContain(encodeURIComponent('weird/login'));
  });

  it('follows Link rel="next" pagination and concatenates results across pages', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const href = typeof url === 'string' ? url : url.toString();
      if (href.includes('page=2')) {
        return Response.json([makeRawRepo({ id: 2, name: 'repo-2' })], { status: 200 });
      }
      return Response.json([makeRawRepo({ id: 1, name: 'repo-1' })], {
        status: 200,
        headers: { link: '<https://api.github.com/users/octocat/repos?page=2>; rel="next"' },
      });
    });

    const result = await listPublicRepos('octocat', { fetchImpl });

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') throw new Error('expected ok');
    expect(result.data.map((r) => r.id)).toEqual([1, 2]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('stops at MAX_LIST_PAGES pages and returns the accumulated repos rather than erroring', async () => {
    let page = 0;
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      page += 1;
      const nextPage = page + 1;
      return Response.json([makeRawRepo({ id: page })], {
        status: 200,
        headers: {
          link: `<https://api.github.com/users/octocat/repos?page=${nextPage}>; rel="next"`,
        },
      });
    });

    const result = await listPublicRepos('octocat', { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(MAX_LIST_PAGES);
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') throw new Error('expected ok');
    expect(result.data).toHaveLength(MAX_LIST_PAGES);
  });

  it('short-circuits and returns the classified result of the first non-200 page', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json([makeRawRepo({ id: 1 })], {
          status: 200,
          headers: { link: '<https://api.github.com/users/octocat/repos?page=2>; rel="next"' },
        }),
      )
      .mockResolvedValueOnce(new Response('{"message":"too many"}', { status: 429 }));

    const result = await listPublicRepos('octocat', { fetchImpl });

    expect(result).toEqual({ kind: 'rate_limited', retryAfterSeconds: null, resetAt: null });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('returns an error kind with status 0 on a network-level fetch throw', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error('network down');
    });

    const result = await listPublicRepos('octocat', { fetchImpl });

    expect(result).toEqual({ kind: 'error', status: 0, message: 'network down' });
  });

  it('throws GithubConfigError when GITHUB_TOKEN is missing', async () => {
    delete process.env.GITHUB_TOKEN;
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json([], { status: 200 }));

    await expect(listPublicRepos('octocat', { fetchImpl })).rejects.toThrow(GithubConfigError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('listStarredRepos', () => {
  it('parses star+json items, mapping starred_at to starredAt and picking repo fields', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json([makeRawStarredItem('2026-02-01T00:00:00Z')], { status: 200 }),
    );

    const result = await listStarredRepos('octocat', { fetchImpl });

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') throw new Error('expected ok');
    expect(result.data.items).toHaveLength(1);
    const [item] = result.data.items;
    expect(item.starredAt).toBe('2026-02-01T00:00:00Z');
    expect(Object.keys(item.repo).sort()).toEqual(EXPECTED_REPO_KEYS);
    expect(item.repo).not.toHaveProperty('ssh_url');
    expect(item.repo.full_name).toBe('octocat/my-repo');
  });

  it('sets hasMore true when the Link header carries rel="next"', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json([makeRawStarredItem('2026-02-01T00:00:00Z')], {
        status: 200,
        headers: { link: '<https://api.github.com/users/octocat/starred?page=2>; rel="next"' },
      }),
    );

    const result = await listStarredRepos('octocat', { fetchImpl });

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') throw new Error('expected ok');
    expect(result.data.hasMore).toBe(true);
  });

  it('sets hasMore false when there is no Link header (last/only page)', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json([makeRawStarredItem('2026-02-01T00:00:00Z')], { status: 200 }),
    );

    const result = await listStarredRepos('octocat', { fetchImpl });

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') throw new Error('expected ok');
    expect(result.data.hasMore).toBe(false);
  });

  it('sets hasMore false when the Link header only carries rel="prev"', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json([makeRawStarredItem('2026-02-01T00:00:00Z')], {
        status: 200,
        headers: { link: '<https://api.github.com/users/octocat/starred?page=1>; rel="prev"' },
      }),
    );

    const result = await listStarredRepos('octocat', { fetchImpl });

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') throw new Error('expected ok');
    expect(result.data.hasMore).toBe(false);
  });

  it('defaults to page 1 and lands the page param in the URL, single request (no auto-pagination)', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json([], { status: 200 }));

    await listStarredRepos('octocat', { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.github.com/users/octocat/starred?per_page=100&page=1');
  });

  it('sends the requested page number in the URL and does not auto-fetch further pages', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json([makeRawStarredItem('2026-02-01T00:00:00Z')], {
        status: 200,
        headers: { link: '<https://api.github.com/users/octocat/starred?page=4>; rel="next"' },
      }),
    );

    await listStarredRepos('octocat', { page: 3, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.github.com/users/octocat/starred?per_page=100&page=3');
  });

  it('encodes the login into the URL', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json([], { status: 200 }));

    await listStarredRepos('weird/login', { fetchImpl });

    const [url] = fetchImpl.mock.calls[0];
    expect(url).toContain(encodeURIComponent('weird/login'));
  });

  it('requests the star+json Accept header, with the standard auth/version/UA headers', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json([], { status: 200 }));

    await listStarredRepos('octocat', { fetchImpl });

    const [, init] = fetchImpl.mock.calls[0];
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('accept')).toBe('application/vnd.github.star+json');
    expect(headers.get('authorization')).toBe('Bearer test-token');
    expect(headers.get('x-github-api-version')).toBe('2022-11-28');
    expect(headers.get('user-agent')).toBe('dorkhub');
  });

  it('returns not_found on 404', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response('{"message":"Not Found"}', { status: 404 }),
    );

    const result = await listStarredRepos('nonexistent-user', { fetchImpl });

    expect(result).toEqual({ kind: 'not_found' });
  });

  it('returns rate_limited on 403', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response('{"message":"rate limited"}', { status: 403 }),
    );

    const result = await listStarredRepos('octocat', { fetchImpl });

    expect(result.kind).toBe('rate_limited');
  });

  it('returns an error kind with status 0 on a network-level fetch throw', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error('network down');
    });

    const result = await listStarredRepos('octocat', { fetchImpl });

    expect(result).toEqual({ kind: 'error', status: 0, message: 'network down' });
  });

  it('throws GithubConfigError when GITHUB_TOKEN is missing', async () => {
    delete process.env.GITHUB_TOKEN;
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json([], { status: 200 }));

    await expect(listStarredRepos('octocat', { fetchImpl })).rejects.toThrow(GithubConfigError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('getRepoByOwnerName', () => {
  it('requests /repos/{owner}/{name} and returns ok with the ETag from the response header', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(makeRawRepo(), { status: 200, headers: { etag: '"abc123"' } }),
    );

    const result = await getRepoByOwnerName('octocat', 'my-repo', { fetchImpl });

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') throw new Error('expected ok');
    expect(result.etag).toBe('"abc123"');
    expect(result.data.full_name).toBe('octocat/my-repo');
    const [url] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/octocat/my-repo');
  });

  it('encodes both owner and name into the URL', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(makeRawRepo(), { status: 200 }),
    );

    await getRepoByOwnerName('weird owner', 'weird/name', { fetchImpl });

    const [url] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      `https://api.github.com/repos/${encodeURIComponent('weird owner')}/${encodeURIComponent('weird/name')}`,
    );
  });

  it('sends If-None-Match when an etag is provided', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(makeRawRepo(), { status: 304 }),
    );

    await getRepoByOwnerName('octocat', 'my-repo', { etag: '"abc123"', fetchImpl });

    const [, init] = fetchImpl.mock.calls[0];
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('if-none-match')).toBe('"abc123"');
  });

  it('returns not_modified with the ETag on 304', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 304, headers: { etag: '"same"' } }),
    );

    const result = await getRepoByOwnerName('octocat', 'my-repo', {
      etag: '"same"',
      fetchImpl,
    });

    expect(result).toEqual({ kind: 'not_modified', etag: '"same"' });
  });

  it('returns not_found on 404', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response('{"message":"Not Found"}', { status: 404 }),
    );

    const result = await getRepoByOwnerName('octocat', 'no-such-repo', { fetchImpl });

    expect(result).toEqual({ kind: 'not_found' });
  });

  it('sends the required auth/version/UA/accept headers', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(makeRawRepo(), { status: 200 }),
    );

    await getRepoByOwnerName('octocat', 'my-repo', { fetchImpl });

    const [, init] = fetchImpl.mock.calls[0];
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('authorization')).toBe('Bearer test-token');
    expect(headers.get('x-github-api-version')).toBe('2022-11-28');
    expect(headers.get('user-agent')).toBe('dorkhub');
    expect(headers.get('accept')).toBe('application/vnd.github+json');
  });

  it('returns an error kind with status 0 on a network-level fetch throw', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error('network down');
    });

    const result = await getRepoByOwnerName('octocat', 'my-repo', { fetchImpl });

    expect(result).toEqual({ kind: 'error', status: 0, message: 'network down' });
  });

  it('throws GithubConfigError when GITHUB_TOKEN is missing', async () => {
    delete process.env.GITHUB_TOKEN;
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(makeRawRepo(), { status: 200 }),
    );

    await expect(getRepoByOwnerName('octocat', 'my-repo', { fetchImpl })).rejects.toThrow(
      GithubConfigError,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('getReadmeHtml', () => {
  it('requests the html media type and returns the raw text body on 200', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () =>
        new Response('<h1>Hello</h1>', { status: 200, headers: { etag: '"readme-etag"' } }),
    );

    const result = await getReadmeHtml('octocat', 'my-repo', { fetchImpl });

    expect(result).toEqual({ kind: 'ok', data: '<h1>Hello</h1>', etag: '"readme-etag"' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/octocat/my-repo/readme');
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('accept')).toBe('application/vnd.github.html');
  });

  it('sends If-None-Match when an etag is provided', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 304 }));

    await getReadmeHtml('octocat', 'my-repo', { etag: '"readme-etag"', fetchImpl });

    const [, init] = fetchImpl.mock.calls[0];
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('if-none-match')).toBe('"readme-etag"');
  });

  it('returns not_found when the repo has no README', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response('{"message":"Not Found"}', { status: 404 }),
    );

    const result = await getReadmeHtml('octocat', 'no-readme', { fetchImpl });

    expect(result).toEqual({ kind: 'not_found' });
  });

  it('throws GithubConfigError when GITHUB_TOKEN is missing', async () => {
    delete process.env.GITHUB_TOKEN;
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('<h1>Hi</h1>', { status: 200 }));

    await expect(getReadmeHtml('octocat', 'my-repo', { fetchImpl })).rejects.toThrow(
      GithubConfigError,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('getReadmeRaw', () => {
  it('requests the raw+json media type and returns the raw text body on 200', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () =>
        new Response('# Hello\n\nA plain markdown readme.', {
          status: 200,
          headers: { etag: '"readme-etag"' },
        }),
    );

    const result = await getReadmeRaw('octocat', 'my-repo', { fetchImpl });

    expect(result).toEqual({
      kind: 'ok',
      data: '# Hello\n\nA plain markdown readme.',
      etag: '"readme-etag"',
    });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/octocat/my-repo/readme');
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('accept')).toBe('application/vnd.github.raw+json');
  });

  it('sends If-None-Match when an etag is provided', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 304 }));

    await getReadmeRaw('octocat', 'my-repo', { etag: '"readme-etag"', fetchImpl });

    const [, init] = fetchImpl.mock.calls[0];
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('if-none-match')).toBe('"readme-etag"');
  });

  it('returns not_modified with the ETag on 304', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 304, headers: { etag: '"same"' } }),
    );

    const result = await getReadmeRaw('octocat', 'my-repo', { etag: '"same"', fetchImpl });

    expect(result).toEqual({ kind: 'not_modified', etag: '"same"' });
  });

  it('returns not_found when the repo has no README', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response('{"message":"Not Found"}', { status: 404 }),
    );

    const result = await getReadmeRaw('octocat', 'no-readme', { fetchImpl });

    expect(result).toEqual({ kind: 'not_found' });
  });

  it('sends the required auth/version/UA headers', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('readme text', { status: 200 }));

    await getReadmeRaw('octocat', 'my-repo', { fetchImpl });

    const [, init] = fetchImpl.mock.calls[0];
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('authorization')).toBe('Bearer test-token');
    expect(headers.get('x-github-api-version')).toBe('2022-11-28');
    expect(headers.get('user-agent')).toBe('dorkhub');
  });

  it('returns an error kind with status 0 on a network-level fetch throw', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error('network down');
    });

    const result = await getReadmeRaw('octocat', 'my-repo', { fetchImpl });

    expect(result).toEqual({ kind: 'error', status: 0, message: 'network down' });
  });

  it('throws GithubConfigError when GITHUB_TOKEN is missing', async () => {
    delete process.env.GITHUB_TOKEN;
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('readme text', { status: 200 }));

    await expect(getReadmeRaw('octocat', 'my-repo', { fetchImpl })).rejects.toThrow(
      GithubConfigError,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('searchRepositories', () => {
  it('parses items (picking repo fields) and totalCount from a search response', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json({ total_count: 1234, items: [makeRawRepo()] }, { status: 200 }),
    );

    const result = await searchRepositories('topic:cli stars:>=50', { fetchImpl });

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') throw new Error('expected ok');
    expect(result.data.totalCount).toBe(1234);
    expect(result.data.items).toHaveLength(1);
    expect(Object.keys(result.data.items[0]).sort()).toEqual(EXPECTED_REPO_KEYS);
    expect(result.data.items[0]).not.toHaveProperty('ssh_url');
    expect(result.data.items[0].full_name).toBe('octocat/my-repo');
  });

  it('builds the URL with encoded q, sort=stars, order=desc, and the requested per_page/page', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json({ total_count: 0, items: [] }, { status: 200 }),
    );

    await searchRepositories('topic:cli stars:>=50', { perPage: 40, page: 3, fetchImpl });

    const [url] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      `https://api.github.com/search/repositories?q=${encodeURIComponent('topic:cli stars:>=50')}&per_page=40&sort=stars&order=desc&page=3`,
    );
  });

  it('defaults to per_page=30 and page=1 when not provided', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json({ total_count: 0, items: [] }, { status: 200 }),
    );

    await searchRepositories('topic:cli', { fetchImpl });

    const [url] = fetchImpl.mock.calls[0];
    expect(url).toContain('per_page=30');
    expect(url).toContain('page=1');
  });

  it('caps per_page at 100 even when a larger value is requested', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json({ total_count: 0, items: [] }, { status: 200 }),
    );

    await searchRepositories('topic:cli', { perPage: 250, fetchImpl });

    const [url] = fetchImpl.mock.calls[0];
    expect(url).toContain('per_page=100');
  });

  it('sends the required auth/version/UA headers', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json({ total_count: 0, items: [] }, { status: 200 }),
    );

    await searchRepositories('topic:cli', { fetchImpl });

    const [, init] = fetchImpl.mock.calls[0];
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('authorization')).toBe('Bearer test-token');
    expect(headers.get('x-github-api-version')).toBe('2022-11-28');
    expect(headers.get('user-agent')).toBe('dorkhub');
    expect(headers.get('accept')).toBe('application/vnd.github+json');
  });

  it('classifies a 403 response as rate_limited (the separate 30/min search bucket)', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () =>
        new Response('{"message":"API rate limit exceeded"}', {
          status: 403,
          headers: { 'retry-after': '60' },
        }),
    );

    const result = await searchRepositories('topic:cli', { fetchImpl });

    expect(result.kind).toBe('rate_limited');
    if (result.kind !== 'rate_limited') throw new Error('expected rate_limited');
    expect(result.retryAfterSeconds).toBe(60);
  });

  it('returns an error kind with status 0 on a network-level fetch throw', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error('network down');
    });

    const result = await searchRepositories('topic:cli', { fetchImpl });

    expect(result).toEqual({ kind: 'error', status: 0, message: 'network down' });
  });

  it('throws GithubConfigError when GITHUB_TOKEN is missing', async () => {
    delete process.env.GITHUB_TOKEN;
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json({ total_count: 0, items: [] }, { status: 200 }),
    );

    await expect(searchRepositories('topic:cli', { fetchImpl })).rejects.toThrow(GithubConfigError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

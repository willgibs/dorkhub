import { describe, expect, it } from 'vitest';
import type { GithubRepo, GithubResult } from './client';
import { computeSyncUpdate, type SyncInput } from './sync';

/** A realistic already-picked GithubRepo — matches what `getRepoById`/client.ts hands back. */
function makeRepo(overrides: Partial<GithubRepo> = {}): GithubRepo {
  return {
    id: 12345,
    name: 'my-repo',
    full_name: 'octocat/my-repo',
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
    owner: { id: 999, login: 'octocat' },
    ...overrides,
  };
}

const baseInput: SyncInput = {
  githubRepoId: 12345,
  repoEtag: '"old-repo-etag"',
  readmeEtag: '"old-readme-etag"',
  repoFullName: 'octocat/my-repo',
};

// Forbidden keys — sync must NEVER touch owner-authored/curation fields.
const FORBIDDEN_PATCH_KEYS = ['slug', 'demo_url', 'tagline', 'tags', 'status', 'description_md'];

type RepoScenario = { label: string; result: GithubResult<GithubRepo> };
type ReadmeScenario = { label: string; result: GithubResult<string> | null };

const repoScenarios: RepoScenario[] = [
  { label: 'ok', result: { kind: 'ok', data: makeRepo(), etag: '"new-repo-etag"' } },
  { label: 'not_modified', result: { kind: 'not_modified', etag: '"old-repo-etag"' } },
  { label: 'not_found', result: { kind: 'not_found' } },
  {
    label: 'rate_limited',
    result: {
      kind: 'rate_limited',
      retryAfterSeconds: 30,
      resetAt: new Date('2026-07-22T00:00:00Z'),
    },
  },
  { label: 'error', result: { kind: 'error', status: 500, message: 'server exploded' } },
];

const readmeScenarios: ReadmeScenario[] = [
  {
    label: 'ok',
    result: { kind: 'ok', data: '<p>hi</p><script>alert(1)</script>', etag: '"new-readme-etag"' },
  },
  { label: 'not_modified', result: { kind: 'not_modified', etag: '"old-readme-etag"' } },
  { label: 'not_found', result: { kind: 'not_found' } },
  { label: 'error', result: { kind: 'error', status: 500, message: 'server exploded' } },
  { label: 'null (not attempted)', result: null },
];

describe('computeSyncUpdate — forbidden keys', () => {
  for (const repoScenario of repoScenarios) {
    for (const readmeScenario of readmeScenarios) {
      it(`repo=${repoScenario.label} readme=${readmeScenario.label} never patches owner-authored/curation fields`, () => {
        const { patch } = computeSyncUpdate(baseInput, repoScenario.result, readmeScenario.result);
        for (const forbiddenKey of FORBIDDEN_PATCH_KEYS) {
          expect(patch).not.toHaveProperty(forbiddenKey);
        }
      });
    }
  }
});

describe('computeSyncUpdate — repo result drives bumpSyncedAt', () => {
  it.each([
    ['ok', true],
    ['not_modified', true],
    ['not_found', true],
    ['rate_limited', false],
    ['error', false],
  ] as const)('repo=%s → bumpSyncedAt=%s, regardless of readme result', (label, expectedBump) => {
    const repoScenario = repoScenarios.find((s) => s.label === label);
    if (!repoScenario) throw new Error(`missing scenario ${label}`);

    for (const readmeScenario of readmeScenarios) {
      const { bumpSyncedAt } = computeSyncUpdate(
        baseInput,
        repoScenario.result,
        readmeScenario.result,
      );
      expect(bumpSyncedAt).toBe(expectedBump);
    }
  });
});

describe('computeSyncUpdate — repo: ok', () => {
  it('patches full repo metadata using the fresh etag and data', () => {
    const repo = makeRepo({
      full_name: 'octocat/renamed-repo',
      html_url: 'https://github.com/octocat/renamed-repo',
      name: 'renamed-repo',
      language: 'Rust',
      topics: ['systems'],
      stargazers_count: 100,
      forks_count: 7,
      license: { spdx_id: 'Apache-2.0' },
    });
    const { patch, bumpSyncedAt } = computeSyncUpdate(
      baseInput,
      { kind: 'ok', data: repo, etag: '"new-repo-etag"' },
      null,
    );

    expect(patch).toEqual({
      repo_etag: '"new-repo-etag"',
      repo_full_name: 'octocat/renamed-repo',
      repo_url: 'https://github.com/octocat/renamed-repo',
      name: 'renamed-repo',
      primary_language: 'Rust',
      topics: ['systems'],
      stars_count: 100,
      forks_count: 7,
      license: 'Apache-2.0',
    });
    expect(bumpSyncedAt).toBe(true);
  });

  it('normalizes a NOASSERTION license to null', () => {
    const repo = makeRepo({ license: { spdx_id: 'NOASSERTION' } });
    const { patch } = computeSyncUpdate(baseInput, { kind: 'ok', data: repo, etag: '"e"' }, null);

    expect(patch.license).toBeNull();
  });

  it('stores a null license as null', () => {
    const repo = makeRepo({ license: null });
    const { patch } = computeSyncUpdate(baseInput, { kind: 'ok', data: repo, etag: '"e"' }, null);

    expect(patch.license).toBeNull();
  });
});

describe('computeSyncUpdate — repo: not_modified', () => {
  it('patches no repo-metadata fields but still bumps last_synced_at', () => {
    const { patch, bumpSyncedAt } = computeSyncUpdate(
      baseInput,
      { kind: 'not_modified', etag: '"old-repo-etag"' },
      null,
    );

    expect(patch).toEqual({});
    expect(bumpSyncedAt).toBe(true);
  });
});

describe('computeSyncUpdate — repo: not_found', () => {
  it('keeps the patch free of repo-metadata fields (last-known-good display data stays) but bumps last_synced_at so dead repos round-robin instead of pinning the cron queue', () => {
    const { patch, bumpSyncedAt } = computeSyncUpdate(baseInput, { kind: 'not_found' }, null);

    expect(patch).toEqual({});
    expect(bumpSyncedAt).toBe(true);
  });
});

describe('computeSyncUpdate — repo: rate_limited / error', () => {
  it('rate_limited produces an empty patch (readme not attempted, matching the IO shell) and does not bump last_synced_at', () => {
    const { patch, bumpSyncedAt } = computeSyncUpdate(
      baseInput,
      { kind: 'rate_limited', retryAfterSeconds: 30, resetAt: null },
      null,
    );

    expect(patch).toEqual({});
    expect(bumpSyncedAt).toBe(false);
  });

  it('error produces an empty patch and does not bump last_synced_at', () => {
    const { patch, bumpSyncedAt } = computeSyncUpdate(
      baseInput,
      { kind: 'error', status: 500, message: 'boom' },
      null,
    );

    expect(patch).toEqual({});
    expect(bumpSyncedAt).toBe(false);
  });

  it('readme processing is independent of the repo result: a readme result still patches through even if the repo call failed (the IO shell never actually produces this combination, but the pure function stays honest about what it was given)', () => {
    const { patch, bumpSyncedAt } = computeSyncUpdate(
      baseInput,
      { kind: 'rate_limited', retryAfterSeconds: 30, resetAt: null },
      { kind: 'ok', data: '<p>independent axis</p>', etag: '"e"' },
    );

    expect(patch.readme_html).toBe('<p>independent axis</p>');
    expect(patch.readme_etag).toBe('"e"');
    expect(patch).not.toHaveProperty('repo_etag');
    expect(bumpSyncedAt).toBe(false);
  });
});

describe('computeSyncUpdate — readme: ok', () => {
  it('sanitizes the readme body (strips script, keeps safe tags) and stores the etag', () => {
    const { patch } = computeSyncUpdate(
      baseInput,
      { kind: 'ok', data: makeRepo(), etag: '"e"' },
      { kind: 'ok', data: '<p>hi</p><script>alert(1)</script>', etag: '"new-readme-etag"' },
    );

    expect(patch.readme_html).toBe('<p>hi</p>');
    expect(patch.readme_html).not.toContain('<script>');
    expect(patch.readme_etag).toBe('"new-readme-etag"');
  });

  it('uses the fresh repo full_name/default_branch to sanitize when the repo call was ok', () => {
    const repo = makeRepo({ full_name: 'octocat/fresh-name', default_branch: 'develop' });
    const { patch } = computeSyncUpdate(
      baseInput,
      { kind: 'ok', data: repo, etag: '"e"' },
      { kind: 'ok', data: '<img src="assets/logo.png">', etag: '"e2"' },
    );

    expect(patch.readme_html).toContain(
      'https://raw.githubusercontent.com/octocat/fresh-name/develop/assets/logo.png',
    );
  });

  it('falls back to the last-known-good repoFullName and the HEAD ref when the repo call was not ok', () => {
    const { patch } = computeSyncUpdate(
      baseInput,
      { kind: 'not_modified', etag: '"old-repo-etag"' },
      { kind: 'ok', data: '<img src="assets/logo.png">', etag: '"e2"' },
    );

    expect(patch.readme_html).toContain(
      `https://raw.githubusercontent.com/${baseInput.repoFullName}/HEAD/assets/logo.png`,
    );
  });
});

describe('computeSyncUpdate — readme: not_modified', () => {
  it('patches no readme fields', () => {
    const { patch } = computeSyncUpdate(
      baseInput,
      { kind: 'ok', data: makeRepo(), etag: '"e"' },
      { kind: 'not_modified', etag: '"old-readme-etag"' },
    );

    expect(patch).not.toHaveProperty('readme_html');
    expect(patch).not.toHaveProperty('readme_etag');
  });
});

describe('computeSyncUpdate — readme: not_found', () => {
  it('sets readme_html and readme_etag to null (graceful absence, not an error)', () => {
    const { patch } = computeSyncUpdate(
      baseInput,
      { kind: 'ok', data: makeRepo(), etag: '"e"' },
      { kind: 'not_found' },
    );

    expect(patch.readme_html).toBeNull();
    expect(patch.readme_etag).toBeNull();
  });
});

describe('computeSyncUpdate — readme: rate_limited / error / null', () => {
  it('rate_limited patches no readme fields and does not affect bumpSyncedAt', () => {
    const { patch, bumpSyncedAt } = computeSyncUpdate(
      baseInput,
      { kind: 'ok', data: makeRepo(), etag: '"e"' },
      { kind: 'rate_limited', retryAfterSeconds: null, resetAt: null },
    );

    expect(patch).not.toHaveProperty('readme_html');
    expect(patch).not.toHaveProperty('readme_etag');
    expect(bumpSyncedAt).toBe(true);
  });

  it('error patches no readme fields and does not affect bumpSyncedAt', () => {
    const { patch, bumpSyncedAt } = computeSyncUpdate(
      baseInput,
      { kind: 'ok', data: makeRepo(), etag: '"e"' },
      { kind: 'error', status: 500, message: 'boom' },
    );

    expect(patch).not.toHaveProperty('readme_html');
    expect(patch).not.toHaveProperty('readme_etag');
    expect(bumpSyncedAt).toBe(true);
  });

  it('null (not attempted) patches no readme fields', () => {
    const { patch } = computeSyncUpdate(
      baseInput,
      { kind: 'ok', data: makeRepo(), etag: '"e"' },
      null,
    );

    expect(patch).not.toHaveProperty('readme_html');
    expect(patch).not.toHaveProperty('readme_etag');
  });
});

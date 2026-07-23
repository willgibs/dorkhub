import { describe, expect, it } from 'vitest';
import type { GithubRepo } from '@/lib/github/client';
import { decideStarImport, type StarImportContext, tallyKey } from './decide';

/** Minimal-but-complete GithubRepo fixture — only owner/fork/archived vary per test. */
function makeRepo(overrides: Partial<GithubRepo> = {}): GithubRepo {
  return {
    id: 1,
    name: 'widget',
    full_name: 'someone/widget',
    html_url: 'https://github.com/someone/widget',
    description: null,
    homepage: null,
    language: null,
    stargazers_count: 0,
    forks_count: 0,
    license: null,
    topics: [],
    default_branch: 'main',
    fork: false,
    archived: false,
    private: false,
    updated_at: '2026-01-01T00:00:00Z',
    owner: { id: 100, login: 'someone' },
    ...overrides,
  };
}

const baseCtx: StarImportContext = {
  viewerGithubId: 999,
  isBlocklisted: false,
  existingProjectId: null,
};

describe('decideStarImport — decision matrix', () => {
  const cases: Array<{
    name: string;
    repo: Partial<GithubRepo>;
    ctx: Partial<StarImportContext>;
    expected: ReturnType<typeof decideStarImport>;
  }> = [
    {
      name: 'own repo, not listed → own_unlisted',
      repo: { owner: { id: 999, login: 'viewer' } },
      ctx: {},
      expected: { kind: 'own_unlisted' },
    },
    {
      name: 'blocklisted repo (not own, not listed) → blocked',
      repo: {},
      ctx: { isBlocklisted: true },
      expected: { kind: 'blocked' },
    },
    {
      name: 'already-listed repo (not own, not blocked) → save',
      repo: {},
      ctx: { existingProjectId: 'project-1' },
      expected: { kind: 'save', projectId: 'project-1' },
    },
    {
      name: 'fork (not own, not blocked, not listed) → filtered_fork',
      repo: { fork: true },
      ctx: {},
      expected: { kind: 'filtered_fork' },
    },
    {
      name: 'archived (not own, not blocked, not listed) → filtered_fork',
      repo: { archived: true },
      ctx: {},
      expected: { kind: 'filtered_fork' },
    },
    {
      name: 'fork AND archived → filtered_fork (still one bucket)',
      repo: { fork: true, archived: true },
      ctx: {},
      expected: { kind: 'filtered_fork' },
    },
    {
      name: 'plain third-party, active, unlisted repo → candidate',
      repo: {},
      ctx: {},
      expected: { kind: 'candidate' },
    },

    // --- precedence conflicts ---
    {
      name: 'own + blocklisted → own_unlisted wins (own-ness checked first)',
      repo: { owner: { id: 999, login: 'viewer' } },
      ctx: { isBlocklisted: true },
      expected: { kind: 'own_unlisted' },
    },
    {
      name: 'blocklisted + already-listed → blocked wins (blocklist checked before existing)',
      repo: {},
      ctx: { isBlocklisted: true, existingProjectId: 'project-1' },
      expected: { kind: 'blocked' },
    },
    {
      name: 'own + already-listed → save wins (own only short-circuits when UNLISTED)',
      repo: { owner: { id: 999, login: 'viewer' } },
      ctx: { existingProjectId: 'project-1' },
      expected: { kind: 'save', projectId: 'project-1' },
    },
    {
      name: 'own + blocklisted + already-listed → own_unlisted still short-circuits everything else is moot, but existingProjectId set means own does NOT fire, so blocked wins',
      repo: { owner: { id: 999, login: 'viewer' } },
      ctx: { isBlocklisted: true, existingProjectId: 'project-1' },
      expected: { kind: 'blocked' },
    },
    {
      name: 'already-listed + fork → save wins (existing check precedes fork filter)',
      repo: { fork: true },
      ctx: { existingProjectId: 'project-1' },
      expected: { kind: 'save', projectId: 'project-1' },
    },
    {
      name: 'blocklisted + fork → blocked wins (blocklist precedes fork filter)',
      repo: { fork: true },
      ctx: { isBlocklisted: true },
      expected: { kind: 'blocked' },
    },
    {
      name: 'own repo that is also a fork, unlisted → own_unlisted wins (own precedes fork filter)',
      repo: { owner: { id: 999, login: 'viewer' }, fork: true },
      ctx: {},
      expected: { kind: 'own_unlisted' },
    },
  ];

  for (const { name, repo, ctx, expected } of cases) {
    it(name, () => {
      expect(decideStarImport(makeRepo(repo), { ...baseCtx, ...ctx })).toEqual(expected);
    });
  }
});

describe('tallyKey', () => {
  it('maps own_unlisted → own', () => {
    expect(tallyKey({ kind: 'own_unlisted' })).toBe('own');
  });

  it('maps blocked → blocked', () => {
    expect(tallyKey({ kind: 'blocked' })).toBe('blocked');
  });

  it('maps save → here', () => {
    expect(tallyKey({ kind: 'save', projectId: 'p1' })).toBe('here');
  });

  it('maps filtered_fork → filtered', () => {
    expect(tallyKey({ kind: 'filtered_fork' })).toBe('filtered');
  });

  it('maps candidate → queued', () => {
    expect(tallyKey({ kind: 'candidate' })).toBe('queued');
  });
});

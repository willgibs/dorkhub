import { describe, expect, it } from 'vitest';
import {
  buildEnrichmentQueue,
  planStamp,
  projectNeedsEnrichment,
  projectToEnrichmentInput,
} from './run';

// Only the pure helpers are tested here — enrichNextBatch takes a
// SupabaseClient and drives real IO (chatCompletion, getReadmeRaw); building
// a fake PostgREST for it is out of scope (house convention: IO paths are
// live-E2E territory, not unit-mocked — see docs/plans/p2.5-self-running.md
// Wave 1B spec).

describe('projectNeedsEnrichment', () => {
  it('needs enrichment when tagline is null', () => {
    expect(projectNeedsEnrichment({ tagline: null, tags: ['cli'] })).toBe(true);
  });

  it('needs enrichment when tagline is empty string', () => {
    expect(projectNeedsEnrichment({ tagline: '', tags: ['cli'] })).toBe(true);
  });

  it('needs enrichment when tagline is whitespace-only', () => {
    expect(projectNeedsEnrichment({ tagline: '   ', tags: ['cli'] })).toBe(true);
  });

  it('needs enrichment when tags is empty, even with a real tagline', () => {
    expect(projectNeedsEnrichment({ tagline: 'a tidy little tool', tags: [] })).toBe(true);
  });

  it('does NOT need enrichment when both tagline and tags are present', () => {
    expect(projectNeedsEnrichment({ tagline: 'a tidy little tool', tags: ['cli'] })).toBe(false);
  });

  it('needs enrichment when both are missing', () => {
    expect(projectNeedsEnrichment({ tagline: null, tags: [] })).toBe(true);
  });
});

describe('projectToEnrichmentInput', () => {
  it('maps a project row to an EnrichmentCandidate, deriving owner_login from repo_full_name', () => {
    const result = projectToEnrichmentInput({
      name: 'widget',
      repo_full_name: 'someone/widget',
      tagline: 'a tidy little tool',
      primary_language: 'Rust',
      topics: ['cli', 'audio'],
    });
    expect(result).toEqual({
      name: 'widget',
      owner_login: 'someone',
      description: 'a tidy little tool',
      primary_language: 'Rust',
      topics: ['cli', 'audio'],
    });
  });

  it('passes a null tagline through as description: null', () => {
    const result = projectToEnrichmentInput({
      name: 'widget',
      repo_full_name: 'someone/widget',
      tagline: null,
      primary_language: null,
      topics: [],
    });
    expect(result.description).toBeNull();
  });

  it('takes only the first path segment as owner_login (org/owner names never contain slashes)', () => {
    const result = projectToEnrichmentInput({
      name: 'widget',
      repo_full_name: 'some-org/widget',
      tagline: null,
      primary_language: null,
      topics: [],
    });
    expect(result.owner_login).toBe('some-org');
  });
});

describe('buildEnrichmentQueue', () => {
  it('puts all projects first, then candidates', () => {
    const queue = buildEnrichmentQueue(['p1', 'p2'], ['c1', 'c2'], 10);
    expect(queue).toEqual([
      { source: 'project', item: 'p1' },
      { source: 'project', item: 'p2' },
      { source: 'candidate', item: 'c1' },
      { source: 'candidate', item: 'c2' },
    ]);
  });

  it('caps at limit, dropping candidates first since projects come first', () => {
    const queue = buildEnrichmentQueue(['p1', 'p2'], ['c1', 'c2'], 3);
    expect(queue).toEqual([
      { source: 'project', item: 'p1' },
      { source: 'project', item: 'p2' },
      { source: 'candidate', item: 'c1' },
    ]);
  });

  it('caps at limit, dropping projects too when there are more projects than limit', () => {
    const queue = buildEnrichmentQueue(['p1', 'p2', 'p3'], ['c1'], 2);
    expect(queue).toEqual([
      { source: 'project', item: 'p1' },
      { source: 'project', item: 'p2' },
    ]);
  });

  it('returns only candidates when projects is empty', () => {
    const queue = buildEnrichmentQueue([], ['c1', 'c2'], 10);
    expect(queue).toEqual([
      { source: 'candidate', item: 'c1' },
      { source: 'candidate', item: 'c2' },
    ]);
  });

  it('returns empty for empty inputs', () => {
    expect(buildEnrichmentQueue([], [], 10)).toEqual([]);
  });

  it('returns empty when limit is 0', () => {
    expect(buildEnrichmentQueue(['p1'], ['c1'], 0)).toEqual([]);
  });

  it('does not error on a negative limit — treats it as 0', () => {
    expect(buildEnrichmentQueue(['p1'], ['c1'], -5)).toEqual([]);
  });
});

describe('planStamp — candidate target', () => {
  const today = '2026-07-23T00:00:00.000Z';
  // `existing` is unused by the candidate branch — any value is fine.
  const existing = { tagline: null, tags: [] };

  it('always overwrites ai_tagline/ai_tags when the model produced both', () => {
    expect(planStamp('candidate', existing, { tagline: 'a tool', tags: ['cli'] }, today)).toEqual({
      ai_tagline: 'a tool',
      ai_tags: ['cli'],
      enriched_at: today,
    });
  });

  it('stamps null/[] when the model came up empty (parsed is null)', () => {
    expect(planStamp('candidate', existing, null, today)).toEqual({
      ai_tagline: null,
      ai_tags: [],
      enriched_at: today,
    });
  });

  it('overwrites even when parsed has only a tagline (partial parse)', () => {
    expect(planStamp('candidate', existing, { tagline: 'a tool', tags: [] }, today)).toEqual({
      ai_tagline: 'a tool',
      ai_tags: [],
      enriched_at: today,
    });
  });
});

describe('planStamp — project target (fill-only)', () => {
  const today = '2026-07-23T00:00:00.000Z';

  it('fills both tagline and tags when both existing fields are empty', () => {
    const stamp = planStamp(
      'project',
      { tagline: null, tags: [] },
      { tagline: 'a tool', tags: ['cli'] },
      today,
    );
    expect(stamp).toEqual({ enriched_at: today, tagline: 'a tool', tags: ['cli'] });
  });

  it('fills nothing when parsed is null, but still stamps enriched_at', () => {
    const stamp = planStamp('project', { tagline: null, tags: [] }, null, today);
    expect(stamp).toEqual({ enriched_at: today });
  });

  it('does NOT overwrite an existing tagline, even when the model produced one', () => {
    const stamp = planStamp(
      'project',
      { tagline: 'human-written tagline', tags: [] },
      { tagline: 'ai guess', tags: ['cli'] },
      today,
    );
    expect(stamp).toEqual({ enriched_at: today, tags: ['cli'] });
    expect(stamp).not.toHaveProperty('tagline');
  });

  it('does NOT overwrite existing tags, even when the model produced tags', () => {
    const stamp = planStamp(
      'project',
      { tagline: null, tags: ['already-tagged'] },
      { tagline: 'a tool', tags: ['ai-guess'] },
      today,
    );
    expect(stamp).toEqual({ enriched_at: today, tagline: 'a tool' });
    expect(stamp).not.toHaveProperty('tags');
  });

  it('fills nothing when both fields already have content — only stamps enriched_at', () => {
    const stamp = planStamp(
      'project',
      { tagline: 'already there', tags: ['already-tagged'] },
      { tagline: 'ai guess', tags: ['ai-guess'] },
      today,
    );
    expect(stamp).toEqual({ enriched_at: today });
  });

  it('does not fill tagline when the model produced an empty/null tagline', () => {
    const stamp = planStamp(
      'project',
      { tagline: null, tags: ['cli'] },
      { tagline: null, tags: [] },
      today,
    );
    expect(stamp).toEqual({ enriched_at: today });
  });

  it('does not fill tags when the model produced an empty tags array', () => {
    const stamp = planStamp(
      'project',
      { tagline: null, tags: [] },
      { tagline: 'a tool', tags: [] },
      today,
    );
    expect(stamp).toEqual({ enriched_at: today, tagline: 'a tool' });
  });
});

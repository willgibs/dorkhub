import { describe, expect, it } from 'vitest';
import { buildScreenQueue, planScreenStamp, type ScreenProjectRow } from './screen';

// Only the pure helpers are tested here — screenNextBatch takes a
// SupabaseClient and drives real IO (chatCompletion); building a fake
// PostgREST for it is out of scope, same house convention as
// src/lib/enrich/run.test.ts for enrichNextBatch (IO paths are live-E2E
// territory, not unit-mocked — docs/plans/p2.6-immune-system.md).

function project(id: string, overrides: Partial<ScreenProjectRow> = {}): ScreenProjectRow {
  return {
    id,
    name: id,
    repo_full_name: `someone/${id}`,
    tagline: null,
    description_md: null,
    topics: [],
    tags: [],
    primary_language: null,
    stars_count: 0,
    readme_html: null,
    ...overrides,
  };
}

describe('buildScreenQueue', () => {
  it('report-only: returns every reported project, source "report"', () => {
    const p1 = project('p1');
    const p2 = project('p2');
    expect(buildScreenQueue([p1, p2], [], 10)).toEqual([
      { source: 'report', project: p1 },
      { source: 'report', project: p2 },
    ]);
  });

  it('retro-only: returns every retro project, source "retro"', () => {
    const r1 = project('r1');
    const r2 = project('r2');
    expect(buildScreenQueue([], [r1, r2], 10)).toEqual([
      { source: 'retro', project: r1 },
      { source: 'retro', project: r2 },
    ]);
  });

  it('merged order: all reported first (given order), then all retro (given order)', () => {
    const p1 = project('p1');
    const p2 = project('p2');
    const r1 = project('r1');
    const r2 = project('r2');
    expect(buildScreenQueue([p1, p2], [r1, r2], 10)).toEqual([
      { source: 'report', project: p1 },
      { source: 'report', project: p2 },
      { source: 'retro', project: r1 },
      { source: 'retro', project: r2 },
    ]);
  });

  it('the same project id in both lists appears once, at "report" priority', () => {
    const reportedVersion = project('shared', { tagline: 'from report query' });
    const retroVersion = project('shared', { tagline: 'from retro query' });
    const queue = buildScreenQueue([reportedVersion], [retroVersion], 10);
    expect(queue).toEqual([{ source: 'report', project: reportedVersion }]);
  });

  it('caps at limit, dropping retro items first since reported come first', () => {
    const p1 = project('p1');
    const r1 = project('r1');
    const r2 = project('r2');
    expect(buildScreenQueue([p1], [r1, r2], 2)).toEqual([
      { source: 'report', project: p1 },
      { source: 'retro', project: r1 },
    ]);
  });

  it('caps at limit, dropping reported items too when there are more reported than limit', () => {
    const p1 = project('p1');
    const p2 = project('p2');
    const p3 = project('p3');
    expect(buildScreenQueue([p1, p2, p3], [project('r1')], 2)).toEqual([
      { source: 'report', project: p1 },
      { source: 'report', project: p2 },
    ]);
  });

  it('returns empty for empty inputs', () => {
    expect(buildScreenQueue([], [], 10)).toEqual([]);
  });

  it('returns empty when limit is 0', () => {
    expect(buildScreenQueue([project('p1')], [project('r1')], 0)).toEqual([]);
  });
});

describe('planScreenStamp', () => {
  const today = '2026-07-27T00:00:00.000Z';
  const model = 'gemini-2.5-flash-lite';

  it('passes through verdict + reason from a parsed reply, stamping model + created_at', () => {
    expect(
      planScreenStamp({ verdict: 'flagged', reason: 'looks like spam' }, model, today),
    ).toEqual({
      verdict: 'flagged',
      reason: 'looks like spam',
      model,
      created_at: today,
    });
  });

  it('passes through every verdict value unchanged', () => {
    expect(planScreenStamp({ verdict: 'ok', reason: null }, model, today)).toEqual({
      verdict: 'ok',
      reason: null,
      model,
      created_at: today,
    });
    expect(planScreenStamp({ verdict: 'review', reason: 'purpose unclear' }, model, today)).toEqual(
      {
        verdict: 'review',
        reason: 'purpose unclear',
        model,
        created_at: today,
      },
    );
  });

  it('a null parse (genuine-but-unusable reply) stamps verdict "review" with a synthetic reason', () => {
    const stamp = planScreenStamp(null, model, today);
    expect(stamp.verdict).toBe('review');
    expect(typeof stamp.reason).toBe('string');
    expect(stamp.reason?.length).toBeGreaterThan(0);
  });

  it('still stamps model + created_at even when parsed is null', () => {
    const stamp = planScreenStamp(null, model, today);
    expect(stamp.model).toBe(model);
    expect(stamp.created_at).toBe(today);
  });
});

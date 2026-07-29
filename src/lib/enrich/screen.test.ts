import { describe, expect, it } from 'vitest';
import {
  buildScreenQueue,
  collectRetroPages,
  planScreenStamp,
  type RetroPage,
  resolveScreenWrite,
  type ScreenProjectRow,
} from './screen';

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

/**
 * P2.7 — the retro pass used ONE fixed `limit * 3` window and removed
 * already-screened rows in JS afterwards, so once those oldest rows were all
 * screened it returned [] on every subsequent run forever (reporting
 * `screened: 0`, indistinguishable from "nothing to do"). Third occurrence of
 * the same window-vs-population bug class (P2.1 enrich, P2.6 retro), so the
 * advance rule gets pinned here rather than trusted.
 */
describe('collectRetroPages — the window must advance', () => {
  function page(rowCount: number, eligibleIds: string[]): RetroPage {
    return { rowCount, eligible: eligibleIds.map((id) => project(id)) };
  }

  it('walks past a full page whose rows are ALL already screened (the stall)', async () => {
    const requested: Array<[number, number]> = [];
    const result = await collectRetroPages(3, 9, 5, async (from, to) => {
      requested.push([from, to]);
      // Page 0: nine eligible-looking candidates, every one already screened.
      if (from === 0) return page(9, []);
      return page(9, ['p10', 'p11', 'p12']);
    });

    expect(result.map((r) => r.id)).toEqual(['p10', 'p11', 'p12']);
    expect(requested[0]).toEqual([0, 8]);
    expect(requested[1]).toEqual([9, 17]);
  });

  it('stops at the first page when it already satisfies the limit', async () => {
    let calls = 0;
    const result = await collectRetroPages(3, 9, 5, async () => {
      calls++;
      return page(9, ['a', 'b', 'c', 'd']);
    });

    expect(result.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(calls).toBe(1);
  });

  it('stops on a short page — end of the eligible population', async () => {
    let calls = 0;
    const result = await collectRetroPages(3, 9, 5, async () => {
      calls++;
      return page(4, ['a']);
    });

    expect(result.map((r) => r.id)).toEqual(['a']);
    expect(calls).toBe(1);
  });

  it('stops on an empty page', async () => {
    let calls = 0;
    const result = await collectRetroPages(3, 9, 5, async () => {
      calls++;
      return page(0, []);
    });

    expect(result).toEqual([]);
    expect(calls).toBe(1);
  });

  it('gives up after maxPages rather than walking forever', async () => {
    let calls = 0;
    const result = await collectRetroPages(3, 9, 5, async () => {
      calls++;
      return page(9, []);
    });

    expect(result).toEqual([]);
    expect(calls).toBe(5);
  });

  it('dedupes a project appearing on two pages', async () => {
    const result = await collectRetroPages(3, 2, 5, async (from) =>
      from === 0 ? page(2, ['dup']) : page(2, ['dup', 'fresh']),
    );

    expect(result.map((r) => r.id)).toEqual(['dup', 'fresh']);
  });

  it('returns empty for non-positive limit, pageSize, or maxPages without loading', async () => {
    let calls = 0;
    const loader = async () => {
      calls++;
      return page(9, ['a']);
    };

    expect(await collectRetroPages(0, 9, 5, loader)).toEqual([]);
    expect(await collectRetroPages(3, 0, 5, loader)).toEqual([]);
    expect(await collectRetroPages(3, 9, 0, loader)).toEqual([]);
    expect(calls).toBe(0);
  });
});

/**
 * D22 — a re-screen never auto-downgrades `flagged`. Screens upsert-overwrite
 * (D5), and the cheapest way to trigger a re-screen is to REPORT the project
 * you want de-flagged, so without this the safety net could be cleared by the
 * very mechanism meant to raise it.
 */
describe('resolveScreenWrite — flagged is sticky until a human acts', () => {
  const stamp = (verdict: 'ok' | 'review' | 'flagged', reason: string | null = 'fresh reason') => ({
    verdict,
    reason,
    model: 'gemini-3.5-flash-lite',
    created_at: '2026-07-29T00:00:00.000Z',
  });

  it('keeps flagged when a re-screen comes back ok', () => {
    const out = resolveScreenWrite('flagged', stamp('ok'), 'malware in the install script');
    expect(out.verdict).toBe('flagged');
  });

  it('keeps flagged when a re-screen comes back review', () => {
    expect(resolveScreenWrite('flagged', stamp('review'), 'spam').verdict).toBe('flagged');
  });

  it('preserves the ORIGINAL reason — it is what a human still has to act on', () => {
    const out = resolveScreenWrite(
      'flagged',
      stamp('ok', 'looks fine now'),
      'malware in postinstall',
    );
    expect(out.reason).toBe('malware in postinstall');
  });

  it('still advances model + created_at, so the same open report stops re-queueing it', () => {
    const out = resolveScreenWrite('flagged', stamp('ok'), 'spam');
    expect(out.created_at).toBe('2026-07-29T00:00:00.000Z');
    expect(out.model).toBe('gemini-3.5-flash-lite');
  });

  it('ESCALATION is untouched: ok -> flagged writes through', () => {
    const out = resolveScreenWrite('ok', stamp('flagged', 'crypto miner'), 'was fine');
    expect(out.verdict).toBe('flagged');
    expect(out.reason).toBe('crypto miner');
  });

  it('review -> ok writes through (only flagged is sticky)', () => {
    expect(resolveScreenWrite('review', stamp('ok', 'fine')).verdict).toBe('ok');
  });

  it('a never-screened project takes the fresh stamp verbatim', () => {
    const s = stamp('review', 'purpose unclear');
    expect(resolveScreenWrite(null, s)).toEqual(s);
  });

  it('flagged -> flagged takes the NEW reason (a genuine re-assessment)', () => {
    const out = resolveScreenWrite('flagged', stamp('flagged', 'now also phishing'), 'was spam');
    expect(out.reason).toBe('now also phishing');
  });
});

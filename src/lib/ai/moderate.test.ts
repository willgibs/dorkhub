import { describe, expect, it } from 'vitest';
import { buildScreenPrompt, htmlToText, parseScreenResult } from './moderate';

const INPUT = {
  repo_full_name: 'octocat/my-repo',
  name: 'my-repo',
  tagline: 'a thing that does stuff',
  description: 'a longer description of the thing',
  topics: ['cli', 'tools'],
  tags: ['cli-tool'],
  primary_language: 'TypeScript',
  stars_count: 42,
};

describe('buildScreenPrompt', () => {
  it('returns a system + user message pair', () => {
    const messages = buildScreenPrompt(INPUT, null);

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
  });

  it('the system message demands STRICT JSON', () => {
    const [system] = buildScreenPrompt(INPUT, null);

    expect(system.content).toContain('STRICT JSON');
  });

  it('the user message includes repo identity, language, and stars', () => {
    const [, user] = buildScreenPrompt(INPUT, null);

    expect(user.content).toContain('octocat/my-repo');
    expect(user.content).toContain('TypeScript');
    expect(user.content).toContain('42');
  });

  it('omits a readme section when readmeText is null', () => {
    const [, user] = buildScreenPrompt(INPUT, null);

    expect(user.content).not.toContain('readme:');
  });

  it('includes the readme text when provided', () => {
    const [, user] = buildScreenPrompt(INPUT, '# My Repo\n\nDoes cool stuff.');

    expect(user.content).toContain('readme:');
    expect(user.content).toContain('Does cool stuff.');
  });

  it('clips the readme to 4000 chars', () => {
    const longReadme = 'a'.repeat(5000);

    const [, user] = buildScreenPrompt(INPUT, longReadme);

    expect(user.content).toContain('a'.repeat(4000));
    expect(user.content).not.toContain('a'.repeat(4001));
  });

  it('shows "none" for missing tagline/description/topics/tags rather than an empty string', () => {
    const [, user] = buildScreenPrompt(
      { ...INPUT, tagline: null, description: null, topics: [], tags: [] },
      null,
    );

    expect(user.content).toContain('existing tagline: none');
    expect(user.content).toContain('existing description: none');
    expect(user.content).toContain('existing topics: none');
    expect(user.content).toContain('existing tags: none');
  });
});

describe('htmlToText', () => {
  it('strips tags, leaving plain text', () => {
    expect(htmlToText('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('collapses whitespace and newlines to single spaces', () => {
    expect(htmlToText('<p>Hello\n\n  <strong>world</strong>\n</p>  <p>again</p>')).toBe(
      'Hello world again',
    );
  });

  it('returns an empty string for an empty string', () => {
    expect(htmlToText('')).toBe('');
  });
});

describe('parseScreenResult — happy paths', () => {
  it('round-trips a clean "ok" verdict', () => {
    const result = parseScreenResult('{"verdict": "ok", "reason": "looks fine"}');

    expect(result).toEqual({ verdict: 'ok', reason: 'looks fine' });
  });

  it('round-trips a clean "review" verdict', () => {
    const result = parseScreenResult('{"verdict": "review", "reason": "purpose unclear"}');

    expect(result).toEqual({ verdict: 'review', reason: 'purpose unclear' });
  });

  it('round-trips a clean "flagged" verdict', () => {
    const result = parseScreenResult('{"verdict": "flagged", "reason": "looks like spam"}');

    expect(result).toEqual({ verdict: 'flagged', reason: 'looks like spam' });
  });

  it('strips a ```json ... ``` fenced block', () => {
    const raw = '```json\n{"verdict": "ok", "reason": "fine"}\n```';

    const result = parseScreenResult(raw);

    expect(result).toEqual({ verdict: 'ok', reason: 'fine' });
  });

  it('strips a bare ``` ... ``` fenced block (no "json" language tag)', () => {
    const raw = '```\n{"verdict": "ok", "reason": "fine"}\n```';

    const result = parseScreenResult(raw);

    expect(result).toEqual({ verdict: 'ok', reason: 'fine' });
  });
});

describe('parseScreenResult — invalid payloads', () => {
  it('returns null for unparseable garbage', () => {
    expect(parseScreenResult('not json at all')).toBeNull();
  });

  it('returns null for a JSON array (not an object)', () => {
    expect(parseScreenResult('["ok", "fine"]')).toBeNull();
  });

  it('returns null for a JSON string primitive', () => {
    expect(parseScreenResult('"ok"')).toBeNull();
  });

  it('returns null when verdict is missing', () => {
    expect(parseScreenResult('{"reason": "no verdict here"}')).toBeNull();
  });

  it('returns null when verdict is an unknown string', () => {
    expect(parseScreenResult('{"verdict": "maybe", "reason": "unsure"}')).toBeNull();
  });

  it('returns null when verdict is a non-string', () => {
    expect(parseScreenResult('{"verdict": 42, "reason": "unsure"}')).toBeNull();
  });
});

describe('parseScreenResult — reason normalization', () => {
  it('is null when reason is omitted', () => {
    const result = parseScreenResult('{"verdict": "ok"}');

    expect(result).toEqual({ verdict: 'ok', reason: null });
  });

  it('is null when reason is an empty string', () => {
    const result = parseScreenResult('{"verdict": "ok", "reason": ""}');

    expect(result?.reason).toBeNull();
  });

  it('trims whitespace', () => {
    const result = parseScreenResult('{"verdict": "ok", "reason": "  fine  "}');

    expect(result?.reason).toBe('fine');
  });

  it('leaves a reason of exactly 240 chars untouched', () => {
    const reason = 'a'.repeat(240);

    const result = parseScreenResult(JSON.stringify({ verdict: 'flagged', reason }));

    expect(result?.reason).toBe(reason);
  });

  it('clips a reason over 240 chars to <=240 chars ending with an ellipsis', () => {
    const longReason = 'a'.repeat(241);

    const result = parseScreenResult(JSON.stringify({ verdict: 'flagged', reason: longReason }));

    expect(result?.reason?.length).toBeLessThanOrEqual(240);
    expect(result?.reason?.endsWith('…')).toBe(true);
  });
});

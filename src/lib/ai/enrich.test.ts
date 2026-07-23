import { describe, expect, it } from 'vitest';
import { buildEnrichmentPrompt, needsEnrichment, parseEnrichmentResult } from './enrich';

const CANDIDATE = {
  name: 'my-repo',
  owner_login: 'octocat',
  description: 'a thing that does stuff',
  primary_language: 'TypeScript',
  topics: ['cli', 'tools'],
};

describe('needsEnrichment', () => {
  it('is true when description is null', () => {
    expect(needsEnrichment({ description: null, topics: ['cli'] })).toBe(true);
  });

  it('is true when description is an empty string', () => {
    expect(needsEnrichment({ description: '', topics: ['cli'] })).toBe(true);
  });

  it('is true when description is whitespace-only', () => {
    expect(needsEnrichment({ description: '   ', topics: ['cli'] })).toBe(true);
  });

  it('is true when topics is empty, even with a real description', () => {
    expect(needsEnrichment({ description: 'a real description', topics: [] })).toBe(true);
  });

  it('is true when BOTH description and topics are missing', () => {
    expect(needsEnrichment({ description: null, topics: [] })).toBe(true);
  });

  it('is false when both a real description and at least one topic are present (OR, not AND)', () => {
    expect(needsEnrichment({ description: 'a real description', topics: ['cli'] })).toBe(false);
  });
});

describe('buildEnrichmentPrompt', () => {
  it('returns a system + user message pair', () => {
    const messages = buildEnrichmentPrompt(CANDIDATE, null);

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
  });

  it('the system message demands strict JSON with the tagline/tags shape', () => {
    const [system] = buildEnrichmentPrompt(CANDIDATE, null);

    expect(system.content).toContain('STRICT JSON');
    expect(system.content).toContain('"tagline"');
    expect(system.content).toContain('"tags"');
  });

  it('the user message includes repo identity, language, existing topics, and description', () => {
    const [, user] = buildEnrichmentPrompt(CANDIDATE, null);

    expect(user.content).toContain('octocat/my-repo');
    expect(user.content).toContain('TypeScript');
    expect(user.content).toContain('cli, tools');
    expect(user.content).toContain('a thing that does stuff');
  });

  it('omits a readme section when readmeText is null', () => {
    const [, user] = buildEnrichmentPrompt(CANDIDATE, null);

    expect(user.content).not.toContain('readme:');
  });

  it('includes the readme text when provided', () => {
    const [, user] = buildEnrichmentPrompt(CANDIDATE, '# My Repo\n\nDoes cool stuff.');

    expect(user.content).toContain('readme:');
    expect(user.content).toContain('Does cool stuff.');
  });

  it('clips the readme to 4000 chars', () => {
    const longReadme = 'a'.repeat(5000);

    const [, user] = buildEnrichmentPrompt(CANDIDATE, longReadme);

    expect(user.content).toContain('a'.repeat(4000));
    expect(user.content).not.toContain('a'.repeat(4001));
  });

  it('shows "none" for missing topics/description rather than an empty string', () => {
    const [, user] = buildEnrichmentPrompt({ ...CANDIDATE, description: null, topics: [] }, null);

    expect(user.content).toContain('existing topics: none');
    expect(user.content).toContain('existing description: none');
  });
});

describe('parseEnrichmentResult — happy paths', () => {
  it('parses clean JSON', () => {
    const result = parseEnrichmentResult('{"tagline": "a cli tool", "tags": ["cli", "tools"]}');

    expect(result).toEqual({ tagline: 'a cli tool', tags: ['cli', 'tools'] });
  });

  it('strips a ```json ... ``` fenced block', () => {
    const raw = '```json\n{"tagline": "a cli tool", "tags": ["cli"]}\n```';

    const result = parseEnrichmentResult(raw);

    expect(result).toEqual({ tagline: 'a cli tool', tags: ['cli'] });
  });

  it('strips a bare ``` ... ``` fenced block (no "json" language tag)', () => {
    const raw = '```\n{"tagline": "a cli tool", "tags": []}\n```';

    const result = parseEnrichmentResult(raw);

    expect(result).toEqual({ tagline: 'a cli tool', tags: [] });
  });
});

describe('parseEnrichmentResult — invalid payloads', () => {
  it('returns null for unparseable garbage', () => {
    expect(parseEnrichmentResult('not json at all')).toBeNull();
  });

  it('returns null for a JSON array (not an object)', () => {
    expect(parseEnrichmentResult('["tagline", "tags"]')).toBeNull();
  });

  it('returns null for a JSON primitive', () => {
    expect(parseEnrichmentResult('"just a string"')).toBeNull();
  });

  it('returns null when both tagline and tags are unusable', () => {
    const result = parseEnrichmentResult('{"tagline": 42, "tags": "not an array"}');

    expect(result).toBeNull();
  });

  it('keeps valid tags with a null tagline when the tagline is non-string', () => {
    const result = parseEnrichmentResult('{"tagline": 42, "tags": ["cli", "tools"]}');

    expect(result).toEqual({ tagline: null, tags: ['cli', 'tools'] });
  });

  it('keeps a valid tagline with empty tags when tags is non-array', () => {
    const result = parseEnrichmentResult('{"tagline": "a cli tool", "tags": "not an array"}');

    expect(result).toEqual({ tagline: 'a cli tool', tags: [] });
  });
});

describe('parseEnrichmentResult — tagline normalization', () => {
  it('trims whitespace', () => {
    const result = parseEnrichmentResult('{"tagline": "  a cli tool  ", "tags": []}');

    expect(result?.tagline).toBe('a cli tool');
  });

  it('normalizes an empty/whitespace-only tagline to null (tags still keep the payload usable)', () => {
    const result = parseEnrichmentResult('{"tagline": "   ", "tags": ["cli"]}');

    expect(result?.tagline).toBeNull();
  });

  it('clips a tagline over 120 chars to 119 chars + an ellipsis', () => {
    const longTagline = 'a'.repeat(150);

    const result = parseEnrichmentResult(JSON.stringify({ tagline: longTagline, tags: ['cli'] }));

    expect(result?.tagline).toBe(`${'a'.repeat(119)}…`);
    expect(result?.tagline?.length).toBeLessThanOrEqual(120);
  });

  it('leaves a tagline of exactly 120 chars untouched', () => {
    const tagline = 'a'.repeat(120);

    const result = parseEnrichmentResult(JSON.stringify({ tagline, tags: ['cli'] }));

    expect(result?.tagline).toBe(tagline);
  });
});

describe('parseEnrichmentResult — tags normalization', () => {
  it('runs tags through parseTagsInput normalization (lowercase, kebab-case)', () => {
    const result = parseEnrichmentResult('{"tagline": "x", "tags": ["Web Dev", "CLI Tool"]}');

    expect(result?.tags).toEqual(['web-dev', 'cli-tool']);
  });

  it('dedupes tags case-insensitively', () => {
    const result = parseEnrichmentResult('{"tagline": "x", "tags": ["cli", "CLI", "cli"]}');

    expect(result?.tags).toEqual(['cli']);
  });

  it('drops non-string entries from the tags array', () => {
    const result = parseEnrichmentResult('{"tagline": "x", "tags": ["cli", 42, null, "tools"]}');

    expect(result?.tags).toEqual(['cli', 'tools']);
  });

  it('caps tags at 6 even when the model returns more', () => {
    const tags = Array.from({ length: 10 }, (_, i) => `tag${i}`);

    const result = parseEnrichmentResult(JSON.stringify({ tagline: 'x', tags }));

    expect(result?.tags).toHaveLength(6);
    expect(result?.tags).toEqual(['tag0', 'tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
  });

  it('returns [] tags when the tags array is empty', () => {
    const result = parseEnrichmentResult('{"tagline": "x", "tags": []}');

    expect(result?.tags).toEqual([]);
  });
});

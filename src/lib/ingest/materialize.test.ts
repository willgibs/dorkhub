import { describe, expect, it } from 'vitest';
import { type DeriveContentCandidate, deriveContent, descriptionToTagline } from './materialize';

/**
 * IO paths (`materializeCandidate` itself) are NOT unit-tested here — no
 * fake PostgREST client exists in this codebase; live E2E covers the write
 * paths (docs/plans/p2.5-self-running.md Wave 3). Only the two PURE helpers
 * factored out of it — `descriptionToTagline` and `deriveContent` — get a
 * matrix here, same convention as src/lib/ingest/decide.test.ts.
 */

describe('descriptionToTagline', () => {
  it('returns null for a null description', () => {
    expect(descriptionToTagline(null)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(descriptionToTagline('')).toBeNull();
  });

  it('returns null for a whitespace-only description', () => {
    expect(descriptionToTagline('   ')).toBeNull();
  });

  it('trims a real description', () => {
    expect(descriptionToTagline('  a thing that does stuff  ')).toBe('a thing that does stuff');
  });

  it('passes a description under 120 chars through unchanged', () => {
    const desc = 'a'.repeat(120);
    expect(descriptionToTagline(desc)).toBe(desc);
  });

  it('clips a description over 120 chars to 119 chars + an ellipsis', () => {
    const desc = 'a'.repeat(150);
    const result = descriptionToTagline(desc);
    expect(result).toHaveLength(120);
    expect(result).toBe(`${'a'.repeat(119)}…`);
  });

  it('trims trailing whitespace introduced by the 119-char clip before appending the ellipsis', () => {
    const desc = `${'a'.repeat(115)}     ${'b'.repeat(30)}`; // clip lands mid-whitespace
    const result = descriptionToTagline(desc);
    expect(result?.endsWith(' …')).toBe(false);
  });
});

describe('deriveContent — precedence matrix', () => {
  const noAi: DeriveContentCandidate = { ai_tagline: null, ai_tags: [] };
  const withAi: DeriveContentCandidate = {
    ai_tagline: 'an ai-guessed tagline',
    ai_tags: ['ai-tag-one', 'ai-tag-two'],
  };

  it('both GitHub and AI empty → {tagline: null, tags: []}', () => {
    expect(deriveContent({ description: null, topics: [] }, noAi)).toEqual({
      tagline: null,
      tags: [],
    });
  });

  it('real GitHub description beats ai_tagline', () => {
    const result = deriveContent({ description: 'the real description', topics: [] }, withAi);
    expect(result.tagline).toBe('the real description');
  });

  it('real GitHub topics beat ai_tags', () => {
    const result = deriveContent({ description: null, topics: ['gh-topic-one'] }, withAi);
    expect(result.tags).toEqual(['gh-topic-one']);
  });

  it('ai_tagline is used as a fallback when GitHub description is empty', () => {
    const result = deriveContent({ description: null, topics: [] }, withAi);
    expect(result.tagline).toBe('an ai-guessed tagline');
  });

  it('ai_tags are used as a fallback (normalized via parseTagsInput) when GitHub topics are empty', () => {
    const result = deriveContent({ description: null, topics: [] }, withAi);
    expect(result.tags).toEqual(['ai-tag-one', 'ai-tag-two']);
  });

  it('whitespace-only GitHub description falls through to ai_tagline (descriptionToTagline normalizes to null)', () => {
    const result = deriveContent({ description: '   ', topics: [] }, withAi);
    expect(result.tagline).toBe('an ai-guessed tagline');
  });

  it('GitHub description present but topics empty → tagline from GitHub, tags from AI (independent precedence)', () => {
    const result = deriveContent({ description: 'real desc', topics: [] }, withAi);
    expect(result).toEqual({ tagline: 'real desc', tags: ['ai-tag-one', 'ai-tag-two'] });
  });

  it('no ai fallback available and GitHub empty → nulls, not AI garbage', () => {
    expect(deriveContent({ description: null, topics: [] }, noAi)).toEqual({
      tagline: null,
      tags: [],
    });
  });
});

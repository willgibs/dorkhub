import { describe, expect, it } from 'vitest';
import { isValidDemoUrl, parseTagsInput } from './fields';

describe('parseTagsInput — basic parsing', () => {
  it('splits on commas, trims, and lowercases', () => {
    expect(parseTagsInput('Audio, TOY,  synth ')).toEqual(['audio', 'toy', 'synth']);
  });

  it('slugify-lites each tag using the same char rules as project slugs', () => {
    expect(parseTagsInput('web dev, C++, .NET')).toEqual(['web-dev', 'c', 'net']);
  });

  it('returns [] for empty input', () => {
    expect(parseTagsInput('')).toEqual([]);
  });

  it('returns [] for whitespace-only input', () => {
    expect(parseTagsInput('   ')).toEqual([]);
  });

  it('drops empty pieces from stray/doubled commas', () => {
    expect(parseTagsInput('audio,,toy,  ,synth')).toEqual(['audio', 'toy', 'synth']);
  });

  it('drops tags that normalize to nothing (e.g. all punctuation)', () => {
    expect(parseTagsInput('audio, !!!, toy')).toEqual(['audio', 'toy']);
  });
});

describe('parseTagsInput — dedupe', () => {
  it('dedupes case-insensitively, preserving first-seen order', () => {
    expect(parseTagsInput('Audio, audio, AUDIO, toy')).toEqual(['audio', 'toy']);
  });

  it('dedupes after normalization even when raw spelling differs', () => {
    expect(parseTagsInput('web dev, web-dev, web  dev')).toEqual(['web-dev']);
  });
});

describe('parseTagsInput — caps', () => {
  it('caps at 8 tags, dropping the rest', () => {
    const raw = Array.from({ length: 12 }, (_, i) => `tag${i}`).join(',');
    const result = parseTagsInput(raw);
    expect(result).toHaveLength(8);
    expect(result).toEqual(['tag0', 'tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7']);
  });

  it('caps each tag at 30 chars', () => {
    const longTag = 'a'.repeat(50);
    const [result] = parseTagsInput(longTag);
    expect(result).toHaveLength(30);
  });

  it('strips a trailing hyphen exposed by the 30-char cap', () => {
    // 29 letters + '-' + more letters: capping at 30 lands exactly on the hyphen.
    const raw = `${'a'.repeat(29)}-${'b'.repeat(10)}`;
    const [result] = parseTagsInput(raw);
    expect(result).toBe('a'.repeat(29));
    expect(result?.endsWith('-')).toBe(false);
  });
});

describe('isValidDemoUrl', () => {
  it('accepts a plain https URL', () => {
    expect(isValidDemoUrl('https://example.com')).toBe(true);
  });

  it('accepts an https URL with path/query', () => {
    expect(isValidDemoUrl('https://example.com/demo?ref=dorkhub')).toBe(true);
  });

  it('rejects http (not https)', () => {
    expect(isValidDemoUrl('http://example.com')).toBe(false);
  });

  it('rejects javascript: scheme', () => {
    expect(isValidDemoUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data: scheme', () => {
    expect(isValidDemoUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects an unparseable string', () => {
    expect(isValidDemoUrl('not a url at all')).toBe(false);
  });

  it('rejects an empty string (callers treat empty as "clear the field")', () => {
    expect(isValidDemoUrl('')).toBe(false);
  });

  it('rejects a protocol-relative string with no scheme', () => {
    expect(isValidDemoUrl('//example.com')).toBe(false);
  });

  it('rejects file: scheme', () => {
    expect(isValidDemoUrl('file:///etc/passwd')).toBe(false);
  });
});

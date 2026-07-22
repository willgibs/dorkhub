import { describe, expect, it } from 'vitest';
import { RESERVED_USERNAMES, validateUsername } from './usernames';

describe('validateUsername — valid cases', () => {
  it('accepts the 2-char minimum', () => {
    expect(validateUsername('ab')).toEqual({ ok: true, value: 'ab' });
  });

  it('accepts the 39-char maximum', () => {
    const value = 'a'.repeat(39);
    expect(validateUsername(value)).toEqual({ ok: true, value });
  });

  it('accepts interior hyphens', () => {
    expect(validateUsername('foo-bar-baz')).toEqual({ ok: true, value: 'foo-bar-baz' });
  });

  it('trims surrounding whitespace before validating', () => {
    expect(validateUsername('  mollybuilds  ')).toEqual({ ok: true, value: 'mollybuilds' });
  });
});

describe('validateUsername — rejects', () => {
  it('rejects fewer than 2 characters', () => {
    const result = validateUsername('a');
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe('needs at least 2 characters');
  });

  it('rejects more than 39 characters', () => {
    const result = validateUsername('a'.repeat(40));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe('maximum 39 characters');
  });

  it('rejects a leading hyphen', () => {
    expect(validateUsername('-abc').ok).toBe(false);
  });

  it('rejects a trailing hyphen', () => {
    expect(validateUsername('abc-').ok).toBe(false);
  });

  it('rejects a double interior hyphen', () => {
    expect(validateUsername('ab--cd').ok).toBe(false);
  });

  it('rejects spaces', () => {
    expect(validateUsername('ab cd').ok).toBe(false);
  });

  it('rejects unicode characters', () => {
    expect(validateUsername('usérname').ok).toBe(false);
    expect(validateUsername('日本語').ok).toBe(false);
  });

  it('rejects underscores', () => {
    expect(validateUsername('user_name').ok).toBe(false);
  });
});

describe('validateUsername — RESERVED_USERNAMES coverage', () => {
  for (const name of RESERVED_USERNAMES) {
    it(`rejects reserved name "${name}"`, () => {
      // Always rejected — but the reason differs for "u": at 1 char it's
      // shorter than the pattern's own 2-char minimum, so the length check
      // (which runs before the reserved-set check) reports first.
      const result = validateUsername(name);
      expect(result.ok).toBe(false);
      if (name.length >= 2) {
        expect(!result.ok && result.reason).toBe('that name is reserved');
      }
    });
  }

  it('is case-insensitive ("Admin")', () => {
    const result = validateUsername('Admin');
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe('that name is reserved');
  });

  it('is case-insensitive ("DORKHUB")', () => {
    const result = validateUsername('DORKHUB');
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe('that name is reserved');
  });
});

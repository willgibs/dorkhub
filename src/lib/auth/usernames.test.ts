import { describe, expect, it } from 'vitest';
import { RESERVED_USERNAMES, validateUsername } from './usernames';

describe('validateUsername — valid cases', () => {
  it('accepts a single character (github.com/f is real)', () => {
    expect(validateUsername('f')).toEqual({ ok: true, value: 'f' });
  });

  it('accepts a single digit', () => {
    expect(validateUsername('0')).toEqual({ ok: true, value: '0' });
  });

  it('accepts the 39-char maximum', () => {
    const value = 'a'.repeat(39);
    expect(validateUsername(value)).toEqual({ ok: true, value });
  });

  it('accepts interior hyphens', () => {
    expect(validateUsername('foo-bar-baz')).toEqual({ ok: true, value: 'foo-bar-baz' });
  });

  it('accepts a trailing hyphen (legacy GitHub: LingDong-)', () => {
    expect(validateUsername('LingDong-')).toEqual({ ok: true, value: 'LingDong-' });
  });

  it('accepts consecutive hyphens (legacy GitHub: Rob--W)', () => {
    expect(validateUsername('Rob--W')).toEqual({ ok: true, value: 'Rob--W' });
  });

  it('accepts short trailing-hyphen names (legacy GitHub: ah-)', () => {
    expect(validateUsername('ah-')).toEqual({ ok: true, value: 'ah-' });
  });

  it('trims surrounding whitespace before validating', () => {
    expect(validateUsername('  mollybuilds  ')).toEqual({ ok: true, value: 'mollybuilds' });
  });
});

describe('validateUsername — rejects', () => {
  it('rejects the empty string', () => {
    const result = validateUsername('');
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe('needs at least 1 character');
  });

  it('rejects whitespace-only input', () => {
    expect(validateUsername('   ').ok).toBe(false);
  });

  it('rejects more than 39 characters', () => {
    const result = validateUsername('a'.repeat(40));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe('maximum 39 characters');
  });

  it('rejects a leading hyphen', () => {
    expect(validateUsername('-abc').ok).toBe(false);
  });

  it('rejects a bare hyphen', () => {
    expect(validateUsername('-').ok).toBe(false);
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
      // Every reserved name passes the format pattern (including 1-char "u"
      // now that single-char names are legal), so all of them report the
      // reserved reason — the format checks never fire first anymore.
      const result = validateUsername(name);
      expect(result.ok).toBe(false);
      expect(!result.ok && result.reason).toBe('that name is reserved');
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

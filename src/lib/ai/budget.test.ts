import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AI_DAILY_MAX_DEFAULT, aiDailyMax, interpretClaim } from './budget';

const ORIGINAL = process.env.AI_DAILY_MAX;

beforeEach(() => {
  delete process.env.AI_DAILY_MAX;
});

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.AI_DAILY_MAX;
  else process.env.AI_DAILY_MAX = ORIGINAL;
});

describe('aiDailyMax — env parsing', () => {
  it('defaults when unset', () => {
    expect(aiDailyMax()).toBe(AI_DAILY_MAX_DEFAULT);
  });

  it('parses a valid ceiling', () => {
    process.env.AI_DAILY_MAX = '250';
    expect(aiDailyMax()).toBe(250);
  });

  it('respects 0 as a real kill-switch, never treating it as missing', () => {
    // The fail-closed verification mode: AI_DAILY_MAX=0 must refuse every
    // claim. Defaulting here would make the kill-switch silently a no-op.
    process.env.AI_DAILY_MAX = '0';
    expect(aiDailyMax()).toBe(0);
  });

  it('degrades junk to the conservative default, never to unlimited or off', () => {
    for (const junk of ['abc', '-5', '1.5', '', '  ', '1e3junk', 'Infinity', 'NaN']) {
      process.env.AI_DAILY_MAX = junk;
      expect(aiDailyMax(), `AI_DAILY_MAX=${JSON.stringify(junk)}`).toBe(AI_DAILY_MAX_DEFAULT);
    }
  });
});

describe('interpretClaim — the fail-closed contract', () => {
  it('claims only on a literal true', () => {
    expect(interpretClaim(true, null, 800)).toEqual({ ok: true });
  });

  it('refuses on false with the ceiling named in the reason', () => {
    const claim = interpretClaim(false, null, 42);
    expect(claim.ok).toBe(false);
    if (!claim.ok) expect(claim.reason).toContain('AI_DAILY_MAX=42');
  });

  it('fails CLOSED when the ledger errors — a guard that cannot answer says no', () => {
    const claim = interpretClaim(null, { message: 'connection refused' }, 800);
    expect(claim.ok).toBe(false);
    if (!claim.ok) expect(claim.reason).toContain('connection refused');
  });

  it('treats any non-true payload as a refusal, not a pass', () => {
    // A malformed/absent RPC payload must never read as "budget available".
    for (const weird of [null, undefined, 1, 'true', {}, []]) {
      expect(interpretClaim(weird, null, 800).ok, `payload=${JSON.stringify(weird)}`).toBe(false);
    }
  });
});

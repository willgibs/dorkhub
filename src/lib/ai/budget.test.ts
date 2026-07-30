import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  AI_DAILY_MAX_DEFAULT,
  AI_TOTAL_MAX_DEFAULT,
  aiDailyMax,
  aiTotalMax,
  describeRefusal,
  interpretClaim,
} from './budget';

const ORIGINAL_DAILY = process.env.AI_DAILY_MAX;
const ORIGINAL_TOTAL = process.env.AI_TOTAL_MAX;

beforeEach(() => {
  delete process.env.AI_DAILY_MAX;
  delete process.env.AI_TOTAL_MAX;
});

afterEach(() => {
  if (ORIGINAL_DAILY === undefined) delete process.env.AI_DAILY_MAX;
  else process.env.AI_DAILY_MAX = ORIGINAL_DAILY;
  if (ORIGINAL_TOTAL === undefined) delete process.env.AI_TOTAL_MAX;
  else process.env.AI_TOTAL_MAX = ORIGINAL_TOTAL;
});

describe('aiDailyMax / aiTotalMax — env parsing (shared contract)', () => {
  it('default when unset', () => {
    expect(aiDailyMax()).toBe(AI_DAILY_MAX_DEFAULT);
    expect(aiTotalMax()).toBe(AI_TOTAL_MAX_DEFAULT);
  });

  it('parses valid ceilings', () => {
    process.env.AI_DAILY_MAX = '250';
    process.env.AI_TOTAL_MAX = '10000';
    expect(aiDailyMax()).toBe(250);
    expect(aiTotalMax()).toBe(10000);
  });

  it('respects 0 as a real kill-switch on BOTH ceilings, never treating it as missing', () => {
    // The fail-closed verification mode: a zero ceiling must refuse every
    // claim. Defaulting here would make the kill-switch silently a no-op.
    process.env.AI_DAILY_MAX = '0';
    process.env.AI_TOTAL_MAX = '0';
    expect(aiDailyMax()).toBe(0);
    expect(aiTotalMax()).toBe(0);
  });

  it('degrades junk to the conservative default, never to unlimited or off', () => {
    for (const junk of ['abc', '-5', '1.5', '', '  ', '1e3junk', 'Infinity', 'NaN']) {
      process.env.AI_DAILY_MAX = junk;
      process.env.AI_TOTAL_MAX = junk;
      expect(aiDailyMax(), `AI_DAILY_MAX=${JSON.stringify(junk)}`).toBe(AI_DAILY_MAX_DEFAULT);
      expect(aiTotalMax(), `AI_TOTAL_MAX=${JSON.stringify(junk)}`).toBe(AI_TOTAL_MAX_DEFAULT);
    }
  });
});

describe('interpretClaim — the fail-closed contract', () => {
  it('claims only on a literal true', () => {
    expect(interpretClaim(true, null, 800, 5000)).toEqual({ ok: true });
  });

  it('refuses on false with both ceilings named in the generic reason', () => {
    const claim = interpretClaim(false, null, 42, 900);
    expect(claim.ok).toBe(false);
    if (!claim.ok) {
      expect(claim.reason).toContain('AI_DAILY_MAX=42');
      expect(claim.reason).toContain('AI_TOTAL_MAX=900');
    }
  });

  it('fails CLOSED when the ledger errors — a guard that cannot answer says no', () => {
    const claim = interpretClaim(null, { message: 'connection refused' }, 800, 5000);
    expect(claim.ok).toBe(false);
    if (!claim.ok) expect(claim.reason).toContain('connection refused');
  });

  it('treats any non-true payload as a refusal, not a pass', () => {
    // A malformed/absent RPC payload must never read as "budget available".
    for (const weird of [null, undefined, 1, 'true', {}, []]) {
      expect(interpretClaim(weird, null, 800, 5000).ok, `payload=${JSON.stringify(weird)}`).toBe(
        false,
      );
    }
  });
});

describe('describeRefusal — the refusal names the tripped ceiling', () => {
  it('lifetime cap wins the message when reached (the "raise AI_TOTAL_MAX" case)', () => {
    const reason = describeRefusal(3, 5000, 800, 5000);
    expect(reason).toContain('lifetime');
    expect(reason).toContain('AI_TOTAL_MAX');
  });

  it('daily cap names the UTC reset when only the daily ceiling tripped', () => {
    const reason = describeRefusal(800, 900, 800, 5000);
    expect(reason).toContain('daily');
    expect(reason).toContain('UTC midnight');
  });

  it('falls back to a numbers-visible generic when neither reads as at-cap', () => {
    // Possible when a ceiling was lowered between the claim and the
    // follow-up read — still a refusal, still shows the state.
    const reason = describeRefusal(3, 10, 800, 5000);
    expect(reason).toContain('3/800');
    expect(reason).toContain('10/5000');
  });
});

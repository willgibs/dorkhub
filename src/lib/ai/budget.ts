import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

/**
 * The AI spend ceiling (P3-C wave C0, decision D33 — docs/plans/p3c-scale.md).
 *
 * Every `chatCompletion` caller claims a slot from the shared `ai_usage`
 * ledger FIRST, via the atomic `claim_ai_call` DB function — a database row,
 * not an in-process counter, because serverless instances don't share memory
 * and an in-process cap enforces nothing across concurrent pipeline runs,
 * the admin enrich drain, and inline materialize-time enrichment.
 *
 * FAIL CLOSED, in both directions: no slot → no call, and a ledger that
 * can't be reached (DB error) → no call either. The same discipline as
 * P2.7's fail-closed counts — when the guard can't answer, the answer is no.
 */

/**
 * Default daily ceiling when `AI_DAILY_MAX` is unset: the scheduled pipeline
 * spends 8 calls/run × 96 runs = 768/day, so 800 leaves the admin drain a
 * sliver while staying under Google AI Studio's genuinely-free ~1k/day tier.
 * Paying for throughput = raising `AI_DAILY_MAX` in Vercel env, no deploy.
 *
 * DOLLAR MAPPING (P3-D board directive: "~$5 max or $1 daily"). Both prompt
 * builders clip README input to 4,000 chars, so worst case is ~1,500 tokens
 * in + ≤300 out per call — ≤ $0.0006/call at flash-lite-class pricing with
 * a 2× margin (≤$0.20/M in, ≤$0.80/M out). Therefore:
 *   · daily 800   → ≤ $0.48/day  (under the $1 target)
 *   · total 5,000 → ≤ $3 lifetime (under the $5 target)
 * The current GEMINI_API_KEY free tier bills $0 regardless — these caps are
 * the insurance that is already armed the day a paid key appears. Re-run
 * this math if the model, pricing, or clip constants change.
 */
export const AI_DAILY_MAX_DEFAULT = 800;

/** Lifetime ceiling default — the "~$5 max" half of the directive (see the dollar mapping above). */
export const AI_TOTAL_MAX_DEFAULT = 5000;

/**
 * Shared env-ceiling parse contract: `0` is respected as a real kill-switch
 * (every claim refuses), NOT treated as missing. Junk (non-integer,
 * negative, empty) falls back to the default: a typo'd env var must degrade
 * to "conservative ceiling", never to "unlimited" and never to "off".
 */
function parseCeiling(raw: string | undefined, fallback: number): number {
  const trimmed = raw?.trim();
  if (!trimmed) return fallback;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function aiDailyMax(): number {
  return parseCeiling(process.env.AI_DAILY_MAX, AI_DAILY_MAX_DEFAULT);
}

export function aiTotalMax(): number {
  return parseCeiling(process.env.AI_TOTAL_MAX, AI_TOTAL_MAX_DEFAULT);
}

export type AiClaim = { ok: true } | { ok: false; reason: string };

/**
 * Pure interpretation of a `claim_ai_call` RPC response — split out so the
 * fail-closed contract is unit-testable without a Supabase fake (which the
 * house test conventions rule out). Anything other than a literal `true`
 * from the ledger is a refusal: `false` means a ceiling is reached, and
 * an error or malformed payload means the guard couldn't answer — closed.
 */
export function interpretClaim(
  data: unknown,
  error: { message: string } | null,
  max: number,
  totalMax: number,
): AiClaim {
  if (error) {
    return { ok: false, reason: `AI budget ledger unreachable — failing closed: ${error.message}` };
  }
  if (data !== true) {
    return {
      ok: false,
      reason: `AI budget exhausted (AI_DAILY_MAX=${max}, AI_TOTAL_MAX=${totalMax})`,
    };
  }
  return { ok: true };
}

/**
 * Pure: names WHICH ceiling refused, given the ledger's current numbers —
 * used only on the (rare) refusal path so the stopReason an admin reads
 * says "raise AI_TOTAL_MAX" vs "wait for the UTC day", not just "no".
 */
export function describeRefusal(
  todayCalls: number,
  totalCalls: number,
  max: number,
  totalMax: number,
): string {
  if (totalCalls >= totalMax) {
    return `lifetime AI budget exhausted (${totalCalls}/${totalMax} calls — raise AI_TOTAL_MAX to continue)`;
  }
  if (todayCalls >= max) {
    return `daily AI budget exhausted (${todayCalls}/${max} calls today — resets at UTC midnight, or raise AI_DAILY_MAX)`;
  }
  return `AI budget refused (today ${todayCalls}/${max}, lifetime ${totalCalls}/${totalMax})`;
}

/**
 * Claims one AI-call slot for today (UTC) against BOTH ceilings. Callers
 * make the model call ONLY on `{ ok: true }`; a refusal carries a
 * human-readable reason that the batch engines surface as
 * `stopKind: 'budget'` / `stopReason`. On a refusal, one extra ledger read
 * (tiny table, one row per day) names the tripped ceiling; if that read
 * fails, the generic both-ceilings reason stands.
 */
export async function claimAiCall(service: SupabaseClient<Database>): Promise<AiClaim> {
  const max = aiDailyMax();
  const totalMax = aiTotalMax();
  const { data, error } = await service.rpc('claim_ai_call', {
    p_max: max,
    p_total_max: totalMax,
  });
  const claim = interpretClaim(data, error, max, totalMax);
  if (claim.ok || error) return claim;

  const { data: usageRows, error: usageError } = await service
    .from('ai_usage')
    .select('day, calls');
  if (usageError || !usageRows) return claim;
  const todayUtc = new Date().toISOString().slice(0, 10);
  const todayCalls = usageRows.find((row) => row.day === todayUtc)?.calls ?? 0;
  const totalCalls = usageRows.reduce((sum, row) => sum + row.calls, 0);
  return { ok: false, reason: describeRefusal(todayCalls, totalCalls, max, totalMax) };
}

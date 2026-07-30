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
 */
export const AI_DAILY_MAX_DEFAULT = 800;

/**
 * Reads the ceiling from env. `0` is respected as a real kill-switch (the
 * fail-closed verification mode — every claim refuses), NOT treated as
 * missing. Junk (non-integer, negative, empty) falls back to the default:
 * a typo'd env var must degrade to "conservative ceiling", never to
 * "unlimited" and never to "immune system off".
 */
export function aiDailyMax(): number {
  const raw = process.env.AI_DAILY_MAX?.trim();
  if (!raw) return AI_DAILY_MAX_DEFAULT;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) return AI_DAILY_MAX_DEFAULT;
  return parsed;
}

export type AiClaim = { ok: true } | { ok: false; reason: string };

/**
 * Pure interpretation of a `claim_ai_call` RPC response — split out so the
 * fail-closed contract is unit-testable without a Supabase fake (which the
 * house test conventions rule out). Anything other than a literal `true`
 * from the ledger is a refusal: `false` means the ceiling is reached, and
 * an error or malformed payload means the guard couldn't answer — closed.
 */
export function interpretClaim(
  data: unknown,
  error: { message: string } | null,
  max: number,
): AiClaim {
  if (error) {
    return { ok: false, reason: `AI budget ledger unreachable — failing closed: ${error.message}` };
  }
  if (data !== true) {
    return { ok: false, reason: `daily AI budget exhausted (AI_DAILY_MAX=${max})` };
  }
  return { ok: true };
}

/**
 * Claims one AI-call slot for today (UTC). Callers make the model call ONLY
 * on `{ ok: true }`; a refusal carries a human-readable reason that the
 * batch engines surface as `stopKind: 'budget'` / `stopReason`.
 */
export async function claimAiCall(service: SupabaseClient<Database>): Promise<AiClaim> {
  const max = aiDailyMax();
  const { data, error } = await service.rpc('claim_ai_call', { p_max: max });
  return interpretClaim(data, error, max);
}

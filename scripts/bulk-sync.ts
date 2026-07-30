/**
 * Headless README/metadata backfill (P4 content ramp) — drives the SAME
 * syncProject the cron uses over every never-synced project, minus the
 * 50-second serverless window. This is the core-budget consumer (~1-2
 * GitHub requests per repo), so concurrency stays modest and a run of
 * rate_limited outcomes backs off for the rolling window to refill.
 * last_synced_at only stamps on ok/304/404 (M4 rule), so the null-set
 * selection naturally advances and rate-limited rows retry.
 *
 *   set -a && source .env.local && set +a
 *   NODE_OPTIONS='--conditions react-server' pnpm dlx tsx --tsconfig tsconfig.json \
 *     scripts/bulk-sync.ts [--max 100000] [--concurrency 3]
 */

import { syncProject } from '../src/lib/github/sync';
import { supabaseService } from '../src/lib/supabase/clients';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function argValue(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  const parsed = Number(process.argv[index + 1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function main() {
  const max = argValue('--max', 100_000);
  const concurrency = argValue('--concurrency', 3);
  const service = supabaseService();

  const tallies = new Map<string, number>();
  let processed = 0;
  let rateLimitedStreak = 0;

  while (processed < max) {
    const { data: batch, error } = await service
      .from('projects')
      .select('id')
      .is('last_synced_at', null)
      .order('created_at', { ascending: true })
      .limit(Math.min(200, max - processed));
    if (error) throw new Error(`project select failed: ${error.message}`);
    if (!batch || batch.length === 0) break;
    const rows = batch;

    let cursor = 0;
    async function worker() {
      while (true) {
        const index = cursor++;
        if (index >= rows.length) return;
        const row = rows[index];
        if (!row) return;
        const { status } = await syncProject(row.id);
        tallies.set(status, (tallies.get(status) ?? 0) + 1);
        if (status === 'rate_limited') {
          rateLimitedStreak += 1;
        } else {
          rateLimitedStreak = 0;
        }
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    processed += rows.length;

    const summary = [...tallies.entries()].map(([k, v]) => `${k}=${v}`).join(' ');
    console.log(`progress ${processed}: ${summary}`);

    if (rateLimitedStreak >= 5) {
      console.log('github rate limited — backing off 10min for the window to refill');
      await sleep(600_000);
      rateLimitedStreak = 0;
    }
  }

  const { count } = await service
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .is('last_synced_at', null);
  const summary = [...tallies.entries()].map(([k, v]) => `${k}=${v}`).join(' ');
  console.log(`DONE: ${summary} | never-synced remaining=${count ?? '?'}`);
}

main().catch((error) => {
  console.error('bulk-sync failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});

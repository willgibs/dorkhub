/**
 * Headless bulk materializer (P4 content thread) — drains pending
 * ingest_candidates through the SAME materializeCandidate the pipeline uses
 * (blocklist, sticky decisions, username rules, profile-race recovery all
 * live inside it), minus the 50-second serverless window that caps the cron
 * at 40/tick. This is the import-day tool; the cron remains the hands-off
 * steady state.
 *
 *   set -a && source .env.local && set +a
 *   NODE_OPTIONS='--conditions react-server' pnpm dlx tsx --tsconfig tsconfig.json \
 *     scripts/bulk-materialize.ts [--max 100000] [--concurrency 3]
 *
 * Pace notes: ~1 GitHub request per stale-snapshot candidate (the true
 * ceiling is the PAT's 5k/hr core budget); skipSync leaves READMEs to the
 * sync passes (fill-only, ETag-cheap). Concurrency stays modest on purpose —
 * same-owner candidates racing profile creation is a recovered-but-noisy
 * path (P2.5 proof), and GitHub likes polite clients.
 */

import { materializeCandidate } from '../src/lib/ingest/materialize';
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
  let unavailableStreak = 0;

  while (processed < max) {
    const { data: batch, error } = await service
      .from('ingest_candidates')
      .select('github_repo_id')
      .eq('status', 'pending')
      .order('demand_count', { ascending: false })
      .order('stars_count', { ascending: false })
      .limit(Math.min(200, max - processed));
    if (error) throw new Error(`candidate select failed: ${error.message}`);
    if (!batch || batch.length === 0) break;
    // Narrowed rebind: TS won't carry the null-guard into the hoisted worker.
    const rows = batch;

    let cursor = 0;
    async function worker() {
      while (true) {
        const index = cursor++;
        if (index >= rows.length) return;
        const id = rows[index];
        if (!id) return;
        const result = await materializeCandidate(id.github_repo_id, {
          decidedBy: null,
          inlineEnrich: false,
          trustFreshSnapshot: true,
          skipSync: true,
        });
        tallies.set(result.kind, (tallies.get(result.kind) ?? 0) + 1);
        if (result.kind === 'github_unavailable') {
          unavailableStreak += 1;
        } else {
          unavailableStreak = 0;
        }
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    processed += batch.length;

    const summary = [...tallies.entries()].map(([k, v]) => `${k}=${v}`).join(' ');
    console.log(`progress ${processed}: ${summary}`);

    // A run of github_unavailable results usually means the rate limit —
    // back off a minute rather than burning the queue into skip-tallies.
    if (unavailableStreak >= 10) {
      console.log('github repeatedly unavailable — backing off 60s');
      await sleep(60_000);
      unavailableStreak = 0;
    }
  }

  const { count } = await service
    .from('ingest_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  const summary = [...tallies.entries()].map(([k, v]) => `${k}=${v}`).join(' ');
  console.log(`DONE: ${summary} | pending remaining=${count ?? '?'}`);
}

main().catch((error) => {
  console.error('bulk-materialize failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});

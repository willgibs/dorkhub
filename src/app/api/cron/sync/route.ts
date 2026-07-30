import { NextResponse } from 'next/server';
import { syncProject } from '@/lib/github/sync';
import { supabaseService } from '@/lib/supabase/clients';

// Vercel Hobby cron budget is 60s max — matches vercel.json's daily schedule.
export const maxDuration = 60;

/**
 * P3-C wave C3: the batch is DEADLINE-governed, not count-governed. The old
 * fixed BATCH_SIZE=200 with no deadline meant a 10k gallery took 50 days to
 * refresh while the route used a fraction of its window (200 mostly-304
 * items × ~0.25 s ÷ 5 workers ≈ 10 s of a 60 s budget). Now the window is
 * the budget: pull a generous queue slice, process until the soft deadline,
 * and let unfinished items retry next run (last_synced_at only bumps on a
 * processed item, so the queue order self-heals). 304s dominate a steady-
 * state walk — ~1,000+/run at 5 workers — and the daily total stays trivial
 * against GitHub's 5k/HOUR limit. The 15-min ingest route's 50-item slice
 * (P3-C D34) does the intra-day freshness work; this daily walk is the
 * backstop that touches everything.
 */
const BATCH_SIZE = 1000;
const CONCURRENCY = 5;
const SOFT_DEADLINE_MS = 50_000;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Empty-secret guard: an unset CRON_SECRET must never leave this endpoint open.
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('unauthorized', { status: 401 });
  }

  const startedAt = Date.now();
  const deadlineAt = startedAt + SOFT_DEADLINE_MS;
  const service = supabaseService();

  // Matches idx_projects_sync_queue; drafts are excluded on purpose (they sync on demand).
  const { data: projects, error: selectError } = await service
    .from('projects')
    .select('id')
    .eq('status', 'published')
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (selectError) {
    console.error('[cron/sync] batch select failed', { message: selectError.message });
    return NextResponse.json({ error: 'batch select failed' }, { status: 500 });
  }

  const ids = (projects ?? []).map((p) => p.id);

  const tally = { synced: 0, notModified: 0, notFound: 0, rateLimited: 0, errored: 0, skipped: 0 };
  let stop = false;
  let cursor = 0;

  async function worker() {
    while (true) {
      if (stop || Date.now() >= deadlineAt) {
        // Remaining items are skipped once a rate_limited outcome (or the
        // soft deadline) is seen — in-flight items still finish, but nothing
        // new starts. Skipped items keep their old last_synced_at and lead
        // the queue next run.
        while (cursor < ids.length) {
          cursor++;
          tally.skipped++;
        }
        return;
      }
      const index = cursor++;
      if (index >= ids.length) return;
      const id = ids[index];
      try {
        const result = await syncProject(id);
        switch (result.status) {
          case 'synced':
            tally.synced++;
            break;
          case 'not_modified':
            tally.notModified++;
            break;
          case 'not_found':
            tally.notFound++;
            break;
          case 'rate_limited':
            tally.rateLimited++;
            stop = true;
            break;
          default:
            tally.errored++;
            console.error('[cron/sync] project errored', { id, detail: result.detail });
        }
      } catch (err) {
        // syncProject shouldn't throw, but isolate anyway so one bad project
        // never takes down the batch.
        tally.errored++;
        console.error('[cron/sync] project threw', { id, err });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  return NextResponse.json({ batch: ids.length, ...tally, tookMs: Date.now() - startedAt });
}

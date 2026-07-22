import { NextResponse } from 'next/server';
import { syncProject } from '@/lib/github/sync';
import { supabaseService } from '@/lib/supabase/clients';

// Vercel Hobby cron budget is 60s max — matches vercel.json's daily schedule.
export const maxDuration = 60;

const BATCH_SIZE = 200;
const CONCURRENCY = 5;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Empty-secret guard: an unset CRON_SECRET must never leave this endpoint open.
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('unauthorized', { status: 401 });
  }

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
      if (stop) {
        // Remaining items are skipped once a rate_limited outcome is seen —
        // in-flight items still finish, but nothing new starts.
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

  return NextResponse.json({ batch: ids.length, ...tally });
}

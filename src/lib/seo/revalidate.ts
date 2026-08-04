import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

import type { Database } from '@/lib/supabase/types';

/**
 * On-demand path revalidation for changed projects (2026-08-04).
 *
 * This is what makes the 24h page TTLs FRESH rather than merely cheap: the
 * sync and enrich pipelines know exactly which rows they changed, so instead
 * of every page re-rendering on a timer, a page re-renders on its next
 * request only after its content actually moved. Cost scales with real
 * change volume (steady-state: a handful of rows per cron run — 304s
 * dominate a sync walk), not with corpus size or crawl rate.
 *
 * Called from ROUTE HANDLERS only (the cron routes) — `revalidatePath` is a
 * request-context API, which is exactly why the batch engines return touched
 * ids instead of reaching into Next's cache themselves (their own documented
 * rule: callers decide if/when a revalidate is warranted).
 *
 * `revalidatePath` itself is a cheap invalidation mark, not a render — the
 * render (and its ISR writes) happens if and when the path is next
 * requested. Best-effort by design: a failure here means a page stays
 * cached until its 24h TTL, which is the same guarantee we had before the
 * call existed. It must never fail a pipeline run.
 */
export async function revalidateProjectPaths(
  service: SupabaseClient<Database>,
  projectIds: string[],
): Promise<number> {
  if (projectIds.length === 0) return 0;

  try {
    const { data, error } = await service
      .from('projects')
      .select('slug, profiles!projects_profile_id_fkey!inner(username)')
      .in('id', projectIds);
    if (error || !data) {
      console.error('[seo/revalidate] path lookup failed', { message: error?.message });
      return 0;
    }

    const paths = new Set<string>();
    for (const row of data) {
      const { username } = row.profiles as unknown as { username: string };
      paths.add(`/u/${username}/${row.slug}`);
      // The profile masthead aggregates stars/languages over its projects, so
      // a changed project also staleness-marks its maker page. Set-deduped —
      // ten changed projects from one author cost one profile revalidation.
      paths.add(`/u/${username}`);
    }
    for (const path of paths) {
      revalidatePath(path);
    }
    return paths.size;
  } catch (err) {
    console.error('[seo/revalidate] revalidation failed', { err });
    return 0;
  }
}

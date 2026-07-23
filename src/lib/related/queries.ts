import 'server-only';

import { unstable_cache } from 'next/cache';

import { FEED_COLUMNS, type FeedRow } from '@/lib/feed/queries';
import { supabaseAnon } from '@/lib/supabase/clients';

/**
 * "more like this" data layer (docs/plans/p2-discovery.md Wave 2A, decision
 * 5) — tag-overlap primary query with a same-language backfill, both riding
 * the anon client so the result stays cacheable below the project page's
 * cookie-bound tree. NEVER the cookie client here — caching must stay
 * user-independent.
 */

/**
 * Merges the tag-overlap and language-backfill result sets: primary rows
 * first (in their given order), backfill rows appended only where they don't
 * dedupe against something already kept, capped at `limit`. PURE — no IO.
 */
export function mergeRelatedRows(
  primary: FeedRow[],
  backfill: FeedRow[],
  limit: number,
): FeedRow[] {
  const merged: FeedRow[] = [];
  const seen = new Set<string>();

  for (const row of [...primary, ...backfill]) {
    if (merged.length >= limit) break;
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }

  return merged;
}

const RELATED_LIMIT = 4;

async function fetchRelatedProjects(
  projectId: string,
  tags: string[],
  language: string | null,
): Promise<FeedRow[]> {
  const client = supabaseAnon();

  let primary: FeedRow[] = [];
  if (tags.length > 0) {
    const { data, error } = await client
      .from('projects')
      .select(FEED_COLUMNS)
      .eq('status', 'published')
      .overlaps('tags', tags)
      .neq('id', projectId)
      .order('trending_score', { ascending: false })
      .order('id', { ascending: false })
      .limit(RELATED_LIMIT);

    if (error) {
      console.error('[related/queries] tag-overlap query failed', { message: error.message });
    } else {
      primary = (data ?? []) as unknown as FeedRow[];
    }
  }

  let backfill: FeedRow[] = [];
  if (primary.length < RELATED_LIMIT && language) {
    const { data, error } = await client
      .from('projects')
      .select(FEED_COLUMNS)
      .eq('status', 'published')
      .eq('primary_language', language)
      .neq('id', projectId)
      .order('trending_score', { ascending: false })
      .order('id', { ascending: false })
      .limit(RELATED_LIMIT);

    if (error) {
      console.error('[related/queries] language-backfill query failed', { message: error.message });
    } else {
      backfill = (data ?? []) as unknown as FeedRow[];
    }
  }

  return mergeRelatedRows(primary, backfill, RELATED_LIMIT);
}

/**
 * Cached (300s, tag 'related') "more like this" read for a published
 * project. Errors are swallowed to an empty array — the section quietly
 * hides rather than surfacing a broken rail (docs/plans/p2-discovery.md).
 */
export async function getRelatedProjects(
  projectId: string,
  tags: string[],
  language: string | null,
): Promise<FeedRow[]> {
  const cached = unstable_cache(
    async (): Promise<FeedRow[]> => {
      try {
        return await fetchRelatedProjects(projectId, tags, language);
      } catch (error) {
        console.error('[related/queries] getRelatedProjects failed', { error });
        return [];
      }
    },
    ['related', projectId],
    { revalidate: 300, tags: ['related'] },
  );

  return cached();
}

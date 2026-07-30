import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { FEED_COLUMNS, type FeedRow } from '@/lib/feed/queries';
import type { Database } from '@/lib/supabase/types';

export type FeaturedSlot = {
  id: string;
  sponsorLabel: string | null;
  project: FeedRow;
};

/**
 * At most this many featured cards lead the home feed — a head, not a
 * takeover (vision: featured lives in discovery surfaces, clearly labeled).
 */
export const FEATURED_STRIP_MAX = 3;

/**
 * Active featured slots with their full card rows (P4 L1, mechanism only —
 * nothing is sold; Will hand-places slots via /admin/featured).
 *
 * Two RLS layers do the honesty work for free:
 * - featured_slots_select_active shows only rows inside their time window,
 *   so expired/scheduled slots never reach the app;
 * - the `projects!inner` embed runs as the anon caller, so an unpublished
 *   target drops the whole slot (the D41 viewer-visible idiom) — a featured
 *   project that gets moderated away disappears from the strip by
 *   construction, no app code involved.
 *
 * Newest placement first; cap FEATURED_STRIP_MAX.
 */
export async function fetchActiveFeaturedSlots(
  client: SupabaseClient<Database>,
): Promise<FeaturedSlot[]> {
  const { data, error } = await client
    .from('featured_slots')
    .select(`id, sponsor_label, projects!featured_slots_project_id_fkey!inner(${FEED_COLUMNS})`)
    .order('starts_at', { ascending: false })
    .limit(FEATURED_STRIP_MAX);

  if (error) {
    // The strip is decoration on top of the feed — a fetch failure renders
    // absence, never an error surface.
    console.error('[featured] active-slot fetch failed:', error.message);
    return [];
  }

  type SlotRow = { id: string; sponsor_label: string | null; projects: FeedRow };
  // IO-boundary cast (house idiom): postgrest-js cannot infer the embedded
  // shape through the template-composed select string; FEED_COLUMNS enforces
  // it at runtime.
  return ((data ?? []) as unknown as SlotRow[]).map((row) => ({
    id: row.id,
    sponsorLabel: row.sponsor_label,
    project: row.projects,
  }));
}

import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

/**
 * Display label for a `/t/[tag]` page's `<title>` (docs/plans/m5-discovery.md
 * Wave 3B `generateMetadata`): the curated `tags.label` when the slug is part
 * of the taxonomy, otherwise the raw slug itself — uncurated tags are still
 * real and browsable, they just don't have a pretty label yet.
 */
export async function resolveTagLabel(
  slug: string,
  client: SupabaseClient<Database>,
): Promise<string> {
  const { data } = await client.from('tags').select('label').eq('slug', slug).maybeSingle();
  return data?.label ?? slug;
}

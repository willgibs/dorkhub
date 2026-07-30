import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';
import { supabaseAnon } from '@/lib/supabase/clients';

/**
 * Dynamic sitemap (P4 L3): statics + every published project page + every
 * profile page + every in-use tag page, read via the anon client (RLS shows
 * published-only regardless — the explicit filter documents intent).
 * Revalidates hourly; content churn is cron-paced, not request-paced.
 *
 * Deliberately absent: /search (client-rendered thin results, page-level
 * noindex), list pages (0 public lists today; add when real ones exist).
 * At ~10k projects this single file is still well under the 50k-URL sitemap
 * limit; shard via generateSitemaps() when the gallery approaches that.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = supabaseAnon();

  const [{ data: projects }, { data: profiles }, { data: tags }] = await Promise.all([
    supabase
      .from('projects')
      .select('slug, github_pushed_at, profiles!projects_profile_id_fkey!inner(username)')
      .eq('status', 'published'),
    supabase.from('profiles').select('username'),
    supabase.rpc('tag_tally'),
  ]);

  const statics: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1.0 },
    { url: `${SITE_URL}/manifesto`, priority: 0.8 },
    { url: `${SITE_URL}/tags`, priority: 0.5 },
    { url: `${SITE_URL}/terms`, priority: 0.2 },
    { url: `${SITE_URL}/privacy`, priority: 0.2 },
    { url: `${SITE_URL}/design`, priority: 0.3 },
    { url: `${SITE_URL}/design/components`, priority: 0.3 },
    { url: `${SITE_URL}/design/motion`, priority: 0.3 },
    { url: `${SITE_URL}/design/typography`, priority: 0.3 },
    { url: `${SITE_URL}/design/voice`, priority: 0.3 },
  ];

  const projectEntries: MetadataRoute.Sitemap = (projects ?? []).map((row) => {
    // postgrest-js types the FK-named !inner embed as an array shape; at
    // runtime a to-one embed is a single object (house cast idiom).
    const author = row.profiles as unknown as { username: string };
    return {
      url: `${SITE_URL}/u/${author.username}/${row.slug}`,
      lastModified: row.github_pushed_at ?? undefined,
      priority: 0.7,
    };
  });

  const profileEntries: MetadataRoute.Sitemap = (profiles ?? []).map((row) => ({
    url: `${SITE_URL}/u/${row.username}`,
    priority: 0.4,
  }));

  const tagEntries: MetadataRoute.Sitemap = (tags ?? []).map((row) => ({
    url: `${SITE_URL}/t/${row.slug}`,
    priority: 0.5,
  }));

  return [...statics, ...projectEntries, ...profileEntries, ...tagEntries];
}

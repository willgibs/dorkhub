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
 * noindex), list pages (0 public lists today; add when real ones exist),
 * zero-project profiles (thin pages; also what keeps the file legal —
 * see the profiles query). At 16,972 projects the file runs ~32k of the
 * 50k-URL sitemap cap; shard via generateSitemaps() before the gallery
 * nears ~30k projects.
 */
export const revalidate = 3600;

// PostgREST caps every response at 1,000 rows — an un-ranged select here
// silently truncated the sitemap to 3,011 URLs at 16,972 projects (caught
// live at launch; the cap was invisible when everything fit under 1,000).
// Walk in pages until a short page. Rows shifting mid-walk cost at most a
// dup/miss for one hourly revalidation — same acceptance as the cron
// walkers. RPCs are range-capped the same way, so tag_tally walks too.
const PAGE = 1000;

async function allRows<Row>(
  page: (from: number, to: number) => PromiseLike<{ data: Row[] | null }>,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data } = await page(from, from + PAGE - 1);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE) return rows;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = supabaseAnon();

  const [projects, tags] = await Promise.all([
    allRows((from, to) =>
      supabase
        .from('projects')
        .select('slug, github_pushed_at, profiles!projects_profile_id_fkey!inner(username)')
        .eq('status', 'published')
        .order('id')
        .range(from, to),
    ),
    allRows((from, to) => supabase.rpc('tag_tally').range(from, to)),
  ]);

  const statics: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1.0 },
    { url: `${SITE_URL}/manifesto`, priority: 0.8 },
    { url: `${SITE_URL}/tags`, priority: 0.5 },
    { url: `${SITE_URL}/sponsor`, priority: 0.4 },
    { url: `${SITE_URL}/terms`, priority: 0.2 },
    { url: `${SITE_URL}/privacy`, priority: 0.2 },
    { url: `${SITE_URL}/design`, priority: 0.3 },
    { url: `${SITE_URL}/design/components`, priority: 0.3 },
    { url: `${SITE_URL}/design/motion`, priority: 0.3 },
    { url: `${SITE_URL}/design/typography`, priority: 0.3 },
    { url: `${SITE_URL}/design/voice`, priority: 0.3 },
  ];

  const projectEntries: MetadataRoute.Sitemap = projects.map((row) => {
    // postgrest-js types the FK-named !inner embed as an array shape; at
    // runtime a to-one embed is a single object (house cast idiom).
    const author = row.profiles as unknown as { username: string };
    return {
      url: `${SITE_URL}/u/${author.username}/${row.slug}`,
      lastModified: row.github_pushed_at ?? undefined,
      priority: 0.7,
    };
  });

  // Profiles = the DISTINCT authors of the projects above — exactly the
  // "has a published project" set (14,020 at 16,972 projects), derived from
  // rows already fetched. A separate embed-filtered profiles walk was tried
  // and cut off at exactly 4,000: with an inner-embed filter a .range() page
  // can come back short because the FILTER dropped rows from that page, not
  // because the set is exhausted — the pagination-layer form of the
  // window-then-filter class. Deriving from the project rows has no
  // pagination semantics to get wrong and can't disagree with the listing.
  const authorUsernames = new Set(
    projects.map((row) => (row.profiles as unknown as { username: string }).username),
  );
  const profileEntries: MetadataRoute.Sitemap = [...authorUsernames].map((username) => ({
    url: `${SITE_URL}/u/${username}`,
    priority: 0.4,
  }));

  // Only tags with a real listing behind them (≥3 published projects) get a
  // sitemap slot — AI enrichment mints a huge one-project long tail (15,656
  // in-use tags at 16,972 projects) that is textbook thin content AND was
  // eating the 50k cap. Thin tags stay crawlable via /tags, just unpromoted.
  const tagEntries: MetadataRoute.Sitemap = tags
    .filter((row) => row.count >= 3)
    .map((row) => ({
      url: `${SITE_URL}/t/${row.slug}`,
      priority: 0.5,
    }));

  return [...statics, ...projectEntries, ...profileEntries, ...tagEntries];
}

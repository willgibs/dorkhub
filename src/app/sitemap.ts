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

/**
 * Promotion thresholds — a COST lever, not an SEO principle (2026-08-03).
 *
 * Every URL promoted here is a dynamic render on each crawl, and a
 * three-day sitemap walk after launch exhausted a month of Vercel resources.
 * Raising these cut the promoted surface from 36,206 URLs to ~17.4k:
 * tags 5,212 → 280, profiles 14,020 → 128.
 *
 * These are deliberately reversible. Nothing here is de-indexed — thin tag
 * and profile pages stay crawlable and reachable from /tags and from every
 * project page, they are just no longer PROMOTED. Once the route cache is
 * proven out (Wave 2) these can come back down; revisit with the invocation
 * numbers in docs/ops-cost.md rather than by feel.
 */
const TAG_SITEMAP_MIN_PROJECTS = 50;
const PROFILE_SITEMAP_MIN_PROJECTS = 5;

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
    { url: `${SITE_URL}/active`, priority: 0.5 },
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
  // ...then narrowed to the makers with a real body of work behind the page
  // (PROFILE_SITEMAP_MIN_PROJECTS). A one-project profile is a near-duplicate
  // of the project page it points at, and there are 13,892 of them.
  const projectsByAuthor = new Map<string, number>();
  for (const row of projects) {
    const { username } = row.profiles as unknown as { username: string };
    projectsByAuthor.set(username, (projectsByAuthor.get(username) ?? 0) + 1);
  }
  const profileEntries: MetadataRoute.Sitemap = [...projectsByAuthor.entries()]
    .filter(([, count]) => count >= PROFILE_SITEMAP_MIN_PROJECTS)
    .map(([username]) => ({
      url: `${SITE_URL}/u/${username}`,
      priority: 0.4,
    }));

  // Only tags with a real listing behind them get a sitemap slot — AI
  // enrichment mints a huge long tail (24,678 in-use tags at 16,972 projects;
  // 21,678 of them under five projects) that is textbook thin content. Thin
  // tags stay crawlable via /tags, just unpromoted.
  const tagEntries: MetadataRoute.Sitemap = tags
    .filter((row) => row.count >= TAG_SITEMAP_MIN_PROJECTS)
    .map((row) => ({
      url: `${SITE_URL}/t/${row.slug}`,
      priority: 0.5,
    }));

  return [...statics, ...projectEntries, ...profileEntries, ...tagEntries];
}

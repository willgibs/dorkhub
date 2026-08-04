import type { MetadataRoute } from 'next';

import {
  promotedProfileUsernames,
  promotedProjects,
  promotedTagSlugs,
  walkPublishedProjects,
} from '@/lib/seo/promoted';
import { SITE_URL } from '@/lib/site';

/**
 * Dynamic sitemap (P4 L3, re-tiered 2026-08-04): statics + the PROMOTED
 * tiers only — top projects by trending score, makers with a real body of
 * work, tags with a real listing. One definition of "promoted" lives in
 * src/lib/seo/promoted.ts, shared with robots.ts so the two surfaces can
 * never disagree.
 *
 * Everything else stays crawlable-and-discoverable through internal links
 * (except what robots.ts explicitly closes); it just isn't handed to
 * crawlers as a 36k-URL work order on a weeks-old domain — which is exactly
 * what exhausted a month of serving resources in three days
 * (docs/ops-cost.md).
 *
 * Deliberately absent: /search (client-rendered thin results, page-level
 * noindex), list pages (0 public lists today), zero-project profiles.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, tagSlugs] = await Promise.all([walkPublishedProjects(), promotedTagSlugs()]);

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

  const projectEntries: MetadataRoute.Sitemap = promotedProjects(projects).map((row) => ({
    url: `${SITE_URL}/u/${row.username}/${row.slug}`,
    lastModified: row.github_pushed_at ?? undefined,
    priority: 0.7,
  }));

  const profileEntries: MetadataRoute.Sitemap = promotedProfileUsernames(projects).map(
    (username) => ({
      url: `${SITE_URL}/u/${username}`,
      priority: 0.4,
    }),
  );

  const tagEntries: MetadataRoute.Sitemap = tagSlugs.map((slug) => ({
    url: `${SITE_URL}/t/${slug}`,
    priority: 0.5,
  }));

  return [...statics, ...projectEntries, ...profileEntries, ...tagEntries];
}

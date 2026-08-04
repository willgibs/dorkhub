import type { MetadataRoute } from 'next';

import {
  promotedProfileUsernames,
  promotedTagSlugs,
  walkPublishedProjects,
} from '@/lib/seo/promoted';
import { SITE_URL } from '@/lib/site';

/** Long window — the promoted sets move on the order of days, not minutes. */
export const revalidate = 86400;

/**
 * Public since launch (P4 L5). The rule set is a COST control as much as an
 * SEO one (docs/ops-cost.md): every crawlable URL is a render plus several
 * metered ISR writes per cache fill, and the long tails are thin content a
 * weeks-old domain can't rank anyway.
 *
 * Google resolves Allow/Disallow by LONGEST MATCH, and matches by PREFIX —
 * two sharp edges this file has already been cut on:
 * - `Disallow: /new` silently blocked `/newest` (prefix match) — hence the
 *   `$` anchor on every entry that has a real sibling route.
 * - A specific `Allow` re-opens exactly one path from under a broad
 *   `Disallow` because it's longer — that's how the tag and profile tiers
 *   below work.
 *
 * Tier scheme (single source of truth: src/lib/seo/promoted.ts, shared with
 * sitemap.ts so the two surfaces can never disagree):
 * - `/t/` closed, promoted tags re-opened `$`-anchored. 21k+ of the 24.7k
 *   in-use tags have <5 projects.
 * - `/u/` closed, `Allow: /u/*​/*` re-opens EVERY project page (the product —
 *   always crawlable), promoted maker profiles re-opened `$`-anchored. The
 *   13.9k one-project profiles are near-duplicates of their project page.
 * - Gated prefixes, machine surfaces, and deliberately-uncacheable routes
 *   closed outright — a crawler was spending ~358 renders/day being
 *   redirected to /auth/signin.
 *
 * Everything blocked here still WORKS for humans and stays linked; nothing
 * is noindexed. Widen the tiers via promoted.ts constants when the meter
 * says there's room (docs/ops-cost.md).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const [projects, tagSlugs] = await Promise.all([walkPublishedProjects(), promotedTagSlugs()]);
  const profileAllows = promotedProfileUsernames(projects).map((username) => `/u/${username}$`);
  const tagAllows = tagSlugs.map((slug) => `/t/${slug}$`);

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        // Every project page — two path segments under /u/.
        '/u/*/*',
        ...profileAllows,
        ...tagAllows,
      ],
      disallow: [
        // Gated — mirrors AUTHED_PREFIXES in src/proxy.ts. `$`-anchored where
        // a real public route shares the prefix (/new vs /newest).
        '/new$',
        '/settings',
        '/saved',
        '/following',
        '/admin',
        '/onboarding',
        '/claim',
        // The redirect target itself.
        '/auth',
        // Machine surfaces, never content.
        '/api',
        // Deliberately uncacheable (a DB query per hit, by design) or
        // already noindexed.
        '/random',
        '/weird',
        '/search',
        // Longer than the project-page Allow, so it wins for these paths:
        // lists pages are force-dynamic (a render per hit, uncacheable by
        // design) and must not be crawled through the /u/*​/* re-open.
        '/u/*/lists',
        // The long tails — see the tier scheme above.
        '/t/',
        '/u/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

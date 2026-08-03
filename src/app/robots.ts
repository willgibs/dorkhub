import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';

/**
 * Public since launch (P4 L5, 2026-07-31) — that flip landed in the SAME
 * commit as removing layout.tsx's `robots: { index: false }` metadata.
 *
 * The disallow list is a COST control as much as an SEO one (2026-08-03).
 * Every path here resolves to a dynamic render, and a crawler walking them
 * spends a function invocation to be told it can't have the page:
 *
 * - Auth-gated prefixes (`AUTHED_PREFIXES` in src/proxy.ts) 307 to
 *   `/auth/signin`, which is how ~358 invocations/day were being spent on
 *   redirects to a page no crawler should want.
 * - `/random` is `force-dynamic` and runs a database query per hit, by
 *   design — it is the one route that must never be cached, so it must not
 *   be crawled either.
 * - `/search` already carries a page-level noindex (thin client-rendered
 *   results, D27); this stops the fetch as well as the indexing.
 * - `/t/*​/newest` is the same listing as `/t/[tag]` in a different order —
 *   a pure duplicate that doubles the tag crawl surface for no new content.
 *
 * Keep this in step with `AUTHED_PREFIXES`: a new gated route added there
 * and not here is a new source of crawler-driven redirects.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Gated — mirrors AUTHED_PREFIXES in src/proxy.ts.
        '/new',
        '/settings/',
        '/saved',
        '/following',
        '/admin/',
        '/onboarding',
        '/claim',
        // The redirect target itself.
        '/auth/',
        // Machine surfaces, never content.
        '/api/',
        // Deliberately uncacheable, or already noindexed.
        '/random',
        '/weird',
        '/search',
        // Sort duplicate of /t/[tag].
        '/t/*/newest',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

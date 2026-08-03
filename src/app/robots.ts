import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';
import { supabaseAnon } from '@/lib/supabase/clients';

/** Long window — the promoted tag set moves on the order of weeks. */
export const revalidate = 86400;

/**
 * Same threshold the sitemap promotes at. A tag below it is a listing of
 * three or four projects that all appear on richer pages elsewhere.
 */
const TAG_CRAWL_MIN_PROJECTS = 50;

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
export default async function robots(): Promise<MetadataRoute.Robots> {
  /*
   * THE TAG LONG TAIL IS CLOSED TO CRAWLERS (2026-08-03, board-approved).
   *
   * There are ~24,700 in-use tags and 21,678 of them have fewer than five
   * projects. Removing them from the sitemap did nothing to the crawl,
   * because a crawler reaches them through the tag chips on all 16,972
   * project pages — 2,840 distinct paths were being walked every 30 minutes,
   * every one a first hit that no cache can serve. Tag pages were the single
   * largest consumer of a Fluid Active CPU allowance that had reached 146%.
   *
   * So `/t/` is disallowed wholesale and the tags worth having in an index
   * are allowed back individually. `$` anchors each Allow to the exact path,
   * so `/t/rust` does not also re-open `/t/rust-lang` or `/t/rust/newest`.
   * Google resolves conflicts by longest match, so the specific Allow beats
   * the general Disallow.
   *
   * REVERSIBLE, and expected to be reversed: nothing here is noindexed, the
   * pages still work and are still linked. Lower the threshold or delete the
   * Disallow once the CPU numbers in docs/ops-cost.md say there's room.
   */
  const { data } = await supabaseAnon()
    .rpc('tag_tally')
    .gte('count', TAG_CRAWL_MIN_PROJECTS)
    .order('count', { ascending: false });
  const promotedTags = (data ?? []).map((row) => `/t/${row.slug}$`);

  return {
    rules: {
      userAgent: '*',
      allow: ['/', ...promotedTags],
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
        // The tag long tail — see the note above. The Allow list re-opens the
        // ~280 tags with a real listing behind them; this closes the other
        // ~24,400, and `/t/*/newest` (a sort duplicate) for all of them.
        '/t/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

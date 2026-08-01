import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MastheadBand } from '@/components/masthead-band';
import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import { supabaseAnon } from '@/lib/supabase/clients';
import { SearchResultsIsland } from './search-results';

// Page-level noindex (P4 L3): results are client-rendered, so a crawler sees
// an empty shell — thin content that should stay out of the index even after
// the sitewide robots flip at launch. follow:true keeps link equity flowing.
export const metadata: Metadata = {
  title: copy.searchTitle,
  robots: { index: false, follow: true },
};

/**
 * Long window: the only server data here is a handful of popular tags for the
 * empty state, and those move on the order of days.
 */
export const revalidate = 3600;

/** Escape hatches offered when there's nothing to show. */
const SUGGESTED_TAG_LIMIT = 8;

/**
 * The results page is a STATIC shell (P3-B D27). Nothing here reads
 * `searchParams`: doing so in a Server Component opts the route out of static
 * rendering permanently, and this is a public route with an unbounded space of
 * distinct query strings — every unique `q` would become its own function
 * invocation and its own cache key, which is the most plausible way to blow
 * the $0 posture. The tag fetch below is query-INDEPENDENT, so the shell stays
 * one cached render for everybody.
 *
 * The query is read client-side by `SearchResultsIsland` via
 * `useSearchParams()` under a Suspense boundary, which keeps this route
 * prerendered while still giving shareable `?q=` URLs. The island fetches
 * `/api/search`, which already carries `s-maxage=30` — so a repeated query is
 * a CDN hit rather than a database round trip.
 *
 * Cost named honestly: results are client-rendered, so there is no RSC card
 * markup and nothing for a crawler — which is why this page carries its OWN
 * `robots: { index: false }` (P4 L3) that survives the launch flip. Revisit
 * only if search ever grows server-rendered results worth indexing.
 */
export default async function SearchPage() {
  const { data } = await supabaseAnon()
    .rpc('tag_tally')
    .order('count', { ascending: false })
    .limit(SUGGESTED_TAG_LIMIT);

  return (
    <>
      <MastheadBand>
        <div className="flex min-w-0 flex-col gap-4">
          <p className="font-mono text-[11.5px] tracking-widest text-muted-foreground uppercase">
            <span aria-hidden="true">{'// '}</span>
            {copy.searchKicker}
          </p>
          <h1 className="font-display text-[32px] leading-[1.05] font-extrabold tracking-tight sm:text-[40px]">
            {copy.searchTitle}
          </h1>
        </div>
      </MastheadBand>

      <PageShell className="flex flex-col gap-6 py-10">
        <Suspense fallback={null}>
          <SearchResultsIsland suggestedTags={(data ?? []).map((row) => row.slug)} />
        </Suspense>
      </PageShell>
    </>
  );
}

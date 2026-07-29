import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import { SearchResultsIsland } from './search-results';

export const metadata: Metadata = { title: copy.searchTitle };

/**
 * The results page is a STATIC shell (P3-B D27). Nothing here reads
 * `searchParams`: doing so in a Server Component opts the route out of static
 * rendering permanently, and this is a public route with an unbounded space of
 * distinct query strings — every unique `q` would become its own function
 * invocation and its own cache key, which is the most plausible way to blow
 * the $0 pre-launch posture.
 *
 * Instead the query is read client-side by `SearchResultsIsland` via
 * `useSearchParams()` under a Suspense boundary, which keeps this route
 * prerendered while still giving shareable `?q=` URLs. The island fetches
 * `/api/search`, which already carries `s-maxage=30` — so a repeated query is
 * a CDN hit rather than a database round trip.
 *
 * Cost named honestly: results are client-rendered, so there is no RSC card
 * markup and nothing for a crawler. Free today — robots is noindex sitewide
 * until launch — and revisitable at P4 if search should be indexed.
 */
export default function SearchPage() {
  return (
    <PageShell className="flex flex-col gap-6 py-10">
      <h1 className="font-display text-[26px] font-extrabold">{copy.searchTitle}</h1>
      <Suspense fallback={null}>
        <SearchResultsIsland />
      </Suspense>
    </PageShell>
  );
}

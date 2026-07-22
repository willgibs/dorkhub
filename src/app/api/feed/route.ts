import { NextResponse } from 'next/server';

import { fetchFeedPage, resolveFeedFilterSpec } from '@/lib/feed/queries';
import { supabaseAnon } from '@/lib/supabase/clients';

/**
 * Public JSON feed endpoint (docs/plans/m5-discovery.md Wave 3B). Edge-cached
 * via `Cache-Control` (s-maxage=60, SWR 300) instead of `unstable_cache` —
 * stacking `getFeedPage`'s in-process cache under the CDN cache would double
 * up caching semantics for no benefit here, so this route goes straight to
 * `fetchFeedPage` against the cookie-less anon client. `resolveFeedFilterSpec`
 * tolerates garbage input (unknown sort, malformed cursor, oversized limit)
 * by falling back to sane defaults rather than throwing, so a bad `cursor`
 * param naturally resolves to page 1 instead of erroring.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const spec = resolveFeedFilterSpec({
      sort: searchParams.get('sort'),
      tag: searchParams.get('tag'),
      language: searchParams.get('language'),
      cursor: searchParams.get('cursor'),
      limit: searchParams.get('limit'),
    });

    const { rows, nextCursor } = await fetchFeedPage(spec, supabaseAnon());

    return NextResponse.json(
      { rows, nextCursor },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  } catch (error) {
    console.error('[api/feed] request failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'feed unavailable' }, { status: 500 });
  }
}

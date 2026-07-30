import { NextResponse } from 'next/server';

import { copy } from '@/lib/copy';
import { normalizeSearchQuery, resolveSearchFacets, searchAll } from '@/lib/search/queries';
import {
  hashClientIp,
  interpretSearchClaim,
  SEARCH_RATE_LIMIT_WINDOW_S,
  searchRateLimitMax,
} from '@/lib/search/rate-limit';
import { supabaseAnon, supabaseService } from '@/lib/supabase/clients';

/**
 * Public search endpoint (docs/plans/m5.5-curator.md Wave 1A). Backs the
 * command palette. `normalizeSearchQuery` is the server-side floor even
 * though the palette also debounces client-side — a short/empty `q` never
 * touches the DB, it just returns the empty shape.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const q = normalizeSearchQuery(searchParams.get('q'));

    // Rate limit only real searches — an under-floor `q` never touches the DB
    // and shouldn't burn a window slot. FAIL-OPEN (see rate-limit.ts): a
    // limiter error logs and the search proceeds; only an explicit `false`
    // claim 429s.
    if (q) {
      try {
        const { data, error } = await supabaseService().rpc('claim_search_call', {
          p_ip_hash: hashClientIp(request.headers.get('x-forwarded-for')),
          p_max: searchRateLimitMax(),
          p_window_seconds: SEARCH_RATE_LIMIT_WINDOW_S,
        });
        if (error) {
          console.error(
            '[api/search] rate-limit ledger unreachable (failing open):',
            error.message,
          );
        }
        if (interpretSearchClaim(data, error) === 'limited') {
          return NextResponse.json(
            { error: copy.searchRateLimited },
            { status: 429, headers: { 'Cache-Control': 'no-store' } },
          );
        }
      } catch (limiterError) {
        console.error(
          '[api/search] rate-limit check threw (failing open):',
          limiterError instanceof Error ? limiterError.message : String(limiterError),
        );
      }
    }

    // `limit` is a request for MORE projects than the palette's default; it is
    // clamped inside searchAll to SEARCH_PROJECT_LIMIT_MAX, so a hand-crafted
    // `?limit=100000` cannot widen the scan. Garbage parses to NaN and falls
    // back to the default.
    const rawLimit = Number.parseInt(searchParams.get('limit') ?? '', 10);
    const projectLimit = Number.isFinite(rawLimit) ? rawLimit : undefined;

    // Facets narrow the query IN SQL (see applyFacets) — never the returned
    // set. Every value is validated here first, so nothing user-shaped reaches
    // a filter.
    const facets = resolveSearchFacets({
      language: searchParams.get('lang'),
      tag: searchParams.get('tag'),
      stars: searchParams.get('stars'),
      demo: searchParams.get('demo'),
    });

    const results = q
      ? await searchAll(q, supabaseAnon(), { projectLimit, facets })
      : { projects: [], profiles: [], tags: [] };

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('[api/search] request failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'search unavailable' }, { status: 500 });
  }
}

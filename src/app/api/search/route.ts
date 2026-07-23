import { NextResponse } from 'next/server';

import { normalizeSearchQuery, searchAll } from '@/lib/search/queries';
import { supabaseAnon } from '@/lib/supabase/clients';

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

    const results = q
      ? await searchAll(q, supabaseAnon())
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

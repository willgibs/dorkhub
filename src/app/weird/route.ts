import { NextResponse } from 'next/server';

import { supabaseAnon } from '@/lib/supabase/clients';

// A statically-cached /weird would keep serving whatever "random" project
// happened to render at build time forever — a silent failure (the route
// still 307s, it just stops being random), not a crash, which makes it easy
// to miss. Force dynamic so every request re-rolls.
export const dynamic = 'force-dynamic';

type WeirdRow = { slug: string; profiles: { username: string } };

/**
 * Serendipity route (docs/plans/p2-discovery.md locked decision 7): redirects
 * to one random published project. This is a one-off single-row random
 * OFFSET pick via `.range(n, n)` — a deliberate, documented exception to the
 * no-OFFSET *feed pagination* rule (docs/decisions.md, docs/architecture.md).
 * That rule guards against OFFSET's cost degrading as a listing grows deep;
 * here there's no listing to page through, just one randomly-indexed row
 * read per request, so the concern doesn't apply.
 */
export async function GET(request: Request) {
  const home = NextResponse.redirect(new URL('/', request.url));
  const supabase = supabaseAnon();

  try {
    const { count, error: countError } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');

    if (countError || !count) return home;

    const index = Math.floor(Math.random() * count);

    // `profiles!projects_profile_id_fkey!inner(...)` — the FK-named embed is
    // REQUIRED: projects<->profiles has three relationships (the direct FK
    // plus many-to-many through likes and saves), so a bare `profiles!inner`
    // is ambiguous and PostgREST 400s it (PGRST201) — verified against the
    // live API (docs/decisions.md, src/lib/feed/queries.ts FEED_COLUMNS).
    const { data, error } = await supabase
      .from('projects')
      .select('slug, profiles!projects_profile_id_fkey!inner(username)')
      .eq('status', 'published')
      .order('id')
      .range(index, index);

    // Same IO-boundary trust as FEED_COLUMNS callers — postgrest-js's generic
    // inference doesn't fully verify nested embeds; shape enforced by the
    // select string above.
    const row = (data?.[0] ?? null) as unknown as WeirdRow | null;

    if (error || !row?.slug || !row.profiles?.username) return home;

    return NextResponse.redirect(
      new URL(`/u/${row.profiles.username}/${row.slug}`, request.url),
      307,
    );
  } catch (err) {
    console.error('[weird] request failed', {
      message: err instanceof Error ? err.message : String(err),
    });
    return home;
  }
}

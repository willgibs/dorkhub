import { NextResponse } from 'next/server';

import { supabaseAnon } from '@/lib/supabase/clients';

// A statically-cached /weird would keep serving whatever "random" project
// happened to render at build time forever — a silent failure (the route
// still 307s, it just stops being random), not a crash, which makes it easy
// to miss. Force dynamic so every request re-rolls.
export const dynamic = 'force-dynamic';

type WeirdRow = { slug: string; profiles: { username: string } };

const WEIRD_SELECT =
  // `profiles!projects_profile_id_fkey!inner(...)` — the FK-named embed is
  // REQUIRED: projects<->profiles has three relationships (the direct FK
  // plus many-to-many through likes and saves), so a bare `profiles!inner`
  // is ambiguous and PostgREST 400s it (PGRST201) — verified against the
  // live API (docs/decisions.md, src/lib/feed/queries.ts FEED_COLUMNS).
  'slug, profiles!projects_profile_id_fkey!inner(username)';

/**
 * Serendipity route (docs/plans/p2-discovery.md locked decision 7): redirects
 * to one random published project.
 *
 * P3-C wave C2 (decision D35): random pick via a uuid PIVOT, not
 * count(*) + OFFSET. The old shape paid O(n) TWICE per request — a full
 * count seq scan plus an OFFSET walk (measured at 10k: 7,020 buffers,
 * ~6.6 ms, on a force-dynamic route) — which retired the "documented
 * OFFSET exception" this route used to carry. Project ids are uuidv4
 * (uniform over the id space), so `id >= <random uuid>, order by id,
 * limit 1` is an O(log n) index seek on the pkey; the rare miss (pivot
 * above the highest id, ~1/(n+1)) wraps around downward. Selection weight
 * is proportional to the uuid gap before each id rather than exactly
 * uniform — for serendipity that trade is invisible, and it never degrades
 * with catalog size.
 */
export async function GET(request: Request) {
  const home = NextResponse.redirect(new URL('/', request.url));
  const supabase = supabaseAnon();

  try {
    const pivot = globalThis.crypto.randomUUID();

    let { data, error } = await supabase
      .from('projects')
      .select(WEIRD_SELECT)
      .eq('status', 'published')
      .gte('id', pivot)
      .order('id', { ascending: true })
      .limit(1);

    if (!error && (data?.length ?? 0) === 0) {
      // Pivot landed above the highest id — wrap around downward.
      ({ data, error } = await supabase
        .from('projects')
        .select(WEIRD_SELECT)
        .eq('status', 'published')
        .lt('id', pivot)
        .order('id', { ascending: false })
        .limit(1));
    }

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

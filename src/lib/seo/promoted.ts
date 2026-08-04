import 'server-only';

import { supabaseAnon } from '@/lib/supabase/clients';

/**
 * The promoted crawl surface — ONE definition shared by sitemap.ts and
 * robots.ts so the two can never disagree (a page the sitemap promotes but
 * robots blocks is the worst possible signal to send a crawler).
 *
 * These are COST controls as much as SEO ones (docs/ops-cost.md): every
 * crawlable URL is a render and several metered ISR writes on each cache
 * fill. They are also, deliberately, a crawl-QUALITY control: a weeks-old
 * domain builds authority from its best few thousand pages, not from 17k
 * thin ones — Google largely ignores (and can penalize) bulk thin content
 * on new domains. The tiers below widen as authority and budget grow;
 * revisit with the meter readings, not by feel.
 */

/** Tags with a real listing behind them. */
export const TAG_PROMOTED_MIN_PROJECTS = 50;
/** Makers with a real body of work — a one-project profile is a near-duplicate of its project page. */
export const PROFILE_PROMOTED_MIN_PROJECTS = 5;
/**
 * Projects promoted in the sitemap, by trending score. The rest stay
 * crawlable (robots allows all project pages) — they're the product — but
 * unpromoted: Google discovers them through internal links at its own pace
 * instead of being handed 17k URLs to sweep on day one.
 */
export const PROJECT_PROMOTED_LIMIT = 3000;

// PostgREST caps every response at 1,000 rows — walk in pages until a short
// page (same discipline as everywhere else; the un-ranged form silently
// truncates, docs/state.md gotcha).
const PAGE = 1000;

async function allRows<Row>(
  page: (from: number, to: number) => PromiseLike<{ data: Row[] | null }>,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data } = await page(from, from + PAGE - 1);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE) return rows;
  }
}

export type PublishedProjectRow = {
  slug: string;
  github_pushed_at: string | null;
  trending_score: number;
  username: string;
};

/**
 * Every published project with its author — the base set both surfaces
 * derive from. One walk, ~17 range queries; callers cache via their route's
 * `revalidate`, so this runs a handful of times a day in total.
 *
 * Profiles are DERIVED from these rows rather than queried separately: an
 * embed-filtered profiles walk was tried once and silently cut off at 4,000
 * (a `.range()` page can come back short because the FILTER dropped rows
 * from that page — the pagination-layer window-then-filter trap).
 */
export async function walkPublishedProjects(): Promise<PublishedProjectRow[]> {
  const supabase = supabaseAnon();
  const rows = await allRows((from, to) =>
    supabase
      .from('projects')
      .select(
        'slug, github_pushed_at, trending_score, profiles!projects_profile_id_fkey!inner(username)',
      )
      .eq('status', 'published')
      .order('id')
      .range(from, to),
  );
  return rows.map((row) => ({
    slug: row.slug,
    github_pushed_at: row.github_pushed_at,
    trending_score: row.trending_score,
    // postgrest-js types the FK-named !inner embed as an array shape; at
    // runtime a to-one embed is a single object (house cast idiom).
    username: (row.profiles as unknown as { username: string }).username,
  }));
}

/** Usernames with ≥ PROFILE_PROMOTED_MIN_PROJECTS published projects. */
export function promotedProfileUsernames(rows: PublishedProjectRow[]): string[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.username, (counts.get(row.username) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= PROFILE_PROMOTED_MIN_PROJECTS)
    .map(([username]) => username);
}

/** The top PROJECT_PROMOTED_LIMIT projects by trending score. */
export function promotedProjects(rows: PublishedProjectRow[]): PublishedProjectRow[] {
  return [...rows]
    .sort((a, b) => b.trending_score - a.trending_score)
    .slice(0, PROJECT_PROMOTED_LIMIT);
}

/** Promoted tag slugs — the same set robots re-opens and the sitemap lists. */
export async function promotedTagSlugs(): Promise<string[]> {
  const { data } = await supabaseAnon()
    .rpc('tag_tally')
    .gte('count', TAG_PROMOTED_MIN_PROJECTS)
    .order('count', { ascending: false });
  return (data ?? []).map((row) => row.slug);
}

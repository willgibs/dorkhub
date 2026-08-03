import 'server-only';

import { cache } from 'react';

import { supabaseAnon } from '@/lib/supabase/clients';

/**
 * Tags prerendered at build. Small on purpose: the point of
 * `generateStaticParams` here is not to prerender the corpus, it's to opt the
 * route into the FULL ROUTE CACHE at all. Without it Next treats a dynamic
 * segment as always-dynamic and Vercel serves `no-store`, so every crawler hit
 * was a fresh render (2026-08-03 cost incident). With it, and `dynamicParams`
 * left at its default `true`, the other ~24,600 tags still render on demand —
 * but the result is cached instead of thrown away.
 */
const PRERENDERED_TAGS = 100;

/** How many co-occurring tags a page offers — enough to suggest, few enough to scan. */
const RELATED_TAG_LIMIT = 6;
/** One project's idiosyncratic tags aren't a pattern. */
const RELATED_MIN_COUNT = 2;
/** Top projects sampled for the co-occurrence tally — wide enough to be a pattern, cheap enough to be free. */
const CO_OCCURRENCE_SAMPLE = 60;

/**
 * The part of a slug before its first hyphen. Tag vocabularies cluster into
 * families — `bevy` / `bevy-engine` / `bevy-plugin`, `rust` / `rust-lang` —
 * and a suggestion row that spends four of its six slots on one family is
 * repeating itself rather than suggesting anything.
 */
function family(slug: string): string {
  return slug.split('-')[0];
}

export type TagMeta = {
  /** Curated `tags.label` when the slug is in the taxonomy, else the slug itself. */
  label: string;
  /** Editorial line for the masthead + metadata description. Null for uncurated tags. */
  description: string | null;
};

export type TagContext = {
  /** Published projects carrying this tag — the "how much is behind it" answer. */
  projectCount: number;
  /** Tags that keep showing up alongside this one, most frequent first. */
  relatedTags: string[];
};

/**
 * Label + description in ONE query, `cache()`d so `generateMetadata` and the
 * page body share it. Uncurated tags are still real and browsable — they just
 * have no pretty label or description yet, and render without one rather than
 * with filler.
 */
/**
 * The busiest tags, for `generateStaticParams`. Shared by `/t/[tag]` and
 * `/t/[tag]/newest` so the two can't prerender different sets.
 */
export async function topTagSlugs(): Promise<Array<{ tag: string }>> {
  const { data } = await supabaseAnon()
    .rpc('tag_tally')
    .order('count', { ascending: false })
    .limit(PRERENDERED_TAGS);
  return (data ?? []).map((row) => ({ tag: row.slug }));
}

export const getTagMeta = cache(async (slug: string): Promise<TagMeta> => {
  const { data } = await supabaseAnon()
    .from('tags')
    .select('label, description')
    .eq('slug', slug)
    .maybeSingle();
  return { label: data?.label ?? slug, description: data?.description ?? null };
});

/**
 * The masthead's numbers.
 *
 * Both queries are deliberately NARROW rather than reusing `getFeedPage`.
 * The first draft asked `getFeedPage` for the same page the feed below
 * renders, relying on its `unstable_cache` to make the two resolve to one
 * query. Two columns off a GIN index is simply cheaper than the RPC it would
 * have shared, reads 60 rows instead of a feed page's 24 for a better
 * co-occurrence signal, and — the reason it stayed — leaves the masthead
 * independent of which sort the calling route happens to use.
 *
 * Measured warm against `pg_stat_statements`: a tag render issues ONE
 * `feed_page` call, matching a plain `/newest` render. (Cold renders read
 * higher in dev because compiling a route renders it more than once — worth
 * knowing before trusting a first measurement.)
 *
 * The count is a `head` count against `idx_projects_tags_gin`, not the
 * `tag_tally()` aggregate — that one scans every published project to answer
 * for every tag at once, which is right for the directory and wasteful here.
 */
export const getTagContext = cache(async (slug: string): Promise<TagContext> => {
  const supabase = supabaseAnon();
  const [{ count }, { data: rows }] = await Promise.all([
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .contains('tags', [slug]),
    supabase
      .from('projects')
      .select('tags')
      .eq('status', 'published')
      .contains('tags', [slug])
      .order('trending_score', { ascending: false })
      .limit(CO_OCCURRENCE_SAMPLE),
  ]);

  // Case-insensitive, like the profile page's language tally: the corpus
  // carries the same tag in more than one casing, and listing both as
  // separate suggestions is the giveaway that nothing is looking.
  const tally = new Map<string, { total: number; spellings: Map<string, number> }>();
  for (const row of rows ?? []) {
    for (const tag of row.tags) {
      const key = tag.toLowerCase();
      if (key === slug.toLowerCase()) continue;
      const entry = tally.get(key) ?? { total: 0, spellings: new Map<string, number>() };
      entry.total += 1;
      entry.spellings.set(tag, (entry.spellings.get(tag) ?? 0) + 1);
      tally.set(key, entry);
    }
  }

  // One slot per tag family, best-supported member wins, and never the family
  // this page already is (`rust` must not suggest `rust-lang`).
  const ownFamily = family(slug.toLowerCase());
  const byFamily = new Map<string, { key: string; total: number; label: string }>();
  for (const [key, entry] of tally) {
    if (entry.total < RELATED_MIN_COUNT) continue;
    const group = family(key);
    if (group === ownFamily) continue;
    const [label] = [...entry.spellings.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0];
    const held = byFamily.get(group);
    if (!held || entry.total > held.total || (entry.total === held.total && key < held.key)) {
      byFamily.set(group, { key, total: entry.total, label });
    }
  }

  const relatedTags = [...byFamily.values()]
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key))
    .slice(0, RELATED_TAG_LIMIT)
    .map((entry) => entry.label);

  return { projectCount: count ?? 0, relatedTags };
});

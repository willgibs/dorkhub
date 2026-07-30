import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState } from '@/components/empty-state';
import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import { supabaseAnon } from '@/lib/supabase/clients';
import type { Tables } from '@/lib/supabase/types';

/**
 * Tag index (docs/plans/m5-discovery.md Wave 3B): full taxonomy browse, not
 * just the active-tag chip `FeedSection` shows inline. Counts come from a
 * live tally over published projects, not a stored counter — always exactly
 * right. Since P3-C C2 the tally is the `tag_tally()` SQL aggregate
 * (migration 0015): the page used to fetch EVERY published row's tags array
 * and count in JS, an O(projects) payload per revalidation; the aggregate
 * returns one row per distinct tag instead. Window raised 300 → 900 —
 * counts move slowly, and each window costs one server-side scan.
 */
export const revalidate = 900;

export const metadata: Metadata = { title: copy.tagsTitle };

type TagRow = Pick<Tables<'tags'>, 'slug' | 'label' | 'kind'>;

type TagEntry = { slug: string; label: string; count: number };

/** TagChip-style link with a permanently-muted count suffix (tag-chip.tsx's own
 * hover state only ever applies to the label — the count is metadata, not
 * the interactive target, so it never brightens on hover). */
function TagCountLink({ slug, label, count }: TagEntry) {
  return (
    <Link
      href={`/t/${slug}`}
      className="inline-flex items-center gap-1.5 rounded-md border bg-surface-2 px-[11px] py-1 font-mono text-xs leading-[1.4] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {label}
      {count > 0 ? <span className="text-muted-foreground tabular-nums">{count}</span> : null}
    </Link>
  );
}

function TagGroup({ label, entries }: { label: string; entries: TagEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{label}</h2>
      <div className="flex flex-wrap gap-2">
        {entries.map((entry) => (
          <TagCountLink key={entry.slug} {...entry} />
        ))}
      </div>
    </div>
  );
}

export default async function TagsPage() {
  const supabase = supabaseAnon();

  const [{ data: tagRows }, { data: tallyRows }] = await Promise.all([
    supabase.from('tags').select('slug, label, kind').order('label', { ascending: true }),
    supabase.rpc('tag_tally'),
  ]);

  const taxonomy = (tagRows ?? []) as TagRow[];
  // Same Map shape tallyProjectTags produced — the aggregate mirrors its
  // semantics exactly (see migration 0015); recs still use the JS tally on
  // their own page-sized row sets.
  const tally = new Map<string, number>((tallyRows ?? []).map((row) => [row.slug, row.count]));

  const stacks: TagEntry[] = taxonomy
    .filter((row) => row.kind === 'stack')
    .map((row) => ({ slug: row.slug, label: row.label, count: tally.get(row.slug) ?? 0 }));

  const curatedTopics: TagEntry[] = taxonomy
    .filter((row) => row.kind === 'topic')
    .map((row) => ({ slug: row.slug, label: row.label, count: tally.get(row.slug) ?? 0 }));

  // Real, browsable, just not in the curated taxonomy yet — surfaced under
  // "topics" rather than dropped (docs/plans/m5-discovery.md Wave 3B).
  const taxonomySlugs = new Set(taxonomy.map((row) => row.slug));
  const uncuratedTopics: TagEntry[] = [...tally.entries()]
    .filter(([slug]) => !taxonomySlugs.has(slug))
    .map(([slug, count]) => ({ slug, label: slug, count }))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const topics = [...curatedTopics, ...uncuratedTopics];

  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <h1 className="font-display text-[26px] font-extrabold">{copy.tagsTitle}</h1>

      {stacks.length === 0 && topics.length === 0 ? (
        <EmptyState message={copy.emptyFeed} />
      ) : (
        <div className="flex flex-col gap-8">
          <TagGroup label={copy.tagsStackLabel} entries={stacks} />
          <TagGroup label={copy.tagsTopicLabel} entries={topics} />
        </div>
      )}
    </PageShell>
  );
}

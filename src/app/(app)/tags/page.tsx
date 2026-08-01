import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState } from '@/components/empty-state';
import { MastheadBand } from '@/components/masthead-band';
import { PageShell } from '@/components/page-shell';
import { SectionHead } from '@/components/section-head';
import { type Stat, StatBlock } from '@/components/stat-block';
import { copy } from '@/lib/copy';
import { formatCount } from '@/lib/format';
import { supabaseAnon } from '@/lib/supabase/clients';
import type { Tables } from '@/lib/supabase/types';

/**
 * Tag index — the full taxonomy browse, not the active-tag chip `FeedSection`
 * shows inline. Counts come from a live `tag_tally()` aggregate (migration
 * 0015), never a stored counter, so they're always exactly right. Window is
 * long because counts move slowly and each one costs a server-side scan.
 */
export const revalidate = 900;

export const metadata: Metadata = { title: copy.tagsTitle };

/**
 * How many of the most-used tags the directory lists.
 *
 * There are ~24,700 distinct tags in use and 21,678 of them have FEWER THAN
 * FIVE projects. Listing everything produced a 977 KB page of undifferentiated
 * chips — and worse, it wasn't even everything: the call had no `.range()`, so
 * PostgREST's 1,000-row cap silently truncated it, and `tag_tally()` has no
 * ORDER BY, so WHICH thousand you got was undefined. A curated tag whose slug
 * happened to miss that arbitrary slice rendered with no count at all.
 *
 * The long tail stays reachable — from project pages, from search, and from
 * the sitemap (which promotes every tag with ≥3 projects) — it just isn't
 * listed here, because a directory that lists everything isn't a directory.
 */
const TOP_TAG_LIMIT = 150;

type TagRow = Pick<Tables<'tags'>, 'slug' | 'label' | 'kind' | 'description'>;
type TagEntry = { slug: string; label: string; count: number; description?: string | null };

/** Chip with a permanently-muted count suffix — the count is metadata, not the target. */
function TagCountLink({ slug, label, count }: TagEntry) {
  return (
    <Link
      href={`/t/${slug}`}
      className="inline-flex items-center gap-1.5 rounded-md border bg-surface-2 px-[11px] py-1 font-mono text-xs leading-[1.4] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {label}
      {count > 0 ? <span className="tabular-nums text-muted-foreground">{count}</span> : null}
    </Link>
  );
}

/** A curated tag gets a card: it has a description, and that's the whole point of curating it. */
function CuratedTagCard({ slug, label, count, description }: TagEntry) {
  return (
    <Link
      href={`/t/${slug}`}
      className="edge-highlight group flex flex-col gap-2 rounded-lg border bg-card p-4 outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-[17px] font-bold transition-colors group-hover:text-primary">
          <span aria-hidden="true" className="text-muted-foreground">
            #
          </span>
          {label}
        </span>
        {count > 0 ? (
          <span className="tabular-nums font-mono text-[12px] text-muted-foreground">{count}</span>
        ) : null}
      </div>
      {description ? (
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </Link>
  );
}

function CuratedGroup({ label, entries }: { label: string; entries: TagEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
        {label}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <CuratedTagCard key={entry.slug} {...entry} />
        ))}
      </div>
    </div>
  );
}

export default async function TagsPage() {
  const supabase = supabaseAnon();

  const { data: tagRows } = await supabase
    .from('tags')
    .select('slug, label, kind, description')
    .order('label', { ascending: true });
  const taxonomy = (tagRows ?? []) as TagRow[];
  const curatedSlugs = taxonomy.map((row) => row.slug);

  // TWO tallies on purpose. The ranked one answers "what's big"; the curated
  // one answers "how much is behind each shelf we keep" — and a curated tag
  // can easily rank below 150th (#plants has two projects) while still needing
  // an honest count on its card.
  const [{ data: topRows }, { data: curatedRows }, { count: tagsInUse }] = await Promise.all([
    supabase.rpc('tag_tally').order('count', { ascending: false }).limit(TOP_TAG_LIMIT),
    curatedSlugs.length > 0
      ? supabase.rpc('tag_tally').in('slug', curatedSlugs)
      : Promise.resolve({ data: [] as Array<{ slug: string; count: number }> }),
    // Head count over the same aggregate: how many DISTINCT tags exist, which
    // is the honest headline for a taxonomy page. (Summing the tally's counts
    // would answer a different question badly — a project with five tags would
    // be counted five times, which is how a 16,972-project corpus produces a
    // "35k tagged projects" figure.)
    supabase.rpc('tag_tally', undefined, { count: 'exact', head: true }),
  ]);

  const topTally = topRows ?? [];
  const curatedTally = new Map((curatedRows ?? []).map((row) => [row.slug, row.count]));

  const entry = (row: TagRow): TagEntry => ({
    slug: row.slug,
    label: row.label,
    count: curatedTally.get(row.slug) ?? 0,
    description: row.description,
  });

  const stacks = taxonomy.filter((row) => row.kind === 'stack').map(entry);
  const topics = taxonomy.filter((row) => row.kind === 'topic').map(entry);

  // Curated tags already have their own section above; repeating them in the
  // ranked list would spend the directory's best slots on itself.
  const curatedSet = new Set(curatedSlugs);
  const popular: TagEntry[] = topTally
    .filter((row) => !curatedSet.has(row.slug))
    .map((row) => ({ slug: row.slug, label: row.slug, count: row.count }));

  const stats: Stat[] = [];
  if (tagsInUse && tagsInUse > 0) {
    stats.push({ label: copy.tagsUnitInUse, tone: 'figure', value: formatCount(tagsInUse) });
  }

  const empty = stacks.length === 0 && topics.length === 0 && popular.length === 0;

  return (
    <>
      <MastheadBand>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <p className="font-mono text-[11.5px] tracking-widest text-muted-foreground uppercase">
              <span aria-hidden="true">{'// '}</span>
              {copy.tagsKicker}
            </p>
            <h1 className="font-display text-[32px] leading-[1.05] font-extrabold tracking-tight sm:text-[40px]">
              {copy.tagsTitle}
            </h1>
            <p className="max-w-[52ch] text-[16.5px] leading-relaxed text-muted-foreground">
              {copy.tagsNote}
            </p>
          </div>
          <StatBlock stats={stats} className="lg:w-[260px] lg:shrink-0" />
        </div>
      </MastheadBand>

      <PageShell className="flex flex-col gap-16 py-10 sm:gap-20">
        {empty ? (
          <EmptyState message={copy.emptyFeed} />
        ) : (
          <>
            {stacks.length > 0 || topics.length > 0 ? (
              <section className="flex flex-col gap-6">
                <SectionHead kicker={copy.tagsCuratedKicker} title={copy.tagsCuratedTitle} />
                <div className="flex flex-col gap-8">
                  <CuratedGroup label={copy.tagsStackLabel} entries={stacks} />
                  <CuratedGroup label={copy.tagsTopicLabel} entries={topics} />
                </div>
              </section>
            ) : null}

            {popular.length > 0 ? (
              <section className="flex flex-col gap-6">
                <SectionHead
                  kicker={copy.tagsPopularKicker}
                  title={copy.tagsPopularTitle}
                  note={copy.tagsPopularNote}
                />
                <div className="flex flex-wrap gap-2">
                  {popular.map((tagEntry) => (
                    <TagCountLink key={tagEntry.slug} {...tagEntry} />
                  ))}
                </div>
                {/* Say what's missing. Most of the taxonomy is a long tail of
                    tags with a handful of projects each; they stay reachable
                    from any project page and from search, and listing them
                    here would bury the ones worth browsing. */}
                {tagsInUse && tagsInUse > popular.length ? (
                  <p className="font-mono text-[12.5px] text-muted-foreground">
                    {copy.tagsTailLead}{' '}
                    <span className="tabular-nums">{formatCount(tagsInUse)}</span>{' '}
                    {copy.tagsTailMid}{' '}
                    <Link
                      href="/search"
                      className="rounded-sm text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {copy.tagsTailLink}
                    </Link>
                    .
                  </p>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </PageShell>
    </>
  );
}

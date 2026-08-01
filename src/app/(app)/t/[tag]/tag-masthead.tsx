import { MastheadBand } from '@/components/masthead-band';
import { type Stat, StatBlock } from '@/components/stat-block';
import { TagChip } from '@/components/tag-chip';
import { copy } from '@/lib/copy';
import { formatCount } from '@/lib/format';

export type TagMastheadProps = {
  label: string;
  description: string | null;
  projectCount: number;
  /** Tags that co-occur with this one — the sideways move out of a dead end. */
  relatedTags: string[];
};

/**
 * A tag page's opening band, on the W3 spine.
 *
 * Before this, `/t/[tag]` was `PageShell > FeedSection`: no heading of any
 * kind, on what is the largest indexable surface dorkhub has (the sitemap
 * promotes every tag with three or more projects). Someone arriving from
 * search saw a grid and no answer to "what is this page".
 *
 * The related tags matter as much as the title: a tag page is the one surface
 * where the obvious next move is sideways rather than deeper, and there was no
 * route to take it.
 */
export function TagMasthead({ label, description, projectCount, relatedTags }: TagMastheadProps) {
  const stats: Stat[] = [];
  if (projectCount > 0) {
    stats.push({
      label: copy.statsUnitProjects,
      tone: 'figure',
      value: formatCount(projectCount),
    });
  }

  return (
    <MastheadBand>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <p className="font-mono text-[11.5px] tracking-widest text-muted-foreground uppercase">
            <span aria-hidden="true">{'// '}</span>
            {copy.tagKicker}
          </p>

          <h1 className="font-display text-[32px] leading-[1.05] font-extrabold tracking-tight sm:text-[40px]">
            <span aria-hidden="true" className="text-muted-foreground">
              #
            </span>
            {label}
          </h1>

          {description ? (
            <p className="max-w-[52ch] text-[16.5px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        <StatBlock stats={stats} className="lg:w-[260px] lg:shrink-0" />
      </div>

      {relatedTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-6">
          <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {copy.tagOftenWith}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {relatedTags.map((tag) => (
              <TagChip key={tag} tag={tag} hashPrefix />
            ))}
          </div>
        </div>
      ) : null}
    </MastheadBand>
  );
}

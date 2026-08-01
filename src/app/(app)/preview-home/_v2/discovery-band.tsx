import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import type { RisingMaker } from '@/lib/discovery/queries';
import type { FeedRow } from '@/lib/feed/queries';
import { RisingMakers } from './rising-makers';
import { TagRail } from './tag-rail';
import { WeirdSpotlight } from './weird-spotlight';

/**
 * The discovery band (U2 R1): the asymmetric row — weird spotlight (8 cols)
 * beside rising makers (4 cols) — then the curated tag rails. Everything in
 * here is non-personalized, anon-cached, and absence-gated: a module with no
 * data simply isn't there.
 */
export function DiscoveryBand({
  weird,
  makers,
  rails,
}: {
  weird: FeedRow | null;
  makers: RisingMaker[];
  rails: Array<{ tag: string; rows: FeedRow[] }>;
}) {
  const hasTopRow = weird !== null || makers.length > 0;
  const liveRails = rails.filter((rail) => rail.rows.length > 0);
  if (!hasTopRow && liveRails.length === 0) return null;

  return (
    <PageShell as="section" className="flex flex-col gap-8 py-12 sm:py-14">
      <p className="font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
        <span aria-hidden="true">{'// '}</span>
        {copy.discoverKicker}
      </p>

      {hasTopRow ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <WeirdSpotlight row={weird} />
          </div>
          <div className="lg:col-span-4">
            <RisingMakers makers={makers} />
          </div>
        </div>
      ) : null}

      {liveRails.map((rail) => (
        <TagRail key={rail.tag} tag={rail.tag} rows={rail.rows} />
      ))}
    </PageShell>
  );
}

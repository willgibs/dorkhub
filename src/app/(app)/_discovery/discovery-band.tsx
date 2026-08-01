import { PageShell } from '@/components/page-shell';
import { SectionHead } from '@/components/section-head';
import { copy } from '@/lib/copy';
import type { RisingMaker } from '@/lib/discovery/queries';
import type { FeedRow } from '@/lib/feed/queries';
import { QuickHits } from './quick-hits';
import { RisingMakers } from './rising-makers';
import { TagRail } from './tag-rail';
import { WeirdSpotlight } from './weird-spotlight';

/**
 * The discovery band (U2 R1, R2.5): the asymmetric row — weird spotlight
 * (8 cols) beside rising makers (4 cols) — then the quick-hits strip
 * (re-homed here from the gallery per R2), then the curated tag rails.
 * Everything in here is non-personalized, anon-cached, and absence-gated:
 * a module with no data simply isn't there.
 */
export function DiscoveryBand({
  weird,
  makers,
  quickHits = [],
  rails,
}: {
  weird: FeedRow | null;
  makers: RisingMaker[];
  quickHits?: FeedRow[];
  rails: Array<{ tag: string; rows: FeedRow[] }>;
}) {
  const hasTopRow = weird !== null || makers.length > 0;
  const liveRails = rails.filter((rail) => rail.rows.length > 0);
  if (!hasTopRow && quickHits.length === 0 && liveRails.length === 0) return null;

  return (
    <PageShell as="section" className="flex flex-col gap-10 py-16 sm:py-20">
      <SectionHead
        kicker={copy.discoverKicker}
        title={copy.discoverTitle}
        note={copy.discoverNote}
      />

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

      <QuickHits rows={quickHits} />

      {liveRails.map((rail) => (
        <TagRail key={rail.tag} tag={rail.tag} rows={rail.rows} />
      ))}
    </PageShell>
  );
}

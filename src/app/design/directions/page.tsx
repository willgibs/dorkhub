import type { Metadata } from 'next';

import '@/styles/directions.css';

import { EngagementProvider } from '@/app/(app)/_engagement/engagement-context';
import { renderFeedCards } from '@/app/(app)/_feed/render-cards';
import { DirectionSwitcher } from '@/app/design/directions/direction-switcher';
import { SectionHeader } from '@/components/section-header';
import { TagChip } from '@/components/tag-chip';
import { Button } from '@/components/ui/button';
import { getFeedPage } from '@/lib/feed/queries';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'directions',
  description: 'U1 closed — the adopted abyss look vs legacy, on real content.',
  // Transient comparison surface, deliberately NOT in the sitemap and
  // noindexed (survives the launch robots flip, same idiom as /search).
  robots: { index: false, follow: true },
};

/**
 * U1 round closer (docs/plans/u1-ui-refresh.md): R3 adopted electric-abyss
 * with the current type (D56, 2026-07-31), so the unskinned control IS the
 * product now. The legacy skin shows pre-U1 quiet-dev-native for
 * before/after. Delete this page + src/styles/directions.css when done.
 */
export default async function DirectionsPage() {
  const { rows } = await getFeedPage({ sort: 'trending', tag: null });
  const preview = rows.slice(0, 6);
  const ids = preview.map((row) => row.id);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        kicker="directions"
        title="abyss, adopted"
        note="U1 closed 2026-07-31 — abyss won, with our type. legacy stays for the before/after."
      />
      <DirectionSwitcher>
        {/* type + action specimen */}
        <div className="flex flex-col gap-5">
          <p className="font-mono text-xs text-muted-foreground">
            <span aria-hidden="true">{'// '}</span>a home for the things you build for fun
          </p>
          <h2 className="max-w-[26ch] font-display text-4xl leading-[1.08] font-extrabold tracking-tight">
            connect github, pick the repos you love, give each one a page.
          </h2>
          <p className="max-w-[52ch] text-[15px] leading-7 text-muted-foreground">
            free to browse, free to fork. the interface whispers, the projects glow — that part
            stays true in every direction; only the voice of the room changes.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button>show your thing</Button>
            <Button variant="secondary">browse projects</Button>
            <Button variant="outline">surprise me</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <TagChip tag="generative-art" hashPrefix />
            <TagChip tag="cli" hashPrefix />
            <TagChip tag="synth" hashPrefix active />
            <TagChip tag="homelab" hashPrefix />
          </div>
        </div>

        {/* the real thing: live trending cards, exact production markup */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs text-muted-foreground">
            <span aria-hidden="true">{'// '}</span>trending, live
          </p>
          <EngagementProvider projectIds={ids}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {renderFeedCards(preview)}
            </div>
          </EngagementProvider>
        </div>
      </DirectionSwitcher>
    </div>
  );
}

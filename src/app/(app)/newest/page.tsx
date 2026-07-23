import type { Metadata } from 'next';

import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';

/**
 * Recent-sort feed, all tags — the secondary "newest" chip
 * (docs/plans/p2.5-self-running.md locked decision 9; trending is now the
 * default at `/`).
 */
export const revalidate = 60;

export const metadata: Metadata = { title: copy.sortNewest };

export default function NewestPage() {
  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <FeedSection sort="recent" />
    </PageShell>
  );
}

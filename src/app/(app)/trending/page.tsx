import type { Metadata } from 'next';

import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { PageShell } from '@/components/page-shell';

/** Trending-sort feed, all tags (docs/plans/m5-discovery.md Wave 3B decision 1). */
export const revalidate = 60;

export const metadata: Metadata = { title: 'trending' };

export default function TrendingPage() {
  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <FeedSection sort="trending" />
    </PageShell>
  );
}

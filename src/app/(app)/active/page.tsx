import type { Metadata } from 'next';

import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';

/**
 * Recently-pushed feed, all tags — the third sort chip (U2, migration 0021).
 * "Active" reads `github_pushed_at`, the honest upstream-activity signal:
 * our own sync writes move `updated_at`, only a real push moves this one.
 * Projects that have never been synced are outside the sort's domain rather
 * than silently last.
 */
export const revalidate = 60;

export const metadata: Metadata = { title: copy.sortActive };

export default function ActivePage() {
  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <FeedSection sort="active" />
    </PageShell>
  );
}

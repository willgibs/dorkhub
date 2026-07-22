import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { PageShell } from '@/components/page-shell';
import { supabaseAnon } from '@/lib/supabase/clients';
import { resolveTagLabel } from '@/lib/tags/label';
import { resolveTagSlug } from '@/lib/tags/slug';

/**
 * Trending-sort feed scoped to one tag — sibling of `/t/[tag]` (recent sort);
 * same shape, different `sort` (docs/plans/m5-discovery.md Wave 3B decision 1).
 */
export const revalidate = 60;

type TagTrendingPageProps = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: TagTrendingPageProps): Promise<Metadata> {
  const { tag: rawTag } = await params;
  const tag = resolveTagSlug(rawTag);
  if (!tag) return {};

  const label = await resolveTagLabel(tag, supabaseAnon());
  return { title: `#${label}` };
}

export default async function TagTrendingPage({ params }: TagTrendingPageProps) {
  const { tag: rawTag } = await params;
  const tag = resolveTagSlug(rawTag);
  if (!tag) notFound();

  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <FeedSection sort="trending" tag={tag} />
    </PageShell>
  );
}

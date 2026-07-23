import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { PageShell } from '@/components/page-shell';
import { supabaseAnon } from '@/lib/supabase/clients';
import { resolveTagLabel } from '@/lib/tags/label';
import { resolveTagSlug } from '@/lib/tags/slug';

/**
 * Recent-sort feed scoped to one tag — sibling of `/t/[tag]` (now
 * trending-default, docs/plans/p2.5-self-running.md locked decision 9); same
 * shape, different `sort`.
 */
export const revalidate = 60;

type TagNewestPageProps = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: TagNewestPageProps): Promise<Metadata> {
  const { tag: rawTag } = await params;
  const tag = resolveTagSlug(rawTag);
  if (!tag) return {};

  const label = await resolveTagLabel(tag, supabaseAnon());
  return { title: `#${label}` };
}

export default async function TagNewestPage({ params }: TagNewestPageProps) {
  const { tag: rawTag } = await params;
  const tag = resolveTagSlug(rawTag);
  if (!tag) notFound();

  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <FeedSection sort="recent" tag={tag} />
    </PageShell>
  );
}

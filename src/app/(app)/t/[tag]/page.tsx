import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { TagMasthead } from '@/app/(app)/t/[tag]/tag-masthead';
import { PageShell } from '@/components/page-shell';
import { getTagContext, getTagMeta } from '@/lib/tags/meta';
import { resolveTagSlug } from '@/lib/tags/slug';

/**
 * Trending-sort feed scoped to one tag (docs/plans/p2.5-self-running.md
 * locked decision 9 — trending is the gallery default). `/t/[tag]/newest`
 * is the sibling recent-sort route — same shape, different `sort`.
 */
export const revalidate = 60;

type TagPageProps = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag: rawTag } = await params;
  const tag = resolveTagSlug(rawTag);
  if (!tag) return {};

  const { label, description } = await getTagMeta(tag);
  return {
    title: `#${label}`,
    // A curated description is written for this tag; the fallback is the
    // generic line these pages have always carried.
    description:
      description ?? `open-source ${label} projects to browse, fork and borrow — on dorkhub`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag: rawTag } = await params;
  const tag = resolveTagSlug(rawTag);
  if (!tag) notFound();

  const [meta, context] = await Promise.all([getTagMeta(tag), getTagContext(tag)]);

  return (
    <>
      <TagMasthead
        label={meta.label}
        description={meta.description}
        projectCount={context.projectCount}
        relatedTags={context.relatedTags}
      />
      <PageShell className="flex flex-col gap-8 py-10">
        <FeedSection sort="trending" tag={tag} />
      </PageShell>
    </>
  );
}

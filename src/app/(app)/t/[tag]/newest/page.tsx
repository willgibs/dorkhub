import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { TagMasthead } from '@/app/(app)/t/[tag]/tag-masthead';
import { PageShell } from '@/components/page-shell';
import { getTagContext, getTagMeta } from '@/lib/tags/meta';
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

  const { label, description } = await getTagMeta(tag);
  return {
    title: `#${label}`,
    description: description ?? `open-source ${label} projects, newest first — on dorkhub`,
  };
}

export default async function TagNewestPage({ params }: TagNewestPageProps) {
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
        <FeedSection sort="recent" tag={tag} />
      </PageShell>
    </>
  );
}

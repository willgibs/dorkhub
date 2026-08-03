import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FeedSection } from '@/app/(app)/_feed/feed-section';
import { TagMasthead } from '@/app/(app)/t/[tag]/tag-masthead';
import { PageShell } from '@/components/page-shell';
import { getTagContext, getTagMeta, topTagSlugs } from '@/lib/tags/meta';
import { resolveTagSlug } from '@/lib/tags/slug';

/**
 * Trending-sort feed scoped to one tag (docs/plans/p2.5-self-running.md
 * locked decision 9 — trending is the gallery default). `/t/[tag]/newest`
 * is the sibling recent-sort route — same shape, different `sort`.
 */
/**
 * Cache posture (2026-08-03 cost incident). `generateStaticParams` is what
 * puts a dynamic route into Next's full route cache — without it Vercel
 * served every hit `no-store` and each crawl was a fresh render. The list is
 * deliberately short; `dynamicParams` stays at its default `true`, so the
 * long tail still renders on demand and is cached from then on.
 *
 * `revalidate` is an hour rather than a minute: this corpus moves at
 * GitHub-sync cadence, and at 60s a crawler returning two minutes later paid
 * for a full re-render. Wave 3 adds on-demand revalidation from the sync
 * pipeline, which is what makes a long window safe rather than merely cheap.
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return topTagSlugs();
}

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

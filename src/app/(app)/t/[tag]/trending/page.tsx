import { notFound, permanentRedirect } from 'next/navigation';

import { resolveTagSlug } from '@/lib/tags/slug';

/**
 * Retired route — trending is now the default sort at `/t/[tag]`
 * (docs/plans/p2.5-self-running.md locked decision 9). 308 (not the 307
 * `redirect()` gives) so search engines and bookmarks repoint permanently;
 * still 404s on a malformed tag rather than redirecting garbage.
 */
type TagTrendingRedirectProps = { params: Promise<{ tag: string }> };

export default async function TagTrendingRedirect({ params }: TagTrendingRedirectProps) {
  const { tag: rawTag } = await params;
  const tag = resolveTagSlug(rawTag);
  if (!tag) notFound();

  permanentRedirect(`/t/${tag}`);
}

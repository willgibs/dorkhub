import type { Metadata } from 'next';

import { NotFoundContent } from '@/components/not-found-content';

export const metadata: Metadata = { title: '404' };

/**
 * 404 boundary for the (app) group — every `notFound()` in the product tree
 * (project, profile, tag, list pages) lands here.
 *
 * Content ONLY, no chrome: this boundary renders INSIDE `(app)/layout.tsx`,
 * which already supplies the header, `<main>`, and footer. The root
 * `not-found.tsx` supplies its own chrome instead, because a path that
 * matches no route group never reaches a group layout. Without this file
 * every in-app 404 rendered the whole shell twice (caught in U2 QA — two
 * headers, two mains, two footers).
 */
export default function AppNotFound() {
  return <NotFoundContent />;
}

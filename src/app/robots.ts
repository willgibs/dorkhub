import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';

// noindex until launch-go (P4 L5): the robots FLIP is this rule swapping to
// `allow: '/'` — in the SAME commit as removing layout.tsx's
// `robots: { index: false }` metadata. Both halves or neither.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

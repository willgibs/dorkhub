import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';

// Public since launch (P4 L5, 2026-07-31) — this flip landed in the SAME
// commit as removing layout.tsx's `robots: { index: false }` metadata.
// /search keeps its own page-level noindex (thin client-rendered results).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

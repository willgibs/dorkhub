import type { MetadataRoute } from 'next';

// noindex until M9 launch: placeholder copy + non-canonical *.vercel.app domain must not index. Flip at launch.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
    sitemap: 'https://dorkhub.com/sitemap.xml',
  };
}

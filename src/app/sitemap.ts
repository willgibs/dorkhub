import type { MetadataRoute } from 'next';

const BASE_URL = 'https://dorkhub.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, priority: 1.0 },
    { url: `${BASE_URL}/manifesto`, priority: 0.8 },
    { url: `${BASE_URL}/design`, priority: 0.3 },
    { url: `${BASE_URL}/design/components`, priority: 0.3 },
    { url: `${BASE_URL}/design/motion`, priority: 0.3 },
    { url: `${BASE_URL}/design/typography`, priority: 0.3 },
    { url: `${BASE_URL}/design/voice`, priority: 0.3 },
  ];
}

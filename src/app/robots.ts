import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = 'https://ghazal.jo';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/pos/', '/api/'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/logo.png', '/favicon.ico', '/icon.png', '/apple-icon.png', '/favicon-*.png', '/icon-*.png'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

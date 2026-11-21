import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/** /robots.txt: crawl the public pages; keep out of private pages and the API */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: ['/', '/c/'], disallow: ['/journal', '/character', '/guild', '/api/', '/login', '/register'] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}

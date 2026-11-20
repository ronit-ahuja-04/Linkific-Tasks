import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/** /robots.txt: crawl everything except the API and the page that throws on purpose */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/broken'] }, sitemap: `${SITE.url}/sitemap.xml` };
}

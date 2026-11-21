import type { MetadataRoute } from 'next';
import { listPublicHandles } from '@/lib/server/public';
import { SITE } from '@/lib/site';

/** /sitemap.xml: the home page and every public character sheet (cached; refreshed when the guild changes) */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const handles = await listPublicHandles();
  return [{ url: SITE.url, changeFrequency: 'daily', priority: 1 }, ...handles.map((h) => ({ url: `${SITE.url}/c/${h}`, changeFrequency: 'daily' as const, priority: 0.8 }))];
}

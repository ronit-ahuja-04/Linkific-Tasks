import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { SITE } from '@/lib/site';

/** /sitemap.xml, generated from the posts: a new Markdown file is listed on the next build with no extra work */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const pages = ['', '/blog', '/rendering', '/about', '/contact'].map((path) => ({ url: `${SITE.url}${path}` }));
  const articles = posts.map((post) => ({ url: `${SITE.url}/blog/${post.slug}`, lastModified: post.date }));
  return [...pages, ...articles];
}

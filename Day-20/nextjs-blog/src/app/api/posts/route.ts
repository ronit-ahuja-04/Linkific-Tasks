import { getAllPosts } from '@/lib/posts';

/**
 * ROUTE HANDLER: GET /api/posts. A file named route.ts answers HTTP requests instead of rendering a page.
 * It reads cached data and touches nothing request-specific, so Next.js builds the JSON once at build time (static).
 */
export async function GET() {
  const posts = await getAllPosts();
  return Response.json({ count: posts.length, posts });
}

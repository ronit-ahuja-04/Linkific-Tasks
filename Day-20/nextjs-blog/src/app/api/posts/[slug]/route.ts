import { getPost } from '@/lib/posts';

/** GET /api/posts/<slug>: a dynamic segment in a route handler. `RouteContext` types `params` from the folder name. */
export async function GET(_request: Request, ctx: RouteContext<'/api/posts/[slug]'>) {
  const { slug } = await ctx.params;
  const post = await getPost(slug);
  if (!post) return Response.json({ error: 'Post not found', slug }, { status: 404 });
  return Response.json(post);
}

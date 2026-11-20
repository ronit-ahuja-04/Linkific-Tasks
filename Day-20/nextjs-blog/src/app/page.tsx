import Link from 'next/link';
import PostCard from '@/components/PostCard';
import { getAllPosts, getTags } from '@/lib/posts';

/**
 * The home page is a Server Component that awaits cached data, so it is rendered once at build time (STATIC):
 * the HTML for this page is ready before anyone asks for it.
 */
export default async function HomePage() {
  const [posts, tags] = await Promise.all([getAllPosts(), getTags()]);
  return (
    <>
      <section className="hero">
        <h1>Notes on Next.js, written while learning it.</h1>
        <p>Routing, server and client components, data fetching, caching and rendering strategies, each in a few minutes of reading.</p>
        <Link href="/blog" className="btn-primary">Read the blog</Link>{' '}
        <Link href="/rendering" className="btn">See SSG, ISR, SSR and CSR live</Link>
      </section>

      <div className="section-head">
        <h2>Latest posts</h2>
        <Link href="/blog">All posts</Link>
      </div>
      <ul className="grid">
        {posts.slice(0, 3).map((post, index) => <li key={post.slug}><PostCard post={post} priority={index === 0} /></li>)}
      </ul>

      <div className="section-head"><h2>Topics</h2></div>
      <ul className="tags">
        {tags.map(({ tag, count }) => <li key={tag}><Link href={`/blog?tag=${encodeURIComponent(tag)}`}>#{tag} ({count})</Link></li>)}
      </ul>
    </>
  );
}

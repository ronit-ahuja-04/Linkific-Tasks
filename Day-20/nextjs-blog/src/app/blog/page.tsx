import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import PostCard from '@/components/PostCard';
import { ListSkeleton } from '@/components/Skeletons';
import { getAllPosts, getTags } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Every post on Dispatch, filterable by topic.',
  alternates: { canonical: '/blog' },
};

/**
 * The heading is static. The filtered list reads `searchParams` (the `?tag=` part of the URL), which only exists
 * once a request arrives, so it is wrapped in Suspense: the shell is sent at once and the list streams in.
 */
export default function BlogPage(props: PageProps<'/blog'>) {
  return (
    <>
      <h1>Blog</h1>
      <Suspense fallback={<ListSkeleton />}>
        <FilteredPosts searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function FilteredPosts({ searchParams }: Pick<PageProps<'/blog'>, 'searchParams'>) {
  const { tag } = await searchParams;
  const selected = typeof tag === 'string' ? tag : undefined; // `?tag=a&tag=b` is an array: only a single value counts
  const [posts, tags] = await Promise.all([getAllPosts(), getTags()]);
  const shown = selected ? posts.filter((post) => post.tags.includes(selected)) : posts;
  return (
    <>
      <nav className="filters" aria-label="Filter by topic">
        <Link href="/blog" aria-current={selected ? undefined : 'true'}>All</Link>
        {tags.map(({ tag: name }) => (
          <Link key={name} href={`/blog?tag=${encodeURIComponent(name)}`} aria-current={selected === name ? 'true' : undefined}>#{name}</Link>
        ))}
      </nav>
      {shown.length === 0 ? (
        <p>No posts tagged “{selected}”. <Link href="/blog">Show all posts</Link>.</p>
      ) : (
        <ul className="grid">{shown.map((post) => <li key={post.slug}><PostCard post={post} /></li>)}</ul>
      )}
    </>
  );
}

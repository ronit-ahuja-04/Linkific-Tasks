import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Disclosure from '@/components/Disclosure';
import LikeButton from '@/components/LikeButton';
import Markdown from '@/components/Markdown';
import PostCard from '@/components/PostCard';
import { formatDate } from '@/lib/parse-post';
import { getAllPosts, getPost, getPostSlugs } from '@/lib/posts';
import { SITE } from '@/lib/site';

/**
 * DYNAMIC ROUTE: the folder name `[slug]` matches any value, which arrives in `params` (a Promise in this version).
 * `generateStaticParams` lists the slugs to build ahead of time, so these posts are static HTML. A slug that is not
 * listed is still handled: Next.js serves the shell, renders the page on the first visit, and caches the result.
 */
export async function generateStaticParams() {
  return (await getPostSlugs()).map((slug) => ({ slug }));
}

/** Per-post SEO: title, description, canonical URL, Open Graph and Twitter cards, all from the post itself */
export async function generateMetadata(props: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post not found', robots: { index: false } };
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: post.author }],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      images: [{ url: post.cover.src, width: 1200, height: 630, alt: post.cover.alt }],
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt, images: [post.cover.src] },
  };
}

export default async function PostPage(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound(); // renders the nearest not-found.tsx

  const related = (await getAllPosts()).filter((other) => other.slug !== post.slug && other.tags.some((tag) => post.tags.includes(tag))).slice(0, 2);

  // Structured data for search engines. `<` is escaped so the text can never close the script tag.
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { '@type': 'Person', name: post.author },
    image: `${SITE.url}${post.cover.src}`,
  }).replace(/</g, '\\u003c');

  return (
    <article className="article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <p className="crumbs"><Link href="/blog">Blog</Link> / {post.title}</p>
      <h1>{post.title}</h1>
      <p className="meta">
        By {post.author} · <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min read
      </p>
      <div className="article-cover">
        {/* priority: this is the biggest thing above the fold, so it is preloaded instead of lazy-loaded */}
        <Image src={post.cover.src} alt={post.cover.alt} width={1200} height={630} sizes="(min-width: 760px) 720px, 100vw" priority />
      </div>
      <Markdown source={post.body} />
      <div className="article-actions">
        <LikeButton />
        <ul className="tags">{post.tags.map((tag) => <li key={tag}><Link href={`/blog?tag=${encodeURIComponent(tag)}`}>#{tag}</Link></li>)}</ul>
      </div>
      <Disclosure summary="About the author">
        <p><strong>{post.author}</strong> is a developer-in-training at Linkific, writing these notes while working through Next.js.</p>
      </Disclosure>
      {related.length > 0 && (
        <>
          <div className="section-head"><h2>Related posts</h2></div>
          <ul className="grid">{related.map((other) => <li key={other.slug}><PostCard post={other} /></li>)}</ul>
        </>
      )}
    </article>
  );
}

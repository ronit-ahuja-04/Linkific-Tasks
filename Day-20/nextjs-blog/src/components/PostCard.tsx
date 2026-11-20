import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/parse-post';
import type { PostSummary } from '@/lib/types';

/**
 * One post in a list. A Server Component (no state, no handlers), so it adds nothing to the browser's JavaScript.
 * `sizes` tells the browser how wide the image will be at each screen width, so it downloads the smallest file that fits.
 */
export default function PostCard({ post, priority = false }: { post: PostSummary; priority?: boolean }) {
  return (
    <article className="card">
      <Link href={`/blog/${post.slug}`} className="card-image" tabIndex={-1} aria-hidden="true">
        <Image src={post.cover.src} alt="" width={1200} height={630} sizes="(min-width: 900px) 360px, 100vw" priority={priority} />
      </Link>
      <div className="card-body">
        <p className="meta">
          <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min read
        </p>
        <h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3>
        <p>{post.excerpt}</p>
        <ul className="tags">{post.tags.map((tag) => <li key={tag}><Link href={`/blog?tag=${encodeURIComponent(tag)}`}>#{tag}</Link></li>)}</ul>
      </div>
    </article>
  );
}

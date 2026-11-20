import Link from 'next/link';

/** Rendered when `notFound()` is called inside /blog/[slug]: a post that does not exist */
export default function PostNotFound() {
  return (
    <div className="error-box">
      <h1>Post not found</h1>
      <p>There is no post at this address. It may have been renamed.</p>
      <Link href="/blog" className="btn-primary">Back to the blog</Link>
    </div>
  );
}

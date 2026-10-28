import BlogPostCard from './BlogPostCard';
import EmptyState from './EmptyState';
import './BlogPostList.css';

/**
 * BlogPostList component demonstrating:
 * - List rendering with `Array.prototype.map()` using unique keys (`key={post.id}`)
 * - Conditional rendering: EmptyState when posts array is empty
 * - Passing `onReadMore` handler down to child cards
 */
function BlogPostList({ posts = [], onReadMore }) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return (
      <EmptyState
        icon="✍️"
        title="No Articles Published"
        message="There are currently no blog articles available to display."
      />
    );
  }

  return (
    <div className="blog-list-container">
      <div className="blog-list-grid">
        {posts.map((post) => (
          <BlogPostCard
            key={post.id}
            post={post}
            onReadMore={onReadMore}
          />
        ))}
      </div>
    </div>
  );
}

export default BlogPostList;

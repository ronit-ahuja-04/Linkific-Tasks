import Card from './Card';
import Button from './Button';
import './BlogPostCard.css';

/**
 * BlogPostCard component demonstrating:
 * - Complex nested props: `post` object containing nested `author` object, arrays, and booleans
 * - List rendering for post tags
 * - Conditional rendering: featured badge and author avatars
 * - Composition: wrapping layout in generic `Card`
 */
function BlogPostCard({ post, onReadMore }) {
  if (!post) return null;

  const {
    id,
    title = 'Untitled Article',
    excerpt = '',
    coverImage,
    date = 'Recent',
    readTime = '3 min read',
    tags = [],
    featured = false,
    author = { name: 'Anonymous', role: 'Contributor' },
  } = post;

  const handleRead = () => {
    if (typeof onReadMore === 'function') {
      onReadMore(post);
    } else {
      alert(`Opening article: "${title}"`);
    }
  };

  return (
    <Card className={`blog-card ${featured ? 'is-featured' : ''}`} elevation="md">
      {coverImage && (
        <div className="blog-cover-wrapper">
          <img src={coverImage} alt={title} className="blog-cover-img" loading="lazy" />
          {featured && <span className="blog-featured-badge">Featured Article</span>}
        </div>
      )}

      <div className="blog-card-content">
        <div className="blog-meta-header">
          <time className="blog-date">{date}</time>
          <span className="blog-meta-dot">&bull;</span>
          <span className="blog-read-time">{readTime}</span>
        </div>

        <h3 className="blog-title">{title}</h3>
        <p className="blog-excerpt">{excerpt}</p>

        {Array.isArray(tags) && tags.length > 0 && (
          <div className="blog-tags">
            {tags.map((tag) => (
              <span key={`${id}-${tag}`} className="blog-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="blog-card-footer">
        <div className="blog-author-box">
          {author.avatar ? (
            <img src={author.avatar} alt={author.name} className="blog-author-avatar" />
          ) : (
            <div className="blog-author-avatar-fallback">
              {author.name ? author.name[0] : 'A'}
            </div>
          )}
          <div className="blog-author-info">
            <span className="blog-author-name">{author.name}</span>
            <span className="blog-author-role">{author.role}</span>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleRead}>
          Read Article
        </Button>
      </div>
    </Card>
  );
}

export default BlogPostCard;

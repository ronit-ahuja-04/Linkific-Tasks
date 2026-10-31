import { useFetch } from '../../hooks/useFetch.js';
import { buildUserPostsUrl } from '../../lib/api.js';
import { ErrorPanel } from './ErrorPanel.jsx';

/**
 * User posts panel demonstrating dependency-driven refetching with useFetch.
 * Meets requirements UP-1, UP-2, and UP-3.
 */
export function UserPosts({ userId, onClose }) {
  const postsUrl = buildUserPostsUrl(userId);
  const { data, loading, error, refetch } = useFetch(postsUrl);

  const posts = data?.posts || [];

  return (
    <div className="live-card">
      <div className="live-card-header">
        <div className="live-card-title-group">
          <h3>Participant Posts</h3>
          {userId ? (
            <span className="live-badge-pill">User #{userId}</span>
          ) : (
            <p className="live-card-subtitle">Select a participant to view posts</p>
          )}
        </div>
        {userId && (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            title="Deselect participant"
          >
            Clear selection ✕
          </button>
        )}
      </div>

      <div>
        {!userId ? (
          <div className="live-empty-box">
            <span style={{ fontSize: '2rem' }} aria-hidden="true">
              👤
            </span>
            <div className="live-empty-title">No participant selected</div>
            <div className="live-empty-desc">
              Click any participant in the directory to inspect their posts and observe
              dependency-driven refetching.
            </div>
          </div>
        ) : error ? (
          <ErrorPanel message={error} onRetry={refetch} />
        ) : loading ? (
          <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label="Loading user posts"
            className="live-skeleton-list"
          >
            {[1, 2, 3].map((key) => (
              <div key={key} className="live-skeleton-row" style={{ padding: '16px' }}>
                <div className="live-skeleton-lines">
                  <div className="live-skeleton-line-title" style={{ width: '60%' }} />
                  <div className="live-skeleton-line-sub" style={{ width: '90%' }} />
                  <div className="live-skeleton-line-sub" style={{ width: '75%' }} />
                </div>
              </div>
            ))}
            <span className="sr-only">Loading participant posts...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="live-empty-box">
            <div className="live-empty-title">No posts published yet</div>
            <div className="live-empty-desc">This participant has not submitted any posts.</div>
          </div>
        ) : (
          <div className="live-posts-list">
            {posts.map((post) => (
              <article key={post.id} className="live-post-card">
                <div className="live-post-title">{post.title}</div>
                <div className="live-post-body">{post.body}</div>
                {post.tags && post.tags.length > 0 && (
                  <div className="live-post-tags-row">
                    {post.tags.map((tag) => (
                      <span key={tag} className="live-post-tag-pill">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {userId && data && !loading && !error && (
        <div
          className="live-search-status-row"
          style={{ paddingTop: '8px', borderTop: '1px solid var(--color-rule)' }}
        >
          <span>
            {posts.length} post{posts.length === 1 ? '' : 's'} loaded
          </span>
          <span>Endpoint: /users/{userId}/posts</span>
        </div>
      )}
    </div>
  );
}

import { Placeholder } from 'react-bootstrap';
import { useFetch } from '../../hooks/useFetch.js';
import { buildUserPostsUrl } from '../../lib/api.js';
import ContentModal from '../ContentModal.jsx';
import { Badge, Button } from '../ui.jsx';
import { ErrorPanel } from './ErrorPanel.jsx';

/**
 * User posts panel demonstrating dependency-driven refetching with useFetch.
 * Meets requirements UP-1, UP-2, and UP-3.
 * Shown in a modal while a participant id is present in the URL.
 */
export function UserPosts({ userId, onClose }) {
  const postsUrl = buildUserPostsUrl(userId);
  const { data, loading, error, refetch } = useFetch(postsUrl);

  const posts = data?.posts || [];

  return (
    <ContentModal
      show={Boolean(userId)}
      onHide={onClose}
      size="lg"
      title={
        <span className="d-inline-flex flex-wrap align-items-center gap-2">
          Participant Posts
          {userId && <Badge tone="accent">User #{userId}</Badge>}
        </span>
      }
      footer={
        userId && data && !loading && !error ? (
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 w-100 font-monospace small text-uppercase ls-wide text-body-secondary">
            <span>
              {posts.length} post{posts.length === 1 ? '' : 's'} loaded
            </span>
            <span>Endpoint: /users/{userId}/posts</span>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={onClose} title="Deselect participant">
            Clear selection ✕
          </Button>
        )
      }
    >
      {!userId ? (
        <div className="d-flex flex-column align-items-center gap-2 rounded-4 border border-dashed bg-body-tertiary p-4 p-sm-5 text-center">
          <span className="fs-2" aria-hidden="true">
            👤
          </span>
          <div className="fw-semibold">No participant selected</div>
          <div className="small text-body-secondary">
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
          className="d-flex flex-column gap-3"
        >
          {[1, 2, 3].map((key) => (
            <Placeholder key={key} as="div" animation="glow" className="border rounded-3 p-3">
              <Placeholder xs={7} className="d-block mb-2" />
              <Placeholder xs={11} size="sm" className="d-block mb-2" />
              <Placeholder xs={9} size="sm" className="d-block" />
            </Placeholder>
          ))}
          <span className="visually-hidden">Loading participant posts...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="d-flex flex-column align-items-center gap-2 rounded-4 border border-dashed bg-body-tertiary p-4 p-sm-5 text-center">
          <div className="fw-semibold">No posts published yet</div>
          <div className="small text-body-secondary">
            This participant has not submitted any posts.
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {posts.map((post) => (
            <article key={post.id} className="border rounded-3 p-3 bg-body">
              <div className="fw-semibold text-capitalize">{post.title}</div>
              <div className="mt-1 small text-body-secondary">{post.body}</div>
              {post.tags && post.tags.length > 0 && (
                <div className="mt-3 d-flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} tone="accent">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </ContentModal>
  );
}

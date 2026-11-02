import { useFetch } from '../../hooks/useFetch.js';
import { buildUserPostsUrl } from '../../lib/api.js';
import { Badge, Button, Card } from '../ui.jsx';
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
    <Card className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">Participant Posts</h3>
          {userId ? (
            <Badge tone="accent" className="mt-1.5">
              User #{userId}
            </Badge>
          ) : (
            <p className="mt-1 text-sm text-muted">Select a participant to view posts</p>
          )}
        </div>
        {userId && (
          <Button variant="secondary" size="sm" onClick={onClose} title="Deselect participant">
            Clear selection ✕
          </Button>
        )}
      </div>

      <div>
        {!userId ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface-2 p-8 text-center">
            <span className="text-3xl" aria-hidden="true">
              👤
            </span>
            <div className="font-display text-base font-semibold">No participant selected</div>
            <div className="text-sm text-muted">
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
            className="flex flex-col gap-3"
          >
            {[1, 2, 3].map((key) => (
              <div key={key} className="rounded-xl border border-line bg-surface p-4">
                <div className="space-y-2">
                  <div className="h-3.5 w-3/5 animate-pulse rounded bg-surface-2" />
                  <div className="h-3 w-[90%] animate-pulse rounded bg-surface-2" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-surface-2" />
                </div>
              </div>
            ))}
            <span className="sr-only">Loading participant posts...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface-2 p-8 text-center">
            <div className="font-display text-base font-semibold">No posts published yet</div>
            <div className="text-sm text-muted">This participant has not submitted any posts.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-xl border border-line bg-surface p-4 transition hover:border-accent/40"
              >
                <div className="font-display text-sm font-semibold capitalize">{post.title}</div>
                <div className="mt-1.5 text-sm leading-relaxed text-muted">{post.body}</div>
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[0.65rem] text-accent"
                      >
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 font-mono text-[0.68rem] uppercase tracking-wider text-muted">
          <span>
            {posts.length} post{posts.length === 1 ? '' : 's'} loaded
          </span>
          <span>Endpoint: /users/{userId}/posts</span>
        </div>
      )}
    </Card>
  );
}

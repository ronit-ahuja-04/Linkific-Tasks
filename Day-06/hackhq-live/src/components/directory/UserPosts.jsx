import { useFetch } from '../../hooks/useFetch.js';
import { buildUserPostsUrl } from '../../lib/api.js';
import { ErrorPanel } from './ErrorPanel.jsx';

/**
 * User posts panel demonstrating dependency-driven refetching with useFetch.
 * Meets requirements UP-1, UP-2, and UP-3 (race-condition resilient).
 *
 * @param {{ userId: number|null, onClose: () => void }} props
 */
export function UserPosts({ userId, onClose }) {
  const postsUrl = buildUserPostsUrl(userId);
  const { data, loading, error, refetch } = useFetch(postsUrl);

  const posts = data?.posts || [];

  return (
    <section className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col h-full min-h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-100">Participant Posts</h3>
          {userId ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              User #{userId}
            </span>
          ) : null}
        </div>
        {userId && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Deselect participant"
          >
            Clear selection ✕
          </button>
        )}
      </div>

      {/* Content Body */}
      <div className="flex-1 mt-4">
        {!userId ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
            <span className="text-3xl mb-2" aria-hidden="true">
              👤
            </span>
            <p className="text-sm font-medium text-slate-300">No participant selected</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Click any participant in the directory to inspect their posts and observe
              dependency-driven refetching.
            </p>
          </div>
        ) : error ? (
          <ErrorPanel message={error} onRetry={refetch} />
        ) : loading ? (
          <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label="Loading user posts"
            className="space-y-3"
          >
            {[1, 2, 3].map((skeletonKey) => (
              <div
                key={skeletonKey}
                className="p-4 rounded-xl border border-white/5 bg-slate-900/40 animate-pulse space-y-2.5"
              >
                <div className="h-4 w-3/4 bg-slate-800 rounded" />
                <div className="h-3 w-full bg-slate-800/60 rounded" />
                <div className="h-3 w-5/6 bg-slate-800/40 rounded" />
                <div className="flex gap-2 pt-1">
                  <div className="h-4 w-12 bg-slate-800/80 rounded" />
                  <div className="h-4 w-14 bg-slate-800/80 rounded" />
                </div>
              </div>
            ))}
            <span className="sr-only">Loading participant posts...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/20">
            <p className="text-sm font-medium text-slate-300">No posts published yet</p>
            <p className="text-xs text-slate-500 mt-1">
              This participant has not submitted any posts.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {posts.map((post) => (
              <article
                key={post.id}
                className="p-4 rounded-xl border border-white/5 bg-slate-800/40 hover:border-slate-700/60 transition-colors space-y-2"
              >
                <h4 className="text-sm font-semibold text-slate-100 leading-snug">{post.title}</h4>
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{post.body}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-mono"
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

      {/* Footer Meta */}
      {userId && data && !loading && !error && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-3 mt-auto border-t border-white/5">
          <span>
            {posts.length} post{posts.length === 1 ? '' : 's'} loaded
          </span>
          <span>Endpoint: /users/{userId}/posts</span>
        </div>
      )}
    </section>
  );
}

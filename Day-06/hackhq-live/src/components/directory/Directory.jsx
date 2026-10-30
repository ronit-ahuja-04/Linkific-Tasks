import { useState, useId } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { buildUsersUrl } from '../../lib/api.js';
import { UserRow } from './UserRow.jsx';
import { UserRowSkeleton } from './UserRowSkeleton.jsx';
import { ErrorPanel } from './ErrorPanel.jsx';

/**
 * Participants Directory component managing live user fetching,
 * slow-network simulation, skeleton states, and error handling.
 */
export function Directory({ selectedUserId, onSelectUser, searchBoxSlot }) {
  const [slowNetwork, setSlowNetwork] = useState(false);
  const slowNetworkCheckboxId = useId();

  // In M1: fetches first 10 users with optional delay parameter
  const requestUrl = buildUsersUrl({
    limit: 10,
    skip: 0,
    delay: slowNetwork ? 1000 : 0,
  });

  const { data, loading, error, refetch } = useFetch(requestUrl);
  const users = data?.users || [];

  return (
    <section className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-5">
      {/* Directory Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              Participant Directory
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
              Live API
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registered attendees fetched declaratively via DummyJSON API
          </p>
        </div>

        {/* Simulate Slow Network Control (PD-5) */}
        <label
          htmlFor={slowNetworkCheckboxId}
          className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/5 hover:border-slate-700 transition-colors"
        >
          <input
            id={slowNetworkCheckboxId}
            type="checkbox"
            checked={slowNetwork}
            onChange={(e) => setSlowNetwork(e.target.checked)}
            className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30"
          />
          <span>Simulate slow network (+1000ms)</span>
        </label>
      </div>

      {/* Optional SearchBox Slot (Integrated in Milestone M2) */}
      {searchBoxSlot}

      {/* Directory Content Area */}
      <div>
        {error ? (
          <ErrorPanel message={error} onRetry={refetch} />
        ) : loading ? (
          <UserRowSkeleton count={5} />
        ) : users.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/20">
            <p className="text-sm font-medium text-slate-300">No participants found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your query or click Retry to reload the directory.
            </p>
            <button
              type="button"
              onClick={refetch}
              className="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Reload Participants
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelected={selectedUserId === user.id}
                onSelect={onSelectUser}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Meta */}
      {data && !loading && !error && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-3 border-t border-white/5">
          <span>
            Showing {users.length} of {data.total || users.length} attendees
          </span>
          <span>Endpoint: /users</span>
        </div>
      )}
    </section>
  );
}

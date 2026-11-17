import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { greeting, loadMyRooms, loadRecentFiles, loadStats, loadTeamNotes } from '../lib/dashboard';
import { Demonstrates, MyRooms, Panel, RecentFiles, StatTiles, TeamNotes } from '../components/dashboard/Panels';
import '../styles/dashboard.css';

const INITIAL = { state: 'loading', data: null, error: '' };

/** Run one query and keep { state, data, error } for it, so one failing section does not break the others */
function useQuery(run, deps) {
  const [result, setResult] = useState(INITIAL);
  useEffect(() => {
    let active = true;
    Promise.resolve(run()).then(({ data, error }) => {
      if (!active) return;
      setResult(error ? { state: 'error', data: null, error: error.message } : { state: 'ready', data, error: '' });
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return result;
}

export default function DashboardPage() {
  const { client, user, profile } = useAuth();
  const userId = user?.id;
  useEffect(() => { document.title = 'Dashboard · Huddle'; }, []);

  const stats = useQuery(() => loadStats(client), [client]);
  const team = useQuery(() => loadTeamNotes(client), [client]);
  const files = useQuery(() => loadRecentFiles(client, userId), [client, userId]);
  const rooms = useQuery(() => loadMyRooms(client, userId), [client, userId]);

  // The hour is read once, in an initializer (not during every render)
  const [hello] = useState(() => greeting(new Date().getHours()));
  const name = profile?.full_name || profile?.username || 'there';

  return (
    <div className="dash-page">
      <h1 className="page-title">{hello}, {name}</h1>
      <p className="page-sub">Here is what is happening in your workspace.</p>

      <StatTiles stats={stats.data} error={stats.state === 'error' ? stats.error : ''} />

      <div className="dash-grid">
        <Panel id="dash-team" title="Recent team notes" to="/notes" linkText="All notes" state={team.state} error={team.error} count={team.data?.length ?? 0} empty="No team notes yet. Share one from the Notes page.">
          {team.state === 'ready' ? <TeamNotes notes={team.data ?? []} /> : null}
        </Panel>
        <Panel id="dash-rooms" title="My rooms" to="/chat" linkText="Open chat" state={rooms.state} error={rooms.error} count={rooms.data?.length ?? 0} empty="You are not in any room yet.">
          {rooms.state === 'ready' ? <MyRooms rooms={rooms.data ?? []} /> : null}
        </Panel>
        <Panel id="dash-files" title="My recent files" to="/files" linkText="All files" state={files.state} error={files.error} count={files.data?.length ?? 0} empty="No files yet. Upload one on the Files page.">
          {files.state === 'ready' ? <RecentFiles files={files.data ?? []} /> : null}
        </Panel>
        <Demonstrates />
      </div>
    </div>
  );
}

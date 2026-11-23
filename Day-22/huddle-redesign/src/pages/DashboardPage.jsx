import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { firstName, greeting, loadMyRooms, loadRecentFiles, loadStats, loadTeamNotes, loadUnreadMentions } from '../lib/dashboard';
import { DashboardUnderTheHood, FilesEmpty, NeedsYou, NotesEmpty, Panel, QuickActions, RecentFiles, TeamNotes, WorkspaceNumbers } from '../components/dashboard/Panels';
import PageHeader from '../components/ui/PageHeader';
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

/**
 * THE DASHBOARD, laid out for an F-shaped scan: the eye starts top left, so "Needs you" is there; it then runs
 * down the left column (team notes, my files); the right column holds what is useful but secondary.
 */
export default function DashboardPage() {
  const { client, user, profile } = useAuth();
  const userId = user?.id;
  useEffect(() => { document.title = 'Dashboard · Huddle'; }, []);

  const stats = useQuery(() => loadStats(client), [client]);
  const team = useQuery(() => loadTeamNotes(client), [client]);
  const files = useQuery(() => loadRecentFiles(client, userId), [client, userId]);
  const rooms = useQuery(() => loadMyRooms(client, userId), [client, userId]);
  const mentions = useQuery(() => loadUnreadMentions(client), [client]);

  // The hour and the date are read once, in initializers (not during every render)
  const [hello] = useState(() => greeting(new Date().getHours()));
  const [today] = useState(() => new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()));

  const needsState = [rooms, mentions].some((q) => q.state === 'loading') ? 'loading' : 'ready';

  return (
    <div className="dash-page">
      <PageHeader title={`${hello}, ${firstName(profile)}`} description={today} />

      <div className="grid-12 dash-layout">
        <div className="span-8 dash-col">
          <NeedsYou state={needsState} mentionCount={Number(stats.data?.unread_mentions ?? mentions.data?.length ?? 0)} mentions={mentions.data ?? []} rooms={rooms.data} />
          <Panel id="dash-team" title="Recent team notes" to="/notes" linkText="All notes" state={team.state} error={team.error} count={team.data?.length ?? 0} empty={<NotesEmpty />}>
            <TeamNotes notes={team.data ?? []} />
          </Panel>
          <Panel id="dash-files" title="My recent files" to="/files" linkText="All files" state={files.state} error={files.error} count={files.data?.length ?? 0} empty={<FilesEmpty />}>
            <RecentFiles files={files.data ?? []} />
          </Panel>
        </div>
        <div className="span-4 dash-col">
          <WorkspaceNumbers stats={stats.data} error={stats.state === 'error' ? stats.error : ''} />
          <QuickActions />
        </div>
      </div>

      <DashboardUnderTheHood />
    </div>
  );
}

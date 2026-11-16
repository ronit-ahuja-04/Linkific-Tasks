import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ageOf, boardStats, projectsSummary } from '../lib/stats';
import { useLatestMessages } from '../lib/useLatestMessages';
import { selectBoard, selectBoardReceivedAt } from '../store/slices/boardSlice';
import { selectProjects } from '../store/slices/projectsSlice';
import { selectUsersById } from '../store/slices/usersSlice';
import '../styles/pulse.css';

/** The current time, refreshed every `ms`: drives "Updated 5s ago" */
function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

const initialOf = (user, uid) => (user?.displayName || user?.email || uid || '?')[0].toUpperCase();

/**
 * The "Live" tab: a dashboard whose numbers are computed from the board in the Redux store, which a Firestore
 * onSnapshot listener keeps current (store/listeners.js). Nothing here polls or refetches: when anyone moves a card,
 * adds a task or attaches an image, the snapshot arrives, the store changes and these numbers change with it.
 */
export default function LivePulse({ projectId }) {
  const { t } = useLanguage();
  const board = useSelector(selectBoard);
  const receivedAt = useSelector(selectBoardReceivedAt);
  const projects = useSelector(selectProjects);
  const users = useSelector(selectUsersById);
  const now = useNow();
  const { messages, ready: messagesReady } = useLatestMessages(projectId, 5);

  const stats = useMemo(() => boardStats(board), [board]);
  const rows = useMemo(() => projectsSummary(projects), [projects]);
  const age = ageOf(receivedAt, now);
  const maxPerson = Math.max(1, ...stats.people.map((p) => p.open + p.done));

  const tiles = [
    { key: 'total', label: t('pulse.tile.total'), value: stats.total },
    { key: 'done', label: t('pulse.tile.done'), value: stats.done, note: t('pulse.tile.donePercent', { percent: stats.percentDone }) },
    { key: 'inprogress', label: t('pulse.tile.inprogress'), value: stats.inProgress },
    { key: 'urgent', label: t('pulse.tile.urgent'), value: stats.openHigh },
    { key: 'images', label: t('pulse.tile.images'), value: stats.images },
  ];

  const bar = (count, total, label) => (
    <span className="pulse-bar" role="img" aria-label={t('pulse.bar.label', { label, count, total })}>
      <span style={{ width: total === 0 ? '0%' : `${Math.round((count / total) * 100)}%` }} />
    </span>
  );

  return (
    <section className="pulse" aria-labelledby="pulse-title">
      <div className="pulse-head">
        <h3 id="pulse-title">{t('pulse.title')}</h3>
        <p className="pulse-live">
          <span className="pulse-dot" aria-hidden="true" />
          <strong>{t('pulse.live')}</strong>
          <span aria-hidden="true"> · </span>
          <span data-testid="pulse-age">{age ? t(`pulse.updated.${age[0]}`, { amount: age[1] }) : t('pulse.waiting')}</span>
        </p>
      </div>
      <p className="pulse-hint">{t('pulse.hint')}</p>

      <ul className="pulse-tiles" aria-label={t('pulse.tiles.label')}>
        {tiles.map((tile) => (
          <li key={tile.key} className="pulse-tile" data-testid={`tile-${tile.key}`}>
            <span className="pulse-tile-label">{tile.label}</span>
            {/* `key` restarts the highlight animation each time the number changes */}
            <strong key={tile.value} className="pulse-tile-value">{tile.value}</strong>
            {tile.note && <span className="pulse-tile-note">{tile.note}</span>}
          </li>
        ))}
      </ul>

      {stats.total === 0 && <p className="pulse-empty">{t('pulse.empty')}</p>}

      <div className="pulse-grid">
        <section className="pulse-card" aria-labelledby="pulse-columns">
          <h4 id="pulse-columns">{t('pulse.columns.title')}</h4>
          <ul className="pulse-rows">
            {stats.columns.map((column) => {
              const label = t(`dashboard.column.${column.id}`);
              return (
                <li key={column.id} data-testid={`column-${column.id}`}>
                  <span className="pulse-row-label">{label}</span>
                  {bar(column.count, stats.total, label)}
                  <span className="pulse-row-value">{column.count}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="pulse-card" aria-labelledby="pulse-priority">
          <h4 id="pulse-priority">{t('pulse.priority.title')}</h4>
          <ul className="pulse-rows">
            {['high', 'medium', 'low'].map((level) => {
              const label = t(`task.priority.${level}`);
              return (
                <li key={level} data-testid={`priority-${level}`}>
                  <span className="pulse-row-label">{label}</span>
                  {bar(stats.priority[level], stats.total, label)}
                  <span className="pulse-row-value">{stats.priority[level]}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="pulse-card" aria-labelledby="pulse-people">
          <h4 id="pulse-people">{t('pulse.people.title')}</h4>
          {stats.people.length === 0 ? (
            <p className="pulse-muted">{t('pulse.people.none')}</p>
          ) : (
            <ul className="pulse-rows pulse-people">
              {stats.people.map((person) => {
                const user = users[person.uid];
                const name = user?.displayName || user?.email || person.uid;
                return (
                  <li key={person.uid} data-testid={`person-${person.uid}`}>
                    <span className="pulse-avatar" aria-hidden="true">{initialOf(user, person.uid)}</span>
                    <span className="pulse-row-label">{name}</span>
                    {bar(person.open + person.done, maxPerson, name)}
                    <span className="pulse-row-value pulse-row-wide">{t('pulse.people.row', { open: person.open, done: person.done })}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {stats.unassigned > 0 && (
            <p className="pulse-muted" data-testid="unassigned">{t('pulse.people.unassigned')}: <strong>{stats.unassigned}</strong></p>
          )}
        </section>

        <section className="pulse-card" aria-labelledby="pulse-chat">
          <h4 id="pulse-chat">{t('pulse.chat.title')}</h4>
          {messagesReady && messages.length === 0 ? (
            <p className="pulse-muted">{t('pulse.chat.empty')}</p>
          ) : (
            <ul className="pulse-feed" data-testid="chat-feed">
              {messages.map((message) => (
                <li key={message.id}>
                  <strong>{message.senderName || '?'}</strong>
                  <span className="pulse-feed-text">{message.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="pulse-card" aria-labelledby="pulse-projects">
          <h4 id="pulse-projects">{t('pulse.projects.title')}</h4>
          <table className="pulse-table">
            <thead>
              <tr>
                <th scope="col">{t('pulse.projects.project')}</th>
                <th scope="col">{t('pulse.projects.tasks')}</th>
                <th scope="col">{t('pulse.projects.done')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} data-testid={`project-${row.id}`}>
                  <th scope="row">
                    <Link to={`/projects/${row.id}`}>{row.name}</Link>
                    {row.id === projectId && <span className="pulse-muted"> {t('pulse.projects.current')}</span>}
                  </th>
                  <td>{row.total}</td>
                  <td>{row.done} ({row.percentDone}%)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </section>
  );
}

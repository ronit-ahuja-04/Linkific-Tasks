import { useState } from 'react';
import { ActivityPanel, ReportsPanel, ReviewPanel } from './AdminPanels';
import { useAppSelector } from '../../app/hooks';
import { ErrorPanel, Loading, cardClasses } from '../../components/ui';
import { listPeople, setRole } from '../../lib/api/people';
import { toAppError } from '../../lib/errors';
import type { Role } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';

const ROLES: Role[] = ['learner', 'instructor', 'admin'];

/** People and roles. Role changes go through set_user_role(): admin-only, logged, never the last admin. */
function PeoplePanel() {
  const me = useAppSelector((s) => s.auth.profile);
  const people = useAsync(() => listPeople(), []);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const change = async (id: string, name: string, role: Role) => {
    setSavingId(id);
    setMessage(null);
    try {
      await setRole(id, role);
      setMessage({ tone: 'ok', text: `${name} is now ${role === 'admin' ? 'an' : 'a'} ${role}.` });
      people.retry();
    } catch (error) {
      setMessage({ tone: 'error', text: toAppError(error).message });
      people.retry();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div aria-live="polite">
        {message && (
          <p
            className={[
              'm-0 rounded-2xl px-4 py-3 font-bold',
              message.tone === 'ok'
                ? 'bg-lagoon-soft text-lagoon-ink'
                : 'bg-ember-soft text-ember-ink',
            ].join(' ')}
          >
            {message.text}
          </p>
        )}
      </div>
      {people.status === 'loading' && <Loading label="Loading people…" />}
      {people.status === 'error' && (
        <ErrorPanel
          title="Couldn't load people"
          message={people.error.message}
          onRetry={people.retry}
        />
      )}
      {people.status === 'ready' && (
        <div className={cardClasses('overflow-x-auto p-2')}>
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="text-sm text-dusk">
                <th scope="col" className="px-3 py-2">
                  Name
                </th>
                <th scope="col" className="px-3 py-2">
                  Handle
                </th>
                <th scope="col" className="px-3 py-2">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {people.data.map((person) => (
                <tr key={person.id} className="border-t-2 border-mist">
                  <td className="px-3 py-3 font-extrabold">
                    {person.display_name}
                    {person.id === me?.id && (
                      <span className="ml-2 text-sm font-bold text-dusk">(you)</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-dusk">@{person.handle}</td>
                  <td className="px-3 py-3">
                    <label className="sr-only" htmlFor={`role-${person.id}`}>
                      Role for {person.display_name}
                    </label>
                    <select
                      id={`role-${person.id}`}
                      value={person.role}
                      disabled={savingId === person.id}
                      onChange={(e) =>
                        void change(person.id, person.display_name, e.target.value as Role)
                      }
                      className="min-h-11 rounded-xl border-2 border-line-strong bg-white px-3 font-bold capitalize"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="m-0 text-sm text-dusk">
        Only admins can change roles, every change is logged, and Lumo always keeps at least one
        admin.
      </p>
    </div>
  );
}

const TABS = [
  { id: 'reports', label: 'Reports' },
  { id: 'review', label: 'Review queue' },
  { id: 'people', label: 'People & roles' },
  { id: 'activity', label: 'Activity' },
] as const;
type Tab = (typeof TABS)[number]['id'];

/** The admin's desk: what learners reported (wellbeing first), courses waiting to go live, roles, and the log. */
export function AdminPage() {
  const [tab, setTab] = useState<Tab>('reports');
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold text-dusk">Admin</span>
        <h1 className="m-0 text-3xl font-bold">Keeping the isles safe</h1>
      </div>
      <div role="tablist" aria-label="Admin sections" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => {
              const i = TABS.findIndex((x) => x.id === tab);
              const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
              if (next === null) return;
              const target = TABS[(next + TABS.length) % TABS.length]!;
              setTab(target.id);
              document.getElementById(`tab-${target.id}`)?.focus();
            }}
            tabIndex={tab === t.id ? 0 : -1}
            className={[
              'min-h-11 rounded-full border-2 px-4 text-sm font-extrabold',
              tab === t.id
                ? 'border-violet bg-violet text-white'
                : 'border-line-strong bg-white text-ink hover:border-violet',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'reports' && <ReportsPanel />}
        {tab === 'review' && <ReviewPanel />}
        {tab === 'people' && <PeoplePanel />}
        {tab === 'activity' && <ActivityPanel />}
      </div>
    </div>
  );
}

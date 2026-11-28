import { ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Guardian } from '../../components/characters';
import { Button, ErrorPanel, Loading, TextAreaField, cardClasses } from '../../components/ui';
import {
  coursesInReview,
  listFlags,
  recentActivity,
  reviewFlag,
  type Flag,
} from '../../lib/api/trust';
import { toAppError } from '../../lib/errors';
import { useAsync } from '../../lib/useAsync';
import { useToast } from '../toast/useToast';

const CATEGORY: Record<Flag['category'], { label: string; rank: number; className: string }> = {
  wellbeing: { label: 'Wellbeing', rank: 0, className: 'bg-ember text-white' },
  abuse: { label: 'Inappropriate', rank: 1, className: 'bg-ember-soft text-ember-ink' },
  integrity: { label: 'Wrong answer', rank: 2, className: 'bg-glow-soft text-glow-ink' },
  off_topic: { label: 'Off topic', rank: 3, className: 'bg-mist text-dusk' },
  other: { label: 'Confusing', rank: 4, className: 'bg-mist text-dusk' },
};

const when = (iso: string) =>
  new Date(iso).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

/** Learner reports, open ones first and wellbeing at the top. Each shows exactly what the learner saw. */
export function ReportsPanel() {
  const toast = useToast();
  const flags = useAsync(() => listFlags(), []);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const sorted = useMemo(() => {
    if (flags.status !== 'ready') return [];
    return [...flags.data]
      .filter((f) => showClosed || f.status === 'open')
      .sort(
        (a, b) =>
          Number(a.status !== 'open') - Number(b.status !== 'open') ||
          CATEGORY[a.category].rank - CATEGORY[b.category].rank ||
          a.created_at.localeCompare(b.created_at),
      );
  }, [flags, showClosed]);

  async function decide(f: Flag, status: 'approved' | 'adjusted' | 'escalated') {
    setBusy(f.id);
    try {
      await reviewFlag(f.id, status, notes[f.id] ?? '');
      toast.success(
        status === 'approved'
          ? 'Marked as fine.'
          : status === 'adjusted'
            ? 'Marked as fixed.'
            : 'Escalated.',
      );
      flags.retry();
    } catch (e) {
      toast.error(toAppError(e).message);
    } finally {
      setBusy(null);
    }
  }

  if (flags.status === 'loading') return <Loading label="Loading reports…" />;
  if (flags.status === 'error')
    return (
      <ErrorPanel
        title="Couldn’t load reports"
        message={flags.error.message}
        onRetry={flags.retry}
      />
    );
  const open = flags.data.filter((f) => f.status === 'open').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 font-bold text-dusk" role="status">
          {open === 0
            ? 'No open reports. The isles are calm.'
            : `${open} open report${open === 1 ? '' : 's'}`}
        </p>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
            className="h-5 w-5 accent-violet"
          />
          Show reviewed
        </label>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {sorted.map((f) => (
          <li
            key={f.id}
            className={cardClasses(
              `flex flex-col gap-3 p-5 ${f.category === 'wellbeing' && f.status === 'open' ? 'border-ember' : ''}`,
            )}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-black">
              <span className={`rounded-full px-2.5 py-1 ${CATEGORY[f.category].className}`}>
                {f.category === 'wellbeing' && (
                  <ShieldAlert aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" />
                )}
                {CATEGORY[f.category].label}
              </span>
              <span className="rounded-full bg-mist px-2.5 py-1 text-dusk">
                {f.status === 'open' ? 'Open' : `Reviewed: ${f.status}`}
              </span>
              <span className="text-dusk">
                {f.course?.island_name ?? 'Unknown island'} ·{' '}
                {f.reporter ? `@${f.reporter.handle}` : 'deleted account'} · {when(f.created_at)}
              </span>
            </div>
            {f.learner_text && <p className="m-0 font-bold">“{f.learner_text}”</p>}
            <pre className="m-0 whitespace-pre-wrap rounded-xl bg-paper p-3 font-sans text-sm text-dusk">
              {f.wisp_text}
            </pre>
            {f.category === 'wellbeing' && f.status === 'open' && (
              <p className="m-0 text-sm font-bold text-ember-ink">
                A learner said something here upset them. Check the content first, and follow your
                safeguarding process if the note suggests they need support.
              </p>
            )}
            {f.status === 'open' ? (
              <>
                <TextAreaField
                  label="Note (optional)"
                  rows={2}
                  maxLength={1000}
                  value={notes[f.id] ?? ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [f.id]: e.target.value }))}
                />
                <div className="flex flex-wrap gap-2">
                  {f.course && (
                    <Link
                      to={`/studio/${f.course.id}`}
                      className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-extrabold text-violet-ink hover:bg-violet-soft"
                    >
                      Open the course to fix it
                    </Link>
                  )}
                  <span className="flex-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={busy === f.id}
                    onClick={() => void decide(f, 'approved')}
                  >
                    It’s fine
                  </Button>
                  <Button
                    size="sm"
                    variant="lagoon"
                    loading={busy === f.id}
                    onClick={() => void decide(f, 'adjusted')}
                  >
                    Fixed it
                  </Button>
                  <Button
                    size="sm"
                    variant="ember"
                    loading={busy === f.id}
                    onClick={() => void decide(f, 'escalated')}
                  >
                    Escalate
                  </Button>
                </div>
              </>
            ) : (
              f.admin_note && <p className="m-0 text-sm text-dusk">Note: {f.admin_note}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Courses instructors have sent for review. Publishing happens in the course editor, after a look. */
export function ReviewPanel() {
  const courses = useAsync(() => coursesInReview(), []);
  if (courses.status === 'loading') return <Loading label="Loading the queue…" />;
  if (courses.status === 'error')
    return (
      <ErrorPanel
        title="Couldn’t load the queue"
        message={courses.error.message}
        onRetry={courses.retry}
      />
    );
  if (courses.data.length === 0)
    return <p className={cardClasses('m-0 p-6 text-dusk')}>Nothing waiting for review.</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {courses.data.map((c) => (
        <li key={c.id}>
          <Link
            to={`/studio/${c.id}`}
            className={cardClasses(
              'flex items-center gap-4 p-4 text-ink no-underline hover:border-violet',
            )}
          >
            <Guardian guardian={c.guardian} size={48} decorative />
            <span className="flex min-w-0 flex-1 flex-col">
              <b className="truncate">
                {c.island_name} · {c.title}
              </b>
              <span className="text-sm text-dusk">
                by {c.owner?.display_name ?? 'unknown'} · sent {when(c.updated_at)}
              </span>
            </span>
            <span className="font-extrabold text-violet-ink">Review</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const ACTIONS: Record<string, string> = {
  set_role: 'changed a role',
  delete_course: 'deleted a course',
  publish_unit: 'published a drafted unit',
  review_flag: 'reviewed a report',
};

/** The audit log: who did what, newest first. */
export function ActivityPanel() {
  const log = useAsync(() => recentActivity(), []);
  if (log.status === 'loading') return <Loading label="Loading activity…" />;
  if (log.status === 'error')
    return (
      <ErrorPanel title="Couldn’t load activity" message={log.error.message} onRetry={log.retry} />
    );
  if (log.data.length === 0)
    return <p className={cardClasses('m-0 p-6 text-dusk')}>No activity yet.</p>;
  return (
    <ol className={cardClasses('m-0 flex list-none flex-col divide-y-2 divide-line p-0')}>
      {log.data.map((e) => (
        <li key={e.id} className="flex flex-wrap items-baseline gap-x-2 px-4 py-3">
          <b>{e.actor?.display_name ?? 'Someone'}</b>
          <span>{ACTIONS[e.action] ?? e.action}</span>
          {e.action === 'set_role' && (
            <span className="text-dusk">
              ({String(e.details.from)} → {String(e.details.to)})
            </span>
          )}
          {'title' in e.details && <span className="text-dusk">“{String(e.details.title)}”</span>}
          {'status' in e.details && e.action === 'review_flag' && (
            <span className="text-dusk">({String(e.details.status)})</span>
          )}
          <span className="ml-auto text-sm text-dusk">{when(e.created_at)}</span>
        </li>
      ))}
    </ol>
  );
}

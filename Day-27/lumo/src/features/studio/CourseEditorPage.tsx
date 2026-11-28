import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Guardian } from '../../components/characters';
import {
  Button,
  ConfirmDialog,
  Dialog,
  ErrorPanel,
  Loading,
  cardClasses,
} from '../../components/ui';
import { toAppError } from '../../lib/errors';
import { deleteCourse, getStudioCourse, setCourseStatus, updateCourse } from '../../lib/api/studio';
import type { CourseStatus, StudioCourse } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { useToast } from '../toast/useToast';
import { CourseForm } from './CourseForm';
import { JobsPanel } from './JobsPanel';
import { LEVELS, STATUS, TOPICS } from './options';
import { PathEditor } from './PathEditor';

interface StatusMove {
  to: CourseStatus;
  label: string;
  done: string;
  variant: 'violet' | 'lagoon' | 'ghost';
}

/** Which status buttons to offer. The database enforces the same rules (only admins publish or archive). */
function statusMoves(status: CourseStatus, isAdmin: boolean): StatusMove[] {
  const moves: StatusMove[] = [];
  if (status === 'draft') {
    moves.push(
      isAdmin
        ? {
            to: 'live',
            label: 'Publish',
            done: 'Published: learners can find it in Explore.',
            variant: 'lagoon',
          }
        : {
            to: 'in_review',
            label: 'Send for review',
            done: 'Sent for review. An admin will publish it.',
            variant: 'violet',
          },
    );
  }
  if (status === 'in_review') {
    if (isAdmin) {
      moves.push({
        to: 'live',
        label: 'Publish',
        done: 'Published: learners can find it in Explore.',
        variant: 'lagoon',
      });
    }
    moves.push({ to: 'draft', label: 'Back to draft', done: 'Back to draft.', variant: 'ghost' });
  }
  if (status === 'live' && isAdmin) {
    moves.push({
      to: 'archived',
      label: 'Archive',
      done: 'Archived: hidden from Explore, history kept.',
      variant: 'ghost',
    });
  }
  if (status === 'archived' && isAdmin) {
    moves.push({
      to: 'draft',
      label: 'Move to draft',
      done: 'Moved back to draft.',
      variant: 'ghost',
    });
  }
  return moves;
}

export function CourseEditorPage() {
  const { courseId = '' } = useParams();
  const profile = useAppSelector((s) => s.auth.profile);
  const isAdmin = profile?.role === 'admin';
  const navigate = useNavigate();
  const toast = useToast();
  const initial = useAsync(() => getStudioCourse(courseId), [courseId]);
  // After the first load, changes refresh quietly (no loading screen); `fresh` holds the newest copy.
  const [fresh, setFresh] = useState<StudioCourse | null>(null);
  const course: StudioCourse | null =
    fresh?.id === courseId ? fresh : initial.status === 'ready' ? initial.data : null;

  const refresh = useCallback(async () => {
    try {
      setFresh(await getStudioCourse(courseId));
    } catch (error) {
      toast.error(`Couldn't refresh: ${toAppError(error).message}`);
    }
  }, [courseId, toast]);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  if (!course) {
    if (initial.status === 'error') {
      return (
        <ErrorPanel
          title={
            initial.error.kind === 'not_found' ? 'No such island' : "Couldn't open this course"
          }
          message={initial.error.message}
          onRetry={initial.error.kind === 'not_found' ? undefined : initial.retry}
        />
      );
    }
    return <Loading label="Opening the island…" />;
  }

  const lessonCount = course.units.reduce(
    (n, u) => n + u.lessons.filter((l) => l.deleted_at === null).length,
    0,
  );

  async function move(m: StatusMove) {
    if (!course) return;
    if (m.to !== 'draft' && m.to !== 'archived' && lessonCount === 0) {
      toast.error('Add at least one lesson first: an empty island has nothing to learn.');
      return;
    }
    setBusy(m.to);
    try {
      await setCourseStatus(course.id, m.to);
      toast.success(m.done);
      await refresh();
    } catch (error) {
      toast.error(toAppError(error).message);
    } finally {
      setBusy(null);
    }
  }

  const topic = TOPICS.find((t) => t.value === course.topic)?.label;
  const level = LEVELS.find((l) => l.value === course.level)?.label;
  const canDelete = course.status !== 'live' || isAdmin;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link to="/studio" className="inline-flex items-center gap-2 font-extrabold text-violet-ink">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Your islands
      </Link>

      <header className={cardClasses('flex flex-wrap items-center gap-4 p-5')}>
        <Guardian guardian={course.guardian} size={72} decorative />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-bold text-dusk">{course.island_name}</span>
          <h1 className="m-0 text-2xl font-bold sm:text-3xl">{course.title}</h1>
          <div className="flex flex-wrap gap-2 text-xs font-black">
            <span className={`rounded-full px-2.5 py-1 ${STATUS[course.status].className}`}>
              {STATUS[course.status].label}
            </span>
            <span className="rounded-full bg-mist px-2.5 py-1 text-dusk">{topic}</span>
            <span className="rounded-full bg-mist px-2.5 py-1 text-dusk">{level}</span>
            <span className="rounded-full bg-mist px-2.5 py-1 text-dusk">
              {course.units.length} unit{course.units.length === 1 ? '' : 's'} · {lessonCount}{' '}
              lesson
              {lessonCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Pencil aria-hidden="true" className="h-4 w-4" />}
            onClick={() => setEditing(true)}
          >
            Edit details
          </Button>
          {statusMoves(course.status, isAdmin).map((m) => (
            <Button
              key={m.to}
              size="sm"
              variant={m.variant}
              loading={busy === m.to}
              onClick={() => void move(m)}
            >
              {m.label}
            </Button>
          ))}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              aria-label="Delete course"
              leftIcon={<Trash2 aria-hidden="true" className="h-4 w-4" />}
              onClick={() => setConfirmDelete(true)}
            >
              <span className="sr-only sm:not-sr-only">Delete</span>
            </Button>
          )}
        </div>
        {course.status === 'in_review' && !isAdmin && (
          <p className="m-0 w-full rounded-xl bg-violet-soft px-3 py-2 text-sm font-bold text-violet-deep">
            Waiting for an admin to review. You can still edit; changes are included in the review.
          </p>
        )}
        {course.status === 'live' && (
          <p className="m-0 w-full rounded-xl bg-lagoon-soft px-3 py-2 text-sm font-bold text-lagoon-ink">
            Live: edits reach learners straight away.
          </p>
        )}
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <PathEditor course={course} refresh={refresh} />
        <JobsPanel courseId={course.id} onDrafted={() => void refresh()} />
      </div>

      <Dialog open={editing} onClose={() => setEditing(false)} title="Course details" wide>
        {editing && (
          <CourseForm
            mode="edit"
            initial={{
              title: course.title,
              island_name: course.island_name,
              slug: course.slug,
              guardian: course.guardian,
              topic: course.topic,
              level: course.level,
              summary: course.summary,
            }}
            submitLabel="Save details"
            onCancel={() => setEditing(false)}
            onSubmit={async ({ slug: _slug, ...input }) => {
              await updateCourse(course.id, input);
              setEditing(false);
              toast.success('Details saved.');
              await refresh();
            }}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete ${course.island_name}?`}
        message={
          course.status === 'live'
            ? 'Learners lose access to this island. Their progress and certificates are kept.'
            : 'The draft and everything in it disappears from your studio.'
        }
        confirmLabel="Delete course"
        busy={busy === 'delete'}
        onConfirm={async () => {
          setBusy('delete');
          try {
            await deleteCourse(course.id);
            toast.success(`${course.island_name} was deleted.`);
            navigate('/studio', { replace: true });
          } catch (error) {
            toast.error(toAppError(error).message);
            setBusy(null);
          }
        }}
      />
    </div>
  );
}

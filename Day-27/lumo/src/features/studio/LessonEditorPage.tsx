import { ArrowLeft, BadgeCheck, CircleAlert, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  ConfirmDialog,
  Dialog,
  ErrorPanel,
  Loading,
  cardClasses,
} from '../../components/ui';
import { toAppError } from '../../lib/errors';
import { deleteQuestion, getStudioLesson, saveQuestion, updateLesson } from '../../lib/api/studio';
import type { QuestionWithKey } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { useToast } from '../toast/useToast';
import { LessonForm } from './LessonForm';
import { KIND_BY_VALUE } from './options';
import { QuestionForm } from './QuestionForm';
import { questionInputFrom } from './questionInput';
import { VideoPanel } from './VideoPanel';

type LessonData = Awaited<ReturnType<typeof getStudioLesson>>;

const LETTERS = 'ABCDEF';

export function LessonEditorPage() {
  const { courseId = '', lessonId = '' } = useParams();
  const toast = useToast();
  const initial = useAsync(() => getStudioLesson(lessonId), [lessonId]);
  const [fresh, setFresh] = useState<LessonData | null>(null);
  const lesson: LessonData | null =
    fresh?.id === lessonId ? fresh : initial.status === 'ready' ? initial.data : null;

  const refresh = useCallback(async () => {
    try {
      setFresh(await getStudioLesson(lessonId));
    } catch (error) {
      toast.error(`Couldn't refresh: ${toAppError(error).message}`);
    }
  }, [lessonId, toast]);

  // null = closed; 'new' = adding; a question = editing it.
  const [editing, setEditing] = useState<QuestionWithKey | 'new' | null>(null);
  const [removing, setRemoving] = useState<QuestionWithKey | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  if (!lesson) {
    if (initial.status === 'error') {
      return (
        <ErrorPanel
          title={
            initial.error.kind === 'not_found' ? 'No such lesson' : "Couldn't open this lesson"
          }
          message={initial.error.message}
          onRetry={initial.error.kind === 'not_found' ? undefined : initial.retry}
        />
      );
    }
    return <Loading label="Opening the lesson…" />;
  }

  // A lesson link must belong to the course in the URL.
  if (lesson.course_id !== courseId) {
    return (
      <ErrorPanel title="No such lesson" message="This lesson belongs to a different course." />
    );
  }

  const kind = KIND_BY_VALUE[lesson.kind];
  const unverified = lesson.questions.filter((q) => !q.key?.verified).length;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        to={`/studio/${courseId}`}
        className="inline-flex items-center gap-2 font-extrabold text-violet-ink"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to the path
      </Link>

      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-soft">
          <kind.icon aria-hidden="true" className="h-6 w-6 text-violet-ink" />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-dusk">{kind.label}</span>
          <h1 className="m-0 text-3xl font-bold">{lesson.title}</h1>
        </div>
      </div>
      {lesson.deleted_at && (
        <p className="m-0 rounded-xl bg-ember-soft px-3 py-2 text-sm font-bold text-ember-ink">
          This lesson is hidden from learners. Show it again from the path.
        </p>
      )}

      <section aria-labelledby="details-heading" className={cardClasses('flex flex-col gap-4 p-5')}>
        <h2 id="details-heading" className="m-0 text-xl font-semibold">
          Details
        </h2>
        <LessonForm
          key={`${lesson.id}-${lesson.duration_seconds ?? ''}`}
          initial={{
            title: lesson.title,
            kind: lesson.kind,
            summary: lesson.summary,
            duration_seconds: lesson.duration_seconds,
            xp: lesson.xp,
          }}
          submitLabel="Save details"
          onSubmit={async (input) => {
            await updateLesson(lesson.id, input);
            toast.success('Lesson saved.');
            await refresh();
          }}
        />
      </section>

      {lesson.kind === 'video' && (
        <VideoPanel
          courseId={courseId}
          lessonId={lesson.id}
          videoPath={lesson.video_path}
          captionsPath={lesson.captions_path}
          onChanged={refresh}
        />
      )}

      <section
        aria-labelledby="questions-heading"
        className={cardClasses('flex flex-col gap-4 p-5')}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="questions-heading" className="m-0 text-xl font-semibold">
              Questions
            </h2>
            <p className="m-0 text-sm text-dusk">
              {lesson.kind === 'video'
                ? 'Optional: a quick check after the video.'
                : 'Learners must get each one right once to finish the lesson. Answers are graded on the server.'}
            </p>
          </div>
          <Button
            variant="violet"
            size="sm"
            leftIcon={<Plus aria-hidden="true" className="h-4 w-4" />}
            onClick={() => setEditing('new')}
          >
            Add question
          </Button>
        </div>

        {unverified > 0 && (
          <p className="m-0 flex items-center gap-2 rounded-xl bg-glow-soft px-3 py-2 text-sm font-bold text-glow-ink">
            <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
            {unverified} question{unverified === 1 ? ' was' : 's were'} drafted by Wisp. Open and
            save each one to confirm the answer.
          </p>
        )}

        {lesson.questions.length === 0 ? (
          <p className="m-0 rounded-2xl bg-paper p-5 text-dusk">
            No questions yet.{lesson.kind !== 'video' && ' A quiz needs at least one.'}
          </p>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {lesson.questions.map((q, i) => (
              <li key={q.id} className="flex flex-col gap-3 rounded-2xl border-2 border-line p-4">
                <div className="flex items-start gap-3">
                  <span className="font-display text-lg font-bold text-dusk">{i + 1}.</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="m-0 font-extrabold">{q.prompt}</p>
                    {q.code && (
                      <pre className="m-0 overflow-x-auto rounded-xl bg-night p-3 font-mono text-sm text-moon">
                        {q.code}
                      </pre>
                    )}
                    <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
                      {q.options.map((o, oi) => {
                        const right = q.key?.correct_index === oi;
                        return (
                          <li
                            key={oi}
                            className={right ? 'font-extrabold text-lagoon-ink' : 'text-dusk'}
                          >
                            {LETTERS[oi]}. {o}
                            {right && <span className="sr-only"> (correct)</span>}
                            {right && <span aria-hidden="true"> ✓</span>}
                          </li>
                        );
                      })}
                    </ul>
                    <span className="flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full bg-mist px-2.5 py-1 text-dusk">
                        {q.concept}
                      </span>
                      {q.key?.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-lagoon-soft px-2.5 py-1 text-lagoon-ink">
                          <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" /> Checked
                        </span>
                      ) : (
                        <span className="rounded-full bg-glow-soft px-2.5 py-1 text-glow-ink">
                          Needs checking
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex">
                    <button
                      type="button"
                      aria-label={`Edit question ${i + 1}`}
                      onClick={() => setEditing(q)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-dusk hover:bg-mist"
                    >
                      <Pencil aria-hidden="true" className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete question ${i + 1}`}
                      onClick={() => setRemoving(q)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-dusk hover:bg-mist"
                    >
                      <Trash2 aria-hidden="true" className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New question' : 'Edit question'}
        wide
      >
        {editing !== null && (
          <QuestionForm
            initial={questionInputFrom(editing === 'new' ? null : editing)}
            onCancel={() => setEditing(null)}
            onSubmit={async (input) => {
              await saveQuestion(lesson.id, editing === 'new' ? null : editing.id, input);
              setEditing(null);
              toast.success(editing === 'new' ? 'Question added.' : 'Question saved.');
              await refresh();
            }}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Delete this question?"
        message="Its answer key and notes go too. This can't be undone."
        confirmLabel="Delete question"
        busy={removeBusy}
        onConfirm={async () => {
          if (!removing) return;
          setRemoveBusy(true);
          try {
            await deleteQuestion(removing.id);
            setRemoving(null);
            toast.success('Question deleted.');
            await refresh();
          } catch (error) {
            toast.error(toAppError(error).message);
          } finally {
            setRemoveBusy(false);
          }
        }}
      />
    </div>
  );
}

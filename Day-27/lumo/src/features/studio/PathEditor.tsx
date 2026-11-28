import { ArrowDown, ArrowUp, Eye, EyeOff, Film, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, ConfirmDialog, Dialog, Field, cardClasses } from '../../components/ui';
import {
  createLesson,
  createUnit,
  deleteLesson,
  deleteUnit,
  reorderLessons,
  reorderUnits,
  setLessonHidden,
  updateUnit,
} from '../../lib/api/studio';
import type { StudioCourse, StudioLesson, StudioUnit } from '../../lib/types';
import { useToast } from '../toast/useToast';
import { LessonForm } from './LessonForm';
import { KIND_BY_VALUE, formatDuration } from './options';
import { useStudioAction } from './useStudioAction';
import { validateUnitTitle } from './validation';

function moved<T>(items: T[], index: number, by: -1 | 1): T[] {
  const next = [...items];
  const [item] = next.splice(index, 1);
  if (item !== undefined) next.splice(index + by, 0, item);
  return next;
}

const iconButton =
  'flex h-10 w-10 items-center justify-center rounded-xl text-dusk hover:bg-mist hover:text-ink disabled:cursor-not-allowed disabled:opacity-40';

/** The learning path: units in order, each with its lessons. Everything is reorderable from the keyboard. */
export function PathEditor({
  course,
  refresh,
}: {
  course: StudioCourse;
  refresh: () => Promise<void>;
}) {
  const { busy, run } = useStudioAction(refresh);
  const navigate = useNavigate();
  const toast = useToast();
  const live = course.status === 'live';
  const [newUnit, setNewUnit] = useState('');
  const [newUnitError, setNewUnitError] = useState<string>();
  const [renaming, setRenaming] = useState<{ id: string; title: string; error?: string } | null>(
    null,
  );
  const [addingTo, setAddingTo] = useState<StudioUnit | null>(null);
  const [confirm, setConfirm] = useState<
    { kind: 'unit'; unit: StudioUnit } | { kind: 'lesson'; lesson: StudioLesson } | null
  >(null);

  async function addUnit(event: FormEvent) {
    event.preventDefault();
    const error = validateUnitTitle(newUnit);
    setNewUnitError(error);
    if (error) return;
    const ok = await run('add-unit', () => createUnit(course.id, newUnit.trim()), 'Unit added.');
    if (ok) setNewUnit('');
  }

  async function saveRename(event: FormEvent) {
    event.preventDefault();
    if (!renaming) return;
    const error = validateUnitTitle(renaming.title);
    if (error) {
      setRenaming({ ...renaming, error });
      return;
    }
    const ok = await run(
      `rename-${renaming.id}`,
      () => updateUnit(renaming.id, renaming.title.trim()),
      'Unit renamed.',
    );
    if (ok) setRenaming(null);
  }

  return (
    <section aria-labelledby="path-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="path-heading" className="m-0 text-2xl font-semibold">
          The path
        </h2>
        <p className="m-0 text-sm text-dusk">
          Units are the stops on the island; lessons are the steps inside them.
          {live &&
            ' This course is live: lessons can be hidden, not deleted, so learners keep their progress.'}
        </p>
      </div>

      {course.units.length === 0 && (
        <p className={cardClasses('m-0 p-6 text-dusk')}>
          No units yet. Add the first one below (for example "Variables").
        </p>
      )}

      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {course.units.map((unit, ui) => (
          <li key={unit.id} className={cardClasses('flex flex-col gap-3 p-4 sm:p-5')}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-night font-display font-bold text-glow">
                {ui + 1}
              </span>
              {renaming?.id === unit.id ? (
                <form
                  onSubmit={saveRename}
                  className="flex min-w-0 flex-1 flex-wrap items-start gap-2"
                >
                  <div className="min-w-48 flex-1">
                    <Field
                      label={`Rename unit ${ui + 1}`}
                      value={renaming.title}
                      onChange={(e) =>
                        setRenaming({ ...renaming, title: e.target.value, error: undefined })
                      }
                      error={renaming.error}
                      maxLength={120}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 pt-7">
                    <Button
                      type="submit"
                      size="sm"
                      variant="violet"
                      loading={busy === `rename-${unit.id}`}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <h3 className="m-0 min-w-0 flex-1 text-lg font-semibold">{unit.title}</h3>
                  <div className="flex items-center">
                    <button
                      type="button"
                      className={iconButton}
                      aria-label={`Move unit "${unit.title}" up`}
                      disabled={ui === 0 || busy !== null}
                      onClick={() =>
                        void run('reorder', () =>
                          reorderUnits(
                            course.id,
                            moved(course.units, ui, -1).map((u) => u.id),
                          ),
                        )
                      }
                    >
                      <ArrowUp aria-hidden="true" className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      aria-label={`Move unit "${unit.title}" down`}
                      disabled={ui === course.units.length - 1 || busy !== null}
                      onClick={() =>
                        void run('reorder', () =>
                          reorderUnits(
                            course.id,
                            moved(course.units, ui, 1).map((u) => u.id),
                          ),
                        )
                      }
                    >
                      <ArrowDown aria-hidden="true" className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      aria-label={`Rename unit "${unit.title}"`}
                      onClick={() => setRenaming({ id: unit.id, title: unit.title })}
                    >
                      <Pencil aria-hidden="true" className="h-5 w-5" />
                    </button>
                    {!live && (
                      <button
                        type="button"
                        className={iconButton}
                        aria-label={`Delete unit "${unit.title}"`}
                        onClick={() => setConfirm({ kind: 'unit', unit })}
                      >
                        <Trash2 aria-hidden="true" className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {unit.lessons.length > 0 && (
              <ol className="m-0 flex list-none flex-col gap-2 p-0">
                {unit.lessons.map((lesson, li) => {
                  const kind = KIND_BY_VALUE[lesson.kind];
                  const hidden = lesson.deleted_at !== null;
                  return (
                    <li
                      key={lesson.id}
                      className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 border-line px-3 py-2 ${hidden ? 'bg-mist' : 'bg-paper'}`}
                    >
                      <kind.icon aria-hidden="true" className="h-5 w-5 shrink-0 text-violet-ink" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link
                          to={`/studio/${course.id}/lessons/${lesson.id}`}
                          className={`truncate font-extrabold no-underline hover:underline ${hidden ? 'text-dusk line-through' : 'text-ink'}`}
                        >
                          {lesson.title}
                        </Link>
                        <span className="flex flex-wrap gap-x-3 text-xs font-bold text-dusk">
                          <span>{kind.label}</span>
                          {lesson.duration_seconds !== null && (
                            <span>{formatDuration(lesson.duration_seconds)}</span>
                          )}
                          {lesson.kind !== 'video' && (
                            <span>
                              {lesson.question_count} question
                              {lesson.question_count === 1 ? '' : 's'}
                            </span>
                          )}
                          {lesson.kind === 'video' && (
                            <span className="inline-flex items-center gap-1">
                              <Film aria-hidden="true" className="h-3.5 w-3.5" />
                              {lesson.video_path ? 'Video attached' : 'No video yet'}
                            </span>
                          )}
                          <span>{lesson.xp} Light</span>
                          {hidden && <span className="text-ember-ink">Hidden from learners</span>}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <button
                          type="button"
                          className={iconButton}
                          aria-label={`Move lesson "${lesson.title}" up`}
                          disabled={li === 0 || busy !== null}
                          onClick={() =>
                            void run('reorder', () =>
                              reorderLessons(
                                unit.id,
                                moved(unit.lessons, li, -1).map((l) => l.id),
                              ),
                            )
                          }
                        >
                          <ArrowUp aria-hidden="true" className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          className={iconButton}
                          aria-label={`Move lesson "${lesson.title}" down`}
                          disabled={li === unit.lessons.length - 1 || busy !== null}
                          onClick={() =>
                            void run('reorder', () =>
                              reorderLessons(
                                unit.id,
                                moved(unit.lessons, li, 1).map((l) => l.id),
                              ),
                            )
                          }
                        >
                          <ArrowDown aria-hidden="true" className="h-5 w-5" />
                        </button>
                        {live ? (
                          <button
                            type="button"
                            className={iconButton}
                            aria-label={
                              hidden
                                ? `Show lesson "${lesson.title}" again`
                                : `Hide lesson "${lesson.title}"`
                            }
                            disabled={busy !== null}
                            onClick={() =>
                              void run(
                                `hide-${lesson.id}`,
                                () => setLessonHidden(lesson.id, !hidden),
                                hidden
                                  ? 'Lesson is back on the path.'
                                  : 'Lesson hidden from learners.',
                              )
                            }
                          >
                            {hidden ? (
                              <Eye aria-hidden="true" className="h-5 w-5" />
                            ) : (
                              <EyeOff aria-hidden="true" className="h-5 w-5" />
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={iconButton}
                            aria-label={`Delete lesson "${lesson.title}"`}
                            onClick={() => setConfirm({ kind: 'lesson', lesson })}
                          >
                            <Trash2 aria-hidden="true" className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <div>
              <Button
                size="sm"
                variant="plain"
                leftIcon={<Plus aria-hidden="true" className="h-4 w-4" />}
                onClick={() => setAddingTo(unit)}
              >
                Add a lesson to “{unit.title}”
              </Button>
            </div>
          </li>
        ))}
      </ol>

      <form
        onSubmit={addUnit}
        noValidate
        className={cardClasses('flex flex-wrap items-start gap-3 border-dashed p-4')}
      >
        <div className="min-w-56 flex-1">
          <Field
            label="New unit"
            value={newUnit}
            onChange={(e) => {
              setNewUnit(e.target.value);
              setNewUnitError(undefined);
            }}
            error={newUnitError}
            placeholder="Loops that know when to stop"
            maxLength={120}
          />
        </div>
        <div className="pt-7">
          <Button
            type="submit"
            variant="glow"
            loading={busy === 'add-unit'}
            leftIcon={<Plus aria-hidden="true" className="h-5 w-5" />}
          >
            Add unit
          </Button>
        </div>
      </form>

      <Dialog
        open={addingTo !== null}
        onClose={() => setAddingTo(null)}
        title="New lesson"
        description={addingTo ? `In “${addingTo.title}”` : undefined}
        wide
      >
        {addingTo && (
          <LessonForm
            submitLabel="Add lesson"
            onCancel={() => setAddingTo(null)}
            onSubmit={async (input) => {
              const lesson = await createLesson(addingTo.id, input);
              setAddingTo(null);
              toast.success('Lesson added. Now give it a video or questions.');
              navigate(`/studio/${course.id}/lessons/${lesson.id}`);
            }}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.kind === 'unit' ? 'Delete this unit?' : 'Delete this lesson?'}
        message={
          confirm?.kind === 'unit'
            ? `“${confirm.unit.title}” and its ${confirm.unit.lessons.length} lesson(s), questions and answer keys will be deleted. This can't be undone.`
            : confirm?.kind === 'lesson'
              ? `“${confirm.lesson.title}” and its questions will be deleted. This can't be undone.`
              : ''
        }
        confirmLabel="Delete"
        busy={busy === 'delete'}
        onConfirm={async () => {
          if (!confirm) return;
          const ok = await run(
            'delete',
            () =>
              confirm.kind === 'unit'
                ? deleteUnit(confirm.unit.id)
                : deleteLesson(confirm.lesson.id),
            confirm.kind === 'unit' ? 'Unit deleted.' : 'Lesson deleted.',
          );
          if (ok) setConfirm(null);
        }}
      />
    </section>
  );
}

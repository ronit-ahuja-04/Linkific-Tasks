import { X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Wisp } from '../../components/characters';
import { Button, ConfirmDialog, ErrorPanel, Loading, buttonClasses } from '../../components/ui';
import { toAppError } from '../../lib/errors';
import { completeLesson, getPlayableLesson, myStats, submitAnswer } from '../../lib/api/learn';
import { useAsync } from '../../lib/useAsync';
import { profilePatched } from '../auth/authSlice';
import { QuizRunner } from './QuizRunner';
import { Rewards, type RewardNumbers } from './Rewards';

type Step = 'watch' | 'quiz' | 'finishing' | 'done' | 'finish-error';

/** A lesson, full screen: the video bite (if any), then its questions, then the rewards. */
export function LessonPlayer() {
  const { lessonId = '' } = useParams();
  // A new lesson id (e.g. "Next lesson") gets a fresh player.
  return <Player key={lessonId} lessonId={lessonId} />;
}

function Player({ lessonId }: { lessonId: string }) {
  const profile = useAppSelector((s) => s.auth.profile);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const lesson = useAsync(() => getPlayableLesson(lessonId), [lessonId]);
  const [step, setStep] = useState<Step | null>(null);
  const [progress, setProgress] = useState(0);
  const [reward, setReward] = useState<RewardNumbers | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const onProgress = useCallback((f: number) => setProgress(f), []);

  if (lesson.status === 'loading') {
    return (
      <main id="main" className="min-h-dvh bg-paper">
        <Loading label="Opening the lesson…" />
      </main>
    );
  }
  if (lesson.status === 'error') {
    return (
      <main id="main" className="min-h-dvh bg-paper px-5">
        <ErrorPanel
          title={
            lesson.error.kind === 'not_found'
              ? 'This lesson isn’t on the map'
              : 'The lesson didn’t load'
          }
          message={lesson.error.message}
          onRetry={lesson.error.kind === 'not_found' ? undefined : lesson.retry}
        />
        <div className="flex justify-center">
          <Link to="/map" className={buttonClasses({ variant: 'ghost' })}>
            Back to the map
          </Link>
        </div>
      </main>
    );
  }

  const data = lesson.data;
  const persona = profile?.wisp_persona ?? 'cheeky';
  const mapUrl = `/map?island=${data.course.slug}`;
  const hasWatch = data.kind === 'video';
  const current: Step = step ?? (hasWatch ? 'watch' : 'quiz');
  const needsQuestions = data.kind !== 'video';
  const empty = needsQuestions && data.questions.length === 0;

  async function finish() {
    if (!profile) return;
    setStep('finishing');
    setFinishError(null);
    const before = { light: profile.light, flame: profile.flame_days };
    try {
      const result = await completeLesson(data.id);
      const stats = await myStats(profile.id);
      dispatch(profilePatched(stats));
      setReward({
        lightBefore: before.light,
        lightAfter: stats.light,
        flameBefore: before.flame,
        flameAfter: stats.flame_days,
        earned: result.xp_awarded,
        heading: result.first_time ? 'Lantern lit!' : 'Lesson replayed',
        note: result.first_time
          ? undefined
          : 'You’d already earned this lesson’s Light. Practice still counts.',
      });
      setStep('done');
    } catch (error) {
      setFinishError(toAppError(error).message);
      setStep('finish-error');
    }
  }

  function afterWatch() {
    if (data.questions.length > 0) setStep('quiz');
    else void finish();
  }

  const shownProgress =
    current === 'watch' ? 0.05 : current === 'quiz' ? Math.max(progress, 0.05) : 1;

  if (current === 'done' && reward) {
    return (
      <main id="main" className="flex min-h-dvh flex-col">
        <Rewards
          numbers={reward}
          persona={persona}
          actions={
            <>
              {data.nextLessonId && (
                <Button
                  variant="glow"
                  size="lg"
                  fullWidth
                  onClick={() => navigate(`/learn/${data.nextLessonId}`)}
                >
                  Next lesson
                </Button>
              )}
              <Link to={mapUrl} className={buttonClasses({ variant: 'dark', fullWidth: true })}>
                Back to the map
              </Link>
            </>
          }
        />
      </main>
    );
  }

  return (
    <main id="main" className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b-2 border-line bg-paper px-4 py-3">
        <button
          type="button"
          aria-label="Leave the lesson"
          onClick={() => (current === 'quiz' ? setLeaving(true) : navigate(mapUrl))}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-dusk hover:bg-mist"
        >
          <X aria-hidden="true" className="h-6 w-6" />
        </button>
        <div
          role="progressbar"
          aria-label="Lesson progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(shownProgress * 100)}
          className="h-4 flex-1 overflow-hidden rounded-full bg-mist"
        >
          <div
            className="h-full rounded-full bg-lagoon transition-[width] duration-500"
            style={{ width: `${shownProgress * 100}%` }}
          />
        </div>
        <span className="hidden text-sm font-bold text-dusk sm:block">
          {data.course.island_name}
        </span>
      </header>

      {current === 'watch' && (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 py-6">
          <h1 className="m-0 text-3xl font-bold">{data.title}</h1>
          {data.videoUrl ? (
            <video
              src={data.videoUrl}
              controls
              playsInline
              preload="metadata"
              crossOrigin="anonymous"
              className="aspect-video w-full rounded-[var(--radius-card)] bg-night"
            >
              {data.captionsUrl && (
                <track
                  kind="captions"
                  src={data.captionsUrl}
                  srcLang="en"
                  label="English"
                  default
                />
              )}
            </video>
          ) : (
            <div className="flex items-center gap-4 rounded-[var(--radius-card)] bg-night p-5 text-white">
              <Wisp size={72} mood="think" decorative />
              <p className="m-0">
                This bite’s video is still being made. Here’s what it covers, so you can keep going.
              </p>
            </div>
          )}
          {data.summary && <p className="m-0 text-lg text-dusk">{data.summary}</p>}
          {data.transcript && (
            <details className="rounded-2xl border-2 border-line bg-white p-4">
              <summary className="cursor-pointer font-extrabold">Read the transcript</summary>
              <p className="m-0 mt-3 leading-relaxed">{data.transcript}</p>
            </details>
          )}
          <div className="mt-auto flex justify-end">
            <Button variant="glow" size="lg" onClick={afterWatch}>
              {data.questions.length > 0 ? 'Continue to the questions' : 'Finish the lesson'}
            </Button>
          </div>
        </div>
      )}

      {current === 'quiz' && empty && (
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
          <Wisp size={110} mood="sad" />
          <h1 className="m-0 text-2xl font-bold">This lesson isn’t ready yet</h1>
          <p className="m-0 text-dusk">
            Its questions haven’t been written. Try the next stop on the map.
          </p>
          <Link to={mapUrl} className={buttonClasses({ variant: 'violet' })}>
            Back to the map
          </Link>
        </div>
      )}

      {current === 'quiz' && !empty && (
        <>
          <h1 className="sr-only">{data.title}</h1>
          <QuizRunner
            questions={data.questions}
            grade={(q, choice) => submitAnswer(q.id, choice)}
            persona={persona}
            onProgress={onProgress}
            onDone={() => void finish()}
          />
        </>
      )}

      {current === 'finishing' && <Loading label="Lighting your lantern…" />}

      {current === 'finish-error' && (
        <div className="px-5">
          <ErrorPanel
            title="Couldn’t save the lesson"
            message={finishError ?? ''}
            onRetry={() => void finish()}
          />
        </div>
      )}

      <ConfirmDialog
        open={leaving}
        onClose={() => setLeaving(false)}
        title="Leave this lesson?"
        message="Your answers so far are saved, but the lesson only counts once you finish it."
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={() => navigate(mapUrl)}
      />
    </main>
  );
}

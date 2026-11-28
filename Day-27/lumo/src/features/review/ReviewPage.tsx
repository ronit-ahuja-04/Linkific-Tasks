import { X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Gloom, Wisp } from '../../components/characters';
import { ErrorPanel, Loading, buttonClasses } from '../../components/ui';
import { dueReviews, myStats, reviewAnswer } from '../../lib/api/learn';
import { toAppError } from '../../lib/errors';
import { wispSays } from '../../lib/game/wisp';
import type { ReviewGrade } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { profilePatched } from '../auth/authSlice';
import { ReportDialog } from '../learn/ReportDialog';
import { QuizRunner, type QuizResult } from '../learn/QuizRunner';
import { Rewards, type RewardNumbers } from '../learn/Rewards';

function nextReviewText(iso: string) {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days <= 0) return 'Back in a few minutes for another try.';
  return `Next review in ${days} day${days === 1 ? '' : 's'}.`;
}

/**
 * Clear the fog: one pass over the ideas that are due (up to 10), graded and rescheduled on the server (FSRS).
 * A miss isn't repeated here; the schedule brings it back in a few minutes.
 */
export function ReviewPage() {
  const profile = useAppSelector((s) => s.auth.profile);
  const dispatch = useAppDispatch();
  const items = useAsync(() => dueReviews(), []);
  const [progress, setProgress] = useState(0);
  const [reward, setReward] = useState<RewardNumbers | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const earned = useRef(0);
  const before = useRef({ light: profile?.light ?? 0, flame: profile?.flame_days ?? 0 });
  const onProgress = useCallback((f: number) => setProgress(f), []);
  const persona = profile?.wisp_persona ?? 'cheeky';
  const [reporting, setReporting] = useState<string | null>(null);

  async function done(result: QuizResult) {
    if (!profile) return;
    try {
      const stats = await myStats(profile.id);
      dispatch(profilePatched(stats));
      setReward({
        lightBefore: before.current.light,
        lightAfter: stats.light,
        flameBefore: before.current.flame,
        flameAfter: stats.flame_days,
        earned: earned.current,
        heading: result.firstTry === result.total ? 'Fog cleared!' : 'Fog pushed back',
        note:
          result.firstTry === result.total
            ? `All ${result.total} ideas are bright again.`
            : `${result.firstTry} of ${result.total} remembered. The misses come back soon, and that’s how they stick.`,
      });
    } catch (error) {
      setFinishError(toAppError(error).message);
    }
  }

  if (reward) {
    return (
      <main id="main" className="flex min-h-dvh flex-col">
        <Rewards
          numbers={reward}
          persona={persona}
          actions={
            <Link
              to="/map"
              className={buttonClasses({ variant: 'glow', size: 'lg', fullWidth: true })}
            >
              Back to the map
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <main id="main" className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b-2 border-line bg-paper px-4 py-3">
        <Link
          to="/map"
          aria-label="Leave the review"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-dusk hover:bg-mist"
        >
          <X aria-hidden="true" className="h-6 w-6" />
        </Link>
        <div
          role="progressbar"
          aria-label="Review progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="h-4 flex-1 overflow-hidden rounded-full bg-fog-soft"
        >
          <div
            className="h-full rounded-full bg-violet transition-[width] duration-500"
            style={{ width: `${Math.max(progress, 0.05) * 100}%` }}
          />
        </div>
        <span className="hidden text-sm font-bold text-dusk sm:block">Clearing the fog</span>
      </header>

      {items.status === 'loading' && <Loading label="Finding the fog…" />}
      {items.status === 'error' && (
        <ErrorPanel
          title="Couldn’t load your review"
          message={items.error.message}
          onRetry={items.retry}
        />
      )}
      {finishError && <ErrorPanel title="Couldn’t update your stats" message={finishError} />}
      {items.status === 'ready' && items.data.length === 0 && (
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
          <Wisp size={130} mood="happy" />
          <h1 className="m-0 text-3xl font-bold">No fog today</h1>
          <p className="m-0 text-dusk">
            Everything you’ve learned is still bright. Wisp will tell you when something starts to
            fade.
          </p>
          <Link to="/map" className={buttonClasses({ variant: 'violet' })}>
            Back to the map
          </Link>
        </div>
      )}
      {items.status === 'ready' && items.data.length > 0 && !finishError && (
        <>
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-5 pt-5">
            <Gloom size={64} decorative />
            <p className="m-0 font-bold text-dusk">
              <span className="sr-only">Clearing the fog. </span>
              {wispSays(persona, 'fog')} {items.data.length} idea
              {items.data.length === 1 ? '' : 's'}.
            </p>
          </div>
          <h1 className="sr-only">Review</h1>
          <QuizRunner
            questions={items.data}
            requeue={false}
            persona={persona}
            onProgress={onProgress}
            grade={async (q, choice) => {
              const g = await reviewAnswer(q.id, choice);
              earned.current += g.light_awarded;
              return g;
            }}
            renderExtra={(g) => {
              const r = g as ReviewGrade;
              return `${r.light_awarded ? `+${r.light_awarded} Light. ` : ''}${nextReviewText(r.next_due_at)}`;
            }}
            onDone={(r) => void done(r)}
            onReport={(q) => setReporting(q.id)}
          />
        </>
      )}
      <ReportDialog questionId={reporting} onClose={() => setReporting(null)} />
    </main>
  );
}

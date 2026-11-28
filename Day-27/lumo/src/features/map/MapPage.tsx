import {
  Award,
  Check,
  Compass,
  Flame,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Swords,
} from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Gloom, Guardian, Wisp } from '../../components/characters';
import { Button, Dialog, ErrorPanel, Loading, buttonClasses } from '../../components/ui';
import { getCourseMap, listVisibleCourses } from '../../lib/api/courses';
import { completedLessonIds, fogConcepts, myEnrollments } from '../../lib/api/learn';
import { claimCertificate } from '../../lib/api/trust';
import { toAppError } from '../../lib/errors';
import {
  daysAway,
  effectiveFlame,
  litToday,
  pathState,
  todayIn,
  type StoneState,
} from '../../lib/game/path';
import type { CourseMap, Lesson } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { useToast } from '../toast/useToast';

/** Zig-zag offsets for the lesson stones, in rem from the centre line. */
const OFFSETS = [0, -4, 1.5, 4, 1, -3.5];

interface MapData {
  map: CourseMap;
  completed: Set<string>;
  startUnit: number;
  fog: Set<string>;
}

/** The island to show: the one in the URL, else the one the learner opened last, else the first live island. */
async function loadMap(slug: string | null): Promise<MapData | null> {
  const [enrollments, completed] = await Promise.all([myEnrollments(), completedLessonIds()]);
  let target = slug;
  if (!target) {
    const live = (await listVisibleCourses()).filter((c) => c.status === 'live');
    const recent = enrollments.map((e) => live.find((c) => c.id === e.course_id)).find(Boolean);
    target = (recent ?? live[0])?.slug ?? null;
  }
  if (!target) return null;
  const map = await getCourseMap(target);
  const fog = await fogConcepts(map.id);
  const startUnit = enrollments.find((e) => e.course_id === map.id)?.start_unit ?? 1;
  return { map, completed, startUnit, fog };
}

function Stone({
  lesson,
  index,
  state,
  onOpen,
}: {
  lesson: Lesson;
  index: number;
  state: StoneState;
  onOpen: () => void;
}) {
  const offset = OFFSETS[index % OFFSETS.length] ?? 0;
  const guardian = lesson.kind === 'guardian';
  const stateText = {
    done: 'finished, play again',
    current: 'start here',
    open: 'skipped, open',
    locked: 'locked',
  }[state];
  const label = `${lesson.title}, ${guardian ? 'guardian battle' : lesson.kind}, ${stateText}`;
  return (
    <li style={{ transform: `translateX(${offset}rem)` }}>
      {/* The stones pop in one after another down the path. */}
      <div
        className="stagger flex animate-pop flex-col items-center gap-2"
        style={{ '--i': index } as CSSProperties}
      >
        {state === 'current' && (
          <span
            aria-hidden="true"
            className="animate-bounce rounded-xl bg-white px-3 py-1 font-display text-sm font-bold tracking-wider text-ink shadow-[0_3px_0_var(--color-moon)]"
          >
            START
          </span>
        )}
        <button
          type="button"
          aria-label={label}
          aria-disabled={state === 'locked' || undefined}
          title={lesson.title}
          onClick={onOpen}
          className={[
            'press flex items-center justify-center rounded-full',
            state === 'current'
              ? 'h-20 w-20 bg-glow text-ink shadow-[0_7px_0_var(--color-glow-deep),0_0_0_10px_rgba(255,185,56,0.25)]'
              : state === 'done'
                ? 'h-16 w-16 bg-lagoon text-white shadow-[0_6px_0_var(--color-lagoon-deep)]'
                : state === 'open'
                  ? 'h-16 w-16 bg-violet text-white shadow-[0_6px_0_var(--color-violet-deep)]'
                  : 'h-16 w-16 cursor-not-allowed bg-night-3 text-moon shadow-[0_6px_0_#221c52]',
          ].join(' ')}
        >
          {state === 'current' ? (
            <Play aria-hidden="true" className="h-8 w-8 fill-current" />
          ) : state === 'done' ? (
            <Check aria-hidden="true" className="h-8 w-8" strokeWidth={3} />
          ) : state === 'open' ? (
            <RotateCcw aria-hidden="true" className="h-7 w-7" />
          ) : guardian ? (
            <Swords aria-hidden="true" className="h-7 w-7" />
          ) : (
            <Lock aria-hidden="true" className="h-6 w-6" />
          )}
        </button>
        <span className="max-w-40 text-center text-xs font-bold text-moon" aria-hidden="true">
          {lesson.title}
        </span>
      </div>
    </li>
  );
}

export function MapPage() {
  const [params] = useSearchParams();
  const island = params.get('island');
  const profile = useAppSelector((s) => s.auth.profile);
  const navigate = useNavigate();
  const toast = useToast();
  const data = useAsync(() => loadMap(island), [island]);

  const states = useMemo(
    () =>
      data.status === 'ready' && data.data
        ? pathState(data.data.map.units, data.data.completed, data.data.startUnit)
        : new Map<string, StoneState>(),
    [data],
  );

  const lit = profile ? litToday(profile.last_goal_date, profile.timezone) : false;
  const flame = profile ? effectiveFlame(profile) : 0;
  const away = profile ? daysAway(profile.last_goal_date, profile.timezone) : null;
  // Back after 3+ days: a warm welcome, once a day (remembered in this browser only).
  const comebackKey = profile ? `lumo-comeback-${profile.id}-${todayIn(profile.timezone)}` : '';
  const [comebackSeen, setComebackSeen] = useState(() => {
    try {
      return comebackKey ? localStorage.getItem(comebackKey) === '1' : true;
    } catch {
      return true;
    }
  });
  const showComeback = away !== null && away >= 3 && !comebackSeen;
  const closeComeback = () => {
    setComebackSeen(true);
    try {
      localStorage.setItem(comebackKey, '1');
    } catch {
      // private mode: it just shows again next visit
    }
  };
  const [claiming, setClaiming] = useState(false);
  const ready = data.status === 'ready' ? data.data : null;
  const fogCount = ready?.fog.size ?? 0;
  const allLessons = ready ? ready.map.units.flatMap((u) => u.lessons) : [];
  const currentLesson = allLessons.find((l) => states.get(l.id) === 'current');

  return (
    <div className="min-h-dvh bg-night px-4 pb-10 text-white">
      <header className="mx-auto flex max-w-xl items-center justify-between gap-3 py-4">
        <div className="flex min-w-0 flex-col">
          <h1 className="m-0 truncate text-xl font-semibold">
            {ready ? ready.map.island_name : 'The Lumen Isles'}
          </h1>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1 text-sm font-bold text-moon"
          >
            <Compass aria-hidden="true" className="h-4 w-4" /> Change island
          </Link>
        </div>
        <div className="flex items-center gap-4 font-black">
          <span
            role="img"
            aria-label={`Flame: ${flame} days${lit ? ', lit today' : ', not lit yet today'}`}
            className={`flex items-center gap-1 ${lit ? 'text-glow' : 'text-moon'}`}
          >
            <Flame
              aria-hidden="true"
              className={`h-5 w-5 ${lit ? 'fill-[#ff9b3d] text-[#ff9b3d]' : 'text-moon'}`}
            />
            {flame}
          </span>
          <span
            role="img"
            aria-label={`${profile?.light ?? 0} Light`}
            className="flex items-center gap-1 text-[#7cf5da]"
          >
            <Sparkles aria-hidden="true" className="h-5 w-5" />
            {profile?.light ?? 0}
          </span>
        </div>
      </header>

      {data.status === 'loading' && <Loading label="Lighting the map…" />}
      {data.status === 'error' && (
        <div className="rounded-[var(--radius-panel)] bg-paper text-ink">
          <ErrorPanel
            title="The map didn't load"
            message={data.error.message}
            onRetry={data.retry}
          />
        </div>
      )}
      {data.status === 'ready' && !ready && (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
          <Wisp size={120} mood="sad" />
          <p className="m-0 font-display text-xl">
            No islands are lit yet. An instructor's first course will appear here.
          </p>
        </div>
      )}
      {ready && (
        <div className="mx-auto flex max-w-xl flex-col gap-10">
          {allLessons.length > 0 && allLessons.every((l) => states.get(l.id) === 'done') && (
            <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] border-2 border-glow bg-night-2 p-4">
              <Award aria-hidden="true" className="h-10 w-10 text-glow" />
              <div className="flex min-w-0 flex-1 flex-col">
                <b className="font-display text-lg">
                  Every lantern on {ready.map.island_name} is lit!
                </b>
                <span className="text-sm text-moon">
                  Claim your certificate: anyone can verify it from its link.
                </span>
              </div>
              <Button
                variant="glow"
                size="sm"
                loading={claiming}
                onClick={async () => {
                  setClaiming(true);
                  try {
                    const code = await claimCertificate(ready.map.id);
                    navigate(`/verify/${code}`);
                  } catch (e) {
                    toast.error(toAppError(e).message);
                    setClaiming(false);
                  }
                }}
              >
                Claim certificate
              </Button>
            </div>
          )}
          {fogCount > 0 && (
            <div className="flex items-center gap-4 rounded-[var(--radius-card)] border-2 border-fog/40 bg-night-2 p-4">
              <Gloom size={72} decorative />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <b className="font-display text-lg">The fog is back</b>
                <span className="text-sm text-moon">
                  Gloom is creeping over {fogCount} idea{fogCount === 1 ? '' : 's'} you learned. A
                  two-minute review clears it.
                </span>
              </div>
              <Link to="/review" className={buttonClasses({ variant: 'glow', size: 'sm' })}>
                Clear the fog
              </Link>
            </div>
          )}
          {!lit && currentLesson && fogCount === 0 && (
            <p className="m-0 rounded-[var(--radius-card)] bg-night-2 px-4 py-3 text-center text-moon">
              Light today’s flame: finish “{currentLesson.title}”.
            </p>
          )}

          {ready.map.units.map((unit, unitIndex) => {
            const foggy = unit.lessons.some((l) => l.concepts?.some((c) => ready.fog.has(c)));
            return (
              <section
                key={unit.id}
                aria-labelledby={`unit-${unit.id}`}
                className="relative flex flex-col gap-8"
              >
                <div className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-violet px-5 py-4 shadow-[0_5px_0_var(--color-violet-deep)]">
                  <div className="flex flex-col">
                    <span className="text-xs font-black tracking-[0.15em] text-[#e3dbff] uppercase">
                      Unit {unitIndex + 1}
                      {unitIndex + 1 < ready.startUnit && ' · skipped'}
                      {foggy && ' · foggy'}
                    </span>
                    <h2 id={`unit-${unit.id}`} className="m-0 text-xl font-semibold">
                      {unit.title}
                    </h2>
                  </div>
                  {unitIndex === ready.map.units.length - 1 && (
                    <Guardian guardian={ready.map.guardian} size={52} decorative />
                  )}
                </div>
                <ol className="m-0 flex list-none flex-col items-center gap-6 p-0">
                  {unit.lessons.map((lesson, i) => {
                    const state = states.get(lesson.id) ?? 'locked';
                    return (
                      <Stone
                        key={lesson.id}
                        lesson={lesson}
                        index={i}
                        state={state}
                        onOpen={() =>
                          state === 'locked'
                            ? toast.info(
                                currentLesson
                                  ? `Locked. Finish “${currentLesson.title}” first.`
                                  : 'Locked for now.',
                              )
                            : navigate(`/learn/${lesson.id}`)
                        }
                      />
                    );
                  })}
                </ol>
                {foggy && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-[-1rem] top-16 bottom-0 rounded-[var(--radius-panel)] bg-[radial-gradient(ellipse_at_center,rgba(189,182,222,0.35)_0%,rgba(189,182,222,0.12)_55%,transparent_75%)]"
                  />
                )}
              </section>
            );
          })}
        </div>
      )}
      <Dialog
        open={showComeback}
        onClose={closeComeback}
        title={`Welcome back, ${profile?.display_name.split(' ')[0] ?? 'friend'}!`}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <Wisp size={110} mood="happy" />
          <p className="m-0 text-lg">
            The isles missed you. No guilt, no catching up: two minutes today is a great restart.
          </p>
          {profile && profile.flame_days > 0 && flame === 0 && (
            <p className="m-0 rounded-2xl bg-glow-soft px-4 py-3 text-sm font-bold text-glow-ink">
              Your {profile.flame_days}-day flame went out, but your best (
              {Math.max(profile.best_flame, profile.flame_days)} days) is saved forever. Finish one
              thing today to light a new one.
            </p>
          )}
          <div className="flex w-full flex-col gap-3">
            <Button
              variant="glow"
              size="lg"
              fullWidth
              onClick={() => {
                closeComeback();
                if (fogCount > 0) navigate('/review');
                else if (currentLesson) navigate(`/learn/${currentLesson.id}`);
              }}
            >
              {fogCount > 0 ? 'Warm up: clear the fog (2 min)' : 'Warm up with the next lesson'}
            </Button>
            <Button variant="ghost" fullWidth onClick={closeComeback}>
              Just look around
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

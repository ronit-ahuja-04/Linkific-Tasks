import { Flame, Lock, Play, Sparkles, Swords } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Guardian, Wisp } from '../../components/characters';
import { ErrorPanel, Loading } from '../../components/ui';
import { getCourseMap, listVisibleCourses } from '../../lib/api/courses';
import type { CourseMap, Lesson } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';

/** Zig-zag offsets for the lesson stones, in rem from the centre line. */
const OFFSETS = [0, -4, 1.5, 4, 1, -3.5];

async function loadMap(slug: string | null): Promise<CourseMap | null> {
  if (slug) return getCourseMap(slug);
  const live = (await listVisibleCourses()).filter((c) => c.status === 'live');
  return live[0] ? getCourseMap(live[0].slug) : null;
}

function Stone({ lesson, index, current }: { lesson: Lesson; index: number; current: boolean }) {
  const offset = OFFSETS[index % OFFSETS.length] ?? 0;
  const guardian = lesson.kind === 'guardian';
  // M1 shows the path; lesson progress and the player arrive in M3, so only the first stone is "today".
  const label = `${lesson.title}, ${guardian ? 'guardian battle' : lesson.kind}${current ? ', start here' : ', locked'}`;
  return (
    <li
      className="flex flex-col items-center gap-2"
      style={{ transform: `translateX(${offset}rem)` }}
    >
      {current && (
        <span
          aria-hidden="true"
          className="rounded-xl bg-white px-3 py-1 font-display text-sm font-bold tracking-wider text-ink shadow-[0_3px_0_var(--color-moon)]"
        >
          START
        </span>
      )}
      <button
        type="button"
        aria-label={label}
        title={lesson.title}
        className={[
          'flex items-center justify-center rounded-full',
          current
            ? 'h-20 w-20 bg-glow text-ink shadow-[0_7px_0_var(--color-glow-deep),0_0_0_10px_rgba(255,185,56,0.25)]'
            : 'h-16 w-16 bg-night-3 text-moon shadow-[0_6px_0_#221c52]',
        ].join(' ')}
      >
        {current ? (
          <Play aria-hidden="true" className="h-8 w-8 fill-current" />
        ) : guardian ? (
          <Swords aria-hidden="true" className="h-7 w-7" />
        ) : (
          <Lock aria-hidden="true" className="h-6 w-6" />
        )}
      </button>
    </li>
  );
}

export function MapPage() {
  const [params] = useSearchParams();
  const profile = useAppSelector((s) => s.auth.profile);
  const map = useAsync(() => loadMap(params.get('island')), [params.get('island')]);

  return (
    <div className="min-h-dvh bg-night px-4 pb-10 text-white">
      <header className="mx-auto flex max-w-xl items-center justify-between gap-3 py-4">
        <h1 className="m-0 text-xl font-semibold">
          {map.status === 'ready' && map.data ? map.data.island_name : 'The Lumen Isles'}
        </h1>
        <div className="flex items-center gap-4 font-black">
          <span
            aria-label={`Flame: ${profile?.flame_days ?? 0} days`}
            className="flex items-center gap-1 text-glow"
          >
            <Flame aria-hidden="true" className="h-5 w-5 fill-[#ff9b3d] text-[#ff9b3d]" />
            {profile?.flame_days ?? 0}
          </span>
          <span
            aria-label={`${profile?.light ?? 0} Light`}
            className="flex items-center gap-1 text-[#7cf5da]"
          >
            <Sparkles aria-hidden="true" className="h-5 w-5" />
            {profile?.light ?? 0}
          </span>
        </div>
      </header>

      {map.status === 'loading' && <Loading label="Lighting the map…" />}
      {map.status === 'error' && (
        <div className="rounded-[var(--radius-panel)] bg-paper text-ink">
          <ErrorPanel title="The map didn't load" message={map.error.message} onRetry={map.retry} />
        </div>
      )}
      {map.status === 'ready' && !map.data && (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
          <Wisp size={120} mood="sad" />
          <p className="m-0 font-display text-xl">
            No islands are lit yet. An instructor's first course will appear here.
          </p>
        </div>
      )}
      {map.status === 'ready' && map.data && (
        <div className="mx-auto flex max-w-xl flex-col gap-10">
          {map.data.units.map((unit, unitIndex) => (
            <section
              key={unit.id}
              aria-labelledby={`unit-${unit.id}`}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-violet px-5 py-4 shadow-[0_5px_0_var(--color-violet-deep)]">
                <div className="flex flex-col">
                  <span className="text-xs font-black tracking-[0.15em] text-[#e3dbff] uppercase">
                    Unit {unit.position}
                  </span>
                  <h2 id={`unit-${unit.id}`} className="m-0 text-xl font-semibold">
                    {unit.title}
                  </h2>
                </div>
                {unitIndex === map.data!.units.length - 1 && (
                  <Guardian guardian={map.data!.guardian} size={52} decorative />
                )}
              </div>
              <ol className="m-0 flex list-none flex-col items-center gap-8 p-0">
                {unit.lessons.map((lesson, i) => (
                  <Stone
                    key={lesson.id}
                    lesson={lesson}
                    index={i}
                    current={unitIndex === 0 && i === 0}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

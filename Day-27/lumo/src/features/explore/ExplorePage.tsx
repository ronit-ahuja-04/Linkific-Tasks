import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Guardian, Wisp } from '../../components/characters';
import { CardSkeletons, ErrorPanel, Field, SelectField, cardClasses } from '../../components/ui';
import { searchCourses } from '../../lib/api/courses';
import type { Level, Topic } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { LEVELS, TOPICS } from '../studio/options';

const isTopic = (v: string | null): v is Topic => TOPICS.some((t) => t.value === v);
const isLevel = (v: string | null): v is Level => LEVELS.some((l) => l.value === v);

/** Waits until typing pauses, so the database isn't asked on every keystroke. */
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

/**
 * Islands you can explore: search by words, filter by topic and level. The filters live in the URL, so a search
 * can be shared or bookmarked and Back works as expected.
 */
export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const topicParam = params.get('topic');
  const levelParam = params.get('level');
  const topic: Topic | '' = isTopic(topicParam) ? topicParam : '';
  const level: Level | '' = isLevel(levelParam) ? levelParam : '';
  const [text, setText] = useState(params.get('q') ?? '');
  const q = useDebounced(text.trim(), 250);

  // React Router applies URL changes in a transition, so `params` can be a render behind when clicks come
  // quickly. Every write starts from the newest params we know about, kept in a ref.
  const latest = useRef(params);
  useEffect(() => {
    latest.current = params;
  }, [params]);
  const write = useCallback(
    (key: 'q' | 'topic' | 'level' | null, value: string, replace = false) => {
      const next = key ? new URLSearchParams(latest.current) : new URLSearchParams();
      if (key && value) next.set(key, value);
      else if (key) next.delete(key);
      latest.current = next;
      setParams(next, { replace });
    },
    [setParams],
  );

  // Mirror the search into the URL once typing has settled (replace, so keystrokes don't fill the history).
  // Waiting for q === text also stops a pending debounce from writing an old word back after "Clear".
  const settled = q === text.trim();
  useEffect(() => {
    if (settled && (latest.current.get('q') ?? '') !== q) write('q', q, true);
  }, [q, settled, write]);

  const setFilter = (key: 'topic' | 'level', value: string) => write(key, value);

  const courses = useAsync(() => searchCourses({ q, topic, level }), [q, topic, level]);
  const filtered = Boolean(q || topic || level);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
      <h1 className="m-0 text-3xl font-bold">New islands on the horizon</h1>

      <div role="search" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-56 flex-[2]">
            <Field
              label="Search islands"
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Loops, budgets, colour…"
              maxLength={60}
              rightSlot={<Search aria-hidden="true" className="mr-2 h-5 w-5 text-dusk" />}
            />
          </div>
          <div className="min-w-40 flex-1">
            <SelectField
              label="Level"
              value={level}
              onChange={(e) => setFilter('level', e.target.value)}
              options={[{ value: '', label: 'Any level' }, ...LEVELS]}
            />
          </div>
        </div>
        <div role="group" aria-label="Topic" className="flex flex-wrap gap-2">
          {[{ value: '', label: 'All topics' }, ...TOPICS].map((t) => (
            <button
              key={t.value || 'all'}
              type="button"
              aria-pressed={topic === t.value}
              onClick={() => setFilter('topic', t.value)}
              className={[
                'min-h-11 rounded-full border-2 px-4 text-sm font-extrabold',
                topic === t.value
                  ? 'border-violet bg-violet text-white'
                  : 'border-line-strong bg-white text-ink hover:border-violet',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {courses.status === 'loading' && <CardSkeletons count={2} label="Scanning the horizon" />}
      {courses.status === 'error' && (
        <ErrorPanel
          title="Couldn't load islands"
          message={courses.error.message}
          onRetry={courses.retry}
        />
      )}
      {courses.status === 'ready' && (
        <>
          <p role="status" className="m-0 text-sm font-bold text-dusk">
            {courses.data.length === 0
              ? 'No islands found'
              : `${courses.data.length} island${courses.data.length === 1 ? '' : 's'}${filtered ? ' found' : ''}`}
          </p>
          {courses.data.length === 0 ? (
            <div className={cardClasses('flex flex-col items-center gap-3 p-8 text-center')}>
              <Wisp size={88} mood="think" decorative />
              <p className="m-0 text-dusk">
                Nothing on the horizon for that. Try fewer words or another topic.
              </p>
              {filtered && (
                <button
                  type="button"
                  onClick={() => {
                    setText('');
                    write(null, '');
                  }}
                  className="inline-flex min-h-11 items-center gap-2 font-extrabold text-violet-ink"
                >
                  <X aria-hidden="true" className="h-4 w-4" /> Clear search and filters
                </button>
              )}
            </div>
          ) : (
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4 p-0">
              {courses.data.map((course) => (
                <li key={course.id} className={cardClasses('flex flex-col gap-3 p-5')}>
                  <div className="flex items-center gap-3">
                    <Guardian guardian={course.guardian} size={56} decorative />
                    <div className="flex flex-col">
                      <h2 className="m-0 text-xl font-semibold">{course.island_name}</h2>
                      <span className="text-sm text-dusk">
                        {course.title} · <span className="capitalize">{course.level}</span>
                      </span>
                    </div>
                  </div>
                  <p className="m-0 flex-1 text-dusk">{course.summary}</p>
                  <Link
                    to={`/map?island=${course.slug}`}
                    className="font-extrabold text-violet-ink"
                    aria-label={`Open the map of ${course.island_name}`}
                  >
                    Open the map
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Guardian, Wisp } from '../../components/characters';
import { CardSkeletons, ErrorPanel, Field, buttonClasses, cardClasses } from '../../components/ui';
import { listOwnedCourses, listVisibleCourses } from '../../lib/api/courses';
import type { CourseStatus } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { STATUS } from './options';

const FILTERS: { value: CourseStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'in_review', label: 'In review' },
  { value: 'live', label: 'Live' },
];

/** The instructor's islands: find one, open it, or start a new one. */
export function StudioPage() {
  const profile = useAppSelector((s) => s.auth.profile);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<CourseStatus | 'all'>('all');
  // Admins can edit every course; instructors see their own.
  const courses = useAsync(
    () => (profile?.role === 'admin' ? listVisibleCourses() : listOwnedCourses(profile?.id ?? '')),
    [profile?.id, profile?.role],
  );

  const shown = useMemo(() => {
    if (courses.status !== 'ready') return [];
    const q = query.trim().toLowerCase();
    return courses.data.filter(
      (c) =>
        (status === 'all' || c.status === status) &&
        (!q || `${c.title} ${c.island_name}`.toLowerCase().includes(q)),
    );
  }, [courses, query, status]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-dusk">Course studio</span>
          <h1 className="m-0 text-3xl font-bold">Your islands</h1>
        </div>
        <Link to="/studio/new" className={buttonClasses({ variant: 'violet' })}>
          <Plus aria-hidden="true" className="h-5 w-5" /> New island
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-56 flex-1">
          <Field
            label="Search your islands"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title or island name"
            rightSlot={<Search aria-hidden="true" className="mr-2 h-5 w-5 text-dusk" />}
          />
        </div>
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={status === f.value}
              onClick={() => setStatus(f.value)}
              className={[
                'min-h-11 rounded-full border-2 px-4 text-sm font-extrabold',
                status === f.value
                  ? 'border-violet bg-violet text-white'
                  : 'border-line-strong bg-white text-ink hover:border-violet',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {courses.status === 'loading' && <CardSkeletons label="Loading your courses" />}
      {courses.status === 'error' && (
        <ErrorPanel
          title="Couldn't load your courses"
          message={courses.error.message}
          onRetry={courses.retry}
        />
      )}
      {courses.status === 'ready' && courses.data.length === 0 && (
        <div className={cardClasses('flex flex-col items-center gap-3 p-10 text-center')}>
          <Wisp size={96} mood="cheer" decorative />
          <h2 className="m-0 text-xl font-semibold">No islands yet</h2>
          <p className="m-0 max-w-sm text-dusk">
            Start one by hand now. Soon Wisp can draft a whole unit from a topic.
          </p>
          <Link to="/studio/new" className={buttonClasses({ variant: 'glow' })}>
            Create your first island
          </Link>
        </div>
      )}
      {courses.status === 'ready' && courses.data.length > 0 && (
        <>
          <p className="m-0 text-sm font-bold text-dusk" role="status">
            {shown.length === courses.data.length
              ? `${shown.length} island${shown.length === 1 ? '' : 's'}`
              : `${shown.length} of ${courses.data.length} islands`}
          </p>
          {shown.length === 0 ? (
            <p className={cardClasses('m-0 p-6 text-dusk')}>
              Nothing matches. Try another word or status.
            </p>
          ) : (
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-4 p-0">
              {shown.map((course) => (
                <li key={course.id}>
                  <Link
                    to={`/studio/${course.id}`}
                    className={cardClasses(
                      'flex items-center gap-4 p-5 text-ink no-underline hover:border-violet',
                    )}
                  >
                    <Guardian guardian={course.guardian} size={56} decorative />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <h2 className="m-0 truncate text-lg font-semibold">
                        {course.island_name} · {course.title}
                      </h2>
                      <div className="flex flex-wrap gap-2 text-xs font-black">
                        <span
                          className={`rounded-full px-2.5 py-1 ${STATUS[course.status].className}`}
                        >
                          {STATUS[course.status].label}
                        </span>
                        <span className="rounded-full bg-mist px-2.5 py-1 text-dusk">
                          v{course.version}
                        </span>
                        {course.ai_generated && (
                          <span className="rounded-full bg-violet-soft px-2.5 py-1 text-violet-deep">
                            AI-generated
                          </span>
                        )}
                      </div>
                    </div>
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

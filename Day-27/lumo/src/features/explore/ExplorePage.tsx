import { Link } from 'react-router-dom';
import { Guardian } from '../../components/characters';
import { ErrorPanel, Loading, cardClasses } from '../../components/ui';
import { listVisibleCourses } from '../../lib/api/courses';
import { useAsync } from '../../lib/useAsync';

/** Islands you can explore. Search and filters arrive in M2. */
export function ExplorePage() {
  const courses = useAsync(() => listVisibleCourses(), []);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
      <h1 className="m-0 text-3xl font-bold">New islands on the horizon</h1>
      {courses.status === 'loading' && <Loading label="Scanning the horizon…" />}
      {courses.status === 'error' && (
        <ErrorPanel
          title="Couldn't load islands"
          message={courses.error.message}
          onRetry={courses.retry}
        />
      )}
      {courses.status === 'ready' && (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4 p-0">
          {courses.data
            .filter((c) => c.status === 'live')
            .map((course) => (
              <li key={course.id} className={cardClasses('flex flex-col gap-3 p-5')}>
                <div className="flex items-center gap-3">
                  <Guardian guardian={course.guardian} size={56} decorative />
                  <div className="flex flex-col">
                    <h2 className="m-0 text-xl font-semibold">{course.island_name}</h2>
                    <span className="text-sm text-dusk">
                      {course.title} · {course.level}
                    </span>
                  </div>
                </div>
                <p className="m-0 text-dusk">{course.summary}</p>
                <Link to={`/map?island=${course.slug}`} className="font-extrabold text-violet-ink">
                  Open the map
                </Link>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

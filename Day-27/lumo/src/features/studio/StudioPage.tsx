import { useAppSelector } from '../../app/hooks';
import { Guardian } from '../../components/characters';
import { ErrorPanel, Loading, cardClasses } from '../../components/ui';
import { listOwnedCourses, listVisibleCourses } from '../../lib/api/courses';
import type { CourseStatus } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';

const STATUS: Record<CourseStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-glow-soft text-glow-ink' },
  in_review: { label: 'In review', className: 'bg-violet-soft text-violet-deep' },
  live: { label: 'Live', className: 'bg-lagoon-soft text-lagoon-ink' },
  archived: { label: 'Archived', className: 'bg-mist text-dusk' },
};

/** The instructor's islands. Editing (M2) and AI generation (M4) build on this list. */
export function StudioPage() {
  const profile = useAppSelector((s) => s.auth.profile);
  // Admins see every course they can edit (all of them); instructors see their own.
  const courses = useAsync(
    () => (profile?.role === 'admin' ? listVisibleCourses() : listOwnedCourses(profile?.id ?? '')),
    [profile?.id, profile?.role],
  );
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold text-dusk">Course studio</span>
        <h1 className="m-0 text-3xl font-bold">Your islands</h1>
      </div>
      {courses.status === 'loading' && <Loading label="Loading your courses…" />}
      {courses.status === 'error' && (
        <ErrorPanel
          title="Couldn't load your courses"
          message={courses.error.message}
          onRetry={courses.retry}
        />
      )}
      {courses.status === 'ready' && courses.data.length === 0 && (
        <p className={cardClasses('m-0 p-6 text-dusk')}>
          No courses yet. Creating courses (by hand or with Wisp) arrives next.
        </p>
      )}
      {courses.status === 'ready' && courses.data.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-4 p-0">
          {courses.data.map((course) => (
            <li key={course.id} className={cardClasses('flex items-center gap-4 p-5')}>
              <Guardian guardian={course.guardian} size={56} decorative />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="m-0 truncate text-lg font-semibold">
                  {course.island_name} · {course.title}
                </h2>
                <div className="flex flex-wrap gap-2 text-xs font-black">
                  <span className={`rounded-full px-2.5 py-1 ${STATUS[course.status].className}`}>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

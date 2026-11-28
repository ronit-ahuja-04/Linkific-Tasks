import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { cardClasses } from '../../components/ui';
import { createCourse } from '../../lib/api/studio';
import { useToast } from '../toast/useToast';
import { CourseForm } from './CourseForm';

export function NewCoursePage() {
  const profile = useAppSelector((s) => s.auth.profile);
  const navigate = useNavigate();
  const toast = useToast();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link to="/studio" className="inline-flex items-center gap-2 font-extrabold text-violet-ink">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Your islands
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-3xl font-bold">A new island</h1>
        <p className="m-0 text-dusk">
          It starts as a private draft. Add units and lessons next, then send it for review.
        </p>
      </div>
      <div className={cardClasses('p-6')}>
        <CourseForm
          mode="create"
          submitLabel="Create island"
          onCancel={() => navigate('/studio')}
          onSubmit={async (input) => {
            const course = await createCourse(profile?.id ?? '', input);
            toast.success(`${course.island_name} is on the map (as a draft).`);
            navigate(`/studio/${course.id}`, { replace: true });
          }}
        />
      </div>
    </div>
  );
}

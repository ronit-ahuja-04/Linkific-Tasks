import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Guardian, Wisp } from '../../components/characters';
import { Button, ErrorPanel, Loading, buttonClasses } from '../../components/ui';
import { getCourseMap, searchCourses } from '../../lib/api/courses';
import { signedUrl } from '../../lib/api/storage';
import { tasteCheck } from '../../lib/api/trust';
import { supabase } from '../../lib/supabase';
import type { LearnQuestion } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { QuizRunner, type QuizResult } from '../learn/QuizRunner';

interface Taste {
  island: string;
  guardian: 'byte' | 'nova' | 'mystery';
  slug: string;
  video: { title: string; url: string | null; captions: string | null; summary: string } | null;
  questions: LearnQuestion[];
}

/** The first unit of an island, as a visitor may see it: one video bite and up to three questions. */
async function loadTaste(slug: string): Promise<Taste> {
  const map = await getCourseMap(slug);
  const first = map.units[0];
  if (!first) throw new Error('This island has no lessons yet.');
  const videoLesson = first.lessons.find((l) => l.kind === 'video');
  const quizIds = first.lessons.filter((l) => l.kind !== 'video').map((l) => l.id);
  const [{ data: media }, { data: qs }] = await Promise.all([
    videoLesson
      ? supabase()
          .from('lessons')
          .select('video_path, captions_path')
          .eq('id', videoLesson.id)
          .single()
      : Promise.resolve({ data: null }),
    quizIds.length
      ? supabase()
          .from('questions')
          .select('id, prompt, code, options, concept, position')
          .in('lesson_id', quizIds)
          .order('position')
      : Promise.resolve({ data: [] }),
  ]);
  const m = media as { video_path: string | null; captions_path: string | null } | null;
  return {
    island: map.island_name,
    guardian: map.guardian,
    slug,
    video: videoLesson
      ? {
          title: videoLesson.title,
          summary: videoLesson.summary,
          url: m?.video_path
            ? await signedUrl('course-media', m.video_path).catch(() => null)
            : null,
          captions: m?.captions_path
            ? await signedUrl('course-media', m.captions_path).catch(() => null)
            : null,
        }
      : null,
    questions: ((qs ?? []) as (LearnQuestion & { position: number })[])
      .slice(0, 3)
      .map(({ position: _p, ...q }) => q),
  };
}

function IslandPicker() {
  const islands = useAsync(() => searchCourses({}), []);
  return (
    <main id="main" className="min-h-dvh bg-night px-5 py-10 text-white">
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-moon">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-3">
          <Wisp size={72} mood="happy" decorative />
          <h1 className="m-0 text-3xl font-bold">Pick an island to taste</h1>
        </div>
        <p className="m-0 text-moon">
          Three minutes, no account. Your progress isn’t saved until you sign up.
        </p>
        {islands.status === 'loading' && <Loading label="Finding islands…" />}
        {islands.status === 'error' && (
          <div className="rounded-2xl bg-paper text-ink">
            <ErrorPanel
              title="Couldn’t find islands"
              message={islands.error.message}
              onRetry={islands.retry}
            />
          </div>
        )}
        {islands.status === 'ready' &&
          islands.data.map((c) => (
            <Link
              key={c.id}
              to={`/taste/${c.slug}`}
              className="flex items-center gap-4 rounded-2xl border-2 border-night-line bg-night-2 p-4 text-white no-underline hover:border-glow"
            >
              <Guardian guardian={c.guardian} size={52} decorative />
              <span className="flex flex-col">
                <b className="font-display text-lg">{c.island_name}</b>
                <span className="text-sm text-moon">{c.summary}</span>
              </span>
            </Link>
          ))}
      </div>
    </main>
  );
}

/** A visitor tries an island's first unit before signing up: watch the first bite, answer up to three questions. */
export function TastePage() {
  const { slug } = useParams();
  if (!slug) return <IslandPicker />;
  return <TasteOf key={slug} slug={slug} />;
}

function TasteOf({ slug }: { slug: string }) {
  const taste = useAsync(() => loadTaste(slug), [slug]);
  const [step, setStep] = useState<'watch' | 'quiz' | 'done'>('watch');
  const [result, setResult] = useState<QuizResult | null>(null);

  if (taste.status === 'loading') return <Loading label="Rowing to the island…" />;
  if (taste.status === 'error') {
    return (
      <main id="main" className="px-5">
        <ErrorPanel title="This island can’t be tasted" message={taste.error.message} />
        <div className="flex justify-center">
          <Link to="/taste" className={buttonClasses({ variant: 'ghost' })}>
            Pick another island
          </Link>
        </div>
      </main>
    );
  }
  const t = taste.data;
  const current = step === 'watch' && !t.video ? 'quiz' : step;

  if (current === 'done' || (current === 'quiz' && t.questions.length === 0)) {
    return (
      <main
        id="main"
        className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-night px-5 text-center text-white"
      >
        <Wisp size={140} mood="cheer" />
        <h1 className="m-0 text-4xl font-bold text-glow">That’s a taste of {t.island}!</h1>
        <p className="m-0 max-w-md text-moon">
          {result ? `You got ${result.firstTry} of ${result.total} on the first try. ` : ''}
          Sign up to keep your Light, start your daily flame, and meet me properly.
        </p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Link
            to="/register"
            className={buttonClasses({ variant: 'glow', size: 'lg', fullWidth: true })}
          >
            Save my progress
          </Link>
          <Link to="/taste" className={buttonClasses({ variant: 'dark', fullWidth: true })}>
            Taste another island
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="flex min-h-dvh flex-col bg-paper">
      <header className="flex items-center gap-3 border-b-2 border-line px-4 py-3">
        <Link
          to="/taste"
          aria-label="Back to the islands"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-dusk hover:bg-mist"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Link>
        <Guardian guardian={t.guardian} size={36} decorative />
        <span className="font-display font-semibold">Tasting {t.island}</span>
        <span className="ml-auto rounded-full bg-glow-soft px-3 py-1 text-xs font-black text-glow-ink">
          No account needed
        </span>
      </header>
      {current === 'watch' && t.video && (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 py-6">
          <h1 className="m-0 text-3xl font-bold">{t.video.title}</h1>
          {t.video.url ? (
            <video
              src={t.video.url}
              controls
              playsInline
              preload="metadata"
              crossOrigin="anonymous"
              className="aspect-video w-full rounded-[var(--radius-card)] bg-night"
            >
              {t.video.captions && (
                <track
                  kind="captions"
                  src={t.video.captions}
                  srcLang="en"
                  label="English"
                  default
                />
              )}
            </video>
          ) : (
            <p className="m-0 rounded-2xl bg-night p-5 text-white">
              {t.video.summary || 'This bite’s video is still being made.'}
            </p>
          )}
          <div className="mt-auto flex justify-end">
            <Button variant="glow" size="lg" onClick={() => setStep('quiz')}>
              {t.questions.length ? 'Try the questions' : 'Finish the taste'}
            </Button>
          </div>
        </div>
      )}
      {current === 'quiz' && (
        <>
          <h1 className="sr-only">Taste quiz</h1>
          <QuizRunner
            questions={t.questions}
            requeue={false}
            persona="cheeky"
            grade={(q, choice) => tasteCheck(q.id, choice)}
            onDone={(r) => {
              setResult(r);
              setStep('done');
            }}
          />
        </>
      )}
    </main>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Guardian, Wisp } from '../../components/characters';
import { ErrorPanel, Loading } from '../../components/ui';
import { getCourseMap, searchCourses } from '../../lib/api/courses';
import { finishOnboarding, getPlayableLesson, submitAnswer } from '../../lib/api/learn';
import { toAppError } from '../../lib/errors';
import type { Course, LearnQuestion, Profile } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { profilePatched } from '../auth/authSlice';
import { QuizRunner } from '../learn/QuizRunner';

type Persona = Profile['wisp_persona'];
type Step = 'island' | 'goal' | 'persona' | 'experience' | 'placement' | 'saving' | 'error';

interface Message {
  from: 'wisp' | 'me';
  text: string;
}

const GOALS = [
  { minutes: 3, label: 'Casual', hint: '3 min a day' },
  { minutes: 10, label: 'Regular', hint: '10 min a day' },
  { minutes: 20, label: 'Serious', hint: '20 min a day' },
  { minutes: 30, label: 'Intense', hint: '30 min a day' },
];

const PERSONAS: { value: Persona; label: string; sample: string }[] = [
  { value: 'cheeky', label: 'Cheeky', sample: '“Ooh, sneaky one. Here’s the trick…”' },
  { value: 'calm', label: 'Calm', sample: '“Not this time, and that’s fine.”' },
  { value: 'coach', label: 'Coach', sample: '“Missed. Here’s the fix.”' },
];

const EXPERIENCE = [
  { value: 'new', label: 'I’m brand new' },
  { value: 'some', label: 'I know a little' },
  { value: 'lots', label: 'I know it well' },
] as const;

/** Up to two questions from the island's first unit, for Wisp's placement check. */
async function placementQuestions(
  course: Course,
): Promise<{ questions: LearnQuestion[]; units: number }> {
  const map = await getCourseMap(course.slug);
  const first = map.units[0];
  const quiz = first?.lessons.find((l) => l.kind !== 'video' && (l.concepts?.length ?? 0) > 0);
  if (!first || !quiz || map.units.length < 2) return { questions: [], units: map.units.length };
  const lesson = await getPlayableLesson(quiz.id);
  return { questions: lesson.questions.slice(0, 2), units: map.units.length };
}

/**
 * First run: a short chat with Wisp. Pick an island, a daily goal and how Wisp should talk; learners who already
 * know some of the topic get a two-question placement check that can start them at unit 2.
 */
export function SetupPage() {
  const profile = useAppSelector((s) => s.auth.profile);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const islands = useAsync(() => searchCourses({}), []);
  const [step, setStep] = useState<Step>('island');
  const [log, setLog] = useState<Message[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [goal, setGoal] = useState(10);
  const [persona, setPersona] = useState<Persona>('cheeky');
  const [placement, setPlacement] = useState<LearnQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const choicesRef = useRef<HTMLDivElement>(null);

  // Put keyboard focus on each new set of choices, so the chat can be answered without a mouse.
  useEffect(() => {
    choicesRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [step, islands.status]);

  if (!profile) return null;
  if (profile.onboarded_at) return <Navigate to="/map" replace />;
  const name = profile.display_name.split(' ')[0];

  const say = (...messages: Message[]) => setLog((l) => [...l, ...messages]);

  async function save(startUnit: number, closing: string) {
    if (!course) return;
    setStep('saving');
    say({ from: 'wisp', text: closing });
    try {
      await finishOnboarding({ courseId: course.id, goal, persona, startUnit });
      dispatch(
        profilePatched({
          onboarded_at: new Date().toISOString(),
          daily_goal_minutes: goal,
          wisp_persona: persona,
        }),
      );
      navigate(`/map?island=${course.slug}`, { replace: true });
    } catch (e) {
      setError(toAppError(e).message);
      setStep('error');
    }
  }

  async function chooseExperience(value: (typeof EXPERIENCE)[number]['value'], label: string) {
    say({ from: 'me', text: label });
    if (!course) return;
    if (value === 'new') {
      await save(1, 'Then we start at the very first lantern. I’ll be right there with you.');
      return;
    }
    try {
      const { questions } = await placementQuestions(course);
      if (questions.length === 0) {
        await save(1, 'Let’s start at the beginning. It’ll fly by if you know it.');
        return;
      }
      setPlacement(questions);
      say({ from: 'wisp', text: `Let’s see! Two quick ones. Get both right and we skip ahead.` });
      setStep('placement');
    } catch {
      await save(1, 'Let’s start at the beginning. It’ll fly by if you know it.');
    }
  }

  const prompts: Record<Step, string> = {
    island: `Hi ${name}! I’m Wisp. The isles went dark, and every lesson you finish lights one back up. Which island first?`,
    goal: 'How much time can you give the isles each day? Keeping your daily flame lit is what makes it stick.',
    persona: 'And how should I talk to you when you get something wrong?',
    experience: `Last one. Have you learned any ${course?.topic === 'code' ? 'code' : (course?.title ?? 'of this')} before?`,
    placement: '',
    saving: '',
    error: '',
  };

  return (
    <main id="main" className="flex min-h-dvh flex-col bg-night text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-5 py-8">
        <h1 className="sr-only">Set up Lumo with Wisp</h1>
        <ol aria-live="polite" className="m-0 flex list-none flex-col gap-3 p-0">
          {log.map((m, i) => (
            <li key={i} className={`flex items-end gap-2 ${m.from === 'me' ? 'justify-end' : ''}`}>
              {m.from === 'wisp' && <Wisp size={40} decorative glow={false} />}
              <p
                className={`m-0 max-w-[80%] rounded-2xl px-4 py-3 font-bold ${
                  m.from === 'wisp'
                    ? 'rounded-bl-sm bg-white text-ink'
                    : 'rounded-br-sm bg-violet text-white'
                }`}
              >
                <span className="sr-only">{m.from === 'wisp' ? 'Wisp: ' : 'You: '}</span>
                {m.text}
              </p>
            </li>
          ))}
          {prompts[step] && (
            <li className="flex items-end gap-3">
              <Wisp
                size={step === 'island' && log.length === 0 ? 96 : 40}
                mood="happy"
                decorative
                glow={false}
              />
              <p className="m-0 max-w-[80%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 font-bold text-ink">
                <span className="sr-only">Wisp: </span>
                {prompts[step]}
              </p>
            </li>
          )}
        </ol>

        <div ref={choicesRef} className="mt-2 flex flex-col gap-3">
          {step === 'island' && islands.status === 'loading' && (
            <Loading label="Finding open islands…" />
          )}
          {step === 'island' && islands.status === 'error' && (
            <div className="rounded-2xl bg-paper text-ink">
              <ErrorPanel
                title="Couldn’t find the islands"
                message={islands.error.message}
                onRetry={islands.retry}
              />
            </div>
          )}
          {step === 'island' && islands.status === 'ready' && islands.data.length === 0 && (
            <p className="m-0 text-moon">No islands are open yet. Check back soon!</p>
          )}
          {step === 'island' &&
            islands.status === 'ready' &&
            islands.data.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCourse(c);
                  say({ from: 'wisp', text: prompts.island }, { from: 'me', text: c.island_name });
                  setStep('goal');
                }}
                className="flex items-center gap-4 rounded-2xl border-2 border-night-line bg-night-2 p-3 text-left hover:border-glow"
              >
                <Guardian guardian={c.guardian} size={52} decorative />
                <span className="flex flex-col">
                  <b className="font-display text-lg">{c.island_name}</b>
                  <span className="text-sm text-moon">
                    {c.title} · <span className="capitalize">{c.level}</span>
                  </span>
                </span>
              </button>
            ))}

          {step === 'goal' && (
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.minutes}
                  type="button"
                  onClick={() => {
                    setGoal(g.minutes);
                    say(
                      { from: 'wisp', text: prompts.goal },
                      { from: 'me', text: `${g.label}: ${g.hint}` },
                    );
                    setStep('persona');
                  }}
                  className="flex flex-col rounded-2xl border-2 border-night-line bg-night-2 p-4 text-left hover:border-glow"
                >
                  <b className="font-display text-lg">{g.label}</b>
                  <span className="text-sm text-moon">{g.hint}</span>
                </button>
              ))}
            </div>
          )}

          {step === 'persona' &&
            PERSONAS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setPersona(p.value);
                  say({ from: 'wisp', text: prompts.persona }, { from: 'me', text: p.label });
                  setStep('experience');
                }}
                className="flex flex-col rounded-2xl border-2 border-night-line bg-night-2 p-4 text-left hover:border-glow"
              >
                <b className="font-display text-lg">{p.label}</b>
                <span className="text-sm text-moon">{p.sample}</span>
              </button>
            ))}

          {step === 'experience' &&
            EXPERIENCE.map((x) => (
              <button
                key={x.value}
                type="button"
                onClick={() => {
                  say({ from: 'wisp', text: prompts.experience });
                  void chooseExperience(x.value, x.label);
                }}
                className="rounded-2xl border-2 border-night-line bg-night-2 p-4 text-left font-display text-lg font-bold hover:border-glow"
              >
                {x.label}
              </button>
            ))}

          {step === 'saving' && <Loading label="Lighting your first island…" />}
          {step === 'error' && (
            <div className="rounded-2xl bg-paper text-ink">
              <ErrorPanel
                title="Couldn’t save your setup"
                message={error ?? ''}
                onRetry={() => setStep('experience')}
              />
            </div>
          )}
        </div>
      </div>

      {step === 'placement' && (
        <div className="flex flex-col bg-paper text-ink">
          <QuizRunner
            questions={placement}
            requeue={false}
            persona={persona}
            grade={(q, choice) => submitAnswer(q.id, choice)}
            onDone={(r) =>
              void (r.firstTry === r.total
                ? save(
                    2,
                    'You know your stuff! I’ll start you at unit 2. Unit 1 stays open if you want it.',
                  )
                : save(1, 'Good try! We’ll start at the beginning. It’ll go quickly for you.'))
            }
          />
        </div>
      )}
    </main>
  );
}

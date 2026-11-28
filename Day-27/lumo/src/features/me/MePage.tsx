import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Wisp } from '../../components/characters';
import { Button, buttonClasses, cardClasses } from '../../components/ui';
import { levelForLight, levelProgress, stageForLevel } from '../../lib/game/level';
import { signOut } from '../auth/authSlice';

const STAGE_NAMES = { spark: 'Spark', wisp: 'Wisp', lantern: 'Lantern', beacon: 'Beacon' } as const;

export function MePage() {
  const profile = useAppSelector((s) => s.auth.profile);
  const dispatch = useAppDispatch();
  if (!profile) return null;
  const level = levelForLight(profile.light);
  const stage = stageForLevel(level);
  const progress = Math.round(levelProgress(profile.light) * 100);
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 px-5 py-8">
      <section className="flex flex-col items-center gap-3 rounded-[var(--radius-panel)] bg-night px-6 py-6 text-white">
        <Wisp size={130} stage={stage} />
        <h1 className="m-0 text-2xl font-bold">Wisp · {STAGE_NAMES[stage]} stage</h1>
        <p className="m-0 text-moon">
          {profile.display_name}'s guide · level {level}
        </p>
        <div className="flex w-full flex-col gap-1">
          <div
            role="progressbar"
            aria-label="Progress to the next level"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-3 overflow-hidden rounded-full bg-night-3"
          >
            <div className="h-full rounded-full bg-glow" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>
      <dl className="m-0 grid grid-cols-2 gap-3">
        {[
          ['Light', profile.light],
          ['Flame', `${profile.flame_days} days`],
          ['Best flame', `${profile.best_flame} days`],
          ['Embers', profile.embers],
        ].map(([label, value]) => (
          <div key={label} className={cardClasses('flex flex-col px-4 py-3')}>
            <dt className="text-sm text-dusk">{label}</dt>
            <dd className="m-0 font-display text-2xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      {profile.role !== 'learner' && (
        <Link
          to={profile.role === 'admin' ? '/admin' : '/studio'}
          className={buttonClasses({ variant: 'violet', fullWidth: true })}
        >
          Back to {profile.role === 'admin' ? 'admin' : 'the studio'}
        </Link>
      )}
      <Button variant="ghost" fullWidth onClick={() => void dispatch(signOut())}>
        Sign out
      </Button>
    </div>
  );
}

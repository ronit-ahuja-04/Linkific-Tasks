import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Wisp } from '../../components/characters';
import { Button, buttonClasses, cardClasses } from '../../components/ui';
import { levelForLight, levelProgress, stageForLevel } from '../../lib/game/level';
import { effectiveFlame } from '../../lib/game/path';
import { myCertificates } from '../../lib/api/trust';
import { useAsync } from '../../lib/useAsync';
import { Award } from 'lucide-react';
import { signOut } from '../auth/authSlice';

const STAGE_NAMES = { spark: 'Spark', wisp: 'Wisp', lantern: 'Lantern', beacon: 'Beacon' } as const;

export function MePage() {
  const profile = useAppSelector((s) => s.auth.profile);
  const dispatch = useAppDispatch();
  const certificates = useAsync(() => myCertificates(), [profile?.id]);
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
          ['Flame', `${effectiveFlame(profile)} days`],
          ['Best flame', `${profile.best_flame} days`],
          ['Embers', profile.embers],
        ].map(([label, value]) => (
          <div key={label} className={cardClasses('flex flex-col px-4 py-3')}>
            <dt className="text-sm text-dusk">{label}</dt>
            <dd className="m-0 font-display text-2xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      {certificates.status === 'ready' && certificates.data.length > 0 && (
        <section aria-labelledby="certs-heading" className="flex flex-col gap-3">
          <h2 id="certs-heading" className="m-0 text-xl font-semibold">
            Certificates
          </h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {certificates.data.map((c) => (
              <li key={c.code}>
                <Link
                  to={`/verify/${c.code}`}
                  className={cardClasses(
                    'flex items-center gap-3 px-4 py-3 text-ink no-underline hover:border-glow',
                  )}
                >
                  <Award aria-hidden="true" className="h-6 w-6 text-glow-deep" />
                  <span className="flex flex-col">
                    <b>{c.course.island_name}</b>
                    <span className="text-sm text-dusk">
                      {c.course.title} · {new Date(c.issued_at).toLocaleDateString()}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
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

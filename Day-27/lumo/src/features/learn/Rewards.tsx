import { Flame, Sparkles, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { Wisp } from '../../components/characters';
import { levelForLight, stageForLevel } from '../../lib/game/level';
import { wispSays } from '../../lib/game/wisp';
import type { Profile } from '../../lib/types';

const STAGE = { spark: 'Spark', wisp: 'Wisp', lantern: 'Lantern', beacon: 'Beacon' } as const;

export interface RewardNumbers {
  lightBefore: number;
  lightAfter: number;
  flameBefore: number;
  flameAfter: number;
  /** Light this activity gave (0 when a lesson was already finished before). */
  earned: number;
  heading: string;
  note?: string;
}

function Tile({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[var(--radius-card)] bg-night-2 px-4 py-4">
      <span className={accent}>{icon}</span>
      <span className="font-display text-3xl font-bold">{value}</span>
      <span className="text-sm text-moon">{label}</span>
    </div>
  );
}

/** The payoff after a lesson or review: what was earned, the flame, and any level or stage-up. */
export function Rewards({
  numbers,
  persona,
  actions,
}: {
  numbers: RewardNumbers;
  persona: Profile['wisp_persona'];
  actions: ReactNode;
}) {
  const levelBefore = levelForLight(numbers.lightBefore);
  const levelAfter = levelForLight(numbers.lightAfter);
  const stageBefore = stageForLevel(levelBefore);
  const stageAfter = stageForLevel(levelAfter);
  const flameUp = numbers.flameAfter > numbers.flameBefore;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-night px-5 py-10 text-center text-white">
      <div className="animate-[bounce_1s_ease-in-out_2]">
        <Wisp size={150} mood="cheer" stage={stageAfter} />
      </div>
      <div className="flex flex-col gap-1" role="status">
        <h1 className="m-0 text-4xl font-bold text-glow">{numbers.heading}</h1>
        <p className="m-0 text-moon">
          {numbers.note ?? wispSays(persona, 'done', numbers.lightAfter)}
        </p>
      </div>
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <Tile
          icon={<Sparkles aria-hidden="true" className="h-7 w-7" />}
          accent="text-[#7cf5da]"
          value={numbers.earned > 0 ? `+${numbers.earned}` : '0'}
          label={numbers.earned > 0 ? 'Light earned' : 'Light (already earned)'}
        />
        <Tile
          icon={<Flame aria-hidden="true" className="h-7 w-7 fill-[#ff9b3d] text-[#ff9b3d]" />}
          accent=""
          value={`${numbers.flameAfter}`}
          label={flameUp ? 'Flame grew today!' : `day flame${numbers.flameAfter === 1 ? '' : 's'}`}
        />
      </div>
      {levelAfter > levelBefore && (
        <p className="m-0 flex items-center gap-2 rounded-full bg-violet px-5 py-2 font-display text-lg font-bold">
          <TrendingUp aria-hidden="true" className="h-5 w-5" /> Level {levelAfter}!
          {stageAfter !== stageBefore && ` Wisp grew into a ${STAGE[stageAfter]}.`}
        </p>
      )}
      <div className="flex w-full max-w-md flex-col gap-3">{actions}</div>
    </div>
  );
}

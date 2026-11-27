import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { Bug, CheckCircle2, Flame, Layers, RotateCcw, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';
import type { MicroChallenge } from '../../lib/demoCurricula';
import { SKILL_LABELS } from '../../lib/game/catalog';
import { sfx } from '../../lib/game/sfx';
import { FloatingParticles, type SparkBurstItem } from './FloatingParticles';

export interface MicroChallengeCardProps {
  challenge: MicroChallenge;
  combo?: number;
  solved?: boolean;
  onSolved: (xpReward: number) => void;
  onWrong?: () => void;
}

export function MicroChallengeCard({
  challenge,
  combo = 0,
  solved = false,
  onSolved,
  onWrong,
}: MicroChallengeCardProps) {
  const reduce = useReducedMotion();
  const [selectedSingle, setSelectedSingle] = useState<string | null>(null);
  const [sequencePicks, setSequencePicks] = useState<string[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [shakeTick, setShakeTick] = useState(0);
  const [cleared, setCleared] = useState(solved);
  const [sparks, setSparks] = useState<SparkBurstItem[]>([]);

  const emitSpark = (label: string, tone: SparkBurstItem['tone'] = 'gold') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setSparks((prev) => [
      ...prev.slice(-4),
      { id, label, tone, xOffset: (Math.random() - 0.5) * 40 },
    ]);
  };

  const triggerWrong = () => {
    sfx.error();
    setWrongCount((prev) => prev + 1);
    setShakeTick((prev) => prev + 1);
    emitSpark('MISS!', 'danger');
    onWrong?.();
  };

  const triggerWin = () => {
    sfx.combo(Math.max(1, combo + 1));
    setCleared(true);
    emitSpark(`+${challenge.xpReward} XP`, 'gold');
    if (combo + 1 >= 2) {
      setTimeout(() => emitSpark(`COMBO x${combo + 1}!`, 'brand'), 120);
    }
    onSolved(challenge.xpReward);
  };

  const handleSingleClick = (option: string) => {
    if (cleared) return;
    setSelectedSingle(option);
    if (option === challenge.correctAnswer) {
      triggerWin();
    } else {
      triggerWrong();
    }
  };

  const handleSequenceToggle = (tile: string) => {
    if (cleared) return;
    sfx.tap();
    if (sequencePicks.includes(tile)) {
      setSequencePicks((prev) => prev.filter((item) => item !== tile));
      return;
    }
    const next = [...sequencePicks, tile];
    setSequencePicks(next);

    if (next.length === challenge.options.length && Array.isArray(challenge.correctAnswer)) {
      const exactMatch = next.every((val, idx) => val === challenge.correctAnswer[idx]);
      if (exactMatch) {
        triggerWin();
      } else {
        triggerWrong();
      }
    }
  };

  const kindIcon =
    challenge.kind === 'bug_hunt' ? (
      <Bug className="h-3.5 w-3.5" aria-hidden="true" />
    ) : challenge.kind === 'sequence' ? (
      <Layers className="h-3.5 w-3.5" aria-hidden="true" />
    ) : (
      <Zap className="h-3.5 w-3.5" aria-hidden="true" />
    );

  const kindLabel =
    challenge.kind === 'bug_hunt'
      ? 'Bug Hunt'
      : challenge.kind === 'sequence'
        ? 'Pipeline Forge'
        : 'Critical Strike';

  return (
    <m.div
      key={shakeTick}
      animate={reduce || shakeTick === 0 ? undefined : { x: [0, -8, 8, -5, 5, 0] }}
      transition={{ duration: 0.35 }}
      className={`rpg-card relative p-5 transition-colors ${
        cleared ? 'border-good bg-good/5' : 'border-line bg-surface'
      }`}
    >
      <FloatingParticles items={sparks} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-3 py-1 font-mono text-xs font-bold text-brand">
            {kindIcon}
            <span>{kindLabel}</span>
          </span>
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-muted">
            {SKILL_LABELS[challenge.skillTag]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {combo > 0 && (
            <m.span
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1 rounded-full bg-warn/15 px-2.5 py-1 font-mono text-xs font-extrabold text-warn"
            >
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />x{combo} Combo
            </m.span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/30 px-2.5 py-1 font-mono text-xs font-extrabold text-ink dark:text-gold">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />+{challenge.xpReward} XP
          </span>
        </div>
      </div>

      <h3 className="mt-3 font-display text-lg font-bold leading-snug">{challenge.prompt}</h3>

      {challenge.codeSnippet && (
        <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-[#181226] p-3.5 font-mono text-xs leading-relaxed text-[#E7DFFF]">
          <code>{challenge.codeSnippet}</code>
        </pre>
      )}

      {challenge.kind === 'sequence' ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border-2 border-dashed border-line bg-surface-2/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-muted">
                Selected Sequence ({sequencePicks.length}/{challenge.options.length})
              </span>
              {sequencePicks.length > 0 && !cleared && (
                <button
                  type="button"
                  onClick={() => setSequencePicks([])}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Clear order
                </button>
              )}
            </div>
            {sequencePicks.length > 0 ? (
              <ol className="mt-2 flex flex-wrap gap-2">
                {sequencePicks.map((item, idx) => (
                  <m.li
                    layout
                    key={item}
                    initial={reduce ? false : { scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-lg bg-brand px-2.5 py-1 text-xs font-bold text-on-brand"
                  >
                    {idx + 1}. {item}
                  </m.li>
                ))}
              </ol>
            ) : (
              <p className="mt-1.5 text-xs text-muted">
                Tap steps below in execution order from Step 1 to Step {challenge.options.length}.
              </p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {challenge.options.map((tile) => {
              const stepIdx = sequencePicks.indexOf(tile);
              const picked = stepIdx >= 0;
              return (
                <m.button
                  key={tile}
                  type="button"
                  whileHover={reduce || cleared ? undefined : { y: -2 }}
                  whileTap={reduce || cleared ? undefined : { scale: 0.97 }}
                  onClick={() => handleSequenceToggle(tile)}
                  disabled={cleared}
                  className={`flex items-center justify-between gap-2 rounded-xl border-2 px-3.5 py-2.5 text-left text-xs font-bold transition-colors ${
                    cleared
                      ? 'border-good bg-good/15 text-ink'
                      : picked
                        ? 'border-brand bg-brand/15 text-brand'
                        : 'border-line bg-surface hover:border-brand hover:bg-surface-2'
                  }`}
                >
                  <span>{tile}</span>
                  {picked && (
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-[11px] text-on-brand">
                      {stepIdx + 1}
                    </span>
                  )}
                </m.button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-2.5">
          {challenge.options.map((option) => {
            const isChosen = selectedSingle === option;
            const isCorrect = option === challenge.correctAnswer;
            const showGood = cleared && isCorrect;
            const showBad = isChosen && !isCorrect && !cleared;
            return (
              <m.button
                key={option}
                type="button"
                whileHover={reduce || cleared ? undefined : { y: -2, x: 2 }}
                whileTap={reduce || cleared ? undefined : { scale: 0.98 }}
                onClick={() => handleSingleClick(option)}
                disabled={cleared}
                className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-bold transition-colors ${
                  showGood
                    ? 'border-good bg-good/15 text-ink'
                    : showBad
                      ? 'border-danger bg-danger/10 text-danger'
                      : 'border-line bg-surface hover:border-brand hover:bg-surface-2'
                }`}
              >
                <span>{option}</span>
                {showGood && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-good" aria-hidden="true" />
                )}
              </m.button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {wrongCount > 0 && !cleared && (
          <m.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className="mt-3 rounded-xl border border-warn/40 bg-warn/10 px-3.5 py-2 text-xs font-semibold text-warn"
          >
            Hint: {challenge.hint}
          </m.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cleared && (
          <m.div
            initial={reduce ? false : { opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            role="status"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-good/40 bg-good/15 px-4 py-3 text-xs font-semibold text-ink"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-good" aria-hidden="true" />
            <div>
              <p className="font-display text-sm font-bold text-good">Quest Challenge Cleared!</p>
              <p className="mt-0.5 text-muted">{challenge.explanation}</p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

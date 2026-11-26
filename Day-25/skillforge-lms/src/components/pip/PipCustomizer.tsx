import { useState } from 'react';
import {
  CLASSES,
  CLASS_INFO,
  PIP_ACCESSORIES,
  PIP_TINTS,
  PIP_TINT_NAMES,
  SKILL_LABELS,
} from '../../lib/game/catalog';
import type { CharacterClass, PipMood, PipStage } from '../../types/lms';
import { Pip } from './Pip';

export interface PipCustomizerProps {
  characterClass: CharacterClass;
  pipTint: number;
  pipAccessory: number;
  stage?: PipStage;
  mood?: PipMood;
  onChangeClass: (value: CharacterClass) => void;
  onChangeTint: (value: number) => void;
  onChangeAccessory: (value: number) => void;
}

export function PipCustomizer({
  characterClass,
  pipTint,
  pipAccessory,
  stage = 'sprout',
  mood = 'happy',
  onChangeClass,
  onChangeTint,
  onChangeAccessory,
}: PipCustomizerProps) {
  const [hop, setHop] = useState(0);

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div className="rpg-card flex flex-col items-center justify-center bg-surface-2/60 p-5 text-center">
        <button
          type="button"
          onClick={() => setHop((prev) => prev + 1)}
          aria-label="Tap Pip to hop"
          className="cursor-pointer rounded-3xl p-2 focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Pip
            stage={stage}
            mood={mood}
            hop={hop}
            tint={pipTint}
            accessory={pipAccessory}
            className="h-auto w-40"
          />
        </button>
        <p className="mt-2 text-xs font-semibold text-muted">
          Tap Pip to test a hop · {CLASS_INFO[characterClass].label}
        </p>
      </div>

      <div className="space-y-5">
        <fieldset>
          <legend className="text-sm font-bold">Character Class (+10% home skill XP)</legend>
          <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
            {CLASSES.map((cls) => {
              const info = CLASS_INFO[cls];
              const selected = cls === characterClass;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => onChangeClass(cls)}
                  aria-pressed={selected}
                  className={`rounded-xl border-2 p-3 text-left transition-colors ${
                    selected
                      ? 'border-brand bg-brand/10'
                      : 'border-line bg-surface hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold">{info.label}</span>
                    {selected && (
                      <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-on-brand">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">{info.motto}</p>
                  <p className="mt-1.5 font-mono text-[11px] text-brand">
                    {info.home.map((s) => SKILL_LABELS[s]).join(' · ')}
                  </p>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold">Pip Coat Tint</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PIP_TINTS.map((hex, index) => {
              const name = PIP_TINT_NAMES[index] ?? `Tint ${index}`;
              const selected = pipTint === index;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onChangeTint(index)}
                  aria-label={`Select ${name} tint`}
                  aria-pressed={selected}
                  className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-semibold ${
                    selected ? 'border-brand bg-surface-2' : 'border-line bg-surface'
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-ink/40"
                    style={{ backgroundColor: hex }}
                    aria-hidden="true"
                  />
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold">Pip Accessory</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PIP_ACCESSORIES.map((label, index) => {
              const selected = pipAccessory === index;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onChangeAccessory(index)}
                  aria-pressed={selected}
                  className={`rounded-full border-2 px-3 py-1 text-xs font-semibold ${
                    selected
                      ? 'border-brand bg-brand text-on-brand'
                      : 'border-line bg-surface hover:bg-surface-2'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

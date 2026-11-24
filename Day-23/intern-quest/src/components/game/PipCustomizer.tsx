'use client';

import Pip, { PIP_ACCESSORIES, PIP_TINT_NAMES, PIP_TINTS } from '@/components/Pip';

/** Choose Pip's colour and accessory, with a live preview. Loaded lazily by the character editor (next/dynamic). */
export default function PipCustomizer({ tint, accessory, onChange }: { tint: number; accessory: number; onChange: (next: { tint: number; accessory: number }) => void }) {
  return (
    <div className="customizer">
      <div className="customizer-preview" aria-hidden="true">
        <Pip stage="sprout" mood="happy" hop={tint * 10 + accessory} tint={tint} accessory={accessory} />
      </div>
      <fieldset>
        <legend>Colour</legend>
        <div className="swatches">
          {PIP_TINTS.map((colour, i) => (
            <button key={colour} type="button" className="swatch" style={{ background: colour }} aria-pressed={tint === i} aria-label={PIP_TINT_NAMES[i]} title={PIP_TINT_NAMES[i]}
              onClick={() => onChange({ tint: i, accessory })} />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Accessory</legend>
        <div className="skill-chips">
          {PIP_ACCESSORIES.map((name, i) => (
            <button key={name} type="button" className="chip" aria-pressed={accessory === i} onClick={() => onChange({ tint, accessory: i })}>{name}</button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

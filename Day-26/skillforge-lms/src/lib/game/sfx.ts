type AudioCtor = typeof AudioContext;

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: AudioCtor;
}

let sharedCtx: AudioContext | null = null;
let soundEnabledFlag = true;

export function setSfxEnabled(enabled: boolean): void {
  soundEnabledFlag = enabled;
}

export function isSfxEnabled(): boolean {
  return soundEnabledFlag;
}

function getAudioContext(): AudioContext | null {
  if (!soundEnabledFlag || typeof window === 'undefined') return null;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;

  const w = window as WindowWithWebkitAudio;
  const Ctor = window.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;

  try {
    if (!sharedCtx) {
      sharedCtx = new Ctor();
    }
    if (sharedCtx.state === 'suspended') {
      void sharedCtx.resume();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

function playTone(
  freq: number,
  durationSec: number,
  options: {
    type?: OscillatorType;
    gain?: number;
    delay?: number;
    endFreq?: number;
  } = {},
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const { type = 'triangle', gain = 0.08, delay = 0, endFreq } = options;
  const start = ctx.currentTime + delay;

  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), start + durationSec);
  }

  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

  osc.connect(amp);
  amp.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + durationSec + 0.02);
}

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66] as const;

export const sfx = {
  tap(): void {
    playTone(540, 0.06, { type: 'sine', gain: 0.05, endFreq: 720 });
  },
  hop(combo = 1): void {
    const base = PENTATONIC[Math.min(combo - 1, PENTATONIC.length - 1)] ?? 523.25;
    playTone(base * 0.75, 0.14, { type: 'triangle', gain: 0.08, endFreq: base * 1.15 });
  },
  combo(streak: number): void {
    const note = PENTATONIC[Math.min(Math.max(0, streak - 1), PENTATONIC.length - 1)] ?? 523.25;
    playTone(note, 0.14, { type: 'triangle', gain: 0.09 });
    playTone(note * 1.5, 0.18, { type: 'sine', gain: 0.06, delay: 0.06 });
  },
  bossHit(): void {
    playTone(180, 0.16, { type: 'sawtooth', gain: 0.08, endFreq: 75 });
    playTone(620, 0.12, { type: 'square', gain: 0.05, delay: 0.04, endFreq: 960 });
  },
  error(): void {
    playTone(230, 0.14, { type: 'sawtooth', gain: 0.07, endFreq: 160 });
    playTone(170, 0.18, { type: 'sawtooth', gain: 0.06, delay: 0.11, endFreq: 120 });
  },
  levelUp(): void {
    const fanfare = [523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((freq, idx) => {
      playTone(freq, idx === fanfare.length - 1 ? 0.36 : 0.14, {
        type: 'triangle',
        gain: 0.09,
        delay: idx * 0.085,
      });
    });
  },
};
